import { useMemo } from 'react';
import { FinancasData } from '../types';
import { getMesAtual, formatMes, calcularSaldoMensal } from '../utils/calculations';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SimpleDashboardProps {
  data: FinancasData;
  page: 'resumo' | 'projecoes' | 'insights';
  mesesFiltrados?: string[];
}

export default function SimpleDashboard({ data, page, mesesFiltrados }: SimpleDashboardProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const mesAtual = getMesAtual();
  
  // Dados do mês atual
  const dadosMesAtual = useMemo(() => {
    const saldo = calcularSaldoMensal(mesAtual, data.receitas, data.gastosCartao, data.gastosDebito);
    return {
      receitas: saldo.receitas,
      gastosCartao: saldo.gastosCartao,
      gastosDebito: saldo.gastosDebito,
      saldo: saldo.saldo,
    };
  }, [data, mesAtual]);

  // Dados dos meses (filtrados ou últimos 6 meses)
  const dadosUltimosMeses = useMemo(() => {
    let mesesParaUsar: string[];
    
    if (mesesFiltrados && mesesFiltrados.length > 0) {
      // Usar meses selecionados pelo filtro
      mesesParaUsar = [...mesesFiltrados].sort();
    } else {
      // Usar últimos 6 meses por padrão
      const meses: string[] = [];
      const hoje = new Date();
      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        meses.push(mes);
      }
      mesesParaUsar = meses;
    }

    return mesesParaUsar.map(mes => {
      const saldo = calcularSaldoMensal(mes, data.receitas, data.gastosCartao, data.gastosDebito);
      return {
        mes: formatMes(mes).split(' ')[0].substring(0, 3),
        mesCompleto: formatMes(mes),
        Receitas: Math.round(saldo.receitas * 100) / 100,
        'Gastos Cartão': Math.round(saldo.gastosCartao * 100) / 100,
        'Gastos Débito': Math.round(saldo.gastosDebito * 100) / 100,
        Saldo: Math.round(saldo.saldo * 100) / 100,
      };
    }).filter(item => item.Receitas > 0 || item['Gastos Cartão'] > 0 || item['Gastos Débito'] > 0);
  }, [data, mesesFiltrados]);

  // Dados para gráfico de pizza
  const dadosPizza = useMemo(() => {
    const totalReceitas = Math.round(data.receitas.reduce((sum, r) => sum + r.valor, 0) * 100) / 100;
    const totalCartao = Math.round(data.gastosCartao.reduce((sum, g) => sum + g.valorParcela, 0) * 100) / 100;
    const totalDebito = Math.round(data.gastosDebito.reduce((sum, g) => sum + g.valor, 0) * 100) / 100;
    
    return [
      { name: 'Receitas', value: totalReceitas },
      { name: 'Cartão', value: totalCartao },
      { name: 'Débito', value: totalDebito },
    ].filter(item => item.value > 0);
  }, [data]);

  const cores = ['#4caf50', '#ff9800', '#f44336'];

  if (page === 'resumo') {
    return (
      <div className="simple-dashboard">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h4>Comparação Mensal</h4>
            {dadosUltimosMeses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosUltimosMeses}>
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
            ) : (
              <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Não há dados suficientes para exibir o gráfico
              </p>
            )}
          </div>

          <div className="dashboard-card">
            <h4>Distribuição Geral</h4>
            {dadosPizza.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend formatter={(value) => {
                    const item = dadosPizza.find(d => d.name === value);
                    return item ? `${value}: ${formatCurrency(item.value)}` : value;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Não há dados suficientes para exibir o gráfico
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'projecoes') {
    return (
      <div className="simple-dashboard">
        <div className="dashboard-card">
          <h4>Tendência de Saldo</h4>
          {dadosUltimosMeses.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dadosUltimosMeses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} />
                <Line type="monotone" dataKey="Receitas" stroke="#4caf50" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Não há dados suficientes para exibir o gráfico
            </p>
          )}
        </div>
      </div>
    );
  }

  if (page === 'insights') {
    const saldoPositivo = dadosMesAtual.saldo >= 0;
    const percentualCartao = dadosMesAtual.receitas > 0 
      ? (dadosMesAtual.gastosCartao / dadosMesAtual.receitas) * 100 
      : 0;

    return (
      <div className="simple-dashboard">
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Status do Mês Atual</h4>
            <div className="insight-content">
              <p><strong>Receitas:</strong> {formatCurrency(dadosMesAtual.receitas)}</p>
              <p><strong>Gastos no Cartão:</strong> {formatCurrency(dadosMesAtual.gastosCartao)}</p>
              <p><strong>Gastos no Débito:</strong> {formatCurrency(dadosMesAtual.gastosDebito)}</p>
              <p className={saldoPositivo ? 'positive' : 'negative'}>
                <strong>Saldo:</strong> {formatCurrency(dadosMesAtual.saldo)}
              </p>
            </div>
          </div>

          <div className="insight-card">
            <h4>Análise de Cobertura</h4>
            <div className="insight-content">
              <p>
                A fatura do cartão representa <strong>{percentualCartao.toFixed(1)}%</strong> das suas receitas.
              </p>
              {percentualCartao > 100 ? (
                <p className="negative">
                  ⚠️ Atenção: Suas receitas não cobrem os gastos do cartão. Considere reduzir despesas.
                </p>
              ) : percentualCartao > 50 ? (
                <p style={{ color: '#f59e0b' }}>
                  ⚠️ Cuidado: A fatura está consumindo mais da metade das receitas.
                </p>
              ) : (
                <p className="positive">
                  ✅ Boa: A fatura está dentro de um limite saudável.
                </p>
              )}
            </div>
          </div>

          <div className="insight-card">
            <h4>Recomendações</h4>
            <div className="insight-content">
              {saldoPositivo ? (
                <>
                  <p className="positive">✅ Seu saldo está positivo este mês!</p>
                  <p>Considere criar uma reserva de emergência.</p>
                  <p>Mantenha o controle dos gastos para continuar no azul.</p>
                </>
              ) : (
                <>
                  <p className="negative">⚠️ Seu saldo está negativo este mês.</p>
                  <p>Revise seus gastos e identifique onde pode economizar.</p>
                  <p>Priorize o pagamento de dívidas de maior juro.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

