param(
  [string]$RepoPath = "C:\Users\Administrator\Documents\Lovenda\lovenda13123123 - copia",
  [string]$Remote = "origin",
  [int]$DebounceSeconds = 3
)

# --- SETTINGS ---
# If $Branch is empty, we'll detect current branch dynamically.
[string]$Branch = ""

# --- SETUP ---
# Move to repo path
Set-Location -LiteralPath $RepoPath

# Ensure this is a git repository
try {
  git rev-parse --is-inside-work-tree | Out-Null
} catch {
  Write-Host "[ERROR] '$RepoPath' no parece ser un repositorio Git inicializado."
  Write-Host "Ejecuta: git init; git remote add origin <URL>; git branch -M main; git push -u origin main"
  exit 1
}

# Detect current branch if not provided
if ([string]::IsNullOrWhiteSpace($Branch)) {
  try {
    $Branch = (git rev-parse --abbrev-ref HEAD).Trim()
    if (-not $Branch) { $Branch = "main" }
  } catch {
    $Branch = "main"
  }
}

# Helpful: cache credentials so it doesn't ask every push
git config --global credential.helper manager | Out-Null

# Make a FileSystemWatcher
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $RepoPath
$fsw.Filter = "*.*"
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $trueF

Write-Host "[INFO] Watching '$RepoPath' (branch: $Branch, remote: $Remote)"
Write-Host "[INFO] Debounce: $DebounceSeconds s. Ctrl+C para salir."

# Debounce timer: triggers a single commit+push after a burst of changes
$timer = New-Object System.Timers.Timer
$timer.Interval = $DebounceSeconds * 1000
$timer.AutoReset = $false

$action = {
  # When timer elapses, perform git ops
  try {
    Set-Location -LiteralPath $RepoPath

    $status = git status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($status)) {
      git add -A

      $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
      $msg = "auto: $ts"
      git commit -m $msg | Out-Null

      # Ensure upstream if not set
      $hasUpstream = (git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null)
      if (-not $hasUpstream) {
        git push -u $Remote $Branch
      } else {
        git push $Remote $Branch
      }
      Write-Host "[PUSH] $ts"
    }
  } catch {
    Write-Host "[ERROR] $($_.Exception.Message)"
  }
}

$timer.Add_Elapsed($action) | Out-Null

# Restart timer on any FS event
$onChange = {
  # Reset/start timer (debounce)
  $timer.Stop()
  $timer.Start()
}

$createdReg = Register-ObjectEvent $fsw Created -Action $onChange
$changedReg = Register-ObjectEvent $fsw Changed -Action $onChange
$deletedReg = Register-ObjectEvent $fsw Deleted -Action $onChange
$renamedReg = Register-ObjectEvent $fsw Renamed -Action $onChange

# Keep the script alive
try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  # Cleanup on exit
  Unregister-Event -SourceIdentifier $createdReg.Name -ErrorAction SilentlyContinue
  Unregister-Event -SourceIdentifier $changedReg.Name -ErrorAction SilentlyContinue
  Unregister-Event -SourceIdentifier $deletedReg.Name -ErrorAction SilentlyContinue
  Unregister-Event -SourceIdentifier $renamedReg.Name -ErrorAction SilentlyContinue
  $fsw.EnableRaisingEvents = $false
  $fsw.Dispose()
  $timer.Dispose()
}
