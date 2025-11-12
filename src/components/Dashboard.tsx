import { FinancasData, SaldoMensal } from '../types';
import { getMesAtual, getProximosMeses, calcularProjecao, formatMes } from '../utils/calculations';
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
} from 'recharts';
import './Dashboard.css';

interface DashboardProps {
  data: FinancasData;
}

export default function Dashboard({ data }: DashboardProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const mesAtual = getMesAtual();
  const proximosMeses = getProximosMeses(6);
  
  // Coletar todos os meses que têm dados (receitas, gastos cartão ou débito)
  const todosMesesComDados = [
    ...new Set([
      ...data.receitas.map(r => r.mes),
      ...data.gastosCartao.map(g => g.mes),
      ...data.gastosDebito.map(g => g.mes),
    ])
  ].sort();
  
  // Garantir que novembro/2025 esteja incluído se houver dados
  const mesNovembro2025 = '2025-11';
  if (!proximosMeses.includes(mesNovembro2025) && todosMesesComDados.includes(mesNovembro2025)) {
    proximosMeses.push(mesNovembro2025);
    proximosMeses.sort();
  }
  
  // Incluir todos os meses com dados que estejam no futuro ou sejam novembro/2025
  const mesesParaCalcular = [...new Set([...proximosMeses, ...todosMesesComDados.filter(m => m >= mesAtual || m === mesNovembro2025)])].sort();
  
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
  
  const projecao = calcularProjecao(mesesParaCalcular, data.receitas, data.gastosCartao, data.gastosDebito);
  
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard Financeiro</h2>
        <div className="mes-atual">
          <strong>Mês Atual: {formatMes(mesAtual)}</strong>
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
          <h3>Saldo Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Saldo" fill="#667eea" />
            </BarChart>
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
        <h3>🎯 Meta de Economia</h3>
        {saldoFinal > 0 ? (
          <div className="meta-positiva">
            <p>
              🎉 Excelente! Com base na sua projeção, você pode economizar{' '}
              <strong>{formatCurrency(saldoFinal)}</strong> nos próximos 6 meses.
            </p>
            <p>
              Isso representa uma média de{' '}
              <strong>{formatCurrency(saldoFinal / 6)}</strong> por mês.
            </p>
          </div>
        ) : (
          <div className="meta-negativa">
            <p>
              ⚠️ Atenção! Sua projeção indica um saldo negativo de{' '}
              <strong>{formatCurrency(Math.abs(saldoFinal))}</strong> nos próximos 6 meses.
            </p>
            <p>
              Considere revisar seus gastos ou aumentar suas receitas para atingir um saldo positivo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

