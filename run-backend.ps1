# PowerShell helper to run backend
if (-not (Test-Path ".\.venv\Scripts\Activate.ps1")) {
    Write-Host "Create a venv: python -m venv .venv"
}
. .\.venv\Scripts\Activate.ps1
python backend/app.py
