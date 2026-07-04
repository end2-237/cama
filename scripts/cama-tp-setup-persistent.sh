#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# CAMA — TP par étudiant : conteneur nommé, persistant, auto-expirant
#
# Chaque étudiant ouvre SON conteneur (nommé « tp-<id> »). Il le
# retrouve s'il se reconnecte. L'ENSEIGNANT, en ouvrant la machine de
# cet étudiant, rejoint LE MÊME conteneur (il voit le vrai travail).
# Le conteneur est détruit après TP_IDLE_MIN minutes sans connexion.
#
# CAMA ouvre l'URL avec l'identité de l'étudiant :
#     https://xxxx.trycloudflare.com/?arg=<studentId>
# (géré automatiquement par le panneau TP et la fenêtre d'évaluation).
#
# Usage (root, Ubuntu/Debian) :
#   curl -fsSL https://raw.githubusercontent.com/end2-237/cama/<branch>/scripts/cama-tp-setup-persistent.sh | sudo bash
#
# Variables :
#   TP_USER, TP_PASS, TP_PORT(7683), TP_IMAGE(ubuntu:24.04),
#   TP_CLIENTS(20), TP_CPU(0.5), TP_MEM(256m), TP_PIDS(128),
#   TP_IDLE_MIN(15)  ← minutes d'inactivité avant destruction
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

TP_USER="${TP_USER:-cama}"
TP_PASS="${TP_PASS:-$(head -c 9 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 12)}"
TP_PORT="${TP_PORT:-7683}"
TP_IMAGE="${TP_IMAGE:-ubuntu:24.04}"
TP_CLIENTS="${TP_CLIENTS:-20}"
TP_CPU="${TP_CPU:-0.5}"
TP_MEM="${TP_MEM:-256m}"
TP_PIDS="${TP_PIDS:-128}"
TP_IDLE_MIN="${TP_IDLE_MIN:-15}"

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
  c_ok "Docker déjà installé"
else
  c_info "Installation de Docker…"
  curl -fsSL https://get.docker.com | sh >/dev/null
  systemctl enable --now docker
  c_ok "Docker installé"
fi
c_info "Téléchargement de l'image ${TP_IMAGE}…"
docker pull -q "${TP_IMAGE}" >/dev/null
c_ok "Image ${TP_IMAGE} prête"

# ── 2. ttyd ──────────────────────────────────────────────────────────
if ! command -v ttyd >/dev/null 2>&1; then
  c_info "Installation de ttyd…"
  apt-get -y install ttyd >/dev/null 2>&1 || {
    curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.${TTYD_ARCH}" -o /usr/local/bin/ttyd
    chmod +x /usr/local/bin/ttyd
  }
fi
TTYD_BIN="$(command -v ttyd)"
c_ok "ttyd prêt"

mkdir -p /run/cama-tp

# ── 3. Lanceur : conteneur nommé par étudiant (créé ou rejoint) ─────
cat >/usr/local/bin/cama-tp-shell <<EOF
#!/usr/bin/env bash
# ttyd passe l'identité de l'étudiant en 1er argument (?arg=<id>).
set -e
RAW="\${1:-invite}"
SID="\$(printf '%s' "\$RAW" | tr -dc 'A-Za-z0-9' | head -c 32)"
[ -n "\$SID" ] || SID="invite"
CTN="tp-\$SID"
IMG="${TP_IMAGE}"

mkdir -p /run/cama-tp
touch "/run/cama-tp/\$SID"          # marque la dernière connexion (pour l'expiration)

# Créer le conteneur s'il n'existe pas encore
if ! docker inspect "\$CTN" >/dev/null 2>&1; then
  docker run -d --name "\$CTN" \\
    --cpus="${TP_CPU}" --memory="${TP_MEM}" --pids-limit="${TP_PIDS}" \\
    --hostname "\$CTN" --label cama.tp=1 \\
    "\$IMG" sleep infinity >/dev/null
fi
# S'il existe mais est arrêté, le redémarrer
if [ "\$(docker inspect -f '{{.State.Running}}' "\$CTN" 2>/dev/null)" != "true" ]; then
  docker start "\$CTN" >/dev/null 2>&1 || true
fi

echo "══════════════════════════════════════════════════"
echo " CAMA TP — machine de : \$SID"
echo " Conteneur \$CTN · root · détruit après ${TP_IDLE_MIN} min d'inactivité"
echo "══════════════════════════════════════════════════"
exec docker exec -it "\$CTN" bash
EOF
chmod +x /usr/local/bin/cama-tp-shell
c_ok "Lanceur par étudiant installé"

# ── 4. Reaper : détruit les conteneurs inactifs > TP_IDLE_MIN ───────
cat >/usr/local/bin/cama-tp-reap <<EOF
#!/usr/bin/env bash
# Supprime tout conteneur CAMA dont la dernière connexion date de plus
# de ${TP_IDLE_MIN} minutes (fichier marqueur dans /run/cama-tp).
set -e
IDLE=${TP_IDLE_MIN}
for CTN in \$(docker ps -a --filter "label=cama.tp=1" --format '{{.Names}}'); do
  SID="\${CTN#tp-}"
  MARK="/run/cama-tp/\$SID"
  if [ -f "\$MARK" ]; then
    AGE=\$(( ( \$(date +%s) - \$(stat -c %Y "\$MARK") ) / 60 ))
  else
    AGE=\$(( IDLE + 1 ))
  fi
  if [ "\$AGE" -ge "\$IDLE" ]; then
    docker rm -f "\$CTN" >/dev/null 2>&1 || true
    rm -f "\$MARK"
  fi
done
EOF
chmod +x /usr/local/bin/cama-tp-reap

cat >/etc/systemd/system/cama-tp-reap.service <<EOF
[Unit]
Description=CAMA TP reaper (détruit les conteneurs inactifs)
[Service]
Type=oneshot
ExecStart=/usr/local/bin/cama-tp-reap
EOF
cat >/etc/systemd/system/cama-tp-reap.timer <<EOF
[Unit]
Description=CAMA TP reaper toutes les 2 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
[Install]
WantedBy=timers.target
EOF

# ── 5. Service ttyd (avec passage d'argument depuis l'URL) ──────────
cat >/etc/systemd/system/cama-ttyd-persist.service <<EOF
[Unit]
Description=CAMA ttyd par etudiant (conteneurs nommes persistants)
After=network.target docker.service
Requires=docker.service

[Service]
ExecStart=${TTYD_BIN} -p ${TP_PORT} -i 127.0.0.1 --writable --url-arg -c ${TP_USER}:${TP_PASS} -t fontSize=15 -m ${TP_CLIENTS} /usr/local/bin/cama-tp-shell
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl stop cama-ttyd-persist 2>/dev/null || true
command -v fuser >/dev/null 2>&1 && fuser -k "${TP_PORT}/tcp" 2>/dev/null || true
sleep 1
systemctl daemon-reload
systemctl enable cama-ttyd-persist cama-tp-reap.timer >/dev/null 2>&1 || true
systemctl restart cama-ttyd-persist
systemctl start cama-tp-reap.timer
sleep 1.5
if ! systemctl is-active --quiet cama-ttyd-persist; then
  c_err "ttyd n'a pas démarré :"; journalctl -u cama-ttyd-persist --no-pager -n 12 || true; exit 1
fi
c_ok "ttyd par étudiant actif sur 127.0.0.1:${TP_PORT} · reaper actif (${TP_IDLE_MIN} min)"

# ── 6. cloudflared + tunnel ──────────────────────────────────────────
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi
cat >/etc/systemd/system/cama-tunnel-persist.service <<EOF
[Unit]
Description=CAMA cloudflared tunnel (TP par etudiant)
After=network.target cama-ttyd-persist.service
Requires=cama-ttyd-persist.service
[Service]
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:${TP_PORT}
Restart=always
RestartSec=3
StandardOutput=append:/var/log/cama-tunnel-persist.log
StandardError=append:/var/log/cama-tunnel-persist.log
[Install]
WantedBy=multi-user.target
EOF
: >/var/log/cama-tunnel-persist.log
systemctl daemon-reload
systemctl enable --now cama-tunnel-persist >/dev/null 2>&1 || systemctl restart cama-tunnel-persist

c_info "Attente de l'URL publique…"
URL=""
for i in $(seq 1 30); do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' /var/log/cama-tunnel-persist.log | head -n1 || true)"
  [ -n "$URL" ] && break; sleep 1
done

echo
echo "════════════════════════════════════════════════════════════════"
if [ -n "$URL" ]; then
  c_ok "TP par étudiant prêt !"
  echo
  echo "   URL HTTPS   : $URL"
  echo "   Login       : $TP_USER"
  echo "   Mot de passe: $TP_PASS"
  echo
  echo "   → Dans CAMA : TP → Machine distante → «+» → type ttyd → collez CETTE URL"
  echo "     (CAMA ajoute automatiquement ?arg=<id étudiant>)"
  echo
  echo "   • Chaque étudiant a SON conteneur, retrouvé s'il revient."
  echo "   • Le prof, en ouvrant la machine d'un étudiant, voit LE MÊME conteneur."
  echo "   • Détruit après ${TP_IDLE_MIN} min sans connexion."
  echo "   • Limites/étudiant : ${TP_CPU} CPU · ${TP_MEM} RAM · ${TP_PIDS} procs · max ${TP_CLIENTS} simultanés"
else
  c_warn "URL pas encore visible : cat /var/log/cama-tunnel-persist.log"
fi
echo "════════════════════════════════════════════════════════════════"
echo
c_info "Conteneurs : docker ps -a --filter label=cama.tp=1"
c_info "Arrêter    : systemctl stop cama-ttyd-persist cama-tunnel-persist cama-tp-reap.timer && docker ps -aq --filter label=cama.tp=1 | xargs -r docker rm -f"
