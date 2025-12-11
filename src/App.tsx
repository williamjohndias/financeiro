import { useEffect, useMemo, useState } from 'react';
import { FinancasData, GastoCartao, GastoDebito } from './types';
import {
  loadData,
  addGastoCartaoDireto,
  addGastoDebito,
  deleteGastoCartao as deleteGastoCartaoDB,
  deleteGastoDebito as deleteGastoDebitoDB,
  updateGastoCartaoPago,
} from './utils/storage';
import { getDataHoje } from './utils/calculations';
import { importarGastosCartaoCSV, lerArquivoCSV } from './utils/importCartaoCSV';
import './App.css';

type CartaoTipo = 'nubank' | 'mercado-pago';

const cartaoLabels: Record<CartaoTipo, string> = {
  nubank: 'Fatura Nubank',
  'mercado-pago': 'Fatura Mercado Pago',
};

function App() {
  const [data, setData] = useState<FinancasData>({ receitas: [], gastosCartao: [], gastosDebito: [] });
  const [loading, setLoading] = useState(true);

  const [valorNubank, setValorNubank] = useState('');
  const [dataNubank, setDataNubank] = useState(getDataHoje());
  const [valorMp, setValorMp] = useState('');
  const [dataMp, setDataMp] = useState(getDataHoje());

  const [descricaoDebito, setDescricaoDebito] = useState('');
  const [valorDebito, setValorDebito] = useState('');
  const [dataDebito, setDataDebito] = useState(getDataHoje());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const loaded = await loadData();
        setData(loaded);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getTipoCartao = (gasto: GastoCartao): CartaoTipo =>
    gasto.descricao.toLowerCase().includes('mercado') ? 'mercado-pago' : 'nubank';

  const handleAddFatura = async (tipo: CartaoTipo) => {
    const valorStr = tipo === 'nubank' ? valorNubank : valorMp;
    const dataRef = tipo === 'nubank' ? dataNubank : dataMp;

    if (!valorStr || !dataRef) return;

    const valor = parseFloat(valorStr);
    const mes = dataRef.slice(0, 7);
    const novo: GastoCartao = {
      id: `${Date.now()}-${Math.random()}`,
      descricao: cartaoLabels[tipo],
      valorTotal: valor,
      parcelas: 1,
      parcelaAtual: 1,
      valorParcela: valor,
      dataInicio: dataRef,
      mes,
      pago: false,
    };

    setData(prev => ({ ...prev, gastosCartao: [...prev.gastosCartao, novo] }));
    await addGastoCartaoDireto(novo);

    if (tipo === 'nubank') {
      setValorNubank('');
      setDataNubank(getDataHoje());
    } else {
      setValorMp('');
      setDataMp(getDataHoje());
    }
  };

  const handleAddDebito = async () => {
    if (!descricaoDebito || !valorDebito || !dataDebito) return;

    const mes = dataDebito.slice(0, 7);
    const novo: GastoDebito = {
      id: Date.now().toString(),
      descricao: descricaoDebito,
      valor: parseFloat(valorDebito),
      data: dataDebito,
      mes,
    };

    setData(prev => ({ ...prev, gastosDebito: [...prev.gastosDebito, novo] }));
    await addGastoDebito(novo);

    setDescricaoDebito('');
    setValorDebito('');
    setDataDebito(getDataHoje());
  };

  const handleDeleteGastoCartao = async (id: string) => {
    setData(prev => ({ ...prev, gastosCartao: prev.gastosCartao.filter(g => g.id !== id) }));
    await deleteGastoCartaoDB(id);
  };

  const handleDeleteGastoDebito = async (id: string) => {
    setData(prev => ({ ...prev, gastosDebito: prev.gastosDebito.filter(g => g.id !== id) }));
    await deleteGastoDebitoDB(id);
  };

  const handleTogglePago = async (id: string) => {
    const gasto = data.gastosCartao.find(g => g.id === id);
    if (!gasto) return;

    const novoStatus = !gasto.pago;
    setData(prev => ({
      ...prev,
      gastosCartao: prev.gastosCartao.map(g => (g.id === id ? { ...g, pago: novoStatus } : g)),
    }));
    await updateGastoCartaoPago(id, novoStatus);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    try {
      const csvContent = await lerArquivoCSV(arquivo);
      const novosGastos = importarGastosCartaoCSV(csvContent);

      if (!novosGastos || novosGastos.length === 0) {
        throw new Error('Nenhum gasto encontrado no CSV.');
      }

      // Deletar todos os gastos no cartão existentes
      const idsParaDeletar = data.gastosCartao.map(g => g.id);
      for (const id of idsParaDeletar) {
        await deleteGastoCartaoDB(id);
      }

      // Limpar estado local antes de inserir
      setData(prev => ({
        ...prev,
        gastosCartao: [],
      }));

      // Inserir cada gasto exatamente como veio do CSV
      await Promise.all(novosGastos.map(g => addGastoCartaoDireto(g)));

      // Atualizar UI imediatamente
      setData(prev => ({
        ...prev,
        gastosCartao: novosGastos,
      }));

      // Recarregar dados do Supabase
      const loadedData = await loadData();
      setData(loadedData);

      alert(`✅ ${novosGastos.length} gastos importados com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      alert(`❌ Erro ao importar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    // Limpar input
    e.target.value = '';
  };

  const faturasNubank = useMemo(() => data.gastosCartao.filter(g => getTipoCartao(g) === 'nubank'), [data.gastosCartao]);
  const faturasMp = useMemo(() => data.gastosCartao.filter(g => getTipoCartao(g) === 'mercado-pago'), [data.gastosCartao]);

  const totalNubank = useMemo(() => faturasNubank.reduce((sum, g) => sum + g.valorParcela, 0), [faturasNubank]);
  const totalMp = useMemo(() => faturasMp.reduce((sum, g) => sum + g.valorParcela, 0), [faturasMp]);
  const totalDebitos = useMemo(() => data.gastosDebito.reduce((sum, g) => sum + g.valor, 0), [data.gastosDebito]);
  const totalGeral = totalNubank + totalMp + totalDebitos;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>💰 Controle Financeiro</h1>
        <div className="totals-bar">
          <div className="total-item nubank">
            <span className="label">Nubank</span>
            <span className="value">{formatCurrency(totalNubank)}</span>
          </div>
          <div className="total-item mercado-pago">
            <span className="label">Mercado Pago</span>
            <span className="value">{formatCurrency(totalMp)}</span>
          </div>
          <div className="total-item debito">
            <span className="label">Débito</span>
            <span className="value">{formatCurrency(totalDebitos)}</span>
          </div>
          <div className="total-item total">
            <span className="label">Total</span>
            <span className="value">{formatCurrency(totalGeral)}</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="page-content">
          <div className="forms-row">
            <div className="form-box">
              <h3>💳 Fatura Nubank</h3>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorNubank}
                onChange={e => setValorNubank(e.target.value)}
                placeholder="Valor (R$)"
              />
              <input
                type="date"
                value={dataNubank}
                onChange={e => setDataNubank(e.target.value)}
              />
              <button onClick={() => handleAddFatura('nubank')}>Adicionar</button>
            </div>

            <div className="form-box">
              <h3>💳 Fatura Mercado Pago</h3>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorMp}
                onChange={e => setValorMp(e.target.value)}
                placeholder="Valor (R$)"
              />
              <input
                type="date"
                value={dataMp}
                onChange={e => setDataMp(e.target.value)}
              />
              <button onClick={() => handleAddFatura('mercado-pago')}>Adicionar</button>
            </div>

            <div className="form-box">
              <h3>💸 Débito</h3>
              <input
                type="text"
                value={descricaoDebito}
                onChange={e => setDescricaoDebito(e.target.value)}
                placeholder="Descrição"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorDebito}
                onChange={e => setValorDebito(e.target.value)}
                placeholder="Valor (R$)"
              />
              <input
                type="date"
                value={dataDebito}
                onChange={e => setDataDebito(e.target.value)}
              />
              <button onClick={handleAddDebito}>Adicionar</button>
            </div>
          </div>

          <div className="import-section">
            <input
              type="file"
              accept=".csv"
              id="importar-csv"
              style={{ display: 'none' }}
              onChange={handleImportCSV}
            />
            <label htmlFor="importar-csv" className="import-button">
              📥 Importar CSV do Cartão
            </label>
          </div>

          <div className="lists-container">
            <div className="list-box">
              <h2>Faturas ({data.gastosCartao.length})</h2>
              {data.gastosCartao.length === 0 ? (
                <p className="empty-msg">Nenhuma fatura cadastrada</p>
              ) : (
                <div className="items-list">
                  {data.gastosCartao.map(gasto => (
                    <div key={gasto.id} className="list-item">
                      <div className="item-info">
                        <span className="item-type">{cartaoLabels[getTipoCartao(gasto)]}</span>
                        <span className="item-value">{formatCurrency(gasto.valorParcela)}</span>
                        <span className="item-date">{new Date(gasto.dataInicio).toLocaleDateString('pt-BR')}</span>
                        <span className="item-month">{gasto.mes}</span>
                      </div>
                      <div className="item-actions">
                        <button
                          className={`status-btn ${gasto.pago ? 'paid' : 'pending'}`}
                          onClick={() => handleTogglePago(gasto.id)}
                        >
                          {gasto.pago ? '✓ Pago' : '⏳ Pendente'}
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteGastoCartao(gasto.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="list-box">
              <h2>Débitos ({data.gastosDebito.length})</h2>
              {data.gastosDebito.length === 0 ? (
                <p className="empty-msg">Nenhum débito cadastrado</p>
              ) : (
                <div className="items-list">
                  {data.gastosDebito.map(gasto => (
                    <div key={gasto.id} className="list-item">
                      <div className="item-info">
                        <span className="item-desc">{gasto.descricao}</span>
                        <span className="item-value">{formatCurrency(gasto.valor)}</span>
                        <span className="item-date">{new Date(gasto.data).toLocaleDateString('pt-BR')}</span>
                        <span className="item-month">{gasto.mes}</span>
                      </div>
                      <div className="item-actions">
                        <button className="delete-btn" onClick={() => handleDeleteGastoDebito(gasto.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
