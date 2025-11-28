# 🔄 Como Resolver Problemas de Cache

## Problema: URL Antiga Aparecendo nos Erros

Se você está vendo erros com a URL antiga mesmo após atualizar o código, isso é um problema de cache.

## Soluções:

### 1. Reiniciar o Servidor de Desenvolvimento

1. Pare o servidor (Ctrl+C no terminal)
2. Reinicie com:
```bash
npm run dev
```

### 2. Limpar Cache do Navegador

**Chrome/Edge:**
- Pressione `Ctrl + Shift + Delete`
- Selecione "Imagens e arquivos em cache"
- Clique em "Limpar dados"
- Ou use `Ctrl + F5` para hard refresh

**Firefox:**
- Pressione `Ctrl + Shift + Delete`
- Selecione "Cache"
- Clique em "Limpar agora"
- Ou use `Ctrl + F5` para hard refresh

### 3. Hard Refresh no Navegador

- **Windows:** `Ctrl + F5` ou `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### 4. Limpar Cache do Vite

1. Pare o servidor
2. Delete a pasta `node_modules/.vite` (se existir)
3. Reinicie o servidor:
```bash
npm run dev
```

### 5. Verificar a URL no Console

Após recarregar, verifique no console do navegador:
- Deve aparecer: `🔗 URL do Supabase: https://tmkrknkzgtppyylztida.supabase.co`
- Se aparecer a URL antiga, o cache ainda não foi limpo

### 6. Modo Anônimo/Incógnito

Teste em uma janela anônima/incógnito para verificar se é cache:
- Chrome/Edge: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

## Verificação Rápida:

1. Abra o console do navegador (F12)
2. Procure por: `🔗 URL do Supabase:`
3. Verifique se a URL está correta: `https://tmkrknkzgtppyylztida.supabase.co`
4. Se ainda estiver errada, siga os passos acima

## Após Limpar o Cache:

1. Recarregue a página
2. Verifique o console
3. Deve aparecer a URL correta
4. A conexão com o Supabase deve funcionar

