import { useState } from 'react';
import * as React from 'react';
import { Receita } from '../types';
import { getMesAtual, getDataHoje } from '../utils/calculations';
import './Forms.css';

interface ReceitasFormProps {
  onAdd: (receita: Omit<Receita, 'id'>) => void;
  onUpdate?: (receita: Receita) => void;
  receitaEditando?: Receita | null;
  onCancelEdit?: () => void;
}

export default function ReceitasForm({ onAdd, onUpdate, receitaEditando, onCancelEdit }: ReceitasFormProps) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(getDataHoje());
  const [mes, setMes] = useState(getMesAtual());

  // Atualizar campos quando receitaEditando mudar
  React.useEffect(() => {
    if (receitaEditando) {
      setDescricao(receitaEditando.descricao);
      setValor(receitaEditando.valor.toString());
      setData(receitaEditando.data);
      setMes(receitaEditando.mes);
    } else {
      setDescricao('');
      setValor('');
      setData(getDataHoje());
      setMes(getMesAtual());
    }
  }, [receitaEditando]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !mes) return;

    if (receitaEditando && onUpdate) {
      // Modo edição
      onUpdate({
        ...receitaEditando,
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
    setData(getDataHoje());
    setMes(getMesAtual());
  };

  return (
    <div className="form-card">
      <h2>{receitaEditando ? '✏️ Editar Receita' : '➕ Adicionar Receita'}</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Salário, Freelance..."
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
            {receitaEditando ? 'Salvar Alterações' : 'Adicionar Receita'}
          </button>
          {receitaEditando && onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

