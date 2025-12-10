# 🚀 Guia de Deploy no Vercel

## Pré-requisitos

1. Conta no GitHub
2. Conta no Vercel
3. Conta no Supabase
4. Git instalado (ou GitHub Desktop)

## Passo 1: Preparar o Repositório GitHub

1. Abra o terminal na pasta do projeto
2. Inicialize o repositório Git (se ainda não estiver inicializado):
```bash
git init
```

3. Adicione todos os arquivos:
```bash
git add .
```

4. Faça o commit inicial:
```bash
git commit -m "Initial commit - Controle Financeiro Pessoal"
```

5. Conecte ao repositório GitHub:
```bash
git remote add origin https://github.com/williamjohndias/financeiro.git
```

6. Envie para o GitHub:
```bash
git branch -M main
git push -u origin main
```

## Passo 2: Configurar o Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto ou use um existente
3. Execute o script SQL `supabase-setup.sql` no SQL Editor
4. Copie a URL do projeto e a chave pública (anon key)

## Passo 3: Deploy no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório `williamjohndias/financeiro`
4. Configure as variáveis de ambiente:
   - **VITE_SUPABASE_URL**: Cole a URL do seu projeto Supabase
   - **VITE_SUPABASE_PUBLISHABLE_KEY**: Cole a chave pública do Supabase
5. Clique em "Deploy"
6. Aguarde o deploy finalizar

## Passo 4: Configurar o Domínio (Opcional)

1. No dashboard do Vercel, vá em "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar o DNS

## Variáveis de Ambiente

As seguintes variáveis de ambiente devem ser configuradas no Vercel:

- `VITE_SUPABASE_URL`: URL do projeto Supabase (ex: https://xxxxx.supabase.co)
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave pública do Supabase (anon key)

## Verificação

Após o deploy, verifique:

1. ✅ A aplicação carrega corretamente
2. ✅ Os dados são salvos no Supabase
3. ✅ A aplicação funciona em dispositivos móveis
4. ✅ Os gráficos são exibidos corretamente

## Troubleshooting

### Erro de conexão com Supabase

- Verifique se as variáveis de ambiente estão corretas
- Verifique se o projeto Supabase está ativo
- Verifique se as tabelas foram criadas corretamente

### Erro de build no Vercel

- Verifique se todas as dependências estão no `package.json`
- Verifique se o Node.js versão está correta (18+)
- Verifique os logs de build no Vercel

### Problemas com responsividade

- A aplicação está otimizada para iPhone XR (414x896px)
- Teste em diferentes dispositivos
- Verifique os media queries no CSS

## Suporte

Para problemas ou dúvidas, verifique:
- [Documentação do Vercel](https://vercel.com/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Vite](https://vitejs.dev)

