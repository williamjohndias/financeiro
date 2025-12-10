-- Script para limpar dados anteriores a novembro de 2025
-- Execute este script no SQL Editor do Supabase
-- ATENÇÃO: Este script remove PERMANENTEMENTE todos os dados anteriores a novembro de 2025

-- Deletar receitas anteriores a novembro de 2025
DELETE FROM receitas 
WHERE mes < '2025-11';

-- Deletar gastos no cartão anteriores a novembro de 2025
DELETE FROM gastos_cartao 
WHERE mes < '2025-11';

-- Deletar gastos no débito anteriores a novembro de 2025
DELETE FROM gastos_debito 
WHERE mes < '2025-11';

-- Verificar quantos registros foram deletados
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

