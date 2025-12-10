import { GastoCartao } from '../types';

// Função para converter valor brasileiro (ex: "6,13") para número
const parseValorBrasileiro = (valor: string): number => {
  // Remove aspas e espaços, substitui vírgula por ponto
  const limpo = valor.replace(/["\s]/g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
};

// Função para extrair informações de parcela do título
const extrairParcela = (titulo: string): { descricao: string; parcelaAtual: number; totalParcelas: number } => {
  const match = titulo.match(/Parcela\s+(\d+)\/(\d+)/i);
  if (match) {
    return {
      descricao: titulo.replace(/\s*-\s*Parcela\s+\d+\/\d+/i, '').trim(),
      parcelaAtual: parseInt(match[1]),
      totalParcelas: parseInt(match[2]),
    };
  }
  return {
    descricao: titulo.trim(),
    parcelaAtual: 1,
    totalParcelas: 1,
  };
};

// Função para determinar o mês baseado na data
const getMesFromData = (data: string): string => {
  const [ano, mes] = data.split('-');
  return `${ano}-${mes}`;
};

// Função para importar gastos do cartão a partir de um CSV
export const importarGastosCartaoCSV = (csvContent: string): GastoCartao[] => {
  const linhas = csvContent.split('\n').filter(linha => linha.trim());
  
  if (linhas.length < 2) {
    throw new Error('CSV vazio ou inválido');
  }

  // Pular cabeçalho
  const dados = linhas.slice(1);
  const gastos: GastoCartao[] = [];
  const timestamp = Date.now();
  let idCounter = 0;

  const gerarId = (): string => {
    return `csv-${timestamp}-${idCounter++}`;
  };

  // Processar cada linha do CSV
  dados.forEach(linha => {
    // Dividir por vírgula, mas respeitando aspas
    const colunas: string[] = [];
    let atual = '';
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      if (char === '"') {
        dentroAspas = !dentroAspas;
      } else if (char === ',' && !dentroAspas) {
        colunas.push(atual.trim());
        atual = '';
      } else {
        atual += char;
      }
    }
    colunas.push(atual.trim());

    if (colunas.length < 3) return;

    const data = colunas[0];
    const titulo = colunas[1];
    const valorStr = colunas[2];

    if (!data || !titulo || !valorStr) return;

    const valor = parseValorBrasileiro(valorStr);
    if (valor <= 0) return;

    const parcelaInfo = extrairParcela(titulo);
    const mes = getMesFromData(data);

    // Se tem informação de parcela, calcular valor total
    let valorTotal = valor;
    let valorParcela = valor;
    
    if (parcelaInfo.totalParcelas > 1) {
      // Para parcelas, assumir que o valor da parcela é o valor mostrado
      valorParcela = valor;
      valorTotal = valor * parcelaInfo.totalParcelas;
    }

    gastos.push({
      id: gerarId(),
      descricao: parcelaInfo.descricao,
      valorTotal: valorTotal,
      parcelas: parcelaInfo.totalParcelas,
      parcelaAtual: parcelaInfo.parcelaAtual,
      valorParcela: valorParcela,
      dataInicio: data,
      mes: mes,
      pago: false, // Por padrão, não pago (espelho do banco)
      createdAt: new Date().toISOString(),
    });
  });

  return gastos;
};

// Função para ler arquivo CSV
export const lerArquivoCSV = async (arquivo: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target?.result as string;
      resolve(texto);
    };
    reader.onerror = reject;
    reader.readAsText(arquivo, 'UTF-8');
  });
};

