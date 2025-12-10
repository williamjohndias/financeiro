import { useMemo, useState } from 'react';
import { Receita } from '../types';
import { formatMes } from '../utils/calculations';
import './Listas.css';

interface ListaReceitasProps {
  receitas: Receita[];
  onDelete: (id: string) => void;
  onEdit?: (receita: Receita) => void;
}

type Ordenacao = 'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc';

export default function ListaReceitas({ receitas, onDelete, onEdit }: ListaReceitasProps) {
  const [mesFiltro, setMesFiltro] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('data-desc');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const todosMeses = useMemo(() => {
    const meses = Array.from(new Set(receitas.map(r => r.mes)));
    return meses.sort().reverse();
  }, [receitas]);

  const receitasOrdenadas = useMemo(() => {
    const sorted = [...receitas];
    switch (ordenacao) {
      case 'valor-desc':
        return sorted.sort((a, b) => b.valor - a.valor);
      case 'valor-asc':
        return sorted.sort((a, b) => a.valor - b.valor);
      case 'data-asc':
        return sorted.sort(
          (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
        );
      case 'data-desc':
      default:
        return sorted.sort(
          (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
        );
    }
  }, [receitas, ordenacao]);

  const receitasFiltradas = useMemo(() => {
    const min = valorMin ? parseFloat(valorMin) : null;
    const max = valorMax ? parseFloat(valorMax) : null;

    return receitasOrdenadas.filter(receita => {
      if (mesFiltro && receita.mes !== mesFiltro) return false;
      if (busca && !receita.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      if (min !== null && receita.valor < min) return false;
      if (max !== null && receita.valor > max) return false;
      return true;
    });
  }, [receitasOrdenadas, mesFiltro, busca, valorMin, valorMax]);

  const totalFiltrado = useMemo(
    () => receitasFiltradas.reduce((sum, receita) => sum + receita.valor, 0),
    [receitasFiltradas]
  );

  const totaisPorMes = useMemo(() => {
    const acumulado = receitasFiltradas.reduce((acc, receita) => {
      acc[receita.mes] = (acc[receita.mes] || 0) + receita.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(acumulado)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [receitasFiltradas]);

  const receitasFormatadas = receitasFiltradas.map(receita => ({
    ...receita,
    dataFormatada: new Date(receita.data).toLocaleDateString('pt-BR'),
  }));

  if (receitas.length === 0) {
    return (
      <div className="sheet-table-card">
        <div className="sheet-table-header">
          <div>
            <h2>📊 Receitas cadastradas</h2>
            <p className="sheet-table-subtitle">Nenhuma receita cadastrada ainda.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-table-card">
      <div className="sheet-table-header">
        <div>
          <h2>📊 Receitas Cadastradas</h2>
          <p className="sheet-table-subtitle">
            {receitasFiltradas.length} lançamentos visíveis • Total{' '}
            <strong>{formatCurrency(totalFiltrado)}</strong>
          </p>
        </div>
        <div className="sheet-table-totals">
          <span>Resumo rápido</span>
          <strong>{formatCurrency(totalFiltrado)}</strong>
        </div>
      </div>

      <div className="sheet-table-toolbar">
        <div className="sheet-filter">
          <label htmlFor="busca-receitas">Pesquisar</label>
          <input
            id="busca-receitas"
            type="text"
            placeholder="Descrição..."
            value={busca}
            onChange={event => setBusca(event.target.value)}
          />
        </div>
        <div className="sheet-filter">
          <label htmlFor="filtro-mes-receitas">Mês</label>
          <select
            id="filtro-mes-receitas"
            value={mesFiltro}
            onChange={event => setMesFiltro(event.target.value)}
          >
            <option value="">Todos</option>
            {todosMeses.map(mes => (
              <option key={mes} value={mes}>
                {formatMes(mes)}
              </option>
            ))}
          </select>
        </div>
        <div className="sheet-filter">
          <label htmlFor="valor-min">Valor mínimo</label>
          <input
            id="valor-min"
            type="number"
            min="0"
            placeholder="0,00"
            value={valorMin}
            onChange={event => setValorMin(event.target.value)}
          />
        </div>
        <div className="sheet-filter">
          <label htmlFor="valor-max">Valor máximo</label>
          <input
            id="valor-max"
            type="number"
            min="0"
            placeholder="0,00"
            value={valorMax}
            onChange={event => setValorMax(event.target.value)}
          />
        </div>
        <div className="sheet-filter">
          <label htmlFor="ordenacao">Ordenação</label>
          <select
            id="ordenacao"
            value={ordenacao}
            onChange={event => setOrdenacao(event.target.value as Ordenacao)}
          >
            <option value="data-desc">Mais recentes</option>
            <option value="data-asc">Mais antigos</option>
            <option value="valor-desc">Maior valor</option>
            <option value="valor-asc">Menor valor</option>
          </select>
        </div>
      </div>

      {receitasFiltradas.length === 0 ? (
        <p className="sheet-empty-state">
          Nenhum lançamento corresponde aos filtros aplicados.
        </p>
      ) : (
        <>
          <div className="sheet-table-wrapper">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th className="align-right">Valor</th>
                  <th>Data</th>
                  <th>Mês</th>
                  {receitas.some(r => r.createdAt) && <th>Criado em</th>}
                  <th className="actions-column">Ações</th>
                </tr>
              </thead>
              <tbody>
                {receitasFormatadas.map(receita => (
                  <tr key={receita.id}>
                    <td>
                      <strong>{receita.descricao}</strong>
                    </td>
                    <td className="align-right">{formatCurrency(receita.valor)}</td>
                    <td>{receita.dataFormatada}</td>
                    <td>
                      <span className="sheet-badge neutral">{formatMes(receita.mes)}</span>
                    </td>
                    {receitas.some(r => r.createdAt) && (
                      <td>
                        {receita.createdAt
                          ? new Date(receita.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    )}
                    <td className="actions-column">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(receita)}
                          className="table-action success"
                          title="Editar lançamento"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(receita.id)}
                        className="table-action danger"
                        title="Excluir lançamento"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="align-right">{formatCurrency(totalFiltrado)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {totaisPorMes.length > 0 && (
            <div className="sheet-pivot">
              {totaisPorMes.map(([mes, total]) => (
                <div key={mes} className="sheet-pivot-card">
                  <span>{formatMes(mes)}</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

