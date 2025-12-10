export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  mes: string;
  createdAt?: string;
}

export interface GastoCartao {
  id: string;
  descricao: string;
  valorTotal: number;
  parcelas: number;
  parcelaAtual: number;
  valorParcela: number;
  dataInicio: string;
  mes: string;
  pago: boolean;
  valorPago?: number; // Valor pago/abatido (para pagamento parcial)
  createdAt?: string;
}

export interface GastoDebito {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  mes: string;
  createdAt?: string;
}

export interface FinancasData {
  receitas: Receita[];
  gastosCartao: GastoCartao[];
  gastosDebito: GastoDebito[];
}

export interface SaldoMensal {
  mes: string;
  receitas: number;
  gastosCartao: number;
  gastosDebito: number;
  saldo: number;
}

