import { FinancasData } from '../types';

export const importarDadosNovembro = (): FinancasData => {
  const data: FinancasData = {
    receitas: [],
    gastosCartao: [],
    gastosDebito: [],
  };

  const novembro2025 = '2025-11';
  const anoBase = 2025;
  const timestamp = Date.now();
  let idCounter = 0;
  
  const gerarIdUnico = (prefixo: string): string => {
    return `import-${prefixo}-${timestamp}-${idCounter++}`;
  };
  
  // Gastos recorrentes (TODO MÊS) - Cartão
  const gastosRecorrentes: Array<{ descricao: string; valor: number; dataInicio: string }> = [
    { descricao: 'IFOOD', valor: 5.95, dataInicio: '2025-11-01' },
    { descricao: 'NETFLIX', valor: 20.90, dataInicio: '2025-11-01' },
    { descricao: 'CLARO', valor: 59.90, dataInicio: '2025-11-01' },
    { descricao: 'BLUEFIT DAY', valor: 139.90, dataInicio: '2025-11-01' },
    { descricao: 'BLUEFIT DAY', valor: 149.90, dataInicio: '2025-11-01' },
    { descricao: 'APPLE', valor: 19.90, dataInicio: '2025-11-01' },
    { descricao: 'SPOTIFY', valor: 12.90, dataInicio: '2025-11-01' },
    { descricao: 'cursor', valor: 111.16, dataInicio: '2025-11-01' },
    { descricao: 'INTERNET', valor: 103.00, dataInicio: '2025-11-01' },
    { descricao: 'INTERNET DAY', valor: 20.00, dataInicio: '2025-11-01' },
  ];

  // Adicionar gastos recorrentes para os próximos 12 meses
  gastosRecorrentes.forEach((gasto) => {
    const prefixoId = `rec-${gasto.descricao.toLowerCase().replace(/\s+/g, '-')}`;
    const mesInicio = 11; // Novembro (mês 11)
    const anoInicio = 2025;
    
    for (let mesOffset = 0; mesOffset < 12; mesOffset++) {
      // Calcular mês e ano diretamente
      const mesTotal = mesInicio + mesOffset;
      const anoParcela = anoInicio + Math.floor((mesTotal - 1) / 12);
      const mesParcelaNum = ((mesTotal - 1) % 12) + 1;
      const mesParcela = `${anoParcela}-${String(mesParcelaNum).padStart(2, '0')}`;
      
      // Data sempre 01 do mês correspondente
      const dataInicioGasto = `${anoParcela}-${String(mesParcelaNum).padStart(2, '0')}-01`;
      
      data.gastosCartao.push({
        id: `${gerarIdUnico(prefixoId)}-${mesOffset + 1}`,
        descricao: gasto.descricao,
        valorTotal: gasto.valor,
        parcelas: 1,
        parcelaAtual: 1,
        valorParcela: gasto.valor,
        dataInicio: dataInicioGasto,
        mes: mesParcela,
        pago: mesOffset === 0, // Primeira parcela (novembro) marcada como paga
      });
    }
  });

  // PACOTE OFFICE: gasto único (não recorrente)
  data.gastosCartao.push({
    id: gerarIdUnico('pacote-office'),
    descricao: 'PACOTE OFFICE',
    valorTotal: 60.00,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 60.00,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  // Gastos parcelados - calcular parcelas restantes
  // DIO: parcela 8/12 em novembro, valor R$ 36,11
  // Se novembro (2025-11) é a parcela 8, começou em abril (2025-04)
  const mesInicioDio = 4; // Abril (parcela 1)
  for (let i = 8; i <= 12; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioDio + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioDio).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('dio')}-${i}`,
      descricao: 'DIO',
      valorTotal: 433.32, // 12 * 36.11
      parcelas: 12,
      parcelaAtual: i,
      valorParcela: 36.11,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 8, // Parcela 8 (novembro) paga
    });
  }

  // CELULAR: parcela 10/10 em novembro, valor R$ 249,90 (última parcela)
  // Se novembro (2025-11) é a parcela 10, começou em fevereiro (2025-02)
  const mesInicioCelular = 2; // Fevereiro (parcela 1)
  const i = 10;
  // Calcular mês da parcela: mesInicio + (i - 1) = 2 + 9 = 11 (novembro)
  const mesParcelaNum = mesInicioCelular + (i - 1);
  const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
  const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
  const mesParcelaCelular = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
  
  // Para novembro, usar data 01/11/2025
  data.gastosCartao.push({
    id: `${gerarIdUnico('celular')}-10`,
    descricao: 'CELULAR',
    valorTotal: 2499.00,
    parcelas: 10,
    parcelaAtual: 10,
    valorParcela: 249.90,
    dataInicio: '2025-11-01',
    mes: mesParcelaCelular,
    pago: true, // Última parcela paga
  });

  // XBOX: parcela 9/10 em novembro, valor R$ 174,27
  // Se novembro (2025-11) é a parcela 9, começou em março (2025-03)
  const mesInicioXbox = 3; // Março (parcela 1)
  for (let i = 9; i <= 10; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioXbox + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioXbox).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('xbox')}-${i}`,
      descricao: 'XBOX',
      valorTotal: 1742.70,
      parcelas: 10,
      parcelaAtual: i,
      valorParcela: 174.27,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 9, // Parcela 9 (novembro) paga
    });
  }

  // MONITOR: parcela 5/12 em novembro, valor R$ 69,00
  // Se novembro (2025-11) é a parcela 5, começou em julho (2025-07)
  // Parcela 1 = julho, Parcela 2 = agosto, Parcela 3 = setembro, Parcela 4 = outubro, Parcela 5 = novembro
  const mesInicioMonitor = 7; // Julho (parcela 1)
  for (let i = 5; i <= 12; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioMonitor + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioMonitor).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('monitor')}-${i}`,
      descricao: 'MONITOR',
      valorTotal: 828.00,
      parcelas: 12,
      parcelaAtual: i,
      valorParcela: 69.00,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 5, // Parcela 5 (novembro) paga
    });
  }

  // FACULDADE DAY: parcela 5/12 em novembro, valor R$ 303,28
  // Se novembro (2025-11) é a parcela 5, começou em julho (2025-07)
  const mesInicioFaculdade = 7; // Julho (parcela 1)
  for (let i = 5; i <= 12; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioFaculdade + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioFaculdade).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('faculdade')}-${i}`,
      descricao: 'FACULDADE DAY',
      valorTotal: 303.28 * 12, // 3639.36
      parcelas: 12,
      parcelaAtual: i,
      valorParcela: 303.28,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 5, // Parcela 5 (novembro) paga
    });
  }

  // PC: parcela 3/12 em novembro, valor R$ 320,00
  // Se novembro (2025-11) é a parcela 3, começou em setembro (2025-09)
  const mesInicioPC = 9; // Setembro (parcela 1)
  for (let i = 3; i <= 12; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioPC + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioPC).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('pc')}-${i}`,
      descricao: 'PC',
      valorTotal: 3840.00,
      parcelas: 12,
      parcelaAtual: i,
      valorParcela: 320.00,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 3, // Parcela 3 (novembro) paga
    });
  }

  // MACBOOK: parcela 2/8 em novembro, valor R$ 375,00
  // Se novembro (2025-11) é a parcela 2, começou em outubro (2025-10)
  const mesInicioMacbook = 10; // Outubro (parcela 1)
  for (let i = 2; i <= 8; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioMacbook + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioMacbook).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('macbook')}-${i}`,
      descricao: 'MACBOOK',
      valorTotal: 3000.00,
      parcelas: 8,
      parcelaAtual: i,
      valorParcela: 375.00,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 2, // Parcela 2 (novembro) paga
    });
  }

  // MERCADO 1/3: parcela 1/3 em novembro, valor R$ 34,38
  // Se novembro (2025-11) é a parcela 1, começou em novembro (2025-11)
  const mesInicioMercado = 11; // Novembro (parcela 1)
  for (let i = 1; i <= 3; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioMercado + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioMercado).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('mercado-parc')}-${i}`,
      descricao: 'MERCADO',
      valorTotal: 34.38 * 3, // 103.14
      parcelas: 3,
      parcelaAtual: i,
      valorParcela: 34.38,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 1, // Parcela 1 (novembro) paga
    });
  }

  // VIVO 1/2: parcela 1/2 em novembro, valor R$ 56,28
  // Se novembro (2025-11) é a parcela 1, começou em novembro (2025-11)
  const mesInicioVivo = 11; // Novembro (parcela 1)
  for (let i = 1; i <= 2; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioVivo + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioVivo).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('vivo')}-${i}`,
      descricao: 'VIVO',
      valorTotal: 112.56,
      parcelas: 2,
      parcelaAtual: i,
      valorParcela: 56.28,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 1, // Parcela 1 (novembro) paga
    });
  }

  // capacete 1/3: parcela 1/3 em novembro, valor R$ 33,52
  // Se novembro (2025-11) é a parcela 1, começou em novembro (2025-11)
  const mesInicioCapacete = 11; // Novembro (parcela 1)
  for (let i = 1; i <= 3; i++) {
    // Calcular mês da parcela: mesInicio + (i - 1)
    const mesParcelaNum = mesInicioCapacete + (i - 1);
    const anoParcela = anoBase + Math.floor((mesParcelaNum - 1) / 12);
    const mesParcelaFinal = ((mesParcelaNum - 1) % 12) + 1;
    const mesParcela = `${anoParcela}-${String(mesParcelaFinal).padStart(2, '0')}`;
    
    // Para a parcela de novembro, usar data 01/11/2025
    const dataInicioParcela = mesParcela === novembro2025 
      ? '2025-11-01' 
      : `${anoBase}-${String(mesInicioCapacete).padStart(2, '0')}-01`;
    
    data.gastosCartao.push({
      id: `${gerarIdUnico('capacete')}-${i}`,
      descricao: 'capacete',
      valorTotal: 33.52 * 3, // 100.56
      parcelas: 3,
      parcelaAtual: i,
      valorParcela: 33.52,
      dataInicio: dataInicioParcela,
      mes: mesParcela,
      pago: i === 1, // Parcela 1 (novembro) paga
    });
  }

  // Gastos únicos no cartão (não recorrentes, não parcelados)
  data.gastosCartao.push({
    id: gerarIdUnico('pitbull'),
    descricao: 'PITBULL',
    valorTotal: 193.33,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 193.33,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('alexa'),
    descricao: 'ALEXA',
    valorTotal: 89.04,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 89.04,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('cuecas'),
    descricao: 'CUECAS',
    valorTotal: 32.51,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 32.51,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('adaptador-fogao'),
    descricao: 'ADAPTADOR FOGÃO',
    valorTotal: 21.30,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 21.30,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('portao'),
    descricao: 'portão',
    valorTotal: 15.58,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 15.58,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('imperio-1'),
    descricao: 'imperio',
    valorTotal: 20.99,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 20.99,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('imperio-2'),
    descricao: 'imperio',
    valorTotal: 28.99,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 28.99,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('ragazzo'),
    descricao: 'ragazzo',
    valorTotal: 73.27,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 73.27,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  // Gastos únicos no cartão (que estavam como débito, mas são no cartão)
  data.gastosCartao.push({
    id: gerarIdUnico('agua'),
    descricao: 'AGUÁ',
    valorTotal: 43.83,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 43.83,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('luz'),
    descricao: 'LUZ',
    valorTotal: 191.96,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 191.96,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('gas'),
    descricao: 'GÁS',
    valorTotal: 124.99,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 124.99,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  // MERCADO (gasto único, não parcelado, diferente do MERCADO parcelado)
  data.gastosCartao.push({
    id: gerarIdUnico('mercado-unico'),
    descricao: 'MERCADO',
    valorTotal: 56.94,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 56.94,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('busao'),
    descricao: 'BUSÃO',
    valorTotal: 67.43,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 67.43,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  data.gastosCartao.push({
    id: gerarIdUnico('farmacia'),
    descricao: 'FARMÁCIA',
    valorTotal: 15.10,
    parcelas: 1,
    parcelaAtual: 1,
    valorParcela: 15.10,
    dataInicio: '2025-11-01',
    mes: novembro2025,
    pago: true,
  });

  // Calcular total de novembro/2025 para verificação
  const gastosNovembro = data.gastosCartao.filter(g => g.mes === novembro2025);
  const totalCalculado = gastosNovembro.reduce((sum, g) => sum + g.valorParcela, 0);
  const diferenca = 3331.51 - totalCalculado;
  
  console.log('📊 Verificação de importação de novembro/2025:');
  console.log('  - Total de gastos:', gastosNovembro.length);
  console.log('  - Total calculado:', totalCalculado.toFixed(2));
  console.log('  - Total esperado: 3331.51');
  console.log('  - Diferença:', diferenca.toFixed(2));
  
  // Listar todos os gastos de novembro para debug
  console.log('  - Detalhamento dos gastos:');
  gastosNovembro.forEach(g => {
    console.log(`    • ${g.descricao}: R$ ${g.valorParcela.toFixed(2)} (mes: ${g.mes}, dataInicio: ${g.dataInicio})`);
  });
  
  // Se houver diferença, adicionar como "TAXAS/OUTROS" para completar o valor total da fatura
  if (Math.abs(diferenca) > 0.01) {
    console.log('  ➕ Adicionando diferença de R$', diferenca.toFixed(2), 'como TAXAS/OUTROS');
    
    data.gastosCartao.push({
      id: gerarIdUnico('taxas-outros'),
      descricao: 'TAXAS/OUTROS',
      valorTotal: diferenca,
      parcelas: 1,
      parcelaAtual: 1,
      valorParcela: diferenca,
      dataInicio: '2025-11-01',
      mes: novembro2025,
      pago: true,
    });
    
    // Verificar total final
    const totalFinal = data.gastosCartao
      .filter(g => g.mes === novembro2025)
      .reduce((sum, g) => sum + g.valorParcela, 0);
    console.log('  ✅ Total final após adicionar TAXAS/OUTROS:', totalFinal.toFixed(2));
  } else {
    console.log('  ✅ Total está correto!');
  }

  return data;
};
