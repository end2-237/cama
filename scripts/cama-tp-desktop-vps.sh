#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# CAMA — Bureau graphique distant SANS Docker (pont noVNC sur le VPS)
#
# Pour partager un bureau GRAPHIQUE (Windows ou Linux avec interface)
# quand la machine cliente n'a NI Docker NI espace disque.
#
# Le pont lourd (noVNC + websockify) tourne sur CE VPS Linux. La machine
# à partager n'a besoin que d'un serveur VNC + d'un tunnel SSH inverse.
#
# ─ Schéma ────────────────────────────────────────────────────────────
#   PC Windows : TightVNC (port 5900)
#        │  ssh -R 5901:localhost:5900 root@<ce-vps>
#        ▼
#   VPS : websockify/noVNC (port web 6080) ──▶ cloudflared (HTTPS)
#        ▼
#   CAMA : TP → Machine distante → « + » → type « vnc » → URL .../vnc.html
#
# Usage (sur le VPS, en root) :
#   curl -fsSL https://raw.githubusercontent.com/end2-237/cama/<branch>/scripts/cama-tp-desktop-vps.sh | sudo bash
#
# Variables optionnelles :
#   VNC_PORT   port VNC reçu via le tunnel SSH inverse  (défaut: 5901)
#   WEB_PORT   port web local de noVNC                  (défaut: 6080)
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

VNC_PORT="${VNC_PORT:-5901}"
WEB_PORT="${WEB_PORT:-6080}"

c_ok()   { printf "\033[1;32m✔\033[0m %s\n" "$*"; }
c_info() { printf "\033[1;36mℹ\033[0m %s\n" "$*"; }
c_warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }
c_err()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }

[ "$(id -u)" -eq 0 ] || { c_err "Lance ce script en root (sudo)."; exit 1; }

# ── 1. noVNC + websockify (paquets Debian/Ubuntu, légers) ────────────
if [ ! -d /usr/share/novnc ]; then
  c_info "Installation de noVNC + websockify…"
  apt-get update -qq
  apt-get install -y novnc websockify >/dev/null
  c_ok "noVNC + websockify installés"
else
  c_ok "noVNC déjà présent"
fi
# Lien vnc.html ↔ index.html selon les versions du paquet.
[ -f /usr/share/novnc/vnc.html ] || ln -sf /usr/share/novnc/vnc_lite.html /usr/share/novnc/vnc.html 2>/dev/null || true

# ── 2. cloudflared (réutilisé s'il est déjà là pour ttyd) ────────────
if ! command -v cloudflared >/dev/null 2>&1; then
  c_info "Installation de cloudflared…"
  ARCH="$(uname -m)"; case "$ARCH" in aarch64|arm64) CF=arm64;; *) CF=amd64;; esac
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF}" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
fi
c_ok "cloudflared prêt"

# ── 3. Service websockify (sert noVNC + relaie vers le VNC tunnelé) ──
cat >/etc/systemd/system/cama-novnc.service <<EOF
[Unit]
Description=CAMA noVNC bridge (websockify)
After=network.target

[Service]
ExecStart=/usr/bin/websockify --web=/usr/share/novnc ${WEB_PORT} 127.0.0.1:${VNC_PORT}
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cama-novnc >/dev/null 2>&1 || true
systemctl restart cama-novnc
c_ok "noVNC actif sur 127.0.0.1:${WEB_PORT} (relaie vers 127.0.0.1:${VNC_PORT})"

# ── 4. Tunnel HTTPS ──────────────────────────────────────────────────
cat >/etc/systemd/system/cama-desktop-tunnel.service <<EOF
[Unit]
Description=CAMA cloudflared tunnel (bureau noVNC)
After=network.target cama-novnc.service
Requires=cama-novnc.service

[Service]
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:${WEB_PORT}
Restart=always
RestartSec=3
StandardOutput=append:/var/log/cama-desktop-tunnel.log
StandardError=append:/var/log/cama-desktop-tunnel.log

[Install]
WantedBy=multi-user.target
EOF

: >/var/log/cama-desktop-tunnel.log
systemctl daemon-reload
systemctl enable --now cama-desktop-tunnel >/dev/null 2>&1 || systemctl restart cama-desktop-tunnel

c_info "Attente de l'URL publique…"
URL=""
for i in $(seq 1 30); do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' /var/log/cama-desktop-tunnel.log | head -n1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done

PUBIP="$(curl -fsSL https://api.ipify.org 2>/dev/null || echo '<IP-de-ton-VPS>')"
echo
echo "════════════════════════════════════════════════════════════════"
if [ -n "$URL" ]; then
  c_ok "Pont bureau prêt côté VPS !"
  echo
  echo "   URL à coller dans CAMA (type « vnc ») :"
  echo "       ${URL}/vnc.html?autoconnect=true&resize=remote"
else
  c_warn "URL pas encore visible : cat /var/log/cama-desktop-tunnel.log"
fi
echo "════════════════════════════════════════════════════════════════"
echo
c_info "ÉTAPE CÔTÉ PC WINDOWS (à partager) :"
echo "  1. Installe TightVNC (~3 Mo) :  winget install -e --id GlavSoft.TightVNC"
echo "     → définis un mot de passe VNC (onglet 'Server')."
echo "  2. Ouvre le tunnel SSH inverse (PowerShell), laisse la fenêtre ouverte :"
echo "       ssh -N -R ${VNC_PORT}:localhost:5900 root@${PUBIP}"
echo "  3. C'est tout : recharge la page CAMA, le bureau Windows s'affiche."
echo
c_info "Gérer : systemctl status cama-novnc cama-desktop-tunnel"
c_info "Arrêter le partage : systemctl stop cama-novnc cama-desktop-tunnel"
