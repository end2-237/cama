#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# CAMA — TP machines distantes : installateur de terminal web
#
# Installe ttyd (terminal web) + un tunnel HTTPS (cloudflared) sur une
# machine Linux (Ubuntu 18 → 24, Debian). À la fin, le script affiche
# l'URL HTTPS à coller dans CAMA → TP → Machine distante → « + ».
#
# Usage (en root) :
#   curl -fsSL https://raw.githubusercontent.com/end2-237/cama/<branch>/scripts/cama-tp-setup.sh | sudo bash
# ou :
#   sudo bash cama-tp-setup.sh
#
# Variables d'environnement optionnelles :
#   TP_USER       login du terminal web        (défaut: cama)
#   TP_PASS       mot de passe du terminal web  (défaut: généré aléatoirement)
#   TP_PORT       port local de ttyd            (défaut: 7681)
#   TP_SHELL      shell servi                    (défaut: bash sur l'utilisateur courant)
#   TP_WRITABLE   1 = clavier actif (lecture+écriture), 0 = lecture seule (défaut: 1)
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

TP_USER="${TP_USER:-cama}"
TP_PASS="${TP_PASS:-$(head -c 9 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 12)}"
TP_PORT="${TP_PORT:-7681}"
TP_SHELL="${TP_SHELL:-bash}"
TP_WRITABLE="${TP_WRITABLE:-1}"

c_ok()   { printf "\033[1;32m✔\033[0m %s\n" "$*"; }
c_info() { printf "\033[1;36mℹ\033[0m %s\n" "$*"; }
c_warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }
c_err()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }

[ "$(id -u)" -eq 0 ] || { c_err "Lancez ce script en root (sudo)."; exit 1; }

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) TTYD_ARCH="x86_64"; CF_ARCH="amd64" ;;
  aarch64|arm64) TTYD_ARCH="aarch64"; CF_ARCH="arm64" ;;
  *) c_err "Architecture non gérée : $ARCH"; exit 1 ;;
esac

. /etc/os-release 2>/dev/null || true
c_info "Système détecté : ${PRETTY_NAME:-inconnu} ($ARCH)"

# ── 1. ttyd ──────────────────────────────────────────────────────────
if command -v ttyd >/dev/null 2>&1; then
  c_ok "ttyd déjà installé ($(ttyd --version 2>&1 | head -n1))"
else
  c_info "Installation de ttyd…"
  # apt fournit une version récente sur 22.04+ ; sur 18/20 on prend le binaire statique.
  if apt-get -y install ttyd >/dev/null 2>&1; then
    c_ok "ttyd installé via apt"
  else
    TTYD_VER="1.7.7"
    URL="https://github.com/tsl0922/ttyd/releases/download/${TTYD_VER}/ttyd.${TTYD_ARCH}"
    c_info "apt indisponible → téléchargement du binaire statique ($URL)"
    curl -fsSL "$URL" -o /usr/local/bin/ttyd
    chmod +x /usr/local/bin/ttyd
    c_ok "ttyd $TTYD_VER installé dans /usr/local/bin"
  fi
fi
TTYD_BIN="$(command -v ttyd)"

# ── 2. cloudflared (tunnel HTTPS sans domaine) ───────────────────────
if command -v cloudflared >/dev/null 2>&1; then
  c_ok "cloudflared déjà installé"
else
  c_info "Installation de cloudflared…"
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  c_ok "cloudflared installé"
fi

# ── 3. Service systemd pour ttyd ─────────────────────────────────────
WRITABLE_FLAG=""
[ "$TP_WRITABLE" = "1" ] && WRITABLE_FLAG="--writable"
# Le shell servi : si on tourne en root et qu'un SUDO_USER existe, on bascule
# sur ce compte (plus sûr) ; sinon on lance directement le shell.
if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  SHELL_CMD="su - ${SUDO_USER}"
else
  SHELL_CMD="${TP_SHELL}"
fi

# Unité systemd minimale : pas de quotes complexes (systemd parse mal les
# guillemets imbriqués → ttyd ne démarre pas).
cat >/etc/systemd/system/cama-ttyd.service <<EOF
[Unit]
Description=CAMA ttyd web terminal
After=network.target

[Service]
ExecStart=${TTYD_BIN} -p ${TP_PORT} -i 127.0.0.1 ${WRITABLE_FLAG} -c ${TP_USER}:${TP_PASS} -t fontSize=15 -m 5 ${SHELL_CMD}
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

# Libère le port 7681 d'un éventuel ttyd resté d'un essai précédent (errno 98).
systemctl stop cama-ttyd 2>/dev/null || true
pkill -f "ttyd" 2>/dev/null || true
command -v fuser >/dev/null 2>&1 && fuser -k "${TP_PORT}/tcp" 2>/dev/null || true
sleep 1

systemctl daemon-reload
systemctl enable cama-ttyd >/dev/null 2>&1 || true
systemctl restart cama-ttyd
sleep 1.5
if ! systemctl is-active --quiet cama-ttyd; then
  c_err "ttyd n'a pas démarré. Dernières lignes du journal :"
  journalctl -u cama-ttyd --no-pager -n 12 || true
  exit 1
fi
c_ok "ttyd actif sur 127.0.0.1:${TP_PORT}"

# ── 4. Tunnel HTTPS cloudflared (quick tunnel, URL aléatoire) ────────
cat >/etc/systemd/system/cama-tunnel.service <<EOF
[Unit]
Description=CAMA cloudflared quick tunnel
After=network.target cama-ttyd.service
Requires=cama-ttyd.service

[Service]
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:${TP_PORT}
Restart=always
RestartSec=3
StandardOutput=append:/var/log/cama-tunnel.log
StandardError=append:/var/log/cama-tunnel.log

[Install]
WantedBy=multi-user.target
EOF

: >/var/log/cama-tunnel.log
systemctl daemon-reload
systemctl enable --now cama-tunnel >/dev/null 2>&1 || systemctl restart cama-tunnel

c_info "Attente de l'URL publique du tunnel…"
URL=""
for i in $(seq 1 30); do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' /var/log/cama-tunnel.log | head -n1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done

echo
echo "════════════════════════════════════════════════════════════════"
if [ -n "$URL" ]; then
  c_ok "Terminal web prêt !"
  echo
  echo "   URL HTTPS  : $URL"
  echo "   Login      : $TP_USER"
  echo "   Mot de passe: $TP_PASS"
  echo
  echo "   → Dans CAMA : TP → Machine distante → «+» → collez l'URL"
  echo "     (le terminal demandera le login/mot de passe ci-dessus)."
else
  c_warn "URL du tunnel pas encore visible. Consultez : cat /var/log/cama-tunnel.log"
fi
echo "════════════════════════════════════════════════════════════════"
echo
c_info "Gestion : systemctl status cama-ttyd cama-tunnel"
c_info "Logs tunnel : tail -f /var/log/cama-tunnel.log"
c_info "Désinstaller : systemctl disable --now cama-ttyd cama-tunnel && rm /etc/systemd/system/cama-{ttyd,tunnel}.service"
