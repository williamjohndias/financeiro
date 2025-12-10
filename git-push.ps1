# Script simples para fazer push
Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
git add -A

Write-Host "Status:" -ForegroundColor Yellow
git status --short

Write-Host "`nFazendo commit..." -ForegroundColor Yellow
git commit -m "fix: corrige formatação de valores nos gráficos e remove aba dashboards"

Write-Host "`nFazendo push..." -ForegroundColor Yellow
git push origin main

Write-Host "`nConcluído!" -ForegroundColor Green

