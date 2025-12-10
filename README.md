# 💰 Controle Financeiro Pessoal

Uma aplicação web moderna para gerenciar suas finanças pessoais, com controle de receitas, gastos no cartão (com parcelamento), gastos no débito, gráficos de saldo e projeção financeira.

## 🚀 Funcionalidades

- **📊 Receitas Mensais**: Cadastre todas as suas receitas do mês
- **💳 Gastos no Cartão**: Adicione gastos no cartão com sistema de parcelamento automático
- **💸 Gastos no Débito**: Registre seus gastos variáveis no débito
- **📈 Dashboard Interativo**: Visualize gráficos de receitas vs gastos, saldo mensal e projeção acumulada
- **🎯 Projeção Financeira**: Veja sua projeção para os próximos 6 meses
- **💰 Meta de Economia**: Acompanhe quanto você pode economizar com base na sua projeção
- **💾 Persistência de Dados**: Sincronização com Supabase e fallback para LocalStorage

## 🛠️ Tecnologias

- React 18
- TypeScript
- Vite
- Recharts (gráficos)
- Supabase (banco de dados)
- CSS3 (design moderno e responsivo)
- Design responsivo para iPhone XR e dispositivos móveis

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse no navegador:
```
http://localhost:5173
```

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist`.

## 📱 Como Usar

1. **Cadastrar Receitas**: Vá para a aba "Receitas" e adicione suas receitas mensais
2. **Cadastrar Gastos no Cartão**: Na aba "Gastos", adicione compras parceladas (o sistema distribui automaticamente as parcelas pelos meses)
3. **Cadastrar Gastos no Débito**: Adicione seus gastos variáveis pagos no débito
4. **Visualizar Dashboard**: Veja gráficos e projeções na aba "Dashboard"
5. **Marcar Parcelas como Pagas**: Clique no ícone de relógio para marcar uma parcela como paga

## 🎨 Recursos Visuais

- Interface moderna com gradientes e animações
- Gráficos interativos de barras e linhas
- Cards informativos com estatísticas
- Design responsivo para mobile e desktop
- Cores diferenciadas para receitas (verde), gastos cartão (laranja) e gastos débito (vermelho)

## 💡 Dicas

- Mantenha seus gastos atualizados para ter projeções mais precisas
- Use o sistema de parcelamento para planejar melhor seus gastos futuros
- Acompanhe o saldo acumulado para entender sua capacidade de economia
- Marque as parcelas como pagas para ter um controle mais preciso

## 🌐 Deploy no Vercel

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave pública do Supabase
3. O Vercel irá fazer o deploy automaticamente

## 📝 Notas

- Os dados são sincronizados com o Supabase
- LocalStorage é usado como fallback caso o Supabase não esteja disponível
- A aplicação é totalmente responsiva e otimizada para dispositivos móveis
- Design otimizado para iPhone XR (414x896px) e outros dispositivos móveis

## 🤝 Contribuindo

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades!

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

