-- Script para limpar TODOS os dados do banco
-- Execute este script no SQL Editor do Supabase
-- ⚠️ ATENÇÃO: Este script remove PERMANENTEMENTE TODOS os dados de todas as tabelas
-- ⚠️ Esta ação NÃO PODE ser desfeita!

-- Deletar TODOS os registros de receitas
DELETE FROM receitas;

-- Deletar TODOS os registros de gastos no cartão
DELETE FROM gastos_cartao;

-- Deletar TODOS os registros de gastos no débito
DELETE FROM gastos_debito;

-- Verificar que todas as tabelas estão vazias
SELECT 
  'receitas' as tabela,
  COUNT(*) as registros_restantes
FROM receitas
UNION ALL
SELECT 
  'gastos_cartao' as tabela,
  COUNT(*) as registros_restantes
FROM gastos_cartao
UNION ALL
SELECT 
  'gastos_debito' as tabela,
  COUNT(*) as registros_restantes
FROM gastos_debito;

-- Se o resultado mostrar 0 registros em todas as tabelas, a limpeza foi bem-sucedida!

