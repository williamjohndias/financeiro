import { useState } from 'react';
import { GastoCartao } from '../types';
import { getMesAtual } from '../utils/calculations';
import './Forms.css';

interface GastosCartaoFormProps {
  onAdd: (gasto: Omit<GastoCartao, 'id' | 'parcelaAtual' | 'valorParcela' | 'mes' | 'pago'>) => void;
}

export default function GastosCartaoForm({ onAdd }: GastosCartaoFormProps) {
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valorTotal || !parcelas || !dataInicio) return;

    onAdd({
      descricao,
      valorTotal: parseFloat(valorTotal),
      parcelas: parseInt(parcelas),
      dataInicio,
      mes: getMesAtual(),
    });

    setDescricao('');
    setValorTotal('');
    setParcelas('1');
    setDataInicio(new Date().toISOString().split('T')[0]);
  };

  const valorParcela = valorTotal && parcelas
    ? (parseFloat(valorTotal) / parseInt(parcelas)).toFixed(2)
    : '0.00';

  return (
    <div className="form-card">
      <h2>💳 Adicionar Gasto no Cartão</h2>
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

        <button type="submit" className="btn-primary">
          Adicionar Gasto
        </button>
      </form>
    </div>
  );
}

