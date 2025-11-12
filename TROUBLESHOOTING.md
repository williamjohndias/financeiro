# 🔧 Guia de Troubleshooting

## Erro: ERR_NAME_NOT_RESOLVED

Se você está vendo o erro `ERR_NAME_NOT_RESOLVED` ao tentar conectar com o Supabase, isso significa que o navegador não consegue resolver o nome do domínio do Supabase.

### Possíveis Causas e Soluções:

#### 1. Projeto Supabase Pausado ou Inativo
**Sintoma:** Erro `ERR_NAME_NOT_RESOLVED` ao tentar acessar o Supabase.

**Solução:**
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Verifique se o projeto está ativo
3. Se o projeto estiver pausado, clique em "Resume" para reativá-lo
4. Aguarde alguns minutos para o projeto ficar totalmente ativo

#### 2. URL do Supabase Incorreta
**Sintoma:** Erro de conexão mesmo com o projeto ativo.

**Solução:**
1. No Dashboard do Supabase, vá em **Settings** > **API**
2. Copie a URL correta do projeto
3. Verifique se a URL no código está correta:
   - Deve ser: `https://[seu-projeto-id].supabase.co`
   - Não deve ter barras no final
   - Deve começar com `https://`

#### 3. Problemas de Rede/DNS
**Sintoma:** Erro intermitente de conexão.

**Soluções:**
1. Verifique sua conexão com a internet
2. Tente limpar o cache do DNS:
   - Windows: `ipconfig /flushdns`
   - Mac/Linux: `sudo dscacheutil -flushcache`
3. Tente acessar a URL do Supabase diretamente no navegador
4. Verifique se há firewall ou proxy bloqueando a conexão

#### 4. Chave API Incorreta
**Sintoma:** Erro de autenticação.

**Solução:**
1. No Dashboard do Supabase, vá em **Settings** > **API**
2. Copie a **Publishable Key** (não a Secret Key!)
3. Atualize a chave no código ou no arquivo `.env`

### Verificações Rápidas:

1. **Projeto está ativo?**
   - Acesse o Dashboard do Supabase
   - Verifique o status do projeto

2. **URL está correta?**
   - Verifique se a URL no código corresponde à URL no Dashboard
   - Teste acessar a URL diretamente no navegador

3. **Chave API está correta?**
   - Use a **Publishable Key** (não a Secret Key)
   - Verifique se a chave está completa (sem cortes)

4. **Tabelas foram criadas?**
   - Execute o script SQL (`supabase-setup.sql`)
   - Verifique no Table Editor se as tabelas existem

### Comportamento Atual da Aplicação:

A aplicação está configurada para funcionar mesmo sem conexão com o Supabase:

- ✅ **Fallback Automático:** Se o Supabase não estiver disponível, os dados são salvos no LocalStorage
- ✅ **Funcionamento Offline:** A aplicação funciona normalmente usando apenas o LocalStorage
- ✅ **Sem Bloqueios:** Erros de conexão não impedem o uso da aplicação
- ✅ **Sincronização Automática:** Quando o Supabase estiver disponível, os dados serão sincronizados automaticamente

### Mensagens no Console:

- `✅ Supabase inicializado com sucesso!` - Supabase está configurado corretamente
- `⚠️ Erro de conexão com o Supabase` - Não foi possível conectar (mas a app funciona com LocalStorage)
- `ℹ️ Usando LocalStorage como fallback` - Aplicação usando armazenamento local
- `✅ Dados carregados do Supabase com sucesso!` - Dados carregados do Supabase

### Próximos Passos:

1. **Verifique o status do projeto no Supabase Dashboard**
2. **Execute o script SQL se ainda não executou**
3. **Teste a conexão novamente**
4. **Se continuar com erro, use a aplicação normalmente - ela funciona com LocalStorage**

### Importante:

A aplicação **funciona perfeitamente** mesmo sem o Supabase! Os dados são salvos no LocalStorage do navegador e estarão disponíveis localmente. Quando o Supabase estiver configurado e funcionando, os dados serão sincronizados automaticamente.

