import { useMemo, useState } from 'react';
import { GastoCartao, GastoDebito } from '../types';
import { formatMes } from '../utils/calculations';
import './Listas.css';

interface ListaGastosProps {
  gastosCartao: GastoCartao[];
  gastosDebito: GastoDebito[];
  onDeleteCartao: (id: string) => void;
  onDeleteDebito: (id: string) => void;
  onTogglePago: (id: string) => void;
  onEditCartao?: (gasto: GastoCartao) => void;
  onEditDebito?: (gasto: GastoDebito) => void;
}

type TipoFiltro = 'todos' | 'cartao' | 'debito';
type StatusFiltro = 'todos' | 'pagos' | 'abertos';

interface GastoLinha {
  id: string;
  tipo: 'Cartão' | 'Débito';
  descricao: string;
  valor: number;
  data: string;
  mes: string;
  pago?: boolean;
  parcelas?: number;
  parcelaAtual?: number;
  valorTotal?: number;
  createdAt?: string;
}

export default function ListaGastos({
  gastosCartao,
  gastosDebito,
  onDeleteCartao,
  onDeleteDebito,
  onTogglePago,
  onEditCartao,
  onEditDebito,
}: ListaGastosProps) {
  const [mesFiltro, setMesFiltro] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos');
  const [busca, setBusca] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const todosMeses = useMemo(() => {
    const meses = [
      ...new Set([...gastosCartao.map(g => g.mes), ...gastosDebito.map(g => g.mes)]),
    ];
    return meses.sort().reverse();
  }, [gastosCartao, gastosDebito]);

  const dataset = useMemo<GastoLinha[]>(() => {
    const cartaoLinhas = gastosCartao.map(gasto => ({
      id: gasto.id,
      tipo: 'Cartão' as const,
      descricao: gasto.descricao,
      valor: gasto.valorParcela,
      data: gasto.dataInicio,
      mes: gasto.mes,
      pago: gasto.pago,
      parcelas: gasto.parcelas,
      parcelaAtual: gasto.parcelaAtual,
      valorTotal: gasto.valorTotal,
      createdAt: gasto.createdAt,
    }));

    const debitoLinhas = gastosDebito.map(gasto => ({
      id: gasto.id,
      tipo: 'Débito' as const,
      descricao: gasto.descricao,
      valor: gasto.valor,
      data: gasto.data,
      mes: gasto.mes,
      createdAt: gasto.createdAt,
    }));

    return [...cartaoLinhas, ...debitoLinhas].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [gastosCartao, gastosDebito]);

  const gastosFiltrados = useMemo(() => {
    const min = valorMin ? parseFloat(valorMin) : null;
    const max = valorMax ? parseFloat(valorMax) : null;

    return dataset.filter(gasto => {
      if (mesFiltro && gasto.mes !== mesFiltro) return false;
      if (busca && !gasto.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      if (tipoFiltro === 'cartao' && gasto.tipo !== 'Cartão') return false;
      if (tipoFiltro === 'debito' && gasto.tipo !== 'Débito') return false;
      if (gasto.tipo === 'Cartão' && statusFiltro !== 'todos') {
        if (statusFiltro === 'pagos' && !gasto.pago) return false;
        if (statusFiltro === 'abertos' && gasto.pago) return false;
      }
      if (min !== null && gasto.valor < min) return false;
      if (max !== null && gasto.valor > max) return false;
      return true;
    });
  }, [dataset, mesFiltro, busca, tipoFiltro, statusFiltro, valorMin, valorMax]);

  const totais = useMemo(() => {
    return gastosFiltrados.reduce(
      (acc, gasto) => {
        if (gasto.tipo === 'Cartão') {
          acc.cartao += gasto.valor;
        } else {
          acc.debito += gasto.valor;
        }
        acc.geral += gasto.valor;
        return acc;
      },
      { cartao: 0, debito: 0, geral: 0 }
    );
  }, [gastosFiltrados]);

  const resumoCartao = useMemo(() => {
    const abertas = gastosCartao.filter(g => !g.pago).reduce((sum, g) => sum + g.valorParcela, 0);
    const pagas = gastosCartao.filter(g => g.pago).reduce((sum, g) => sum + g.valorParcela, 0);
    return { abertas, pagas };
  }, [gastosCartao]);

  const filtroAtivo = [
    mesFiltro ? formatMes(mesFiltro) : 'Todos os meses',
    tipoFiltro === 'todos' ? 'Todos os tipos' : tipoFiltro === 'cartao' ? 'Cartão' : 'Débito',
    statusFiltro === 'todos' ? 'Todos os status' : statusFiltro === 'pagos' ? 'Pagos' : 'Abertos',
  ].join(' • ');

  if (gastosCartao.length === 0 && gastosDebito.length === 0) {
    return (
      <div className="sheet-table-card">
        <div className="sheet-table-header">
          <div>
            <h2>💳 Gastos Cadastrados</h2>
            <p className="sheet-table-subtitle">Nenhum gasto cadastrado ainda.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-table-card">
      <div className="sheet-table-header">
        <div>
          <h2>💳 Gastos Cadastrados</h2>
          <p className="sheet-table-subtitle">{filtroAtivo}</p>
        </div>
        <div className="sheet-table-totals">
          <span>Total filtrado</span>
          <strong>{formatCurrency(totais.geral)}</strong>
        </div>
      </div>

      <div className="sheet-table-toolbar">
        <div className="sheet-filter wide">
          <label htmlFor="busca-gastos">Pesquisar</label>
          <input
            id="busca-gastos"
            type="text"
            placeholder="Descrição..."
            value={busca}
            onChange={event => setBusca(event.target.value)}
          />
        </div>
        <div className="sheet-filter">
          <label htmlFor="filtro-mes-gastos">Mês</label>
          <select
            id="filtro-mes-gastos"
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
          <label htmlFor="filtro-tipo">Tipo</label>
          <select
            id="filtro-tipo"
            value={tipoFiltro}
            onChange={event => setTipoFiltro(event.target.value as TipoFiltro)}
          >
            <option value="todos">Todos</option>
            <option value="cartao">Cartão</option>
            <option value="debito">Débito</option>
          </select>
        </div>
        <div className="sheet-filter">
          <label htmlFor="filtro-status">Status (Cartão)</label>
          <select
            id="filtro-status"
            value={statusFiltro}
            onChange={event => setStatusFiltro(event.target.value as StatusFiltro)}
          >
            <option value="todos">Todos</option>
            <option value="pagos">Pagos</option>
            <option value="abertos">Abertos</option>
          </select>
        </div>
        <div className="sheet-filter">
          <label htmlFor="valor-min-gastos">Valor mínimo</label>
          <input
            id="valor-min-gastos"
            type="number"
            min="0"
            placeholder="0,00"
            value={valorMin}
            onChange={event => setValorMin(event.target.value)}
          />
        </div>
        <div className="sheet-filter">
          <label htmlFor="valor-max-gastos">Valor máximo</label>
          <input
            id="valor-max-gastos"
            type="number"
            min="0"
            placeholder="0,00"
            value={valorMax}
            onChange={event => setValorMax(event.target.value)}
          />
        </div>
      </div>

      <div className="sheet-pivot">
        <div className="sheet-pivot-card cartao">
          <span>Cartão filtrado</span>
          <strong>{formatCurrency(totais.cartao)}</strong>
        </div>
        <div className="sheet-pivot-card debito">
          <span>Débito filtrado</span>
          <strong>{formatCurrency(totais.debito)}</strong>
        </div>
        <div className="sheet-pivot-card warning">
          <span>Parcelas abertas</span>
          <strong>{formatCurrency(resumoCartao.abertas)}</strong>
        </div>
        <div className="sheet-pivot-card success">
          <span>Parcelas pagas</span>
          <strong>{formatCurrency(resumoCartao.pagas)}</strong>
        </div>
      </div>

      {gastosFiltrados.length === 0 ? (
        <p className="sheet-empty-state">
          Nenhum gasto encontrado com os filtros selecionados.
        </p>
      ) : (
        <div className="sheet-table-wrapper">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descrição</th>
                <th className="align-right">Valor</th>
                <th>Data</th>
                <th>Mês</th>
                <th>Parcelas</th>
                <th>Status</th>
                {dataset.some(g => g.createdAt) && <th>Criado em</th>}
                <th className="actions-column">Ações</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.map(gasto => (
                <tr key={gasto.id}>
                  <td>
                    <span
                      className={`sheet-badge ${
                        gasto.tipo === 'Cartão' ? 'accent' : 'neutral'
                      }`}
                    >
                      {gasto.tipo}
                    </span>
                  </td>
                  <td>
                    <strong>{gasto.descricao}</strong>
                  </td>
                  <td className="align-right">{formatCurrency(gasto.valor)}</td>
                  <td>{new Date(gasto.data).toLocaleDateString('pt-BR')}</td>
                  <td>{formatMes(gasto.mes)}</td>
                  <td>
                    {gasto.tipo === 'Cartão' && gasto.parcelas ? (
                      <span>
                        {gasto.parcelaAtual}/{gasto.parcelas}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {gasto.tipo === 'Cartão' ? (
                      <span className={`sheet-status ${gasto.pago ? 'paid' : 'pending'}`}>
                        {gasto.pago ? 'Pago' : 'Aberto'}
                      </span>
                    ) : (
                      <span className="sheet-status neutral">À vista</span>
                    )}
                  </td>
                  {dataset.some(g => g.createdAt) && (
                    <td>
                      {gasto.createdAt
                        ? new Date(gasto.createdAt).toLocaleString('pt-BR', {
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
                    {gasto.tipo === 'Cartão' && (
                      <button
                        onClick={() => onTogglePago(gasto.id)}
                        className="table-action success"
                        title={gasto.pago ? 'Marcar como não pago' : 'Marcar como pago'}
                      >
                        {gasto.pago ? '✅' : '⏳'}
                      </button>
                    )}
                    {gasto.tipo === 'Cartão' && onEditCartao && (
                      <button
                        onClick={() => {
                          const gastoOriginal = gastosCartao.find(g => g.id === gasto.id);
                          if (gastoOriginal) onEditCartao(gastoOriginal);
                        }}
                        className="table-action success"
                        title="Editar lançamento"
                      >
                        ✏️
                      </button>
                    )}
                    {gasto.tipo === 'Débito' && onEditDebito && (
                      <button
                        onClick={() => {
                          const gastoOriginal = gastosDebito.find(g => g.id === gasto.id);
                          if (gastoOriginal) onEditDebito(gastoOriginal);
                        }}
                        className="table-action success"
                        title="Editar lançamento"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() =>
                        gasto.tipo === 'Cartão'
                          ? onDeleteCartao(gasto.id)
                          : onDeleteDebito(gasto.id)
                      }
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
                <td colSpan={2}>Totais</td>
                <td className="align-right">{formatCurrency(totais.geral)}</td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

