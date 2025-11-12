import { createClient } from '@supabase/supabase-js';

// Nova API Key do Supabase (Publishable Key - segura para usar no browser)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmkrknkzgtppyylztida.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_2DG1pydZMpDfcUOZZ_48kg_ycYSEWOr';

// Verificar se a URL está completa e válida
let supabase: ReturnType<typeof createClient> | null = null;
let supabaseAvailable = false;

try {
  if (supabaseUrl && supabasePublishableKey && supabaseUrl.startsWith('https://')) {
    console.info('🔗 URL do Supabase:', supabaseUrl);
    console.info('🔑 Chave API configurada:', supabasePublishableKey.substring(0, 20) + '...');
    
    supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
      },
    });
    
    console.info('🔄 Supabase configurado. Tentando conectar...');
    supabaseAvailable = true;
  } else {
    console.warn('⚠️ Configuração do Supabase inválida. Usando LocalStorage apenas.');
    supabaseAvailable = false;
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Supabase:', error);
  console.warn('⚠️ Usando LocalStorage apenas.');
  supabaseAvailable = false;
}

export { supabase, supabaseAvailable };

