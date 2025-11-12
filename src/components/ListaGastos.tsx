import { useState } from 'react';
import { GastoCartao, GastoDebito } from '../types';
import { formatMes } from '../utils/calculations';
import './Listas.css';

interface ListaGastosProps {
  gastosCartao: GastoCartao[];
  gastosDebito: GastoDebito[];
  onDeleteCartao: (id: string) => void;
  onDeleteDebito: (id: string) => void;
  onTogglePago: (id: string) => void;
}

export default function ListaGastos({
  gastosCartao,
  gastosDebito,
  onDeleteCartao,
  onDeleteDebito,
  onTogglePago,
}: ListaGastosProps) {
  const [mesFiltro, setMesFiltro] = useState<string>('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const gastosCartaoPorMes = gastosCartao.reduce((acc, gasto) => {
    if (!acc[gasto.mes]) {
      acc[gasto.mes] = [];
    }
    acc[gasto.mes].push(gasto);
    return acc;
  }, {} as Record<string, GastoCartao[]>);

  const gastosDebitoPorMes = gastosDebito.reduce((acc, gasto) => {
    if (!acc[gasto.mes]) {
      acc[gasto.mes] = [];
    }
    acc[gasto.mes].push(gasto);
    return acc;
  }, {} as Record<string, GastoDebito[]>);

  const todosMeses = [
    ...Object.keys(gastosCartaoPorMes),
    ...Object.keys(gastosDebitoPorMes),
  ].filter((v, i, a) => a.indexOf(v) === i).sort().reverse();

  // Filtrar gastos por mês selecionado
  const gastosCartaoFiltrados = mesFiltro 
    ? gastosCartao.filter(g => g.mes === mesFiltro)
    : gastosCartao;
  
  const gastosDebitoFiltrados = mesFiltro
    ? gastosDebito.filter(g => g.mes === mesFiltro)
    : gastosDebito;

  // Agrupar gastos do cartão por descrição e data de início
  const gastosAgrupados = gastosCartaoFiltrados.reduce((acc, gasto) => {
    // Agrupar por descrição e dataInicio para identificar o mesmo gasto
    const chaveAgrupamento = `${gasto.descricao}-${gasto.dataInicio}`;
    if (!acc[chaveAgrupamento]) {
      // Encontrar a primeira parcela para calcular quantas parcelas anteriores já foram pagas
      const todasParcelas = gastosCartao.filter(g => 
        g.descricao === gasto.descricao && g.dataInicio === gasto.dataInicio
      );
      const primeiraParcela = todasParcelas.reduce((min, p) => 
        p.parcelaAtual < min.parcelaAtual ? p : min
      , todasParcelas[0]);
      const parcelasAnterioresPagas = primeiraParcela.parcelaAtual > 1 
        ? primeiraParcela.parcelaAtual - 1 
        : 0;
      
      acc[chaveAgrupamento] = {
        descricao: gasto.descricao,
        valorTotal: gasto.valorTotal,
        parcelas: gasto.parcelas,
        dataInicio: gasto.dataInicio,
        parcelasList: [],
        parcelasAnterioresPagas,
      };
    }
    acc[chaveAgrupamento].parcelasList.push(gasto);
    return acc;
  }, {} as Record<string, any>);
  
  // Calcular parcelas pagas para cada grupo (incluindo parcelas anteriores)
  Object.keys(gastosAgrupados).forEach(chave => {
    const grupo = gastosAgrupados[chave];
    const parcelasPagasNoSistema = grupo.parcelasList.filter((p: GastoCartao) => p.pago).length;
    grupo.parcelasPagas = grupo.parcelasAnterioresPagas + parcelasPagasNoSistema;
  });

  // Agrupar gastos do cartão por mês quando não há filtro
  const gastosCartaoPorMesAgrupados = Object.keys(gastosCartaoPorMes).reduce((acc, mes) => {
    const gastosMes = gastosCartaoPorMes[mes];
    const gastosAgrupadosMes = gastosMes.reduce((accGrupo, gasto) => {
      const chaveAgrupamento = `${gasto.descricao}-${gasto.dataInicio}`;
      if (!accGrupo[chaveAgrupamento]) {
        // Encontrar a primeira parcela para calcular quantas parcelas anteriores já foram pagas
        const todasParcelas = gastosCartao.filter(g => 
          g.descricao === gasto.descricao && g.dataInicio === gasto.dataInicio
        );
        const primeiraParcela = todasParcelas.reduce((min, p) => 
          p.parcelaAtual < min.parcelaAtual ? p : min
        , todasParcelas[0]);
        const parcelasAnterioresPagas = primeiraParcela.parcelaAtual > 1 
          ? primeiraParcela.parcelaAtual - 1 
          : 0;
        
        accGrupo[chaveAgrupamento] = {
          descricao: gasto.descricao,
          valorTotal: gasto.valorTotal,
          parcelas: gasto.parcelas,
          dataInicio: gasto.dataInicio,
          parcelasList: [],
          parcelasAnterioresPagas,
        };
      }
      accGrupo[chaveAgrupamento].parcelasList.push(gasto);
      return accGrupo;
    }, {} as Record<string, any>);
    
    // Calcular parcelas pagas para cada grupo do mês
    Object.keys(gastosAgrupadosMes).forEach(chave => {
      const grupo = gastosAgrupadosMes[chave];
      const parcelasPagasNoSistema = grupo.parcelasList.filter((p: GastoCartao) => p.pago).length;
      grupo.parcelasPagas = grupo.parcelasAnterioresPagas + parcelasPagasNoSistema;
    });
    
    acc[mes] = Object.values(gastosAgrupadosMes);
    return acc;
  }, {} as Record<string, any[]>);

  if (gastosCartao.length === 0 && gastosDebito.length === 0) {
    return (
      <div className="lista-card">
        <h2>💳 Gastos Cadastrados</h2>
        <p className="empty-message">Nenhum gasto cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="lista-card">
      <div className="lista-header">
        <h2>💳 Gastos Cadastrados</h2>
        <div className="filtro-mes">
          <label htmlFor="filtro-mes">Filtrar por mês: </label>
          <select
            id="filtro-mes"
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="select-mes"
          >
            <option value="">Todos os meses</option>
            {todosMeses.map(mes => (
              <option key={mes} value={mes}>
                {formatMes(mes)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mesFiltro ? (
        // Mostrar gastos do mês filtrado
        <>
          {Object.keys(gastosAgrupados).length > 0 && (
            <div className="mes-group">
              <div className="mes-header">
                <h3>💳 Cartão - {formatMes(mesFiltro)}</h3>
                <span className="total">
                  Total: {formatCurrency(
                    gastosCartaoFiltrados.reduce((sum, g) => sum + g.valorParcela, 0)
                  )}
                </span>
              </div>
              <div className="gastos-section">
                {Object.values(gastosAgrupados).map((grupo: any, idx) => {
                  const isParcelado = grupo.parcelas > 1;
                  
                  return (
                    <div key={idx} className="gasto-agrupado">
                      <div className="gasto-header">
                        <strong>{grupo.descricao}</strong>
                        <span>
                          Total: {formatCurrency(grupo.valorTotal)} | 
                          {isParcelado ? ` ${grupo.parcelasPagas}/${grupo.parcelas} parcelas pagas` : ` ${grupo.parcelas}x`}
                        </span>
                      </div>
                      <div className="parcelas-list">
                        {grupo.parcelasList
                          .sort((a: GastoCartao, b: GastoCartao) => a.parcelaAtual - b.parcelaAtual)
                          .map((parcela: GastoCartao) => (
                            <div
                              key={parcela.id}
                              className={`item-card ${parcela.pago ? 'pago' : ''}`}
                            >
                              <div className="item-info">
                                <span>
                                  Parcela {parcela.parcelaAtual}/{parcela.parcelas} - {formatMes(parcela.mes)}
                                </span>
                                <span className="item-date">
                                  {new Date(parcela.dataInicio).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="item-actions">
                                <span className="item-value">{formatCurrency(parcela.valorParcela)}</span>
                                <button
                                  onClick={() => onTogglePago(parcela.id)}
                                  className={`btn-toggle ${parcela.pago ? 'pago' : ''}`}
                                  title={parcela.pago ? 'Marcar como não pago' : 'Marcar como pago'}
                                >
                                  {parcela.pago ? '✅' : '⏳'}
                                </button>
                                <button
                                  onClick={() => onDeleteCartao(parcela.id)}
                                  className="btn-delete"
                                  title="Excluir"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {gastosDebitoFiltrados.length > 0 && (
            <div className="mes-group">
              <div className="mes-header">
                <h3>💸 Débito - {formatMes(mesFiltro)}</h3>
                <span className="total">
                  Total: {formatCurrency(gastosDebitoFiltrados.reduce((sum, g) => sum + g.valor, 0))}
                </span>
              </div>
              <div className="items-list">
                {gastosDebitoFiltrados.map(gasto => (
                  <div key={gasto.id} className="item-card debito">
                    <div className="item-info">
                      <strong>{gasto.descricao}</strong>
                      <span className="item-date">{new Date(gasto.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="item-actions">
                      <span className="item-value">{formatCurrency(gasto.valor)}</span>
                      <button
                        onClick={() => onDeleteDebito(gasto.id)}
                        className="btn-delete"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // Mostrar todos os meses quando não há filtro
        todosMeses.map(mes => {
          const gastosCartaoMes = gastosCartaoPorMesAgrupados[mes] || [];
          const gastosDebitoMes = gastosDebitoPorMes[mes] || [];
          
          if (gastosCartaoMes.length === 0 && gastosDebitoMes.length === 0) {
            return null;
          }

          const totalMesCartao = (gastosCartaoPorMes[mes] || []).reduce((sum, g) => sum + g.valorParcela, 0);
          const totalMesDebito = gastosDebitoMes.reduce((sum, g) => sum + g.valor, 0);

          return (
            <div key={mes} className="mes-group">
              {gastosCartaoMes.length > 0 && (
                <>
                  <div className="mes-header">
                    <h3>💳 Cartão - {formatMes(mes)}</h3>
                    <span className="total">Total: {formatCurrency(totalMesCartao)}</span>
                  </div>
                  <div className="gastos-section">
                    {gastosCartaoMes.map((grupo: any, idx) => {
                      const isParcelado = grupo.parcelas > 1;
                      
                      return (
                        <div key={idx} className="gasto-agrupado">
                          <div className="gasto-header">
                            <strong>{grupo.descricao}</strong>
                            <span>
                              Total: {formatCurrency(grupo.valorTotal)} | 
                              {isParcelado ? ` ${grupo.parcelasPagas}/${grupo.parcelas} parcelas pagas` : ` ${grupo.parcelas}x`}
                            </span>
                          </div>
                          <div className="parcelas-list">
                            {grupo.parcelasList
                              .sort((a: GastoCartao, b: GastoCartao) => a.parcelaAtual - b.parcelaAtual)
                              .map((parcela: GastoCartao) => (
                                <div
                                  key={parcela.id}
                                  className={`item-card ${parcela.pago ? 'pago' : ''}`}
                                >
                                  <div className="item-info">
                                    <span>
                                      Parcela {parcela.parcelaAtual}/{parcela.parcelas} - {formatMes(parcela.mes)}
                                    </span>
                                    <span className="item-date">
                                      {new Date(parcela.dataInicio).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <div className="item-actions">
                                    <span className="item-value">{formatCurrency(parcela.valorParcela)}</span>
                                    <button
                                      onClick={() => onTogglePago(parcela.id)}
                                      className={`btn-toggle ${parcela.pago ? 'pago' : ''}`}
                                      title={parcela.pago ? 'Marcar como não pago' : 'Marcar como pago'}
                                    >
                                      {parcela.pago ? '✅' : '⏳'}
                                    </button>
                                    <button
                                      onClick={() => onDeleteCartao(parcela.id)}
                                      className="btn-delete"
                                      title="Excluir"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {gastosDebitoMes.length > 0 && (
                <>
                  <div className="mes-header">
                    <h3>💸 Débito - {formatMes(mes)}</h3>
                    <span className="total">Total: {formatCurrency(totalMesDebito)}</span>
                  </div>
                  <div className="items-list">
                    {gastosDebitoMes.map(gasto => (
                      <div key={gasto.id} className="item-card debito">
                        <div className="item-info">
                          <strong>{gasto.descricao}</strong>
                          <span className="item-date">{new Date(gasto.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="item-actions">
                          <span className="item-value">{formatCurrency(gasto.valor)}</span>
                          <button
                            onClick={() => onDeleteDebito(gasto.id)}
                            className="btn-delete"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

