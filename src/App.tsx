import { useState, useEffect } from 'react';
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

function App() {
  const [data, setData] = useState<FinancasData>({
    receitas: [],
    gastosCartao: [],
    gastosDebito: [],
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receitas' | 'gastos'>('dashboard');
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Controle Financeiro Pessoal</h1>
        <nav className="app-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'receitas' ? 'active' : ''}
            onClick={() => setActiveTab('receitas')}
          >
            Receitas
          </button>
          <button
            className={activeTab === 'gastos' ? 'active' : ''}
            onClick={() => setActiveTab('gastos')}
          >
            Gastos
          </button>
        </nav>
      </header>

      <main className="app-main">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Carregando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard data={data} />
            )}

            {activeTab === 'receitas' && (
              <div className="tab-content">
                <ReceitasForm onAdd={handleAddReceita} />
                <ListaReceitas
                  receitas={data.receitas}
                  onDelete={handleDeleteReceita}
                />
              </div>
            )}

            {activeTab === 'gastos' && (
              <div className="tab-content">
                <div className="forms-container">
                  <GastosCartaoForm onAdd={handleAddGastoCartao} />
                  <GastosDebitoForm onAdd={handleAddGastoDebito} />
                </div>
                <ListaGastos
                  gastosCartao={data.gastosCartao}
                  gastosDebito={data.gastosDebito}
                  onDeleteCartao={handleDeleteGastoCartao}
                  onDeleteDebito={handleDeleteGastoDebito}
                  onTogglePago={handleTogglePago}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

