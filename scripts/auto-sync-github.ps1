param(
    [switch]$Once,
    [int]$IntervalSeconds = 15,
    [string]$Message = ""
)

$ErrorActionPreference = "Continue"

# Dam bao Git luon nam trong PATH cua tien trinh
$gitCmdPath = "C:\Users\Anh Huy\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd"
$gitBinPath = "C:\Users\Anh Huy\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\ucrt64\bin"
if (Test-Path $gitCmdPath) {
    $env:Path = "$gitCmdPath;$gitBinPath;$env:Path"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Invoke-GitSync {
    param([string]$CustomMessage)

    # Kiem tra xem co thay doi nao trong du an khong
    $status = git status --porcelain 2>$null
    if (-not $status) {
        return $false
    }

    $timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
    Write-Host "[$timestamp] Phat hien chinh sua moi, dang dong bo len GitHub va Vercel..." -ForegroundColor Cyan

    # Them tat ca thay doi nhung tuyet doi loai tru cac tep .env chua khoa bi mat
    git add -A 2>$null
    git reset HEAD -- .env .env.local .env.development.local .env.test.local .env.production.local 2>$null | Out-Null

    # Kiem tra lai xem sau khi loai tru .env thi con thay doi nao can day len khong
    $staged = git diff --cached --name-only 2>$null
    if (-not $staged) {
        return $false
    }

    $commitMsg = if ($CustomMessage) { $CustomMessage } else { "Cap nhat tu dong Sky-Line ICT Portal ($timestamp)" }
    git commit -m "$commitMsg" 2>$null | Out-Null

    # Day len nhanh main cua GitHub (Tu dong kich hoat Vercel build & deploy)
    git push origin main --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$timestamp] HOAN TAT! Da dong bo len GitHub (doanhhuy14spt/sky-line-ict-portal-app) va Vercel." -ForegroundColor Green
        return $true
    } else {
        Write-Host "[$timestamp] Co loi khi day len GitHub, he thong se tu dong thu lai..." -ForegroundColor Yellow
        return $false
    }
}

# Neu chay che do 1 lan (-Once)
if ($Once) {
    $synced = Invoke-GitSync -CustomMessage $Message
    if (-not $synced) {
        Write-Host "Tat ca tep tin tren may tinh da khop 100% voi GitHub va Vercel." -ForegroundColor Green
    }
    exit 0
}

# Kiem tra tranh chay trung lap nhieu tien trinh ngam
$lockFile = Join-Path $repoRoot ".git\auto-sync.pid"
if (Test-Path $lockFile) {
    $oldPid = Get-Content $lockFile -ErrorAction SilentlyContinue
    if ($oldPid) {
        $proc = Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -match "powershell|pwsh") {
            Write-Host "Trinh tu dong dong bo GitHub va Vercel dang hoat dong ngam (PID: $oldPid)." -ForegroundColor Green
            exit 0
        }
    }
}
$PID | Set-Content $lockFile -Force

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  KICH HOAT TU DONG DONG BO: MAY TINH -> GITHUB -> VERCEL" -ForegroundColor Cyan
Write-Host "  Kho luu tru: https://github.com/doanhhuy14spt/sky-line-ict-portal-app" -ForegroundColor Cyan
Write-Host "  Chu ky quet: Moi $IntervalSeconds giay" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Dong bo ngay lan dau khi khoi dong
Invoke-GitSync -CustomMessage $Message | Out-Null

while ($true) {
    Start-Sleep -Seconds $IntervalSeconds
    try {
        Invoke-GitSync | Out-Null
    } catch {
        # Bo qua loi tam thoi de tiep tuc canh gac
    }
}
