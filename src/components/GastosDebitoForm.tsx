import { useState } from 'react';
import * as React from 'react';
import { GastoDebito } from '../types';
import { getMesAtual, getDataHoje } from '../utils/calculations';
import './Forms.css';

interface GastosDebitoFormProps {
  onAdd: (gasto: Omit<GastoDebito, 'id'>) => void;
  onUpdate?: (gasto: GastoDebito) => void;
  gastoEditando?: GastoDebito | null;
  onCancelEdit?: () => void;
}

export default function GastosDebitoForm({ onAdd, onUpdate, gastoEditando, onCancelEdit }: GastosDebitoFormProps) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(getDataHoje());
  const [mes, setMes] = useState(getMesAtual());

  // Atualizar campos quando gastoEditando mudar
  React.useEffect(() => {
    if (gastoEditando) {
      setDescricao(gastoEditando.descricao);
      setValor(gastoEditando.valor.toString());
      setData(gastoEditando.data);
      setMes(gastoEditando.mes);
    } else {
      setDescricao('');
      setValor('');
      setData(getDataHoje());
      setMes(getMesAtual());
    }
  }, [gastoEditando]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !mes) return;

    if (gastoEditando && onUpdate) {
      // Modo edição
      onUpdate({
        ...gastoEditando,
        descricao,
        valor: parseFloat(valor),
        data,
        mes,
      });
      if (onCancelEdit) onCancelEdit();
    } else {
      // Modo adição
      onAdd({
        descricao,
        valor: parseFloat(valor),
        data,
        mes,
      });
    }

    setDescricao('');
    setValor('');
    setData(getDataHojeMenosUmDia());
    setMes(getMesAtual());
  };

  return (
    <div className="form-card">
      <h2>{gastoEditando ? '✏️ Editar Gasto no Débito' : '💸 Adicionar Gasto no Débito'}</h2>
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

