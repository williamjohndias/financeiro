import { useState } from 'react';
import * as React from 'react';
import { GastoCartao } from '../types';
import { getDataHoje } from '../utils/calculations';
import './Forms.css';

interface GastosCartaoFormProps {
  onAdd: (gasto: Omit<GastoCartao, 'id' | 'parcelaAtual' | 'valorParcela' | 'mes' | 'pago'>) => void;
  onUpdate?: (gasto: GastoCartao) => void;
  gastoEditando?: GastoCartao | null;
  onCancelEdit?: () => void;
}

export default function GastosCartaoForm({ onAdd, onUpdate, gastoEditando, onCancelEdit }: GastosCartaoFormProps) {
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [dataInicio, setDataInicio] = useState(getDataHoje());
  const [pago, setPago] = useState(false);
  const [valorPago, setValorPago] = useState('');

  // Atualizar campos quando gastoEditando mudar
  React.useEffect(() => {
    if (gastoEditando) {
      setDescricao(gastoEditando.descricao);
      setValorTotal(gastoEditando.valorTotal.toString());
      setParcelas(gastoEditando.parcelas.toString());
      setDataInicio(gastoEditando.dataInicio);
      setPago(gastoEditando.pago);
      setValorPago(gastoEditando.valorPago?.toString() || '');
    } else {
      setDescricao('');
      setValorTotal('');
      setParcelas('1');
      setDataInicio(getDataHoje());
      setPago(false);
      setValorPago('');
    }
  }, [gastoEditando]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valorTotal || !parcelas || !dataInicio) return;

    if (gastoEditando && onUpdate) {
      // Modo edição - atualizar apenas esta parcela
      const valorParcelaCalculado = Math.round((parseFloat(valorTotal) / parseInt(parcelas)) * 100) / 100;
      const valorPagoNum = valorPago ? parseFloat(valorPago) : undefined;
      
      onUpdate({
        ...gastoEditando,
        descricao,
        valorTotal: parseFloat(valorTotal),
        parcelas: parseInt(parcelas),
        dataInicio,
        valorParcela: valorParcelaCalculado,
        pago,
        valorPago: valorPagoNum && valorPagoNum > 0 ? valorPagoNum : undefined,
      });
      if (onCancelEdit) onCancelEdit();
    } else {
      // Modo adição
      onAdd({
        descricao,
        valorTotal: parseFloat(valorTotal),
        parcelas: parseInt(parcelas),
        dataInicio,
      });
    }

    setDescricao('');
    setValorTotal('');
    setParcelas('1');
    setDataInicio(getDataHoje());
  };

  const valorParcela = valorTotal && parcelas
    ? (parseFloat(valorTotal) / parseInt(parcelas)).toFixed(2)
    : '0.00';

  return (
    <div className="form-card">
      <h2>{gastoEditando ? '✏️ Editar Gasto no Cartão' : '💳 Adicionar Gasto no Cartão'}</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Compras no supermercado..."
            required
          />
        </div>

        <div className="form-group">
          <label>Valor Total (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Número de Parcelas</label>
          <input
            type="number"
            min="1"
            max="24"
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Data da Primeira Parcela</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
          />
        </div>

        {valorTotal && parcelas && (
          <div className="info-box">
            <strong>Valor por Parcela: R$ {valorParcela}</strong>
          </div>
        )}

        {gastoEditando && (
          <>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={pago}
                  onChange={(e) => setPago(e.target.checked)}
                />
                {' '}Marcar como pago
              </label>
            </div>

            {pago && (
              <div className="form-group">
                <label>Valor Pago/Abatido (R$) - Deixe vazio para pagamento total</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={valorParcela}
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  placeholder={`Máximo: R$ ${valorParcela}`}
                />
                <small style={{ color: '#666', fontSize: '0.85em' }}>
                  {valorPago && parseFloat(valorPago) > 0 
                    ? `Abatimento parcial: R$ ${parseFloat(valorPago).toFixed(2)} de R$ ${valorParcela}`
                    : 'Se deixar vazio, será considerado pagamento total'}
                </small>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn-primary">
            {gastoEditando ? 'Salvar Alterações' : 'Adicionar Gasto'}
          </button>
          {gastoEditando && onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

