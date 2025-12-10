import { useEffect, useMemo, useRef, useState } from 'react';
import { FinancasData, SaldoMensal } from '../types';
import { 
  getMesAtual, 
  getProximosMeses, 
  calcularProjecao, 
  calcularSaldoMensal,
  formatMes,
  analisarPagamentoFatura,
  getTodosMesesComDados,
  AnalisePagamento
} from '../utils/calculations';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './Dashboard.css';

interface DashboardProps {
  data: FinancasData;
  initialPage?: DashboardPage;
}

type StatusCartaoFiltro = 'todos' | 'pagos' | 'abertos';
type GraficoTab = 'comparativo' | 'distribuicao' | 'capacidade' | 'tendencia' | 'saldo' | 'parcelas';
type DashboardPage = 'resumo' | 'projecoes' | 'insights';
type ResumoView = 'principal' | 'comparar' | 'tabela';

export default function Dashboard({ data, initialPage }: DashboardProps) {
  const [mesFiltro, setMesFiltro] = useState<string>('');
  const [periodoMeses, setPeriodoMeses] = useState(12);
  const [statusCartaoFiltro, setStatusCartaoFiltro] = useState<StatusCartaoFiltro>('todos');
  const [seriesVisiveis, setSeriesVisiveis] = useState({
    receitas: true,
    cartao: true,
    debito: true,
  });
  const [mesesComparacao, setMesesComparacao] = useState<string[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [abaGraficos, setAbaGraficos] = useState<GraficoTab>('comparativo');
  const [paginaAtual, setPaginaAtual] = useState<DashboardPage>(initialPage || 'resumo');
  const [resumoView, setResumoView] = useState<ResumoView>('principal');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialPage) {
      setPaginaAtual(initialPage);
    }
  }, [initialPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const gastosCartaoConsiderados = useMemo(() => {
    if (statusCartaoFiltro === 'todos') {
      return data.gastosCartao;
    }
    return data.gastosCartao.filter(g =>
      statusCartaoFiltro === 'pagos' ? g.pago : !g.pago
    );
  }, [data.gastosCartao, statusCartaoFiltro]);

  const mesAtual = getMesAtual();
  const proximosMeses = getProximosMeses(periodoMeses);
  
  // Coletar todos os meses que têm dados (receitas, gastos cartão ou débito)
  const todosMesesComDados = getTodosMesesComDados(
    data.receitas,
    data.gastosCartao,
    data.gastosDebito
  );
  const mesesComparaveis = useMemo(
    () => [...todosMesesComDados],
    [todosMesesComDados]
  );
  
  // Garantir que novembro/2025 esteja incluído se houver dados
  const mesNovembro2025 = '2025-11';
  if (!proximosMeses.includes(mesNovembro2025) && todosMesesComDados.includes(mesNovembro2025)) {
    proximosMeses.push(mesNovembro2025);
    proximosMeses.sort();
  }
  
  // Incluir todos os meses com dados que estejam no futuro ou sejam novembro/2025
  const mesesParaCalcular = [...new Set([...proximosMeses, ...todosMesesComDados.filter(m => m >= mesAtual || m === mesNovembro2025)])].sort();
  
  // Filtrar meses se houver filtro selecionado
  const mesesExibidos = mesFiltro 
    ? mesesParaCalcular.filter(m => m === mesFiltro)
    : mesesParaCalcular;
  
  const projecao = calcularProjecao(
    mesesExibidos,
    data.receitas,
    gastosCartaoConsiderados,
    data.gastosDebito
  );
  
  const saldoAtual = projecao.find(p => p.mes === mesAtual) || {
    mes: mesAtual,
    receitas: 0,
    gastosCartao: 0,
    gastosDebito: 0,
    saldo: 0,
  };
  
  const saldoAcumulado = projecao.reduce((acc, mes) => {
    const saldoAnterior = acc.length > 0 ? acc[acc.length - 1].saldoAcumulado : 0;
    return [
      ...acc,
      {
        ...mes,
        saldoAcumulado: saldoAnterior + mes.saldo,
        mesFormatado: formatMes(mes.mes),
      },
    ];
  }, [] as (SaldoMensal & { saldoAcumulado: number; mesFormatado: string })[]);

  const totalReceitas = saldoAcumulado.reduce((sum, m) => sum + m.receitas, 0);
  const totalGastosCartao = saldoAcumulado.reduce((sum, m) => sum + m.gastosCartao, 0);
  const totalGastosDebito = saldoAcumulado.reduce((sum, m) => sum + m.gastosDebito, 0);
  const saldoFinal = saldoAcumulado[saldoAcumulado.length - 1]?.saldoAcumulado || 0;

  const dadosGrafico = saldoAcumulado.map(mes => ({
    mes: mes.mesFormatado.split(' ')[0].substring(0, 3),
    Receitas: mes.receitas,
    'Gastos Cartão': mes.gastosCartao,
    'Gastos Débito': mes.gastosDebito,
    Saldo: mes.saldo,
  }));

  const dadosSaldoAcumulado = saldoAcumulado.map(mes => ({
    mes: mes.mesFormatado.split(' ')[0].substring(0, 3),
    'Saldo Acumulado': mes.saldoAcumulado,
  }));

  // Análise de pagamento de fatura para o mês atual e próximos meses
  const analisesPagamento: AnalisePagamento[] = mesesExibidos.map(mes =>
    analisarPagamentoFatura(
      mes,
      data.receitas,
      gastosCartaoConsiderados,
      data.gastosDebito,
      mesesParaCalcular
    )
  );
  const analisePadrao: AnalisePagamento = {
    mes: mesAtual,
    faturaTotal: 0,
    receitas: 0,
    saldoDisponivel: 0,
    podePagar: true,
    percentualCobertura: 0,
    mesesRestantes: 0,
  };

  // Dados para gráfico de capacidade de pagamento
  const dadosCapacidadePagamento = analisesPagamento.map(analise => ({
    mes: formatMes(analise.mes).split(' ')[0].substring(0, 3),
    'Fatura do Cartão': analise.faturaTotal,
    'Receitas': analise.receitas,
    'Saldo Disponível': analise.saldoDisponivel,
    'Pode Pagar': analise.podePagar ? analise.faturaTotal : 0,
  }));

  // Dados para gráfico de tendência de saldo
  const dadosTendencia = saldoAcumulado.map(mes => ({
    mes: mes.mesFormatado.split(' ')[0].substring(0, 3),
    'Saldo Mensal': mes.saldo,
    'Saldo Acumulado': mes.saldoAcumulado,
  }));

  const dadosDistribuicao = [
    {
      name: 'Receitas',
      value: seriesVisiveis.receitas ? totalReceitas : 0,
    },
    {
      name: 'Cartão',
      value: seriesVisiveis.cartao ? totalGastosCartao : 0,
    },
    {
      name: 'Débito',
      value: seriesVisiveis.debito ? totalGastosDebito : 0,
    },
  ];

  const coresDistribuicao = ['#34a853', '#fbbc05', '#ea4335'];

  const statusParcelasPorMes = mesesParaCalcular
    .map(mes => {
      const parcelasMes = data.gastosCartao.filter(g => g.mes === mes);
      const pagas = parcelasMes
        .filter(p => p.pago)
        .reduce((sum, parcela) => sum + parcela.valorParcela, 0);
      const abertas = parcelasMes
        .filter(p => !p.pago)
        .reduce((sum, parcela) => sum + parcela.valorParcela, 0);

      return {
        mes: formatMes(mes).split(' ')[0].substring(0, 3),
        Pagas: pagas,
        Abertas: abertas,
      };
    })
    .filter(item => item.Pagas > 0 || item.Abertas > 0);

  const paginasDashboard: Array<{
    id: DashboardPage;
    label: string;
    descricao: string;
  }> = [
    {
      id: 'resumo',
      label: 'Resumo',
      descricao: 'Escolha visualizar o painel principal, o comparador ou a tabela resumida.',
    },
    {
      id: 'projecoes',
      label: 'Projeções e Gráficos',
      descricao: 'Acompanhe projeções futuras e navegue entre os gráficos principais.',
    },
    {
      id: 'insights',
      label: 'Insights e Quitar Dívidas',
      descricao: 'Receba recomendações para quitar despesas e equilibrar o fluxo de caixa.',
    },
  ];

  const paginaAtivaInfo = paginasDashboard.find(page => page.id === paginaAtual);
  const resumoViews: Array<{ id: ResumoView; label: string }> = [
    { id: 'principal', label: 'Painel Principal' },
    { id: 'comparar', label: 'Comparar Meses' },
    { id: 'tabela', label: 'Tabela Comparativa' },
  ];

  const chartTabs = useMemo(() => {
    const tabs: Array<{
      id: GraficoTab;
      label: string;
      heading: string;
      content: JSX.Element;
      available?: boolean;
    }> = [
      {
        id: 'comparativo',
        label: 'Receitas x Gastos',
        heading: 'Receitas vs Gastos por Mês',
        content: (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              {seriesVisiveis.receitas && <Bar dataKey="Receitas" fill="#4caf50" />}
              {seriesVisiveis.cartao && <Bar dataKey="Gastos Cartão" fill="#ff9800" />}
              {seriesVisiveis.debito && <Bar dataKey="Gastos Débito" fill="#f44336" />}
            </BarChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'distribuicao',
        label: 'Distribuição Geral',
        heading: 'Distribuição de Receitas e Gastos',
        content: (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={dadosDistribuicao}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
              >
                {dadosDistribuicao.map((entry, index) => (
                  <Cell key={entry.name} fill={coresDistribuicao[index % coresDistribuicao.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'capacidade',
        label: 'Capacidade da Fatura',
        heading: 'Capacidade de Pagamento da Fatura',
        content: (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={dadosCapacidadePagamento}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Fatura do Cartão" fill="#ff9800" />
              <Bar dataKey="Receitas" fill="#4caf50" />
              <Line
                type="monotone"
                dataKey="Saldo Disponível"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'tendencia',
        label: 'Tendência de Saldo',
        heading: 'Tendência de Saldo (Mensal e Acumulado)',
        content: (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dadosTendencia}>
              <defs>
                <linearGradient id="colorSaldoMensal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaldoAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#764ba2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#764ba2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Saldo Mensal"
                stroke="#667eea"
                fillOpacity={1}
                fill="url(#colorSaldoMensal)"
              />
              <Line
                type="monotone"
                dataKey="Saldo Acumulado"
                stroke="#764ba2"
                strokeWidth={3}
                dot={{ fill: '#764ba2', r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'saldo',
        label: 'Saldo Projetado',
        heading: 'Saldo Acumulado (Projeção)',
        content: (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dadosSaldoAcumulado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Saldo Acumulado"
                stroke="#764ba2"
                strokeWidth={3}
                dot={{ fill: '#764ba2', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ),
      },
      {
        id: 'parcelas',
        label: 'Parcelas do Cartão',
        heading: 'Status das Parcelas do Cartão',
        content: (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={statusParcelasPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Pagas" stackId="a" fill="#34a853" />
              <Bar dataKey="Abertas" stackId="a" fill="#ea4335" />
            </BarChart>
          </ResponsiveContainer>
        ),
        available: statusParcelasPorMes.length > 0,
      },
    ];

    return tabs.filter(tab => tab.available !== false);
  }, [
    dadosGrafico,
    dadosDistribuicao,
    dadosCapacidadePagamento,
    dadosTendencia,
    dadosSaldoAcumulado,
    statusParcelasPorMes,
    seriesVisiveis,
  ]);

  useEffect(() => {
    if (!chartTabs.length) {
      return;
    }

    if (!chartTabs.some(tab => tab.id === abaGraficos)) {
      setAbaGraficos(chartTabs[0].id);
    }
  }, [chartTabs, abaGraficos]);

  const graficoAtivo = chartTabs.find(tab => tab.id === abaGraficos) || chartTabs[0];

  // Calcular estratégia de pagamento - MOVER PARA ANTES DO USO
  const mesAtualAnalise = analisesPagamento.find(a => a.mes === mesAtual) || analisesPagamento[0] || analisePadrao;

  const valorParaQuitarMes = saldoAtual.saldo < 0 ? Math.abs(saldoAtual.saldo) : 0;
  const coberturaCartao = saldoAtual.receitas > 0 ? (saldoAtual.gastosCartao / saldoAtual.receitas) * 100 : 0;
  const valorFaturaFaltante = Math.max(0, mesAtualAnalise.faturaTotal - mesAtualAnalise.saldoDisponivel);

  const insightsFinanceiros = [
    {
      titulo: valorParaQuitarMes > 0 ? 'Reforço necessário no mês atual' : 'Saldo mensal positivo',
      descricao:
        valorParaQuitarMes > 0
          ? `Faltam ${formatCurrency(valorParaQuitarMes)} para quitar todas as despesas deste mês. Considere cortar gastos ou antecipar receitas para equilibrar o fluxo.`
          : 'Seu saldo cobre todas as despesas do mês atual. Mantenha o ritmo e aproveite para criar reserva.',
    },
    {
      titulo: 'Cobertura da fatura do cartão',
      descricao:
        coberturaCartao > 100
          ? `A fatura consome ${coberturaCartao.toFixed(1)}% das receitas. Reduza compras parceladas para voltar a um patamar seguro.`
          : `A fatura usa ${coberturaCartao.toFixed(1)}% das receitas. Você está dentro de um limite saudável.`,
    },
    {
      titulo: mesAtualAnalise.podePagar ? 'Fatura sob controle' : 'Planeje pagamentos futuros',
      descricao: mesAtualAnalise.podePagar
        ? 'Você consegue pagar a fatura integralmente sem comprometer o saldo.'
        : `Separe ${formatCurrency(valorFaturaFaltante)} e considere pausar novas compras até equilibrar o caixa (previsão de ${mesAtualAnalise.mesesRestantes} mês(es)).`,
    },
  ];

  const chipLabels: Record<keyof typeof seriesVisiveis, string> = {
    receitas: 'Receitas',
    cartao: 'Gastos Cartão',
    debito: 'Gastos Débito',
  };

  const handleToggleSerie = (serie: keyof typeof seriesVisiveis) => {
    setSeriesVisiveis(prev => ({
      ...prev,
      [serie]: !prev[serie],
    }));
  };

  const comparacaoData = useMemo(
    () =>
      mesesComparacao.map(mes => {
        const resumo = calcularSaldoMensal(
          mes,
          data.receitas,
          gastosCartaoConsiderados,
          data.gastosDebito
        );
        return {
          ...resumo,
          mesLabel: formatMes(mes),
        };
      }),
    [mesesComparacao, data.receitas, gastosCartaoConsiderados, data.gastosDebito]
  );

  const podeComparar = comparacaoData.length >= 2;
  const maiorSaldoComparado =
    comparacaoData.length > 0
      ? Math.max(...comparacaoData.map(item => item.saldo))
      : 0;
  const menorSaldoComparado =
    comparacaoData.length > 0
      ? Math.min(...comparacaoData.map(item => item.saldo))
      : 0;

  const handleToggleComparacao = (mes: string) => {
    setMesesComparacao(prev =>
      prev.includes(mes) ? prev.filter(item => item !== mes) : [...prev, mes]
    );
  };

  const limparComparacao = () => setMesesComparacao([]);

  // Encontrar meses críticos (saldo negativo)
  const mesesCriticos = saldoAcumulado.filter(m => m.saldo < 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>📊 Dashboard Financeiro</h2>
          <p className="dashboard-subtitle">
            Explore os dados como em uma planilha: filtros, métricas e comparativos em um lugar.
          </p>
        </div>
        <div className="dashboard-header-controls">
          <div className="dashboard-control-group">
            <div className="mes-atual">
              <strong>Mês atual: {formatMes(mesAtual)}</strong>
            </div>
            <div className="dashboard-select">
              <label htmlFor="periodo-meses">Período</label>
              <select
                id="periodo-meses"
                value={periodoMeses}
                onChange={event => setPeriodoMeses(Number(event.target.value))}
              >
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
                <option value={18}>18 meses</option>
                <option value={24}>24 meses</option>
              </select>
            </div>
            <div className="dashboard-select">
              <label htmlFor="status-cartao">Status do cartão</label>
              <select
                id="status-cartao"
                value={statusCartaoFiltro}
                onChange={event => setStatusCartaoFiltro(event.target.value as StatusCartaoFiltro)}
              >
                <option value="todos">Todos</option>
                <option value="pagos">Pagos</option>
                <option value="abertos">Abertos</option>
              </select>
            </div>
            <div className="dashboard-select">
              <label htmlFor="filtro-mes-dashboard">Filtrar por mês</label>
              <select
                id="filtro-mes-dashboard"
                value={mesFiltro}
                onChange={event => setMesFiltro(event.target.value)}
              >
                <option value="">Todos os meses</option>
                {todosMesesComDados.map(mes => (
                  <option key={mes} value={mes}>
                    {formatMes(mes)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="dashboard-chip-group">
            {Object.entries(chipLabels).map(([key, label]) => (
              <button
                key={key}
                className={`dashboard-chip ${seriesVisiveis[key as keyof typeof seriesVisiveis] ? 'active' : ''}`}
                onClick={() => handleToggleSerie(key as keyof typeof seriesVisiveis)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!initialPage && (
        <>
          <div className="dashboard-pages-nav">
            {paginasDashboard.map(page => (
              <button
                key={page.id}
                className={paginaAtual === page.id ? 'active' : ''}
                onClick={() => setPaginaAtual(page.id)}
                type="button"
              >
                {page.label}
              </button>
            ))}
          </div>
          {paginaAtivaInfo && (
            <p className="dashboard-pages-hint">{paginaAtivaInfo.descricao}</p>
          )}
        </>
      )}

      {paginaAtual === 'resumo' && (
        <div className="dashboard-page resumo">
          <div className="resumo-layout">
            <div className="resumo-left">
              {mesesComparaveis.length > 0 && (
                <div className="dashboard-compare-panel">
                  <div className="dashboard-compare-header">
                    <div>
                      <h3>Comparar meses</h3>
                      <p>Use o menu suspenso para escolher quantos meses quiser analisar.</p>
                    </div>
                    <div className="compare-actions" ref={dropdownRef}>
                      {mesesComparacao.length > 0 && (
                        <button className="dashboard-clear-button" onClick={limparComparacao}>
                          Limpar seleção
                        </button>
                      )}
                      <button
                        className="compare-dropdown__trigger"
                        onClick={() => setDropdownAberto(prev => !prev)}
                        type="button"
                      >
                        Selecionar meses
                        <span>{mesesComparacao.length} selecionado(s)</span>
                      </button>
                      {dropdownAberto && (
                        <div className="compare-dropdown">
                          <div className="compare-dropdown__options">
                            {mesesComparaveis.map(mes => (
                              <label key={mes} className="compare-option">
                                <input
                                  type="checkbox"
                                  checked={mesesComparacao.includes(mes)}
                                  onChange={() => handleToggleComparacao(mes)}
                                />
                                {formatMes(mes)}
                              </label>
                            ))}
                          </div>
                          <div className="compare-dropdown__footer">
                            <button type="button" onClick={limparComparacao}>
                              Limpar tudo
                            </button>
                            <button type="button" onClick={() => setDropdownAberto(false)}>
                              Concluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {mesesComparacao.length > 0 && (
                    <div className="compare-selected">
                      {mesesComparacao.map(mes => (
                        <button
                          type="button"
                          key={mes}
                          className="compare-chip selected removable"
                          onClick={() => handleToggleComparacao(mes)}
                          title="Remover mês da comparação"
                        >
                          {formatMes(mes)} <span>×</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="compare-hint">
                    {mesesComparacao.length === 0 &&
                      'Selecione dois ou mais meses para habilitar a comparação.'}
                    {mesesComparacao.length === 1 &&
                      'Escolha mais um mês para comparar os indicadores.'}
                    {mesesComparacao.length > 1 &&
                      `Comparando ${mesesComparacao.length} meses. Clique em um chip para removê-lo.`}
                  </p>
                </div>
              )}

              {podeComparar && (
                <div className="comparison-panel">
                  <div className="comparison-panel__header">
                    <div>
                      <h3>Resumo dos meses selecionados</h3>
                      <p>Compare receitas, gastos e saldo para tomar decisões rápidas.</p>
                    </div>
                    <button className="dashboard-clear-button outline" onClick={limparComparacao}>
                      Reiniciar comparação
                    </button>
                  </div>
                  <div className="comparison-table-wrapper">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Mês</th>
                          <th className="align-right">Receitas</th>
                          <th className="align-right">Cartão</th>
                          <th className="align-right">Débito</th>
                          <th className="align-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparacaoData.map(item => {
                          const isMelhor =
                            item.saldo === maiorSaldoComparado &&
                            maiorSaldoComparado !== menorSaldoComparado;
                          const isPior =
                            item.saldo === menorSaldoComparado &&
                            maiorSaldoComparado !== menorSaldoComparado;
                          return (
                            <tr
                              key={item.mes}
                              className={`${item.saldo >= 0 ? 'positivo' : 'negativo'} ${
                                isMelhor ? 'comparison-best' : isPior ? 'comparison-worst' : ''
                              }`}
                            >
                              <td>{item.mesLabel}</td>
                              <td className="align-right">{formatCurrency(item.receitas)}</td>
                              <td className="align-right">{formatCurrency(item.gastosCartao)}</td>
                              <td className="align-right">{formatCurrency(item.gastosDebito)}</td>
                              <td className="align-right">{formatCurrency(item.saldo)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="resumo-right">
              <div className="cards-grid resumo-cards">
                <div className="stat-card receitas">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h3>Receitas</h3>
                    <p className="stat-value">{formatCurrency(saldoAtual.receitas)}</p>
                    <p className="stat-label">Este mês</p>
                  </div>
                </div>

                <div className="stat-card gastos-cartao">
                  <div className="stat-icon">💳</div>
                  <div className="stat-content">
                    <h3>Gastos Cartão</h3>
                    <p className="stat-value">{formatCurrency(saldoAtual.gastosCartao)}</p>
                    <p className="stat-label">Este mês</p>
                  </div>
                </div>

                <div className="stat-card gastos-debito">
                  <div className="stat-icon">💸</div>
                  <div className="stat-content">
                    <h3>Gastos Débito</h3>
                    <p className="stat-value">{formatCurrency(saldoAtual.gastosDebito)}</p>
                    <p className="stat-label">Este mês</p>
                  </div>
                </div>

                <div className={`stat-card saldo ${saldoAtual.saldo >= 0 ? 'positivo' : 'negativo'}`}>
                  <div className="stat-icon">{saldoAtual.saldo >= 0 ? '✅' : '⚠️'}</div>
                  <div className="stat-content">
                    <h3>Saldo do Mês</h3>
                    <p className="stat-value">{formatCurrency(saldoAtual.saldo)}</p>
                    <p className="stat-label">Este mês</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {paginaAtual === 'projecoes' && (
        <div className="dashboard-page projecoes">
          {chartTabs.length > 0 && graficoAtivo && (
            <div className="charts-module">
              <div className="chart-tabs">
                {chartTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`chart-tab-button ${abaGraficos === tab.id ? 'active' : ''}`}
                    onClick={() => setAbaGraficos(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="chart-tab-content">
                <div className="chart-card">
                  <h3>{graficoAtivo.heading}</h3>
                  {graficoAtivo.content}
                </div>
              </div>
            </div>
          )}

          <div className="projecao-section">
            <h3>📈 Projeção dos Próximos 6 Meses</h3>
            <div className="projecao-resumo">
              <div className="projecao-item">
                <span>Total de Receitas:</span>
                <strong>{formatCurrency(totalReceitas)}</strong>
              </div>
              <div className="projecao-item">
                <span>Total de Gastos (Cartão):</span>
                <strong>{formatCurrency(totalGastosCartao)}</strong>
              </div>
              <div className="projecao-item">
                <span>Total de Gastos (Débito):</span>
                <strong>{formatCurrency(totalGastosDebito)}</strong>
              </div>
              <div className={`projecao-item ${saldoFinal >= 0 ? 'positivo' : 'negativo'}`}>
                <span>Saldo Final Acumulado:</span>
                <strong>{formatCurrency(saldoFinal)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {paginaAtual === 'insights' && (
        <div className="dashboard-page insights">
          <div className="analise-pagamento-section">
            <h3>💳 Análise de Pagamento de Fatura</h3>
            <div className="analise-pagamento-content">
              <div className="analise-card">
                <div className="analise-icon">{mesAtualAnalise.podePagar ? '✅' : '⚠️'}</div>
                <div className="analise-info">
                  <h4>Mês Atual ({formatMes(mesAtual)})</h4>
                  <p className="analise-valor">
                    Fatura: <strong>{formatCurrency(mesAtualAnalise.faturaTotal)}</strong>
                  </p>
                  <p className="analise-valor">
                    Saldo Disponível:{' '}
                    <strong className={mesAtualAnalise.podePagar ? 'positivo' : 'negativo'}>
                      {formatCurrency(mesAtualAnalise.saldoDisponivel)}
                    </strong>
                  </p>
                  <p className="analise-status">
                    {mesAtualAnalise.podePagar
                      ? '✅ Você pode pagar a fatura este mês!'
                      : `⚠️ Você precisará de ${mesAtualAnalise.mesesRestantes} mês(es) para pagar a fatura completa.`}
                  </p>
                  <p className="analise-detalhe">
                    A fatura representa {mesAtualAnalise.percentualCobertura.toFixed(1)}% das suas receitas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="meta-section">
            <h3>🎯 Análise e Recomendações</h3>
            {saldoFinal > 0 ? (
              <div className="meta-positiva">
                <p>
                  🎉 Excelente! Com base na sua projeção, você pode economizar{' '}
                  <strong>{formatCurrency(saldoFinal)}</strong> nos próximos {mesesExibidos.length} meses.
                </p>
                <p>
                  Isso representa uma média de{' '}
                  <strong>{formatCurrency(saldoFinal / mesesExibidos.length)}</strong> por mês.
                </p>
                {mesAtualAnalise.podePagar && (
                  <p>✅ Você está em condições de pagar todas as suas faturas do cartão no mês atual.</p>
                )}
              </div>
            ) : (
              <div className="meta-negativa">
                <p>
                  ⚠️ Atenção! Sua projeção indica um saldo negativo de{' '}
                  <strong>{formatCurrency(Math.abs(saldoFinal))}</strong> nos próximos {mesesExibidos.length} meses.
                </p>
                {mesesCriticos.length > 0 && (
                  <p>
                    📍 Você terá saldo negativo em {mesesCriticos.length} mês(es):{' '}
                    {mesesCriticos.map(m => formatMes(m.mes)).join(', ')}.
                  </p>
                )}
                <p>💡 Recomendações:</p>
                <ul>
                  <li>Revise seus gastos e identifique onde pode economizar</li>
                  <li>Considere aumentar suas receitas</li>
                  <li>Priorize o pagamento das faturas dos meses críticos</li>
                  {!mesAtualAnalise.podePagar && (
                    <li>Você precisará de aproximadamente {mesAtualAnalise.mesesRestantes} mês(es) para pagar a fatura atual</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="insights-panel">
            {insightsFinanceiros.map(insight => (
              <div className="insight-card" key={insight.titulo}>
                <h4>{insight.titulo}</h4>
                <p>{insight.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

