import { botConnection, getTenantConnection } from '../config/bot';

async function main() {
  try {
    // Exemplo de uso com múltiplos tenants
    for (const [tenantId, connection] of Object.entries(botConnection)) {
      console.log(`\nVerificando conexão para o tenant ${tenantId}...`);

      // Verificar status da solicitação
      const requestStatus = await connection.checkRequestStatus();
      console.log('Status da solicitação:', requestStatus);

      // Se aprovado, você pode usar os outros métodos
      if (requestStatus.status === 'approved') {
        // Verificar status da conexão
        const status = await connection.ping();
        console.log('Status da conexão:', status);

        // Obter acesso aos bots
        const botAccess = await connection.getBotAccess();
        console.log('Bots disponíveis:', botAccess);

        // Obter uso de tokens
        const tokenUsage = await connection.getTokenUsage();
        console.log('Uso de tokens:', tokenUsage);
      }
    }

    // Exemplo de uso com um tenant específico
    const specificTenantId = 'seu-tenant-id';
    const specificConnection = getTenantConnection(specificTenantId);
    if (specificConnection) {
      console.log(`\nUsando conexão específica para o tenant ${specificTenantId}...`);
      const status = await specificConnection.ping();
      console.log('Status da conexão:', status);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

main();
