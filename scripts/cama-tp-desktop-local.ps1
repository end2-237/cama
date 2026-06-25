# ====================================================================
# CAMA - Bureau Windows graphique dans le navigateur
#
# Script officiel d'installation CAMA TP Desktop.
# Au lancement, une fenetre d'explorateur de fichiers permet de choisir
# le dossier d'installation (tout y est stocke : Python, noVNC, etc.).
#
# Installe :
#   - Python "embeddable" (zip ~15 Mo, aucune install systeme)
#   - websockify + noVNC  (pont VNC -> HTML5 dans le navigateur)
#   - cloudflared          (tunnel HTTPS public)
#   - TightVNC             (serveur d'affichage, ~3 Mo, via winget)
#
# Schema :
#   TightVNC (5900) -> websockify/noVNC (6080) -> cloudflared (HTTPS) -> CAMA
#
# Usage (PowerShell, admin conseille pour TightVNC) :
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\cama-tp-desktop-local.ps1
#
# Options avancees (passees en param, sinon valeurs par defaut) :
#   -WebPort 6080       port web local de noVNC
#   -VncPort 5900       port du serveur VNC (TightVNC = 5900)
#   -SkipPicker         saute l'explorateur, utilise -Root directement
#   -Root D:\cama       dossier par defaut si -SkipPicker
#
# NB: script en ASCII pur (Windows PowerShell 5.1 + ANSI).
# ====================================================================
[CmdletBinding()]
param(
  [string]$Root    = "",
  [int]$WebPort    = 6080,
  [int]$VncPort    = 5900,
  [switch]$SkipPicker
)
$ErrorActionPreference = "Stop"
function Ok  ($m){ Write-Host "[OK]  $m" -ForegroundColor Green }
function Info($m){ Write-Host "[..]  $m" -ForegroundColor Cyan }
function Warn($m){ Write-Host "[!]   $m" -ForegroundColor Yellow }
function Die ($m){ Write-Host "[X]   $m" -ForegroundColor Red; exit 1 }

# -- 0. Choix du dossier d'installation (explorateur Windows) --------
if (-not $SkipPicker -and ($Root -eq "")) {
  Write-Host ""
  Write-Host "================================================================"
  Write-Host "   CAMA - Installation du bureau distant (TP)"
  Write-Host "================================================================"
  Write-Host ""
  Info "Choisis le dossier d'installation dans la fenetre qui va s'ouvrir..."
  Info "(Un sous-dossier 'cama' sera cree dedans.)"
  Write-Host ""

  Add-Type -AssemblyName System.Windows.Forms
  $picker = New-Object System.Windows.Forms.FolderBrowserDialog
  $picker.Description = "CAMA - Choisis le dossier d'installation"
  $picker.RootFolder = [System.Environment+SpecialFolder]::MyComputer
  $picker.ShowNewFolderButton = $true

  $result = $picker.ShowDialog()
  if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    Die "Installation annulee."
  }
  $Root = Join-Path $picker.SelectedPath "cama"
  Ok "Dossier choisi : $Root"
}

if ($Root -eq "") { $Root = "D:\cama" }

# Verifie que le lecteur existe.
$drive = (Split-Path $Root -Qualifier)
if (-not (Test-Path $drive)) { Die "Lecteur $drive introuvable." }
New-Item -ItemType Directory -Force -Path $Root | Out-Null
Info "Installation dans : $Root"

# -- 1. Python embeddable (aucune install systeme, tout dans Root) ----
$py = Join-Path $Root "python\python.exe"
if (-not (Test-Path $py)) {
  Info "Telechargement de Python embeddable..."
  $zip = Join-Path $Root "python.zip"
  Invoke-WebRequest "https://www.python.org/ftp/python/3.12.7/python-3.12.7-embed-amd64.zip" -OutFile $zip
  Expand-Archive $zip -DestinationPath (Join-Path $Root "python") -Force
  Remove-Item $zip
  $pth = Get-ChildItem (Join-Path $Root "python") -Filter "python*._pth" | Select-Object -First 1
  (Get-Content $pth.FullName) -replace '^#\s*import site','import site' | Set-Content $pth.FullName
  Ok "Python embeddable pret."
} else { Ok "Python deja present." }

# -- 2. pip + websockify ---------------------------------------------
# Force TEMP et le cache pip sur le meme disque que Root (souvent C: est plein).
$tmp = Join-Path $Root "tmp"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$env:TMP = $tmp; $env:TEMP = $tmp
$env:PIP_NO_CACHE_DIR = "1"

$hasPip = $false
try { & $py -m pip --version 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { $hasPip = $true } } catch {}
if (-not $hasPip) {
  Info "Installation de pip..."
  $getpip = Join-Path $Root "get-pip.py"
  Invoke-WebRequest "https://bootstrap.pypa.io/get-pip.py" -OutFile $getpip
  & $py $getpip --no-warn-script-location
  Remove-Item $getpip
}
Info "Installation de websockify..."
& $py -m pip install --no-cache-dir --no-warn-script-location websockify
if ($LASTEXITCODE -ne 0) {
  Die "Echec installation websockify (souvent: disque plein). Libere de l'espace sur $drive puis relance."
}
& $py -c "import websockify" 2>$null
if ($LASTEXITCODE -ne 0) { Die "websockify non importable. Relance le script." }
Ok "websockify installe."

# -- 3. noVNC (fichiers web statiques) -------------------------------
$novnc = Join-Path $Root "novnc"
if (-not (Test-Path (Join-Path $novnc "vnc.html"))) {
  Info "Telechargement de noVNC..."
  $z = Join-Path $Root "novnc.zip"
  Invoke-WebRequest "https://github.com/novnc/noVNC/archive/refs/tags/v1.5.0.zip" -OutFile $z
  Expand-Archive $z -DestinationPath $Root -Force
  if (Test-Path $novnc) { Remove-Item $novnc -Recurse -Force }
  Rename-Item (Join-Path $Root "noVNC-1.5.0") $novnc
  Remove-Item $z
  Ok "noVNC pret."
} else { Ok "noVNC deja present." }

# -- 4. cloudflared --------------------------------------------------
$cf = Join-Path $Root "cloudflared.exe"
if (-not (Test-Path $cf)) {
  Info "Telechargement de cloudflared..."
  Invoke-WebRequest "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cf
}
Ok "cloudflared pret."

# -- 5. TightVNC (serveur d'affichage, ~3 Mo) ------------------------
$tvn = "C:\Program Files\TightVNC\tvnserver.exe"
if (-not (Test-Path $tvn)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Info "Installation de TightVNC (installeur graphique)..."
    Info "Dans l'installeur : mets un mot de passe VNC, coche 'Allow loopback connections'."
    winget install -e --id GlavSoft.TightVNC --accept-source-agreements --accept-package-agreements -i
  } else {
    Warn "winget absent - installe TightVNC a la main : https://www.tightvnc.com/download.php"
  }
}
if (Test-Path $tvn) {
  Ok "TightVNC installe."
  # Autorise le loopback via registre (au cas ou l'utilisateur n'a pas coche).
  try {
    New-Item -Path 'HKLM:\SOFTWARE\TightVNC\Server' -Force -ErrorAction SilentlyContinue | Out-Null
    Set-ItemProperty 'HKLM:\SOFTWARE\TightVNC\Server' -Name AllowLoopback -Value 1 -Type DWord -ErrorAction SilentlyContinue
  } catch {}
  # Demarre le service s'il ne tourne pas.
  $svc = Get-Service tvnserver -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -ne 'Running') {
    Start-Service tvnserver -ErrorAction SilentlyContinue
  }
  if (-not $svc) {
    try { & $tvn -install; Start-Service tvnserver } catch {}
  }
  $svc = Get-Service tvnserver -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -eq 'Running') {
    Ok "TightVNC actif (service tvnserver)."
  } else {
    Warn "TightVNC installe mais le service ne tourne pas. Lance-le manuellement."
  }
} else {
  Warn "TightVNC non trouve. Installe-le avant de continuer."
}

# -- 6. Demarrage : websockify (noVNC) puis cloudflared --------------
Info "Demarrage du pont noVNC sur 127.0.0.1:$WebPort..."
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -match 'websockify' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Process -FilePath $py `
  -ArgumentList @("-m","websockify","--web=$novnc","$WebPort","127.0.0.1:$VncPort") `
  -WindowStyle Hidden

$log = Join-Path $Root "tunnel.log"
Remove-Item $log,"$log.err" -ErrorAction SilentlyContinue
Info "Ouverture du tunnel HTTPS..."
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

# -- 7. Recap --------------------------------------------------------
Write-Host ""
Write-Host "================================================================"
if ($url) {
  Ok "Bureau Windows pret !"
  Write-Host ""
  Write-Host "   URL a coller dans CAMA (type vnc) :"
  Write-Host ("      " + $url + "/vnc.html?autoconnect=true" + [char]38 + "resize=remote")
} else {
  Warn "URL pas encore visible : Get-Content $log"
}
Write-Host "================================================================"
Write-Host ""
Info "Avant de tester : TightVNC doit tourner avec un MOT DE PASSE defini."
Info "Dans CAMA : TP -> Machine distante -> + -> type vnc -> colle l'URL."
Write-Host ""
Warn "Le navigateur demandera le mot de passe VNC. Le bureau partage = ta session Windows."
Write-Host ""
Info "Dossier d'installation : $Root"
Info "Arreter le partage :"
Write-Host "   Stop-Process -Name cloudflared -Force"
Write-Host "   Stop-Process -Name python -Force"
Info "Desinstaller : supprime le dossier $Root"
