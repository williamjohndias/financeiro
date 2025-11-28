# ⚡ Solução Rápida para Problema de Cache

## O Problema:
O navegador está usando código antigo em cache, mostrando a URL errada nos erros.

## Solução Rápida (2 minutos):

### Passo 1: Reiniciar o Servidor
1. No terminal onde o servidor está rodando, pressione `Ctrl + C`
2. Execute novamente:
```bash
npm run dev
```

### Passo 2: Limpar Cache do Navegador
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Período: "Todo o período"
4. Clique em "Limpar dados"

### Passo 3: Hard Refresh
1. Com a página aberta, pressione `Ctrl + F5` (ou `Ctrl + Shift + R`)
2. Isso força o navegador a recarregar tudo

### Passo 4: Verificar no Console
1. Abra o console (F12)
2. Procure por: `🔗 URL do Supabase:`
3. Deve mostrar: `https://tmkrknkzgtppyylztida.supabase.co`

## Se Ainda Não Funcionar:

### Opção 1: Modo Anônimo
1. Abra uma janela anônima (`Ctrl + Shift + N`)
2. Acesse `http://localhost:5173`
3. Verifique se funciona

### Opção 2: Limpar Cache do Vite
1. Pare o servidor (`Ctrl + C`)
2. Delete a pasta `.vite` se existir:
```bash
rm -rf node_modules/.vite
# ou no Windows:
rmdir /s node_modules\.vite
```
3. Reinicie o servidor:
```bash
npm run dev
```

### Opção 3: Verificar Variáveis de Ambiente
Se você tem um arquivo `.env`, verifique se a URL está correta:
```env
VITE_SUPABASE_URL=https://tmkrknkzgtppyylztida.supabase.co
```

## Verificação Final:

Após seguir os passos, verifique no console:
- ✅ `🔗 URL do Supabase: https://tmkrknkzgtppyylztida.supabase.co`
- ✅ `✅ Dados carregados do Supabase com sucesso!`

Se aparecer isso, está funcionando! 🎉

