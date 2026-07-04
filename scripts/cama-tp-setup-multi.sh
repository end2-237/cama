#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# CAMA — TP multi-étudiants : un conteneur Docker isolé PAR connexion
#
# Chaque étudiant qui ouvre le terminal web obtient SON propre conteneur
# Ubuntu jetable (root dedans, isolation totale, détruit à la déconnexion).
# Le VPS reste propre ; limites CPU/RAM par conteneur.
#
# Usage (en root, Ubuntu/Debian) :
#   curl -fsSL https://raw.githubusercontent.com/end2-237/cama/<branch>/scripts/cama-tp-setup-multi.sh | sudo bash
#
# Variables optionnelles :
#   TP_USER      login du terminal web            (défaut: cama)
#   TP_PASS      mot de passe                      (défaut: aléatoire)
#   TP_PORT      port local de ttyd                (défaut: 7682)
#   TP_IMAGE     image Docker servie               (défaut: ubuntu:24.04)
#   TP_CLIENTS   connexions simultanées max        (défaut: 15)
#   TP_CPU       CPU max PAR conteneur             (défaut: 0.5)
#   TP_MEM       RAM max PAR conteneur             (défaut: 256m)
#   TP_PIDS      processus max PAR conteneur       (défaut: 128)
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

TP_USER="${TP_USER:-cama}"
TP_PASS="${TP_PASS:-$(head -c 9 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 12)}"
TP_PORT="${TP_PORT:-7682}"
TP_IMAGE="${TP_IMAGE:-ubuntu:24.04}"
TP_CLIENTS="${TP_CLIENTS:-15}"
TP_CPU="${TP_CPU:-0.5}"
TP_MEM="${TP_MEM:-256m}"
TP_PIDS="${TP_PIDS:-128}"

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
c_info "Système : ${PRETTY_NAME:-inconnu} ($ARCH)"

# ── 1. Docker ────────────────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
  c_ok "Docker déjà installé ($(docker --version | cut -d, -f1))"
else
  c_info "Installation de Docker (script officiel get.docker.com)…"
  curl -fsSL https://get.docker.com | sh >/dev/null
  systemctl enable --now docker
  c_ok "Docker installé et démarré"
fi

c_info "Téléchargement de l'image ${TP_IMAGE}…"
docker pull -q "${TP_IMAGE}" >/dev/null
c_ok "Image ${TP_IMAGE} prête"

# ── 2. ttyd ──────────────────────────────────────────────────────────
if command -v ttyd >/dev/null 2>&1; then
  c_ok "ttyd déjà installé"
else
  c_info "Installation de ttyd…"
  if apt-get -y install ttyd >/dev/null 2>&1; then
    c_ok "ttyd installé via apt"
  else
    TTYD_VER="1.7.7"
    curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VER}/ttyd.${TTYD_ARCH}" -o /usr/local/bin/ttyd
    chmod +x /usr/local/bin/ttyd
    c_ok "ttyd ${TTYD_VER} installé"
  fi
fi
TTYD_BIN="$(command -v ttyd)"

# ── 3. Script de lancement : 1 conteneur jetable par connexion ──────
cat >/usr/local/bin/cama-tp-shell <<EOF
#!/usr/bin/env bash
# Lancé par ttyd À CHAQUE connexion : conteneur Ubuntu jetable, isolé,
# root dedans, limité en CPU/RAM/processus, détruit à la déconnexion.
exec docker run --rm -it \\
  --cpus="${TP_CPU}" --memory="${TP_MEM}" --pids-limit="${TP_PIDS}" \\
  --network bridge \\
  --label cama.tp=1 \\
  --hostname tp-cama \\
  -e DEBIAN_FRONTEND=noninteractive \\
  "${TP_IMAGE}" bash -c 'echo "══════════════════════════════════════════════"; echo " CAMA TP — votre machine personnelle jetable"; echo " Vous êtes root. Tout est détruit à la sortie."; echo "══════════════════════════════════════════════"; exec bash'
EOF
chmod +x /usr/local/bin/cama-tp-shell
c_ok "Lanceur de conteneurs installé (/usr/local/bin/cama-tp-shell)"

# ── 4. Service systemd ttyd multi ────────────────────────────────────
cat >/etc/systemd/system/cama-ttyd-multi.service <<EOF
[Unit]
Description=CAMA ttyd multi-etudiants (1 conteneur Docker par connexion)
After=network.target docker.service
Requires=docker.service

[Service]
ExecStart=${TTYD_BIN} -p ${TP_PORT} -i 127.0.0.1 --writable -c ${TP_USER}:${TP_PASS} -t fontSize=15 -m ${TP_CLIENTS} /usr/local/bin/cama-tp-shell
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl stop cama-ttyd-multi 2>/dev/null || true
command -v fuser >/dev/null 2>&1 && fuser -k "${TP_PORT}/tcp" 2>/dev/null || true
sleep 1
systemctl daemon-reload
systemctl enable cama-ttyd-multi >/dev/null 2>&1 || true
systemctl restart cama-ttyd-multi
sleep 1.5
if ! systemctl is-active --quiet cama-ttyd-multi; then
  c_err "ttyd multi n'a pas démarré :"
  journalctl -u cama-ttyd-multi --no-pager -n 12 || true
  exit 1
fi
c_ok "ttyd multi actif sur 127.0.0.1:${TP_PORT}"

# ── 5. cloudflared + tunnel ──────────────────────────────────────────
if ! command -v cloudflared >/dev/null 2>&1; then
  c_info "Installation de cloudflared…"
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi

cat >/etc/systemd/system/cama-tunnel-multi.service <<EOF
[Unit]
Description=CAMA cloudflared tunnel (TP multi)
After=network.target cama-ttyd-multi.service
Requires=cama-ttyd-multi.service

[Service]
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:${TP_PORT}
Restart=always
RestartSec=3
StandardOutput=append:/var/log/cama-tunnel-multi.log
StandardError=append:/var/log/cama-tunnel-multi.log

[Install]
WantedBy=multi-user.target
EOF

: >/var/log/cama-tunnel-multi.log
systemctl daemon-reload
systemctl enable --now cama-tunnel-multi >/dev/null 2>&1 || systemctl restart cama-tunnel-multi

c_info "Attente de l'URL publique…"
URL=""
for i in $(seq 1 30); do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' /var/log/cama-tunnel-multi.log | head -n1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done

MAXRAM_MB=$(( $(echo "${TP_MEM}" | tr -dc '0-9') * TP_CLIENTS ))
echo
echo "════════════════════════════════════════════════════════════════"
if [ -n "$URL" ]; then
  c_ok "Terminal TP multi-étudiants prêt !"
  echo
  echo "   URL HTTPS   : $URL"
  echo "   Login       : $TP_USER"
  echo "   Mot de passe: $TP_PASS"
  echo
  echo "   → Dans CAMA : TP → Machine distante → «+» → type ttyd → collez l'URL"
  echo
  echo "   Chaque étudiant qui se connecte reçoit SON conteneur ${TP_IMAGE}"
  echo "   isolé (root dedans), détruit à la déconnexion."
  echo "   Limites par étudiant : ${TP_CPU} CPU · ${TP_MEM} RAM · ${TP_PIDS} processus"
  echo "   Max ${TP_CLIENTS} étudiants simultanés (~${MAXRAM_MB} Mo de RAM au pic)."
else
  c_warn "URL pas encore visible : cat /var/log/cama-tunnel-multi.log"
fi
echo "════════════════════════════════════════════════════════════════"
echo
c_info "Gérer     : systemctl status cama-ttyd-multi cama-tunnel-multi"
c_info "Conteneurs CAMA : docker ps --filter label=cama.tp=1"
c_info "Arrêter   : systemctl stop cama-ttyd-multi cama-tunnel-multi (les conteneurs --rm s'auto-suppriment)"
c_info "Forcer    : docker ps -aq --filter label=cama.tp=1 | xargs -r docker rm -f   (NE TOUCHE QUE CAMA)"
c_info "NB: l'ancien service mono-shell (cama-ttyd, port 7681) n'est pas touché."
