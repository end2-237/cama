# ════════════════════════════════════════════════════════════════════
# CAMA — Bureau Windows graphique EN LOCAL (sans Docker, sans VPS)
#
# Installe tout dans D:\cama (configurable) :
#   • Python "embeddable" (zip ~15 Mo, aucune install système)
#   • websockify + noVNC  (pont VNC → HTML5 dans le navigateur)
#   • cloudflared          (tunnel HTTPS public)
# Le serveur d'affichage = TightVNC (~3 Mo, installé via winget).
#
# Schéma :
#   TightVNC (5900) ─▶ websockify/noVNC (6080) ─▶ cloudflared (HTTPS) ─▶ CAMA
#
# Usage (PowerShell, PAS besoin d'admin sauf pour TightVNC) :
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\cama-tp-desktop-local.ps1
#
# Réglages :
#   -Root D:\cama       dossier d'installation (défaut: D:\cama)
#   -WebPort 6080       port web local de noVNC
#   -VncPort 5900       port du serveur VNC (TightVNC = 5900)
# ════════════════════════════════════════════════════════════════════
[CmdletBinding()]
param(
  [string]$Root    = "D:\cama",
  [int]$WebPort    = 6080,
  [int]$VncPort    = 5900
)
$ErrorActionPreference = "Stop"
function Ok  ($m){ Write-Host "[OK]  $m" -ForegroundColor Green }
function Info($m){ Write-Host "[..]  $m" -ForegroundColor Cyan }
function Warn($m){ Write-Host "[!]   $m" -ForegroundColor Yellow }
function Die ($m){ Write-Host "[X]   $m" -ForegroundColor Red; exit 1 }

# Vérifie que le lecteur de destination existe (D: par défaut).
$drive = (Split-Path $Root -Qualifier)
if (-not (Test-Path $drive)) { Die "Lecteur $drive introuvable. Choisis -Root sur un disque existant." }
New-Item -ItemType Directory -Force -Path $Root | Out-Null
Info "Installation dans : $Root"

# ── 1. Python embeddable (aucune install système, tout dans $Root) ───
$py = Join-Path $Root "python\python.exe"
if (-not (Test-Path $py)) {
  Info "Téléchargement de Python embeddable…"
  $zip = Join-Path $Root "python.zip"
  Invoke-WebRequest "https://www.python.org/ftp/python/3.12.7/python-3.12.7-embed-amd64.zip" -OutFile $zip
  Expand-Archive $zip -DestinationPath (Join-Path $Root "python") -Force
  Remove-Item $zip
  # Active site-packages (décommente "import site" dans le fichier ._pth).
  $pth = Get-ChildItem (Join-Path $Root "python") -Filter "python*._pth" | Select-Object -First 1
  (Get-Content $pth.FullName) -replace '^#\s*import site','import site' | Set-Content $pth.FullName
  Ok "Python embeddable prêt."
} else { Ok "Python déjà présent." }

# ── 2. pip + websockify ──────────────────────────────────────────────
if (-not (& $py -m pip --version 2>$null)) {
  Info "Installation de pip…"
  $getpip = Join-Path $Root "get-pip.py"
  Invoke-WebRequest "https://bootstrap.pypa.io/get-pip.py" -OutFile $getpip
  & $py $getpip --no-warn-script-location
  Remove-Item $getpip
}
Info "Installation de websockify…"
& $py -m pip install --quiet --no-warn-script-location websockify
Ok "websockify installé."

# ── 3. noVNC (fichiers web statiques) ────────────────────────────────
$novnc = Join-Path $Root "novnc"
if (-not (Test-Path (Join-Path $novnc "vnc.html"))) {
  Info "Téléchargement de noVNC…"
  $z = Join-Path $Root "novnc.zip"
  Invoke-WebRequest "https://github.com/novnc/noVNC/archive/refs/tags/v1.5.0.zip" -OutFile $z
  Expand-Archive $z -DestinationPath $Root -Force
  if (Test-Path $novnc) { Remove-Item $novnc -Recurse -Force }
  Rename-Item (Join-Path $Root "noVNC-1.5.0") $novnc
  Remove-Item $z
  Ok "noVNC prêt."
} else { Ok "noVNC déjà présent." }

# ── 4. cloudflared (sur D:) ──────────────────────────────────────────
$cf = Join-Path $Root "cloudflared.exe"
if (-not (Test-Path $cf)) {
  Info "Téléchargement de cloudflared…"
  Invoke-WebRequest "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cf
}
Ok "cloudflared prêt."

# ── 5. TightVNC (serveur d'affichage, ~3 Mo) ─────────────────────────
$tvn = "C:\Program Files\TightVNC\tvnserver.exe"
if (-not (Test-Path $tvn)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Info "Installation de TightVNC (~3 Mo)…"
    winget install -e --id GlavSoft.TightVNC --accept-source-agreements --accept-package-agreements
  } else {
    Warn "winget absent — installe TightVNC à la main : https://www.tightvnc.com/download.php"
  }
}
if (Test-Path $tvn) {
  Ok "TightVNC installé."
  Warn "Ouvre TightVNC (zone de notification) → onglet 'Server' → définis un MOT DE PASSE VNC."
}

# ── 6. Démarrage : websockify (noVNC) puis cloudflared ───────────────
Info "Démarrage du pont noVNC sur 127.0.0.1:$WebPort…"
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -match 'websockify' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Process -FilePath $py `
  -ArgumentList @("-m","websockify","--web=$novnc","$WebPort","127.0.0.1:$VncPort") `
  -WindowStyle Hidden

$log = Join-Path $Root "tunnel.log"
Remove-Item $log,"$log.err" -ErrorAction SilentlyContinue
Info "Ouverture du tunnel HTTPS…"
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process -FilePath $cf `
  -ArgumentList @("tunnel","--no-autoupdate","--url","http://127.0.0.1:$WebPort") `
  -RedirectStandardOutput $log -RedirectStandardError "$log.err" -WindowStyle Hidden

$url = $null
foreach ($i in 1..30) {
  Start-Sleep -Seconds 1
  $hit = Select-String -Path $log,"$log.err" -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' `
    -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($hit) { $url = $hit.Matches[0].Value; break }
}

# ── 7. Récap ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════"
if ($url) {
  Ok "Bureau Windows prêt — 100% local, sans Docker, sans VPS !"
  Write-Host ""
  Write-Host "   URL à coller dans CAMA (type « vnc ») :"
  Write-Host ("      " + $url + '/vnc.html?autoconnect=true&resize=remote')
} else {
  Warn "URL pas encore visible : Get-Content `"$log`""
}
Write-Host "════════════════════════════════════════════════════════════════"
Write-Host ""
Info "Avant de tester : TightVNC doit tourner avec un MOT DE PASSE défini."
Info "Dans CAMA : TP → Machine distante → « + » → type « vnc » → colle l'URL."
Write-Host ""
Warn "Le navigateur demandera le mot de passe VNC. Le bureau partagé = ta session Windows."
Info  "Arrêter le partage :"
Write-Host '   Get-Process cloudflared | Stop-Process -Force'
Write-Host '   Get-CimInstance Win32_Process | ? { $_.CommandLine -match ''websockify'' } | % { Stop-Process -Id $_.ProcessId -Force }'
