import { useState } from 'react';
import { GastoDebito } from '../types';
import { getMesAtual } from '../utils/calculations';
import './Forms.css';

interface GastosDebitoFormProps {
  onAdd: (gasto: Omit<GastoDebito, 'id'>) => void;
}

export default function GastosDebitoForm({ onAdd }: GastosDebitoFormProps) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [mes, setMes] = useState(getMesAtual());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !mes) return;

    onAdd({
      descricao,
      valor: parseFloat(valor),
      data,
      mes,
    });

    setDescricao('');
    setValor('');
    setData(new Date().toISOString().split('T')[0]);
    setMes(getMesAtual());
  };

  return (
    <div className="form-card">
      <h2>💸 Adicionar Gasto no Débito</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Conta de luz, Almoço..."
            required
          />
        </div>

        <div className="form-group">
          <label>Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Mês de Referência</label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Adicionar Gasto
        </button>
      </form>
    </div>
  );
}

