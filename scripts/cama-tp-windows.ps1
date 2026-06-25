# ════════════════════════════════════════════════════════════════════
# CAMA — TP machine distante GRAPHIQUE (bureau Windows dans le navigateur)
#
# Met en place, sur CE PC Windows :
#   1. le Bureau à distance Windows (RDP)            ← Windows Pro/Entreprise
#      (ou un serveur VNC si -UseVNC                  ← marche aussi sur Famille)
#   2. Apache Guacamole en Docker (pont RDP/VNC → HTML5, port 8080)
#   3. un tunnel HTTPS cloudflared (URL https://xxxx.trycloudflare.com)
#
# À la fin, le script affiche l'URL HTTPS à coller dans
#   CAMA → TP → Machine distante → « + »  (type : guacamole)
#
# Usage (PowerShell EN ADMINISTRATEUR) :
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\cama-tp-windows.ps1                 # RDP (Windows Pro/Entreprise)
#   .\cama-tp-windows.ps1 -UseVNC         # VNC (toutes éditions, dont Famille)
#
# Désinstaller :
#   docker rm -f cama-guac ; Stop-Process -Name cloudflared -Force
# ════════════════════════════════════════════════════════════════════
[CmdletBinding()]
param(
  [switch]$UseVNC,                       # bascule RDP -> VNC (Windows Famille)
  [int]$GuacPort = 8080,                 # port web local de Guacamole
  [string]$RdpUser = "$env:USERNAME"     # compte Windows utilisé pour la session
)

$ErrorActionPreference = "Stop"
function Ok   ($m){ Write-Host "[OK]   $m" -ForegroundColor Green }
function Info ($m){ Write-Host "[..]   $m" -ForegroundColor Cyan }
function Warn ($m){ Write-Host "[!]    $m" -ForegroundColor Yellow }
function Die  ($m){ Write-Host "[X]    $m" -ForegroundColor Red; exit 1 }

# ── 0. Admin ? ───────────────────────────────────────────────────────
$admin = ([Security.Principal.WindowsPrincipal] `
  [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Die "Lance PowerShell en tant qu'Administrateur." }

$edition = (Get-CimInstance Win32_OperatingSystem).Caption
Info "Système : $edition"

# ── 1. Accès au bureau : RDP (Pro) ou VNC (toutes éditions) ──────────
if (-not $UseVNC) {
  if ($edition -match "Home|Famille") {
    Warn "Édition Famille détectée : le Bureau à distance (RDP) n'existe pas ici."
    Warn "Relance avec :  .\cama-tp-windows.ps1 -UseVNC"
    Die  "RDP indisponible sur Windows Famille."
  }
  Info "Activation du Bureau à distance (RDP)…"
  Set-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' `
    -Name 'fDenyTSConnections' -Value 0
  Enable-NetFirewallRule -DisplayGroup "Remote Desktop" -ErrorAction SilentlyContinue
  # NLA off : Guacamole/guacd gère mieux le RDP sans Network Level Authentication.
  Set-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' `
    -Name 'UserAuthentication' -Value 0 -ErrorAction SilentlyContinue
  Ok "RDP activé pour l'utilisateur '$RdpUser'."
  $proto = "rdp"; $hostname = "host.docker.internal"; $port = 3389
  Warn "Le mot de passe de connexion sera celui de TON compte Windows '$RdpUser'."
  Warn "=> ce compte DOIT avoir un mot de passe (un compte sans mot de passe est refusé en RDP)."
}
else {
  Info "Mode VNC : installation de TightVNC…"
  if (-not (Get-Command tvnserver.exe -ErrorAction SilentlyContinue) `
      -and -not (Test-Path "C:\Program Files\TightVNC\tvnserver.exe")) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
      winget install -e --id GlavSoft.TightVNC --accept-source-agreements --accept-package-agreements
    } else {
      Die "winget introuvable. Installe TightVNC manuellement : https://www.tightvnc.com/download.php"
    }
  }
  Ok "TightVNC installé. Ouvre TightVNC et définis un mot de passe VNC."
  $proto = "vnc"; $hostname = "host.docker.internal"; $port = 5900
}

# ── 2. Docker Desktop ────────────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Info "Docker Desktop absent — installation via winget…"
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Die "winget introuvable. Installe Docker Desktop : https://www.docker.com/products/docker-desktop/"
  }
  winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
  Warn "Docker Desktop installé. DÉMARRE-le (icône baleine), attends qu'il soit prêt,"
  Warn "puis relance ce script."
  exit 0
}
try { docker info *> $null } catch {
  Die "Docker est installé mais pas démarré. Lance Docker Desktop puis relance ce script."
}
Ok "Docker opérationnel."

# ── 3. Conteneur Guacamole tout-en-un (web + guacd + postgres) ───────
Info "Démarrage de Guacamole (flcontainers/guacamole)…"
docker rm -f cama-guac *> $null
docker run -d --name cama-guac `
  --add-host host.docker.internal:host-gateway `
  -p "$($GuacPort):8080" `
  -e GUACD_LOG_LEVEL=info `
  flcontainers/guacamole | Out-Null

Info "Attente de l'initialisation de Guacamole (~20 s)…"
$ready = $false
foreach ($i in 1..40) {
  try {
    $r = Invoke-WebRequest "http://127.0.0.1:$GuacPort/guacamole/" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if ($ready) { Ok "Guacamole en ligne sur http://127.0.0.1:$GuacPort/guacamole/" }
else { Warn "Guacamole met du temps à démarrer — vérifie : docker logs cama-guac" }

# ── 4. cloudflared (tunnel HTTPS, URL aléatoire) ─────────────────────
$cf = "$env:ProgramData\cama\cloudflared.exe"
New-Item -ItemType Directory -Force -Path (Split-Path $cf) | Out-Null
if (-not (Test-Path $cf)) {
  Info "Téléchargement de cloudflared…"
  Invoke-WebRequest `
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" `
    -OutFile $cf
}
Ok "cloudflared prêt."

$log = "$env:ProgramData\cama\tunnel.log"
Remove-Item $log -ErrorAction SilentlyContinue
Info "Ouverture du tunnel HTTPS…"
Start-Process -FilePath $cf `
  -ArgumentList @("tunnel","--no-autoupdate","--url","http://127.0.0.1:$GuacPort") `
  -RedirectStandardOutput $log -RedirectStandardError "$log.err" `
  -WindowStyle Hidden

$url = $null
foreach ($i in 1..30) {
  Start-Sleep -Seconds 1
  $hit = Select-String -Path $log,"$log.err" -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' `
    -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($hit) { $url = $hit.Matches[0].Value; break }
}

# ── 5. Récap + étapes Guacamole ──────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════"
if ($url) {
  Ok "Bureau Windows prêt à être partagé !"
  Write-Host ""
  Write-Host "   URL HTTPS  : $url/guacamole/"
  Write-Host "   Admin Guac : guacadmin / guacadmin   (CHANGE ce mot de passe !)"
} else {
  Warn "URL du tunnel pas encore visible. Regarde : Get-Content `"$log`""
}
Write-Host "════════════════════════════════════════════════════════════════"
Write-Host ""
Info "DERNIÈRE ÉTAPE (4 clics dans Guacamole) :"
Write-Host "  1. Ouvre  $url/guacamole/  → connecte-toi guacadmin/guacadmin"
Write-Host "  2. En haut à droite : guacadmin → Parametres → Connexions → Nouvelle connexion"
Write-Host "  3. Protocole = $proto ; Hote = $hostname ; Port = $port"
if (-not $UseVNC) {
  Write-Host "     Nom d'utilisateur = $RdpUser ; Mot de passe = (ton mdp Windows)"
  Write-Host "     Coche 'Ignorer le certificat du serveur' (Ignore certificate)."
} else {
  Write-Host "     Mot de passe = (le mot de passe VNC que tu as defini dans TightVNC)"
}
Write-Host "  4. Enregistre. Reviens a l'accueil, clique la connexion : ton bureau s'affiche."
Write-Host ""
Info "Dans CAMA : TP -> Machine distante -> '+' -> type 'guacamole' -> colle :"
Write-Host "     $url/guacamole/"
Write-Host ""
Warn "Le bureau partage = TA session Windows. Ferme le tunnel apres le TP :"
Write-Host "     docker rm -f cama-guac ; Stop-Process -Name cloudflared -Force"
