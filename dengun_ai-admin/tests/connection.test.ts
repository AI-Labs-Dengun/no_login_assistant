import { botConnection, getTenantConnection, tenantSync } from '../config/bot';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testConnection() {
  try {
    console.log('🧪 Iniciando teste de conexão...');
    console.log('📋 Verificando configurações...');
    
    // Verificar se o BOT_TOKEN está configurado
    if (!process.env.BOT_TOKEN) {
      console.error('❌ BOT_TOKEN não encontrado no arquivo .env');
      console.log('⚠️ Adicione a seguinte linha ao seu arquivo .env:');
      console.log('BOT_TOKEN="seu-token-jwt"');
      return;
    }

    // Verificar se o DASHBOARD_URL está configurado
    if (!process.env.DASHBOARD_URL) {
      console.error('❌ DASHBOARD_URL não encontrado no arquivo .env');
      console.log('⚠️ Adicione a seguinte linha ao seu arquivo .env:');
      console.log('DASHBOARD_URL="https://seu-dashboard.com"');
      return;
    }

    console.log('✅ Configurações básicas verificadas');
    
    // Testar sincronização de tenants
    console.log('\n🔄 Testando sincronização de tenants...');
    try {
      await tenantSync.syncTenants();
      const connections = tenantSync.getConnections();
      
      if (Object.keys(connections).length === 0) {
        console.log('⚠️ Nenhum tenant encontrado');
        console.log('ℹ️ Aguarde o Super Admin associar um tenant ao seu bot no dashboard');
        return;
      }

      console.log('✅ Tenants sincronizados:', Object.keys(connections));
      
      // Mostrar detalhes de cada tenant
      for (const [tenantId, connection] of Object.entries(connections)) {
        console.log(`\n📋 Detalhes do Tenant ${tenantId}:`);
        
        // Verificar status da solicitação
        console.log('📡 Verificando status da solicitação...');
        const requestStatus = await connection.checkRequestStatus();
        console.log('Status da solicitação:', requestStatus.status);

        if (requestStatus.status === 'approved') {
          // Verificar status da conexão
          console.log('📡 Verificando status da conexão...');
          const status = await connection.ping();
          console.log('Status da conexão:', status ? '✅ Conectado' : '❌ Desconectado');

          // Obter acesso aos bots
          console.log('📡 Obtendo acesso aos bots...');
          const botAccess = await connection.getBotAccess();
          console.log('Bots disponíveis:', botAccess);

          // Obter uso de tokens
          console.log('📡 Obtendo uso de tokens...');
          const tokenUsage = await connection.getTokenUsage();
          console.log('Uso de tokens:', tokenUsage);
        } else {
          console.log('⚠️ Bot ainda não foi aprovado para este tenant');
          console.log('ℹ️ Aguarde a aprovação do Super Admin no dashboard');
        }
      }
    } catch (error) {
      console.error('❌ Erro durante a sincronização:', error);
      console.log('\n🔍 Possíveis soluções:');
      console.log('1. Verifique se o BOT_TOKEN está correto');
      console.log('2. Verifique se o DASHBOARD_URL está correto');
      console.log('3. Verifique se o dashboard está online');
      console.log('4. Verifique se o bot foi registrado no dashboard');
    }
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
console.log('🚀 Iniciando teste de conexão do bot...');
testConnection().then(() => {
  console.log('\n✨ Teste concluído!');
});