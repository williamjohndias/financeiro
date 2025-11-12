# Configuração do Supabase

## Passo 1: Criar as Tabelas no Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o script SQL do arquivo `supabase-setup.sql`

O script criará as seguintes tabelas:
- `receitas` - Receitas mensais
- `gastos_cartao` - Gastos no cartão de crédito
- `gastos_debito` - Gastos no débito

## Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://tmkrknkzgtppyylztida.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_2DG1pydZMpDfcUOZZ_48kg_ycYSEWOr
```

**Importante:** 
- O arquivo `.env` já está no `.gitignore` para proteger suas credenciais.
- A **publishable key** é segura para usar no browser quando RLS (Row Level Security) está habilitado nas tabelas.
- A **secret key** NUNCA deve ser usada no frontend, apenas no backend.

## Passo 3: Verificar Políticas de Segurança (RLS)

As políticas de Row Level Security (RLS) estão configuradas para permitir todas as operações. Para produção, você deve:

1. Acessar **Authentication** > **Policies** no Supabase
2. Configurar políticas mais restritivas baseadas em usuários autenticados
3. Implementar autenticação na aplicação

## Estrutura das Tabelas

### receitas
- `id` (TEXT, PRIMARY KEY)
- `descricao` (TEXT)
- `valor` (NUMERIC)
- `data` (DATE)
- `mes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### gastos_cartao
- `id` (TEXT, PRIMARY KEY)
- `descricao` (TEXT)
- `valor_total` (NUMERIC)
- `parcelas` (INTEGER)
- `parcela_atual` (INTEGER)
- `valor_parcela` (NUMERIC)
- `data_inicio` (DATE)
- `mes` (TEXT)
- `pago` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### gastos_debito
- `id` (TEXT, PRIMARY KEY)
- `descricao` (TEXT)
- `valor` (NUMERIC)
- `data` (DATE)
- `mes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Funcionalidades

- ✅ Sincronização automática com Supabase
- ✅ Fallback para LocalStorage em caso de erro
- ✅ Operações CRUD completas (Create, Read, Update, Delete)
- ✅ Suporte a importação em lote
- ✅ Verificação de duplicatas

## Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`

### Erro: "permission denied"
- Verifique as políticas RLS no Supabase
- Certifique-se de que as políticas permitem as operações necessárias

### Dados não aparecem
- Verifique o console do navegador para erros
- Verifique se as tabelas foram criadas corretamente
- Verifique se os dados foram inseridos no Supabase

## Próximos Passos

1. Implementar autenticação de usuários
2. Configurar políticas RLS mais restritivas
3. Adicionar backups automáticos
4. Implementar sincronização em tempo real com Supabase Realtime

