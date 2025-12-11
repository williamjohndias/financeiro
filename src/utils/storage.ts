import { FinancasData, Receita, GastoCartao, GastoDebito } from '../types';
import { supabase, supabaseAvailable } from '../lib/supabase';

// Fallback para LocalStorage caso Supabase não esteja disponível
const STORAGE_KEY = 'financas-data';

const saveDataLocal = (data: FinancasData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadDataLocal = (): FinancasData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsedData = JSON.parse(data);
    // Filtrar dados anteriores a novembro de 2025 automaticamente
    const mesLimite = '2025-11';
    const dadosFiltrados = {
      receitas: parsedData.receitas?.filter((r: Receita) => r.mes >= mesLimite) || [],
      gastosCartao: parsedData.gastosCartao?.filter((g: GastoCartao) => g.mes >= mesLimite) || [],
      gastosDebito: parsedData.gastosDebito?.filter((g: GastoDebito) => g.mes >= mesLimite) || [],
    };
    
    // Se houver dados antigos, salvar os dados filtrados de volta
    if (parsedData.receitas?.length !== dadosFiltrados.receitas.length || 
        parsedData.gastosCartao?.length !== dadosFiltrados.gastosCartao.length || 
        parsedData.gastosDebito?.length !== dadosFiltrados.gastosDebito.length) {
      console.warn('⚠️ Dados antigos encontrados no LocalStorage. Removendo automaticamente...');
      saveDataLocal(dadosFiltrados);
    }
    
    return dadosFiltrados;
  }
  return {
    receitas: [],
    gastosCartao: [],
    gastosDebito: [],
  };
};

// Função para verificar se o erro é de conexão
const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  const errorMessage = error.message || error.toString() || '';
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED'
  );
};

// Funções para carregar dados do Supabase
export const loadData = async (): Promise<FinancasData> => {
  // Se o Supabase não estiver disponível, usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    console.info('ℹ️ Supabase não disponível. Usando LocalStorage.');
    return loadDataLocal();
  }

  try {
    // Carregar receitas
    const { data: receitasData, error: receitasError } = await supabase!
      .from('receitas')
      .select('*')
      .order('created_at', { ascending: false });

    if (receitasError) {
      if (isConnectionError(receitasError)) {
        console.warn('⚠️ Não foi possível conectar ao Supabase. Verifique:');
        console.warn('   1. Se o projeto está ativo no Dashboard do Supabase');
        console.warn('   2. Se a URL está correta');
        console.warn('   3. Se há problemas de rede/DNS');
        console.info('ℹ️ Usando LocalStorage como fallback.');
        return loadDataLocal();
      }
      console.error('Erro ao carregar receitas:', receitasError);
      throw receitasError;
    }

    // Carregar gastos no cartão
    const { data: gastosCartaoData, error: gastosCartaoError } = await supabase!
      .from('gastos_cartao')
      .select('*')
      .order('created_at', { ascending: false });

    if (gastosCartaoError) {
      if (isConnectionError(gastosCartaoError)) {
        console.warn('⚠️ Erro de conexão ao carregar gastos no cartão.');
        return loadDataLocal();
      }
      console.error('Erro ao carregar gastos no cartão:', gastosCartaoError);
      throw gastosCartaoError;
    }

    // Carregar gastos no débito
    const { data: gastosDebitoData, error: gastosDebitoError } = await supabase!
      .from('gastos_debito')
      .select('*')
      .order('created_at', { ascending: false });

    if (gastosDebitoError) {
      if (isConnectionError(gastosDebitoError)) {
        console.warn('⚠️ Erro de conexão ao carregar gastos no débito.');
        return loadDataLocal();
      }
      console.error('Erro ao carregar gastos no débito:', gastosDebitoError);
      throw gastosDebitoError;
    }

    // Converter os dados do formato do banco para o formato da aplicação
    const receitas: Receita[] = (receitasData || []).map((r: any) => ({
      id: r.id,
      descricao: r.descricao,
      valor: parseFloat(r.valor),
      data: r.data,
      mes: r.mes,
      createdAt: r.created_at || r.createdAt,
    }));

    const gastosCartao: GastoCartao[] = (gastosCartaoData || []).map((g: any) => ({
      id: g.id,
      descricao: g.descricao,
      valorTotal: parseFloat(g.valor_total),
      parcelas: g.parcelas,
      parcelaAtual: g.parcela_atual,
      valorParcela: parseFloat(g.valor_parcela),
      dataInicio: g.data_inicio,
      mes: g.mes,
      pago: g.pago,
      valorPago: g.valor_pago ? parseFloat(g.valor_pago) : undefined,
      createdAt: g.created_at || g.createdAt,
    }));

    const gastosDebito: GastoDebito[] = (gastosDebitoData || []).map((g: any) => ({
      id: g.id,
      descricao: g.descricao,
      valor: parseFloat(g.valor),
      data: g.data,
      mes: g.mes,
      createdAt: g.created_at || g.createdAt,
    }));

    console.info('✅ Dados carregados do Supabase com sucesso!');
    
    // Filtrar dados anteriores a novembro de 2025 automaticamente
    const mesLimite = '2025-11';
    const receitasFiltradas = receitas.filter(r => r.mes >= mesLimite);
    const gastosCartaoFiltrados = gastosCartao.filter(g => g.mes >= mesLimite);
    const gastosDebitoFiltrados = gastosDebito.filter(g => g.mes >= mesLimite);
    
    // Se houver dados antigos, remover automaticamente
    if (receitas.length !== receitasFiltradas.length || 
        gastosCartao.length !== gastosCartaoFiltrados.length || 
        gastosDebito.length !== gastosDebitoFiltrados.length) {
      console.warn('⚠️ Dados antigos encontrados (antes de nov/2025). Removendo automaticamente...');
      console.log('📊 Dados removidos:', {
        receitas: receitas.length - receitasFiltradas.length,
        gastosCartao: gastosCartao.length - gastosCartaoFiltrados.length,
        gastosDebito: gastosDebito.length - gastosDebitoFiltrados.length,
      });
      
      // Remover do Supabase também
      try {
        await supabase!.from('receitas').delete().lt('mes', mesLimite);
        await supabase!.from('gastos_cartao').delete().lt('mes', mesLimite);
        await supabase!.from('gastos_debito').delete().lt('mes', mesLimite);
        console.info('✅ Dados antigos removidos do Supabase.');
      } catch (error) {
        console.warn('⚠️ Erro ao remover dados antigos do Supabase:', error);
      }
    }
    
    return {
      receitas: receitasFiltradas,
      gastosCartao: gastosCartaoFiltrados,
      gastosDebito: gastosDebitoFiltrados,
    };
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn('⚠️ Erro de conexão com o Supabase.');
      console.info('ℹ️ Verifique se o projeto está ativo no Dashboard do Supabase.');
      console.info('ℹ️ Usando LocalStorage como fallback.');
    } else {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
    }
    // Fallback para LocalStorage
    return loadDataLocal();
  }
};

// Funções para salvar dados no Supabase
export const saveData = async (data: FinancasData): Promise<void> => {
  // Sempre salvar no LocalStorage primeiro (backup)
  saveDataLocal(data);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    console.info('ℹ️ Supabase não disponível. Dados salvos apenas no LocalStorage.');
    return;
  }

  try {
    // Salvar receitas (upsert - atualiza se existir, cria se não existir)
    if (data.receitas.length > 0) {
      const receitasToSave = data.receitas.map(r => ({
        id: r.id,
        descricao: r.descricao,
        valor: r.valor,
        data: r.data,
        mes: r.mes,
        updated_at: new Date().toISOString(),
      }));

      const { error: receitasError } = await supabase!
        .from('receitas')
        .upsert(receitasToSave, { onConflict: 'id' });

      if (receitasError) throw receitasError;
    }

    // Salvar gastos no cartão
    if (data.gastosCartao.length > 0) {
      const gastosCartaoToSave = data.gastosCartao.map(g => ({
        id: g.id,
        descricao: g.descricao,
        valor_total: g.valorTotal,
        parcelas: g.parcelas,
        parcela_atual: g.parcelaAtual,
        valor_parcela: g.valorParcela,
        data_inicio: g.dataInicio,
        mes: g.mes,
        pago: g.pago,
        updated_at: new Date().toISOString(),
      }));

      const { error: gastosCartaoError } = await supabase!
        .from('gastos_cartao')
        .upsert(gastosCartaoToSave, { onConflict: 'id' });

      if (gastosCartaoError) throw gastosCartaoError;
    }

    // Salvar gastos no débito
    if (data.gastosDebito.length > 0) {
      const gastosDebitoToSave = data.gastosDebito.map(g => ({
        id: g.id,
        descricao: g.descricao,
        valor: g.valor,
        data: g.data,
        mes: g.mes,
        updated_at: new Date().toISOString(),
      }));

      const { error: gastosDebitoError } = await supabase!
        .from('gastos_debito')
        .upsert(gastosDebitoToSave, { onConflict: 'id' });

      if (gastosDebitoError) throw gastosDebitoError;
    }

    console.info('✅ Dados salvos no Supabase com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao salvar dados no Supabase:', error);
    console.info('ℹ️ Dados salvos apenas no LocalStorage.');
    // Dados já foram salvos no LocalStorage acima
  }
};

// Função para adicionar uma receita
export const addReceita = async (receita: Receita): Promise<void> => {
  // Adicionar timestamp se não existir
  const receitaComTimestamp = {
    ...receita,
    createdAt: receita.createdAt || new Date().toISOString(),
  };

  // Sempre salvar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.receitas.push(receitaComTimestamp);
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('receitas')
      .insert({
        id: receitaComTimestamp.id,
        descricao: receitaComTimestamp.descricao,
        valor: receitaComTimestamp.valor,
        data: receitaComTimestamp.data,
        mes: receitaComTimestamp.mes,
      });

    if (error) throw error;
  } catch (error: any) {
    if (isConnectionError(error)) {
      // Não logar erro de conexão repetidamente
    } else {
      console.error('❌ Erro ao adicionar receita no Supabase:', error);
    }
    // Não relançar o erro, pois já salvamos no LocalStorage
  }
};

// Função para adicionar um gasto no cartão
export const addGastoCartao = async (gasto: GastoCartao): Promise<void> => {
  // Adicionar timestamp se não existir
  const gastoComTimestamp = {
    ...gasto,
    createdAt: gasto.createdAt || new Date().toISOString(),
  };

  // Sempre salvar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosCartao.push(gastoComTimestamp);
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_cartao')
      .insert({
        id: gastoComTimestamp.id,
        descricao: gastoComTimestamp.descricao,
        valor_total: gastoComTimestamp.valorTotal,
        parcelas: gastoComTimestamp.parcelas,
        parcela_atual: gastoComTimestamp.parcelaAtual,
        valor_parcela: gastoComTimestamp.valorParcela,
        data_inicio: gastoComTimestamp.dataInicio,
        mes: gastoComTimestamp.mes,
        pago: gastoComTimestamp.pago,
      });

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao adicionar gasto no cartão no Supabase:', error);
    }
    // Não relançar o erro, pois já salvamos no LocalStorage
  }
};

// Adicionar gasto no cartão exatamente como recebido (sem gerar parcelas)
export const addGastoCartaoDireto = async (gasto: GastoCartao): Promise<void> => {
  const gastoComTimestamp = {
    ...gasto,
    createdAt: gasto.createdAt || new Date().toISOString(),
  };

  const dataLocal = loadDataLocal();
  dataLocal.gastosCartao.push(gastoComTimestamp);
  saveDataLocal(dataLocal);

  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_cartao')
      .insert({
        id: gastoComTimestamp.id,
        descricao: gastoComTimestamp.descricao,
        valor_total: gastoComTimestamp.valorTotal,
        parcelas: gastoComTimestamp.parcelas,
        parcela_atual: gastoComTimestamp.parcelaAtual,
        valor_parcela: gastoComTimestamp.valorParcela,
        data_inicio: gastoComTimestamp.dataInicio,
        mes: gastoComTimestamp.mes,
        pago: gastoComTimestamp.pago,
        // coluna valor_pago não existe no Supabase atual
        created_at: gastoComTimestamp.createdAt,
      });

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao adicionar gasto no cartão (direto) no Supabase:', error);
    }
  }
};

// Função para adicionar um gasto no débito
export const addGastoDebito = async (gasto: GastoDebito): Promise<void> => {
  // Adicionar timestamp se não existir
  const gastoComTimestamp = {
    ...gasto,
    createdAt: gasto.createdAt || new Date().toISOString(),
  };

  // Sempre salvar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosDebito.push(gastoComTimestamp);
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_debito')
      .insert({
        id: gastoComTimestamp.id,
        descricao: gastoComTimestamp.descricao,
        valor: gastoComTimestamp.valor,
        data: gastoComTimestamp.data,
        mes: gastoComTimestamp.mes,
      });

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao adicionar gasto no débito no Supabase:', error);
    }
    // Não relançar o erro, pois já salvamos no LocalStorage
  }
};

// Função para deletar uma receita
export const deleteReceita = async (id: string): Promise<void> => {
  // Sempre deletar do LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.receitas = dataLocal.receitas.filter(r => r.id !== id);
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('receitas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao deletar receita no Supabase:', error);
    }
    // Não relançar o erro, pois já deletamos do LocalStorage
  }
};

// Função para deletar um gasto no cartão
export const deleteGastoCartao = async (id: string): Promise<void> => {
  // Sempre deletar do LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosCartao = dataLocal.gastosCartao.filter(g => g.id !== id);
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_cartao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao deletar gasto no cartão no Supabase:', error);
    }
    // Não relançar o erro, pois já deletamos do LocalStorage
  }
};

// Função para deletar um gasto no débito
export const deleteGastoDebito = async (id: string): Promise<void> => {
  // Sempre deletar do LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosDebito = dataLocal.gastosDebito.filter(g => g.id !== id);
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_debito')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao deletar gasto no débito no Supabase:', error);
    }
    // Não relançar o erro, pois já deletamos do LocalStorage
  }
};

// Função para atualizar status de pagamento
export const updateGastoCartaoPago = async (id: string, pago: boolean): Promise<void> => {
  // Sempre atualizar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosCartao = dataLocal.gastosCartao.map(g => 
    g.id === id ? { ...g, pago } : g
  );
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_cartao')
      .update({ pago, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao atualizar status de pagamento no Supabase:', error);
    }
    // Não relançar o erro, pois já atualizamos no LocalStorage
  }
};

// Função para limpar dados anteriores a um mês específico
export const limparDadosAntigos = async (mesLimite: string): Promise<void> => {
  // Limpar do LocalStorage primeiro
  const dataLocal = loadDataLocal();
  
  // Filtrar apenas dados do mês limite em diante
  dataLocal.receitas = dataLocal.receitas.filter(r => r.mes >= mesLimite);
  dataLocal.gastosCartao = dataLocal.gastosCartao.filter(g => g.mes >= mesLimite);
  dataLocal.gastosDebito = dataLocal.gastosDebito.filter(g => g.mes >= mesLimite);
  
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    console.info('ℹ️ Dados antigos removidos do LocalStorage.');
    return;
  }

  try {
    // Deletar receitas antigas
    const { error: receitasError } = await supabase!
      .from('receitas')
      .delete()
      .lt('mes', mesLimite);

    if (receitasError) throw receitasError;

    // Deletar gastos no cartão antigos
    const { error: gastosCartaoError } = await supabase!
      .from('gastos_cartao')
      .delete()
      .lt('mes', mesLimite);

    if (gastosCartaoError) throw gastosCartaoError;

    // Deletar gastos no débito antigos
    const { error: gastosDebitoError } = await supabase!
      .from('gastos_debito')
      .delete()
      .lt('mes', mesLimite);

    if (gastosDebitoError) throw gastosDebitoError;

    console.info(`✅ Dados anteriores a ${mesLimite} removidos do Supabase com sucesso!`);
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao limpar dados antigos no Supabase:', error);
    }
    console.info('ℹ️ Dados antigos removidos apenas do LocalStorage.');
  }
};

// Função para limpar TODOS os dados do banco
export const limparTodosDados = async (): Promise<void> => {
  // Limpar do LocalStorage primeiro
  const dataVazio: FinancasData = {
    receitas: [],
    gastosCartao: [],
    gastosDebito: [],
  };
  saveDataLocal(dataVazio);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    console.info('ℹ️ Todos os dados removidos do LocalStorage.');
    return;
  }

  try {
    // Buscar todos os IDs primeiro e depois deletar
    // Isso garante que deletamos todos os registros, mesmo com RLS
    
    // Deletar TODAS as receitas
    const { data: receitas, error: receitasSelectError } = await supabase!
      .from('receitas')
      .select('id');
    
    if (receitasSelectError) throw receitasSelectError;
    
    if (receitas && receitas.length > 0) {
      const receitasIds = receitas.map((r: any) => r.id);
      const { error: receitasError } = await supabase!
        .from('receitas')
        .delete()
        .in('id', receitasIds);
      if (receitasError) throw receitasError;
    }

    // Deletar TODOS os gastos no cartão
    const { data: gastosCartao, error: gastosCartaoSelectError } = await supabase!
      .from('gastos_cartao')
      .select('id');
    
    if (gastosCartaoSelectError) throw gastosCartaoSelectError;
    
    if (gastosCartao && gastosCartao.length > 0) {
      const gastosCartaoIds = gastosCartao.map((g: any) => g.id);
      const { error: gastosCartaoError } = await supabase!
        .from('gastos_cartao')
        .delete()
        .in('id', gastosCartaoIds);
      if (gastosCartaoError) throw gastosCartaoError;
    }

    // Deletar TODOS os gastos no débito
    const { data: gastosDebito, error: gastosDebitoSelectError } = await supabase!
      .from('gastos_debito')
      .select('id');
    
    if (gastosDebitoSelectError) throw gastosDebitoSelectError;
    
    if (gastosDebito && gastosDebito.length > 0) {
      const gastosDebitoIds = gastosDebito.map((g: any) => g.id);
      const { error: gastosDebitoError } = await supabase!
        .from('gastos_debito')
        .delete()
        .in('id', gastosDebitoIds);
      if (gastosDebitoError) throw gastosDebitoError;
    }

    console.info('✅ Todos os dados removidos do Supabase com sucesso!');
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao limpar todos os dados no Supabase:', error);
    }
    console.info('ℹ️ Todos os dados removidos apenas do LocalStorage.');
  }
};

// Função para atualizar uma receita
export const updateReceita = async (receita: Receita): Promise<void> => {
  // Sempre atualizar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.receitas = dataLocal.receitas.map(r => 
    r.id === receita.id ? receita : r
  );
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('receitas')
      .update({
        descricao: receita.descricao,
        valor: receita.valor,
        data: receita.data,
        mes: receita.mes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', receita.id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao atualizar receita no Supabase:', error);
    }
    // Não relançar o erro, pois já atualizamos no LocalStorage
  }
};

// Função para atualizar um gasto no cartão
export const updateGastoCartao = async (gasto: GastoCartao): Promise<void> => {
  // Sempre atualizar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosCartao = dataLocal.gastosCartao.map(g => 
    g.id === gasto.id ? gasto : g
  );
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_cartao')
      .update({
        descricao: gasto.descricao,
        valor_total: gasto.valorTotal,
        parcelas: gasto.parcelas,
        parcela_atual: gasto.parcelaAtual,
        valor_parcela: gasto.valorParcela,
        data_inicio: gasto.dataInicio,
        mes: gasto.mes,
        pago: gasto.pago,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gasto.id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao atualizar gasto no cartão no Supabase:', error);
    }
    // Não relançar o erro, pois já atualizamos no LocalStorage
  }
};

// Função para atualizar um gasto no débito
export const updateGastoDebito = async (gasto: GastoDebito): Promise<void> => {
  // Sempre atualizar no LocalStorage primeiro
  const dataLocal = loadDataLocal();
  dataLocal.gastosDebito = dataLocal.gastosDebito.map(g => 
    g.id === gasto.id ? gasto : g
  );
  saveDataLocal(dataLocal);

  // Se o Supabase não estiver disponível, apenas usar LocalStorage
  if (!supabaseAvailable || !supabase) {
    return;
  }

  try {
    const { error } = await supabase!
      .from('gastos_debito')
      .update({
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: gasto.data,
        mes: gasto.mes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gasto.id);

    if (error) throw error;
  } catch (error: any) {
    if (!isConnectionError(error)) {
      console.error('❌ Erro ao atualizar gasto no débito no Supabase:', error);
    }
    // Não relançar o erro, pois já atualizamos no LocalStorage
  }
};
