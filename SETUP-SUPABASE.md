# 🚀 Configuração do Supabase - Passo a Passo

## Passo 1: Criar as Tabelas no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login e selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `supabase-setup.sql`
6. Clique em **Run** para executar o script

O script criará 3 tabelas:
- ✅ `receitas` - Receitas mensais
- ✅ `gastos_cartao` - Gastos no cartão de crédito
- ✅ `gastos_debito` - Gastos no débito

## Passo 2: Verificar se as Tabelas Foram Criadas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as 3 tabelas criadas:
   - `receitas`
   - `gastos_cartao`
   - `gastos_debito`

## Passo 3: Configurar Variáveis de Ambiente (Opcional)

As credenciais do Supabase já estão configuradas no código. Se você quiser usar variáveis de ambiente:

1. Crie um arquivo `.env` na raiz do projeto
2. Adicione as seguintes linhas:

```env
VITE_SUPABASE_URL=https://tmkrknkzgtppyylztida.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_2DG1pydZMpDfcUOZZ_48kg_ycYSEWOr
```

**Nota:** A publishable key é segura para usar no browser quando RLS (Row Level Security) está habilitado nas tabelas.

3. Reinicie o servidor de desenvolvimento (`npm run dev`)

## Passo 4: Verificar Políticas de Segurança (RLS)

As políticas de Row Level Security (RLS) já estão configuradas para permitir todas as operações. 

Para verificar:
1. No menu lateral, clique em **Authentication** > **Policies**
2. Você deve ver políticas para as 3 tabelas

## ✅ Pronto!

Agora sua aplicação está configurada para usar o Supabase! 

### Funcionalidades Ativadas:
- ✅ Dados salvos no Supabase (nuvem)
- ✅ Sincronização automática
- ✅ Fallback para LocalStorage em caso de erro
- ✅ Operações CRUD completas
- ✅ Importação de dados em lote

### Testando:

1. Inicie o servidor: `npm run dev`
2. Acesse a aplicação no navegador
3. Adicione uma receita ou gasto
4. Verifique no Supabase (Table Editor) se os dados foram salvos

## 🔧 Troubleshooting

### Erro: "permission denied"
- Verifique se as políticas RLS estão ativas e permitem todas as operações
- Verifique se você executou o script SQL corretamente

### Dados não aparecem
- Verifique o console do navegador (F12) para erros
- Verifique se as tabelas foram criadas no Supabase
- Verifique se os dados foram inseridos na tabela correta

### Erro de conexão
- Verifique se a URL e a chave do Supabase estão corretas
- Verifique sua conexão com a internet
- Verifique se o projeto do Supabase está ativo

## 📊 Estrutura das Tabelas

### receitas
- `id` (TEXT, PRIMARY KEY) - ID único da receita
- `descricao` (TEXT) - Descrição da receita
- `valor` (NUMERIC) - Valor da receita
- `data` (DATE) - Data da receita
- `mes` (TEXT) - Mês de referência (formato: YYYY-MM)
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### gastos_cartao
- `id` (TEXT, PRIMARY KEY) - ID único do gasto
- `descricao` (TEXT) - Descrição do gasto
- `valor_total` (NUMERIC) - Valor total do gasto
- `parcelas` (INTEGER) - Número total de parcelas
- `parcela_atual` (INTEGER) - Número da parcela atual
- `valor_parcela` (NUMERIC) - Valor da parcela
- `data_inicio` (DATE) - Data de início do parcelamento
- `mes` (TEXT) - Mês de referência (formato: YYYY-MM)
- `pago` (BOOLEAN) - Se a parcela foi paga
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### gastos_debito
- `id` (TEXT, PRIMARY KEY) - ID único do gasto
- `descricao` (TEXT) - Descrição do gasto
- `valor` (NUMERIC) - Valor do gasto
- `data` (DATE) - Data do gasto
- `mes` (TEXT) - Mês de referência (formato: YYYY-MM)
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

## 🎯 Próximos Passos

1. ✅ Configuração básica completa
2. 🔄 Implementar autenticação de usuários (opcional)
3. 🔒 Configurar políticas RLS mais restritivas (opcional)
4. 📱 Adicionar sincronização em tempo real (opcional)

