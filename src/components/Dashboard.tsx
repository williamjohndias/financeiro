import { useState } from 'react';
import { FinancasData, SaldoMensal } from '../types';
import { 
  getMesAtual, 
  getProximosMeses, 
  calcularProjecao, 
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
} from 'recharts';
import './Dashboard.css';

interface DashboardProps {
  data: FinancasData;
}

export default function Dashboard({ data }: DashboardProps) {
  const [mesFiltro, setMesFiltro] = useState<string>('');
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const mesAtual = getMesAtual();
  const proximosMeses = getProximosMeses(12);
  
  // Coletar todos os meses que têm dados (receitas, gastos cartão ou débito)
  const todosMesesComDados = getTodosMesesComDados(data.receitas, data.gastosCartao, data.gastosDebito);
  
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
  
  // Debug: Log dos dados recebidos
  console.log('📊 Dashboard - Dados recebidos:', {
    mesAtual,
    totalReceitas: data.receitas.length,
    totalGastosCartao: data.gastosCartao.length,
    totalGastosDebito: data.gastosDebito.length,
    receitasMesAtual: data.receitas.filter(r => r.mes === mesAtual).length,
    gastosCartaoMesAtual: data.gastosCartao.filter(g => g.mes === mesAtual).length,
    gastosDebitoMesAtual: data.gastosDebito.filter(g => g.mes === mesAtual).length,
    todosMesesGastosCartao: [...new Set(data.gastosCartao.map(g => g.mes))],
    todosMesesGastosDebito: [...new Set(data.gastosDebito.map(g => g.mes))],
    mesesParaCalcular,
    gastosNovembro2025: data.gastosCartao.filter(g => g.mes === '2025-11').length,
    totalNovembro2025: data.gastosCartao.filter(g => g.mes === '2025-11').reduce((sum, g) => sum + g.valorParcela, 0),
  });
  
  const projecao = calcularProjecao(mesesExibidos, data.receitas, data.gastosCartao, data.gastosDebito);
  
  const saldoAtual = projecao.find(p => p.mes === mesAtual) || {
    mes: mesAtual,
    receitas: 0,
    gastosCartao: 0,
    gastosDebito: 0,
    saldo: 0,
  };
  
  // Debug: Log do saldo calculado
  console.log('📊 Dashboard - Saldo atual calculado:', saldoAtual);

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
    analisarPagamentoFatura(mes, data.receitas, data.gastosCartao, data.gastosDebito, mesesParaCalcular)
  );

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

  // Encontrar meses críticos (saldo negativo)
  const mesesCriticos = saldoAcumulado.filter(m => m.saldo < 0);
  
  // Calcular estratégia de pagamento
  const mesAtualAnalise = analisesPagamento.find(a => a.mes === mesAtual) || analisesPagamento[0];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard Financeiro</h2>
        <div className="dashboard-header-controls">
          <div className="mes-atual">
            <strong>Mês Atual: {formatMes(mesAtual)}</strong>
          </div>
          <div className="filtro-mes-dashboard">
            <label htmlFor="filtro-mes-dashboard">Filtrar por mês: </label>
            <select
              id="filtro-mes-dashboard"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="select-mes"
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
      </div>

      <div className="cards-grid">
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
                Saldo Disponível: <strong className={mesAtualAnalise.podePagar ? 'positivo' : 'negativo'}>
                  {formatCurrency(mesAtualAnalise.saldoDisponivel)}
                </strong>
              </p>
              <p className="analise-status">
                {mesAtualAnalise.podePagar 
                  ? '✅ Você pode pagar a fatura este mês!'
                  : `⚠️ Você precisará de ${mesAtualAnalise.mesesRestantes} mês(es) para pagar a fatura completa.`
                }
              </p>
              <p className="analise-detalhe">
                A fatura representa {mesAtualAnalise.percentualCobertura.toFixed(1)}% das suas receitas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Receitas vs Gastos por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Receitas" fill="#4caf50" />
              <Bar dataKey="Gastos Cartão" fill="#ff9800" />
              <Bar dataKey="Gastos Débito" fill="#f44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Capacidade de Pagamento da Fatura</h3>
          <ResponsiveContainer width="100%" height={300}>
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
        </div>

        <div className="chart-card">
          <h3>Tendência de Saldo (Mensal e Acumulado)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dadosTendencia}>
              <defs>
                <linearGradient id="colorSaldoMensal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSaldoAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#764ba2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#764ba2" stopOpacity={0}/>
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
        </div>

        <div className="chart-card">
          <h3>Saldo Acumulado (Projeção)</h3>
          <ResponsiveContainer width="100%" height={300}>
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
              <p>
                ✅ Você está em condições de pagar todas as suas faturas do cartão no mês atual.
              </p>
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
            <p>
              💡 Recomendações:
            </p>
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
    </div>
  );
}

