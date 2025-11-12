import { Receita, GastoCartao, GastoDebito, SaldoMensal } from '../types';

export const getMesAtual = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMes = (mes: string): string => {
  const [ano, mesNum] = mes.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${meses[parseInt(mesNum) - 1]} ${ano}`;
};

export const calcularSaldoMensal = (
  mes: string,
  receitas: Receita[],
  gastosCartao: GastoCartao[],
  gastosDebito: GastoDebito[]
): SaldoMensal => {
  const receitasMes = receitas
    .filter(r => r.mes === mes)
    .reduce((sum, r) => sum + r.valor, 0);

  // Contabilizar TODOS os gastos do cartão do mês (mesmo os pagos)
  // Pois são gastos que foram/serão pagos naquele mês
  const gastosCartaoFiltrados = gastosCartao.filter(g => g.mes === mes);
  const gastosCartaoMes = gastosCartaoFiltrados
    .reduce((sum, g) => sum + g.valorParcela, 0);

  const gastosDebitoFiltrados = gastosDebito.filter(g => g.mes === mes);
  const gastosDebitoMes = gastosDebitoFiltrados
    .reduce((sum, g) => sum + g.valor, 0);

  const saldo = receitasMes - gastosCartaoMes - gastosDebitoMes;

  // Debug: Log detalhado do cálculo
  if (gastosCartaoFiltrados.length > 0 || gastosDebitoFiltrados.length > 0) {
    console.log(`💰 Cálculo para ${mes}:`, {
      receitasMes,
      gastosCartao: {
        quantidade: gastosCartaoFiltrados.length,
        total: gastosCartaoMes,
        detalhes: gastosCartaoFiltrados.map(g => ({ descricao: g.descricao, valor: g.valorParcela, pago: g.pago })),
      },
      gastosDebito: {
        quantidade: gastosDebitoFiltrados.length,
        total: gastosDebitoMes,
        detalhes: gastosDebitoFiltrados.map(g => ({ descricao: g.descricao, valor: g.valor })),
      },
      saldo,
    });
  }

  return {
    mes,
    receitas: receitasMes,
    gastosCartao: gastosCartaoMes,
    gastosDebito: gastosDebitoMes,
    saldo,
  };
};

const getMesesEntre = (mesInicio: string, mesFim: string): number => {
  const [anoInicio, mesInicioNum] = mesInicio.split('-').map(Number);
  const [anoFim, mesFimNum] = mesFim.split('-').map(Number);
  
  return (anoFim - anoInicio) * 12 + (mesFimNum - mesInicioNum);
};

export const getProximosMeses = (quantidade: number = 6): string[] => {
  const meses: string[] = [];
  const date = new Date();
  
  for (let i = 0; i < quantidade; i++) {
    const ano = date.getFullYear();
    const mes = date.getMonth() + 1;
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`);
    date.setMonth(date.getMonth() + 1);
  }
  
  return meses;
};

export const calcularProjecao = (
  meses: string[],
  receitas: Receita[],
  gastosCartao: GastoCartao[],
  gastosDebito: GastoDebito[]
): SaldoMensal[] => {
  return meses.map(mes => calcularSaldoMensal(mes, receitas, gastosCartao, gastosDebito));
};

