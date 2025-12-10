# 🚀 Guia Completo: Deploy no Vercel

Este guia mostra como fazer o deploy da aplicação Controle Financeiro Pessoal no Vercel.

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (já feito - código no repositório)
2. ✅ Conta no Vercel (crie em https://vercel.com)
3. ✅ Projeto no Supabase (configure se ainda não fez)
4. ✅ Variáveis de ambiente do Supabase (URL e chave pública)

## 🎯 Passo 1: Acessar o Vercel

1. Acesse https://vercel.com
2. Clique em **"Sign Up"** ou **"Login"** se já tem conta
3. Faça login com sua conta GitHub (recomendado)

## 📦 Passo 2: Importar o Projeto

1. No dashboard do Vercel, clique em **"Add New Project"** ou **"New Project"**
2. Você verá uma lista dos seus repositórios GitHub
3. Procure por **"williamjohndias/financeiro"**
4. Clique em **"Import"**

## ⚙️ Passo 3: Configurar o Projeto

### 3.1 Configurações Básicas

- **Project Name**: `financeiro` (ou o nome que preferir)
- **Framework Preset**: O Vercel detecta automaticamente como **Vite**
- **Root Directory**: Deixe como `./` (raiz do projeto)
- **Build Command**: Deve estar como `npm run build` (automático)
- **Output Directory**: Deve estar como `dist` (automático)
- **Install Command**: Deve estar como `npm install` (automático)

### 3.2 Configurar Variáveis de Ambiente

⚠️ **IMPORTANTE**: Antes de fazer o deploy, configure as variáveis de ambiente!

1. Na seção **"Environment Variables"**, clique em **"Add"** para cada variável:

#### Variável 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Cole a URL do seu projeto Supabase
  - Exemplo: `https://tmkrknkzgtppyylztida.supabase.co`
  - Você encontra isso no dashboard do Supabase em **Settings > API**
- **Environments**: Selecione todas (Production, Preview, Development)

#### Variável 2: VITE_SUPABASE_PUBLISHABLE_KEY
- **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value**: Cole a chave pública (anon/public key) do Supabase
  - Você encontra isso no dashboard do Supabase em **Settings > API**
  - Procure por **"Project API keys"** > **"anon"** ou **"public"**
- **Environments**: Selecione todas (Production, Preview, Development)

### 3.3 Verificar Configurações

Verifique se está assim:
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x (ou superior)
```

## 🚀 Passo 4: Fazer o Deploy

1. Após configurar as variáveis de ambiente, clique em **"Deploy"**
2. Aguarde o processo de build (geralmente 1-3 minutos)
3. O Vercel irá:
   - Instalar as dependências (`npm install`)
   - Fazer o build (`npm run build`)
   - Fazer o deploy dos arquivos

## ✅ Passo 5: Verificar o Deploy

1. Após o deploy, você verá uma URL como: `https://financeiro-xxx.vercel.app`
2. Clique na URL para acessar sua aplicação
3. Teste se está funcionando:
   - A aplicação carrega?
   - Os dados são salvos no Supabase?
   - Os gráficos aparecem?

## 🔧 Passo 6: Configurar Domínio Personalizado (Opcional)

1. No dashboard do projeto, vá em **"Settings"** > **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `meuapp.com`)
4. Siga as instruções para configurar o DNS

## 🛠️ Passo 7: Verificar Supabase

### 7.1 Criar as Tabelas no Supabase

1. Acesse o dashboard do Supabase: https://app.supabase.com
2. Vá em **"SQL Editor"**
3. Execute o script `supabase-setup.sql`:
   - Copie o conteúdo do arquivo `supabase-setup.sql`
   - Cole no SQL Editor
   - Clique em **"Run"**

### 7.2 Verificar as Tabelas

1. Vá em **"Table Editor"**
2. Verifique se as tabelas foram criadas:
   - `receitas`
   - `gastos_cartao`
   - `gastos_debito`

## 🔍 Troubleshooting

### Erro: "Failed to fetch" ou "ERR_NAME_NOT_RESOLVED"

**Solução**: Verifique se as variáveis de ambiente estão corretas:
- `VITE_SUPABASE_URL` está correta?
- `VITE_SUPABASE_PUBLISHABLE_KEY` está correta?
- O projeto Supabase está ativo?

### Erro: "Build failed"

**Solução**: 
- Verifique os logs de build no Vercel
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o Node.js versão está correta (18+)

### Erro: "Module not found"

**Solução**:
- Verifique se todas as dependências estão instaladas
- Execute `npm install` localmente para verificar
- Verifique se o `package.json` está correto

### Aplicação não carrega

**Solução**:
- Verifique se o build foi bem-sucedido
- Verifique os logs no Vercel
- Verifique se o `vercel.json` está configurado corretamente

### Dados não são salvos

**Solução**:
- Verifique se as variáveis de ambiente estão configuradas
- Verifique se as tabelas foram criadas no Supabase
- Verifique se as políticas RLS estão configuradas
- Verifique o console do navegador para erros

## 📱 Testar no Mobile

1. Acesse a URL do Vercel no seu iPhone XR
2. Verifique se:
   - A interface está responsiva
   - Os botões funcionam
   - Os gráficos aparecem corretamente
   - Os formulários funcionam
   - Os dados são salvos

## 🔄 Atualizar o Deploy

Toda vez que você fizer um push para o GitHub:

1. O Vercel detecta automaticamente as mudanças
2. Faz um novo build automaticamente
3. Faz o deploy da nova versão
4. Você pode ver o status no dashboard do Vercel

## 📊 Monitoramento

1. No dashboard do Vercel, você pode ver:
   - Logs de build
   - Logs de runtime
   - Métricas de performance
   - Erros e avisos

## 🔐 Segurança

⚠️ **IMPORTANTE**: 
- **NUNCA** commite arquivos `.env` no GitHub
- Use apenas variáveis de ambiente no Vercel
- Mantenha suas chaves do Supabase seguras
- Use a chave **anon/public** do Supabase (não a service role key)

## 📝 Checklist Final

- [ ] Conta no Vercel criada
- [ ] Projeto importado do GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Tabelas criadas no Supabase
- [ ] Aplicação funcionando corretamente
- [ ] Testado no mobile (iPhone XR)
- [ ] Domínio personalizado configurado (opcional)

## 🎉 Pronto!

Sua aplicação está no ar! Acesse a URL fornecida pelo Vercel e comece a usar.

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Vercel
2. Verifique o console do navegador
3. Verifique a documentação do Vercel: https://vercel.com/docs
4. Verifique a documentação do Supabase: https://supabase.com/docs

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **GitHub Repository**: https://github.com/williamjohndias/financeiro
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs

