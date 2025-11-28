# Script para fazer push das mudanças para o GitHub

Write-Host "=== Verificando status do Git ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Adicionando todos os arquivos ===" -ForegroundColor Cyan
git add -A

Write-Host "`n=== Verificando arquivos adicionados ===" -ForegroundColor Cyan
git status --short

Write-Host "`n=== Fazendo commit ===" -ForegroundColor Cyan
git commit -m "fix: corrige formatação de valores nos gráficos e remove aba dashboards"

Write-Host "`n=== Verificando remote ===" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Configurando remote se necessário ===" -ForegroundColor Cyan
git remote set-url origin https://github.com/williamjohndias/financeiro.git

Write-Host "`n=== Fazendo push para o GitHub ===" -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n=== Push falhou, tentando com fetch primeiro ===" -ForegroundColor Yellow
    git fetch origin main
    git push -u origin main --force-with-lease
}

Write-Host "`n=== Verificando commits locais vs remotos ===" -ForegroundColor Cyan
git log origin/main..HEAD --oneline

Write-Host "`n=== Concluído! ===" -ForegroundColor Green

