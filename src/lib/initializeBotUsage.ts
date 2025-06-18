import { supabase } from './supabase';
import { getWebsiteUrl } from './utils';

// Função para inicializar registro de uso do bot para o website atual
export async function initializeBotUsageForCurrentWebsite(): Promise<boolean> {
  try {
    const website = getWebsiteUrl();
    console.log('[initializeBotUsage] Iniciando para website:', website);

    // Primeiro, verificar se já existe um registro
    const { data: existingRecords, error: checkError } = await supabase
      .from('client_bot_usage')
      .select('*')
      .eq('website', website)
      .limit(1);

    if (checkError) {
      console.error('[initializeBotUsage] Erro ao verificar registros existentes:', checkError);
      return false;
    }

    if (existingRecords && existingRecords.length > 0) {
      console.log('[initializeBotUsage] Registro já existe:', existingRecords[0]);
      // Se existe mas não está habilitado, habilitar
      if (!existingRecords[0].enabled) {
        const { error: updateError } = await supabase
          .from('client_bot_usage')
          .update({ enabled: true, updated_at: new Date().toISOString() })
          .eq('id', existingRecords[0].id);
        
        if (updateError) {
          console.error('[initializeBotUsage] Erro ao habilitar registro:', updateError);
          return false;
        }
        console.log('[initializeBotUsage] Registro habilitado com sucesso');
      }
      return true;
    }

    // Se não existe, criar um novo registro usando a função do banco
    console.log('[initializeBotUsage] Criando novo registro...');
    const { data: createData, error: createError } = await supabase.rpc('register_public_bot_usage', {
      p_website: website,
      p_bot_id: '00000000-0000-0000-0000-000000000000', // ID padrão
      p_tokens_used: 0,
      p_action_type: 'chat'
    });

    if (createError) {
      console.error('[initializeBotUsage] Erro ao criar registro:', createError);
      
      // Como fallback, tentar inserção direta
      const { error: insertError } = await supabase
        .from('client_bot_usage')
        .insert({
          website: website,
          bot_name: 'Default Bot',
          enabled: true,
          tokens_used: 0,
          interactions: 0,
          available_interactions: 1000000,
          total_tokens: 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[initializeBotUsage] Erro ao inserir registro diretamente:', insertError);
        return false;
      }
      
      console.log('[initializeBotUsage] Registro criado diretamente com sucesso');
      return true;
    }

    console.log('[initializeBotUsage] Registro criado via RPC com sucesso:', createData);
    return true;
  } catch (error) {
    console.error('[initializeBotUsage] Erro geral:', error);
    return false;
  }
} 