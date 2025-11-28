import { useState, useEffect, useMemo, useRef } from 'react';
import { FinancasData } from './types';
import { loadData, addReceita, addGastoCartao, addGastoDebito, deleteReceita as deleteReceitaDB, deleteGastoCartao as deleteGastoCartaoDB, deleteGastoDebito as deleteGastoDebitoDB, updateGastoCartaoPago } from './utils/storage';
import { GastoCartao } from './types';
import { getTodosMesesComDados, formatMes } from './utils/calculations';
import ReceitasForm from './components/ReceitasForm';
import GastosCartaoForm from './components/GastosCartaoForm';
import GastosDebitoForm from './components/GastosDebitoForm';
import SimpleDashboard from './components/SimpleDashboard';
import ListaReceitas from './components/ListaReceitas';
import ListaGastos from './components/ListaGastos';
import './App.css';

type DashboardTab = 'resumo' | 'projecoes' | 'insights';

type TabKey = 'resumo' | 'receitas' | 'gastos';

function App() {
  const [data, setData] = useState<FinancasData>({
    receitas: [],
    gastosCartao: [],
    gastosDebito: [],
  });
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('resumo');
  const [mesesSelecionados, setMesesSelecionados] = useState<string[]>([]);
  const [dropdownMesesAberto, setDropdownMesesAberto] = useState(false);
  const dropdownMesesRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const loadedData = await loadData();
        console.log('📥 Dados carregados:', {
          receitas: loadedData.receitas.length,
          gastosCartao: loadedData.gastosCartao.length,
          gastosDebito: loadedData.gastosDebito.length,
          mesesComGastos: [...new Set(loadedData.gastosCartao.map(g => g.mes))],
        });
        setData(loadedData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownMesesRef.current && !dropdownMesesRef.current.contains(event.target as Node)) {
        setDropdownMesesAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obter todos os meses com dados
  const todosMesesComDados = useMemo(() => {
    return getTodosMesesComDados(data.receitas, data.gastosCartao, data.gastosDebito);
  }, [data]);

  const handleToggleMes = (mes: string) => {
    setMesesSelecionados(prev =>
      prev.includes(mes) ? prev.filter(m => m !== mes) : [...prev, mes]
    );
  };

  const limparMesesSelecionados = () => {
    setMesesSelecionados([]);
  };

  const handleAddReceita = async (receita: any) => {
    const novaReceita = { ...receita, id: Date.now().toString() };
    setData(prev => ({
      ...prev,
      receitas: [...prev.receitas, novaReceita],
    }));
    await addReceita(novaReceita);
  };

  const handleAddGastoCartao = async (gasto: any) => {
    const gastosParcelados: GastoCartao[] = [];
    const baseId = Date.now().toString();
    const dataInicio = new Date(gasto.dataInicio);
    
    for (let i = 1; i <= gasto.parcelas; i++) {
      const dataParcela = new Date(dataInicio);
      dataParcela.setMonth(dataParcela.getMonth() + i - 1);
      
      const ano = dataParcela.getFullYear();
      const mes = dataParcela.getMonth() + 1;
      const mesParcela = `${ano}-${String(mes).padStart(2, '0')}`;
      
      const gastoParcelado: GastoCartao = {
        ...gasto,
        id: `${baseId}-${i}`,
        parcelaAtual: i,
        valorParcela: Math.round((gasto.valorTotal / gasto.parcelas) * 100) / 100,
        mes: mesParcela,
        pago: false,
      };
      
      gastosParcelados.push(gastoParcelado);
    }
    
    setData(prev => ({
      ...prev,
      gastosCartao: [...prev.gastosCartao, ...gastosParcelados],
    }));
    
    for (const gastoParcelado of gastosParcelados) {
      await addGastoCartao(gastoParcelado);
    }
  };

  const handleAddGastoDebito = async (gasto: any) => {
    const novoGasto = { ...gasto, id: Date.now().toString() };
    setData(prev => ({
      ...prev,
      gastosDebito: [...prev.gastosDebito, novoGasto],
    }));
    await addGastoDebito(novoGasto);
  };

  const handleDeleteReceita = async (id: string) => {
    setData(prev => ({
      ...prev,
      receitas: prev.receitas.filter(r => r.id !== id),
    }));
    await deleteReceitaDB(id);
  };

  const handleDeleteGastoCartao = async (id: string) => {
    const gasto = data.gastosCartao.find(g => g.id === id);
    if (gasto) {
      const idBase = id.split('-').slice(0, -1).join('-');
      const parcelasParaDeletar = data.gastosCartao.filter(g => g.id.startsWith(idBase));
      
      setData(prev => ({
        ...prev,
        gastosCartao: prev.gastosCartao.filter(g => !g.id.startsWith(idBase)),
      }));
      
      await Promise.all(parcelasParaDeletar.map(p => deleteGastoCartaoDB(p.id)));
    }
  };

  const handleDeleteGastoDebito = async (id: string) => {
    setData(prev => ({
      ...prev,
      gastosDebito: prev.gastosDebito.filter(g => g.id !== id),
    }));
    await deleteGastoDebitoDB(id);
  };

  const handleTogglePago = async (id: string) => {
    const gasto = data.gastosCartao.find(g => g.id === id);
    if (gasto) {
      const novoStatus = !gasto.pago;
      setData(prev => ({
        ...prev,
        gastosCartao: prev.gastosCartao.map(g => 
          g.id === id ? { ...g, pago: novoStatus } : g
        ),
      }));
      await updateGastoCartaoPago(id, novoStatus);
    }
  };

  const totalReceitas = useMemo(
    () => data.receitas.reduce((sum, receita) => sum + receita.valor, 0),
    [data.receitas]
  );

  const totalCartao = useMemo(
    () => data.gastosCartao.reduce((sum, gasto) => sum + gasto.valorParcela, 0),
    [data.gastosCartao]
  );

  const totalDebito = useMemo(
    () => data.gastosDebito.reduce((sum, gasto) => sum + gasto.valor, 0),
    [data.gastosDebito]
  );

  const saldoGeral = totalReceitas - totalCartao - totalDebito;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const mesAtualDate = new Date();
  const mesAtualKey = `${mesAtualDate.getFullYear()}-${String(mesAtualDate.getMonth() + 1).padStart(2, '0')}`;

  const receitasMesAtual = data.receitas.filter(r => r.mes === mesAtualKey);
  const totalReceitasMesAtual = receitasMesAtual.reduce((sum, r) => sum + r.valor, 0);
  const gastosCartaoMesAtual = data.gastosCartao
    .filter(g => g.mes === mesAtualKey)
    .reduce((sum, g) => sum + g.valorParcela, 0);
  const gastosDebitoMesAtual = data.gastosDebito
    .filter(g => g.mes === mesAtualKey)
    .reduce((sum, g) => sum + g.valor, 0);
  const saldoMesAtual = totalReceitasMesAtual - gastosCartaoMesAtual - gastosDebitoMesAtual;

  // Calcular resumo dos meses selecionados
  const resumoMesesSelecionados = useMemo(() => {
    if (mesesSelecionados.length === 0) return null;

    let totalReceitas = 0;
    let totalCartao = 0;
    let totalDebito = 0;

    mesesSelecionados.forEach(mes => {
      const receitasMes = data.receitas
        .filter(r => r.mes === mes)
        .reduce((sum, r) => sum + r.valor, 0);
      
      const gastosCartaoMes = data.gastosCartao
        .filter(g => g.mes === mes)
        .reduce((sum, g) => sum + g.valorParcela, 0);
      
      const gastosDebitoMes = data.gastosDebito
        .filter(g => g.mes === mes)
        .reduce((sum, g) => sum + g.valor, 0);

      totalReceitas += receitasMes;
      totalCartao += gastosCartaoMes;
      totalDebito += gastosDebitoMes;
    });

    const saldoTotal = totalReceitas - totalCartao - totalDebito;

    return {
      totalReceitas,
      totalCartao,
      totalDebito,
      saldoTotal,
      quantidadeMeses: mesesSelecionados.length,
    };
  }, [mesesSelecionados, data]);

  const tabLabels: Record<TabKey, string> = {
    resumo: 'Resumo',
    receitas: 'Receitas',
    gastos: 'Gastos',
  };

  const tabIcons: Record<TabKey, string> = {
    resumo: '📊',
    receitas: '💰',
    gastos: '💳',
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">💼</span>
            <div>
              <h1>Financeiro</h1>
              <p>Controle Pessoal</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {(['resumo', 'receitas', 'gastos'] as TabKey[]).map(tab => (
            <button
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="nav-icon">{tabIcons[tab]}</span>
              <span className="nav-label">{tabLabels[tab]}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="summary-card">
            <div className="summary-item">
              <span>Saldo Geral</span>
              <strong className={saldoGeral >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(saldoGeral)}
              </strong>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div>
            <h2>{tabLabels[activeTab]}</h2>
            <p className="header-subtitle">Gerencie suas finanças de forma simples e eficiente</p>
          </div>
          <div className="header-stats">
            <div className="stat-badge receitas">
              <span className="stat-label">Receitas</span>
              <span className="stat-value">{formatCurrency(totalReceitas)}</span>
            </div>
            <div className="stat-badge cartao">
              <span className="stat-label">Cartão</span>
              <span className="stat-value">{formatCurrency(totalCartao)}</span>
            </div>
            <div className="stat-badge debito">
              <span className="stat-label">Débito</span>
              <span className="stat-value">{formatCurrency(totalDebito)}</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando dados...</p>
            </div>
          )}
          {!loading && (
            <>
              {activeTab === 'resumo' && (
                <div className="resumo-view">
                  {resumoMesesSelecionados && (
                    <div className="resumo-meses-selecionados">
                      <div className="resumo-meses-header">
                        <h3>📊 Resumo dos Meses Selecionados</h3>
                        <p className="resumo-meses-subtitle">
                          {resumoMesesSelecionados.quantidadeMeses === 1 
                            ? `Dados de ${formatMes(mesesSelecionados[0])}`
                            : `Dados consolidados de ${resumoMesesSelecionados.quantidadeMeses} meses`}
                        </p>
                      </div>
                      <div className="cards-row">
                        <div className="metric-card receitas">
                          <div className="card-icon">💰</div>
                          <div className="card-content">
                            <span className="card-label">Total de Receitas</span>
                            <strong className="card-value">{formatCurrency(resumoMesesSelecionados.totalReceitas)}</strong>
                            {resumoMesesSelecionados.quantidadeMeses > 1 && (
                              <span className="card-average">
                                Média: {formatCurrency(resumoMesesSelecionados.totalReceitas / resumoMesesSelecionados.quantidadeMeses)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="metric-card cartao">
                          <div className="card-icon">💳</div>
                          <div className="card-content">
                            <span className="card-label">Total Gastos no Cartão</span>
                            <strong className="card-value">{formatCurrency(resumoMesesSelecionados.totalCartao)}</strong>
                            {resumoMesesSelecionados.quantidadeMeses > 1 && (
                              <span className="card-average">
                                Média: {formatCurrency(resumoMesesSelecionados.totalCartao / resumoMesesSelecionados.quantidadeMeses)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="metric-card debito">
                          <div className="card-icon">💸</div>
                          <div className="card-content">
                            <span className="card-label">Total Gastos no Débito</span>
                            <strong className="card-value">{formatCurrency(resumoMesesSelecionados.totalDebito)}</strong>
                            {resumoMesesSelecionados.quantidadeMeses > 1 && (
                              <span className="card-average">
                                Média: {formatCurrency(resumoMesesSelecionados.totalDebito / resumoMesesSelecionados.quantidadeMeses)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`metric-card saldo ${resumoMesesSelecionados.saldoTotal >= 0 ? 'positive' : 'negative'}`}>
                          <div className="card-icon">{resumoMesesSelecionados.saldoTotal >= 0 ? '✅' : '⚠️'}</div>
                          <div className="card-content">
                            <span className="card-label">Saldo Total</span>
                            <strong className="card-value">{formatCurrency(resumoMesesSelecionados.saldoTotal)}</strong>
                            {resumoMesesSelecionados.quantidadeMeses > 1 && (
                              <span className="card-average">
                                Média: {formatCurrency(resumoMesesSelecionados.saldoTotal / resumoMesesSelecionados.quantidadeMeses)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="cards-row">
                    <div className="metric-card receitas">
                      <div className="card-icon">💰</div>
                      <div className="card-content">
                        <span className="card-label">Receitas do Mês</span>
                        <strong className="card-value">{formatCurrency(totalReceitasMesAtual)}</strong>
                      </div>
                    </div>
                    <div className="metric-card cartao">
                      <div className="card-icon">💳</div>
                      <div className="card-content">
                        <span className="card-label">Gastos no Cartão</span>
                        <strong className="card-value">{formatCurrency(gastosCartaoMesAtual)}</strong>
                      </div>
                    </div>
                    <div className="metric-card debito">
                      <div className="card-icon">💸</div>
                      <div className="card-content">
                        <span className="card-label">Gastos no Débito</span>
                        <strong className="card-value">{formatCurrency(gastosDebitoMesAtual)}</strong>
                      </div>
                    </div>
                    <div className={`metric-card saldo ${saldoMesAtual >= 0 ? 'positive' : 'negative'}`}>
                      <div className="card-icon">{saldoMesAtual >= 0 ? '✅' : '⚠️'}</div>
                      <div className="card-content">
                        <span className="card-label">Saldo do Mês</span>
                        <strong className="card-value">{formatCurrency(saldoMesAtual)}</strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dashboard-section">
                    <div className="dashboard-tabs-header">
                      <div>
                        <h3>📊 Dashboards e Análises</h3>
                        <div className="meses-filter" ref={dropdownMesesRef}>
                          <button
                            className="meses-filter-button"
                            onClick={() => setDropdownMesesAberto(!dropdownMesesAberto)}
                            type="button"
                          >
                            <span>📅 Filtrar Meses</span>
                            {mesesSelecionados.length > 0 && (
                              <span className="meses-count">{mesesSelecionados.length} selecionado(s)</span>
                            )}
                          </button>
                          {dropdownMesesAberto && (
                            <div className="meses-dropdown">
                              <div className="meses-dropdown-header">
                                <span>Selecione os meses para comparar</span>
                                {mesesSelecionados.length > 0 && (
                                  <button
                                    className="limpar-meses-btn"
                                    onClick={limparMesesSelecionados}
                                    type="button"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>
                              <div className="meses-dropdown-options">
                                {todosMesesComDados.map(mes => (
                                  <label key={mes} className="mes-option">
                                    <input
                                      type="checkbox"
                                      checked={mesesSelecionados.includes(mes)}
                                      onChange={() => handleToggleMes(mes)}
                                    />
                                    <span>{formatMes(mes)}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          {mesesSelecionados.length > 0 && (
                            <div className="meses-selected-chips">
                              {mesesSelecionados.map(mes => (
                                <button
                                  key={mes}
                                  className="mes-chip"
                                  onClick={() => handleToggleMes(mes)}
                                  type="button"
                                  title="Remover mês"
                                >
                                  {formatMes(mes).split(' ')[0]} <span>×</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="dashboard-tabs">
                        <button
                          className={`dashboard-tab ${dashboardTab === 'resumo' ? 'active' : ''}`}
                          onClick={() => setDashboardTab('resumo')}
                        >
                          Resumo
                        </button>
                        <button
                          className={`dashboard-tab ${dashboardTab === 'projecoes' ? 'active' : ''}`}
                          onClick={() => setDashboardTab('projecoes')}
                        >
                          Projeções
                        </button>
                        <button
                          className={`dashboard-tab ${dashboardTab === 'insights' ? 'active' : ''}`}
                          onClick={() => setDashboardTab('insights')}
                        >
                          Insights
                        </button>
                      </div>
                    </div>
                    <div className="dashboard-content-wrapper">
                      <SimpleDashboard 
                        data={data} 
                        page={dashboardTab} 
                        mesesFiltrados={mesesSelecionados.length > 0 ? mesesSelecionados : undefined}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'receitas' && (
                <div className="receitas-view">
                  <div className="view-grid">
                    <div className="form-section">
                      <h3>Adicionar Receita</h3>
                      <ReceitasForm onAdd={handleAddReceita} />
                    </div>
                    <div className="table-section">
                      <h3>Lista de Receitas</h3>
                      <ListaReceitas receitas={data.receitas} onDelete={handleDeleteReceita} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gastos' && (
                <div className="gastos-view">
                  <div className="forms-section">
                    <div className="form-card">
                      <h3>Gastos no Cartão</h3>
                      <GastosCartaoForm onAdd={handleAddGastoCartao} />
                    </div>
                    <div className="form-card">
                      <h3>Gastos no Débito</h3>
                      <GastosDebitoForm onAdd={handleAddGastoDebito} />
                    </div>
                  </div>
                  <div className="table-section">
                    <h3>Lista de Gastos</h3>
                    <ListaGastos
                      gastosCartao={data.gastosCartao}
                      gastosDebito={data.gastosDebito}
                      onDeleteCartao={handleDeleteGastoCartao}
                      onDeleteDebito={handleDeleteGastoDebito}
                      onTogglePago={handleTogglePago}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
