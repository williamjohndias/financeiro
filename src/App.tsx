import { useState, useEffect, useMemo } from 'react';
import { FinancasData } from './types';
import { loadData, addReceita, addGastoCartao, addGastoDebito, deleteReceita as deleteReceitaDB, deleteGastoCartao as deleteGastoCartaoDB, deleteGastoDebito as deleteGastoDebitoDB, updateGastoCartaoPago } from './utils/storage';
import { GastoCartao } from './types';
import ReceitasForm from './components/ReceitasForm';
import GastosCartaoForm from './components/GastosCartaoForm';
import GastosDebitoForm from './components/GastosDebitoForm';
import Dashboard from './components/Dashboard';
import ListaReceitas from './components/ListaReceitas';
import ListaGastos from './components/ListaGastos';
import './App.css';

type TabKey = 'dashboard' | 'receitas' | 'gastos';

function App() {
  const [data, setData] = useState<FinancasData>({
    receitas: [],
    gastosCartao: [],
    gastosDebito: [],
  });
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [loading, setLoading] = useState(true);

  // Carregar dados do Supabase quando o componente montar
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

  // Removido: não vamos mais salvar automaticamente toda vez que data mudar
  // Isso causaria muitos requests desnecessários. Cada operação salva individualmente.

  const handleAddReceita = async (receita: any) => {
    const novaReceita = { ...receita, id: Date.now().toString() };
    // Adicionar no estado local primeiro
    setData(prev => ({
      ...prev,
      receitas: [...prev.receitas, novaReceita],
    }));
    // Tentar adicionar no Supabase (não bloqueia se falhar)
    await addReceita(novaReceita);
  };

  const handleAddGastoCartao = async (gasto: any) => {
    const gastosParcelados: GastoCartao[] = [];
    const baseId = Date.now().toString();
    const dataInicio = new Date(gasto.dataInicio);
    
    for (let i = 1; i <= gasto.parcelas; i++) {
      const dataParcela = new Date(dataInicio);
      dataParcela.setMonth(dataParcela.getMonth() + i - 1);
      
      // Garantir que o mês está correto após adicionar meses
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
    
    // Adicionar no estado local primeiro
    setData(prev => ({
      ...prev,
      gastosCartao: [...prev.gastosCartao, ...gastosParcelados],
    }));
    
    // Tentar adicionar cada parcela no Supabase (não bloqueia se falhar)
    for (const gastoParcelado of gastosParcelados) {
      await addGastoCartao(gastoParcelado);
    }
  };

  const handleAddGastoDebito = async (gasto: any) => {
    const novoGasto = { ...gasto, id: Date.now().toString() };
    // Adicionar no estado local primeiro
    setData(prev => ({
      ...prev,
      gastosDebito: [...prev.gastosDebito, novoGasto],
    }));
    // Tentar adicionar no Supabase (não bloqueia se falhar)
    await addGastoDebito(novoGasto);
  };

  const handleDeleteReceita = async (id: string) => {
    // Remover do estado local primeiro
    setData(prev => ({
      ...prev,
      receitas: prev.receitas.filter(r => r.id !== id),
    }));
    // Tentar deletar no Supabase (não bloqueia se falhar)
    await deleteReceitaDB(id);
  };

  const handleDeleteGastoCartao = async (id: string) => {
    const gasto = data.gastosCartao.find(g => g.id === id);
    if (gasto) {
      // Remove todas as parcelas do mesmo gasto
      const idBase = id.split('-').slice(0, -1).join('-');
      const parcelasParaDeletar = data.gastosCartao.filter(g => g.id.startsWith(idBase));
      
      // Remover do estado local primeiro
      setData(prev => ({
        ...prev,
        gastosCartao: prev.gastosCartao.filter(g => !g.id.startsWith(idBase)),
      }));
      
      // Tentar deletar cada parcela no Supabase (não bloqueia se falhar)
      await Promise.all(parcelasParaDeletar.map(p => deleteGastoCartaoDB(p.id)));
    }
  };

  const handleDeleteGastoDebito = async (id: string) => {
    // Remover do estado local primeiro
    setData(prev => ({
      ...prev,
      gastosDebito: prev.gastosDebito.filter(g => g.id !== id),
    }));
    // Tentar deletar no Supabase (não bloqueia se falhar)
    await deleteGastoDebitoDB(id);
  };

  const handleTogglePago = async (id: string) => {
    const gasto = data.gastosCartao.find(g => g.id === id);
    if (gasto) {
      const novoStatus = !gasto.pago;
      // Atualizar no estado local primeiro
      setData(prev => ({
        ...prev,
        gastosCartao: prev.gastosCartao.map(g => 
          g.id === id ? { ...g, pago: novoStatus } : g
        ),
      }));
      // Tentar atualizar no Supabase (não bloqueia se falhar)
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

  const tabLabels: Record<TabKey, string> = {
    dashboard: 'Dashboard',
    receitas: 'Receitas',
    gastos: 'Gastos',
  };

  return (
    <div className="sheet-shell">
      <header className="sheet-topbar">
        <div className="sheet-topbar__left">
          <div className="sheet-doc-icon">📊</div>
          <div>
            <p className="sheet-doc-label">Visão financeira</p>
            <h1>Painel de Controle</h1>
          </div>
        </div>
      </header>

      <nav className="sheet-tabbar">
        {(['dashboard', 'receitas', 'gastos'] as TabKey[]).map(tab => (
          <button
            key={tab}
            className={`sheet-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      <section className="sheet-main">
        <div className="sheet-toolbar sticky">
          <div>
            <span className="sheet-breadcrumb">Finanças &gt; {tabLabels[activeTab]}</span>
            <h2>{tabLabels[activeTab]}</h2>
            <p className="sheet-toolbar__hint">
              Visual minimalista inspirado em planilhas para facilitar sua leitura.
            </p>
          </div>
          <div className="sheet-toolbar__stats">
            <div className="sheet-chip receitas">
              <span>Receitas</span>
              <strong>
                {totalReceitas.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </div>
            <div className="sheet-chip cartao">
              <span>Cartão</span>
              <strong>
                {totalCartao.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </div>
            <div className="sheet-chip debito">
              <span>Débito</span>
              <strong>
                {totalDebito.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </div>
            <div className={`sheet-chip saldo ${saldoGeral >= 0 ? 'positivo' : 'negativo'}`}>
              <span>Saldo Geral</span>
              <strong>
                {saldoGeral.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </div>
          </div>
        </div>

        <div className={`sheet-content ${activeTab === 'dashboard' ? 'sheet-content--full' : ''}`}>
          {loading ? (
            <div className="sheet-loading">
              <div className="sheet-loading__spinner" />
              <p>Carregando dados...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard data={data} />}

              {activeTab === 'receitas' && (
                <div className="sheet-grid">
                  <div className="sheet-panel sheet-panel--form">
                    <ReceitasForm onAdd={handleAddReceita} />
                  </div>
                  <div className="sheet-panel sheet-panel--table">
                    <ListaReceitas receitas={data.receitas} onDelete={handleDeleteReceita} />
                  </div>
                </div>
              )}

              {activeTab === 'gastos' && (
                <div className="sheet-grid sheet-grid--stacked">
                  <div className="sheet-panel sheet-panel--form">
                    <div className="forms-grid">
                      <GastosCartaoForm onAdd={handleAddGastoCartao} />
                      <GastosDebitoForm onAdd={handleAddGastoDebito} />
                    </div>
                  </div>
                  <div className="sheet-panel sheet-panel--table">
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
      </section>
    </div>
  );
}

export default App;

