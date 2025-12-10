# 📤 Como Fazer Push para o GitHub

Como o Git não está instalado no terminal, você pode usar uma das seguintes opções:

## Opção 1: GitHub Desktop (Recomendado)

1. **Instale o GitHub Desktop**: [Download aqui](https://desktop.github.com/)

2. **Clone o repositório**:
   - Abra o GitHub Desktop
   - Clique em "File" > "Clone Repository"
   - Cole a URL: `https://github.com/williamjohndias/financeiro.git`
   - Escolha a pasta local (onde está o projeto)
   - Clique em "Clone"

3. **Adicione os arquivos**:
   - O GitHub Desktop detectará automaticamente as mudanças
   - Clique em "Commit to main"
   - Escreva uma mensagem: "Initial commit - Controle Financeiro Pessoal"
   - Clique em "Commit to main"

4. **Envie para o GitHub**:
   - Clique em "Push origin"
   - Aguarde o upload

## Opção 2: GitHub Web Interface

1. **Crie o repositório no GitHub**:
   - Acesse: https://github.com/williamjohndias/financeiro
   - Se não existir, crie um novo repositório

2. **Faça upload dos arquivos**:
   - Clique em "Upload files"
   - Arraste todos os arquivos do projeto (exceto `node_modules` e `.env`)
   - Escreva uma mensagem de commit: "Initial commit"
   - Clique em "Commit changes"

## Opção 3: Instalar Git no Windows

1. **Instale o Git**:
   - Download: https://git-scm.com/download/win
   - Instale com as opções padrão

2. **Abra o Git Bash** no diretório do projeto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Controle Financeiro Pessoal"
   git remote add origin https://github.com/williamjohndias/financeiro.git
   git branch -M main
   git push -u origin main
   ```

## Arquivos que NÃO devem ser enviados

Certifique-se de que o `.gitignore` está configurado corretamente. Os seguintes arquivos/pastas NÃO devem ser enviados:

- `node_modules/`
- `.env`
- `.env.local`
- `.env.production`
- `dist/`
- `.DS_Store`
- Arquivos de log

## Verificação

Após fazer o push, verifique:
- ✅ Todos os arquivos estão no GitHub
- ✅ O `.gitignore` está funcionando
- ✅ As variáveis de ambiente NÃO estão no repositório
- ✅ O `README.md` está atualizado

## Próximos Passos

Após enviar para o GitHub:
1. Configure o Supabase (se ainda não fez)
2. Configure o Vercel com as variáveis de ambiente
3. Faça o deploy
4. Teste a aplicação

Veja o arquivo `DEPLOY.md` para instruções detalhadas de deploy no Vercel.

