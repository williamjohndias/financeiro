import { Receita } from '../types';
import { formatMes } from '../utils/calculations';
import './Listas.css';

interface ListaReceitasProps {
  receitas: Receita[];
  onDelete: (id: string) => void;
}

export default function ListaReceitas({ receitas, onDelete }: ListaReceitasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const receitasPorMes = receitas.reduce((acc, receita) => {
    if (!acc[receita.mes]) {
      acc[receita.mes] = [];
    }
    acc[receita.mes].push(receita);
    return acc;
  }, {} as Record<string, Receita[]>);

  const meses = Object.keys(receitasPorMes).sort().reverse();

  if (receitas.length === 0) {
    return (
      <div className="lista-card">
        <h2>📊 Receitas Cadastradas</h2>
        <p className="empty-message">Nenhuma receita cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="lista-card">
      <h2>📊 Receitas Cadastradas</h2>
      {meses.map(mes => {
        const receitasMes = receitasPorMes[mes];
        const totalMes = receitasMes.reduce((sum, r) => sum + r.valor, 0);

        return (
          <div key={mes} className="mes-group">
            <div className="mes-header">
              <h3>{formatMes(mes)}</h3>
              <span className="total">Total: {formatCurrency(totalMes)}</span>
            </div>
            <div className="items-list">
              {receitasMes.map(receita => (
                <div key={receita.id} className="item-card receita">
                  <div className="item-info">
                    <strong>{receita.descricao}</strong>
                    <span className="item-date">{new Date(receita.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="item-actions">
                    <span className="item-value">{formatCurrency(receita.valor)}</span>
                    <button
                      onClick={() => onDelete(receita.id)}
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
  );
}

