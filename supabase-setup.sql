-- Criar tabela de receitas
CREATE TABLE IF NOT EXISTS receitas (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  mes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de gastos no cartão
CREATE TABLE IF NOT EXISTS gastos_cartao (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  parcelas INTEGER NOT NULL,
  parcela_atual INTEGER NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  data_inicio DATE NOT NULL,
  mes TEXT NOT NULL,
  pago BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de gastos no débito
CREATE TABLE IF NOT EXISTS gastos_debito (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  mes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_receitas_mes ON receitas(mes);
CREATE INDEX IF NOT EXISTS idx_gastos_cartao_mes ON gastos_cartao(mes);
CREATE INDEX IF NOT EXISTS idx_gastos_debito_mes ON gastos_debito(mes);
CREATE INDEX IF NOT EXISTS idx_gastos_cartao_pago ON gastos_cartao(pago);

-- Habilitar RLS (Row Level Security) - permitir todas as operações por enquanto
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_debito ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir todas as operações (você pode ajustar depois)
CREATE POLICY "Permitir todas as operações em receitas" ON receitas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas as operações em gastos_cartao" ON gastos_cartao
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas as operações em gastos_debito" ON gastos_debito
  FOR ALL USING (true) WITH CHECK (true);

