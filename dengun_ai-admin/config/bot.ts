import { createBotConnection } from 'dengun_ai-admin-client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuração base do bot
const botConfig = {
  baseUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
  botName: process.env.BOT_NAME,
  botDescription: process.env.BOT_DESCRIPTION,
  botCapabilities: process.env.BOT_CAPABILITIES?.split(',') || [],
  contactEmail: process.env.BOT_CONTACT_EMAIL,
  website: process.env.BOT_WEBSITE,
  maxTokensPerRequest: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '1000')
};

// Classe para gerenciar a sincronização dos tenants
class TenantSyncManager {
  private static instance: TenantSyncManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private tenantConnections: { [key: string]: any } = {};
  private lastSync: { [key: string]: number } = {};

  private constructor() {
    this.startSync();
  }

  public static getInstance(): TenantSyncManager {
    if (!TenantSyncManager.instance) {
      TenantSyncManager.instance = new TenantSyncManager();
    }
    return TenantSyncManager.instance;
  }

  public async syncTenants() {
    try {
      // Se não tiver BOT_TOKEN, tenta registrar o bot primeiro
      if (!process.env.BOT_TOKEN) {
        console.log('🔄 Registrando bot no dashboard...');
        try {
          const registerResponse = await fetch(botConfig.baseUrl + '/api/bots', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: botConfig.botName,
              description: botConfig.botDescription,
              capabilities: botConfig.botCapabilities,
              contactEmail: botConfig.contactEmail,
              website: botConfig.website
            })
          });

          if (!registerResponse.ok) {
            const errorData = await registerResponse.json();
            throw new Error('Falha ao registrar bot: ' + (errorData.message || 'Erro desconhecido'));
          }

          const { token } = await registerResponse.json();
          
          // Atualizar .env com o novo token
          const envPath = path.join(__dirname, '..', '.env');
          let envContent = fs.readFileSync(envPath, 'utf-8');
          
          if (envContent.includes('BOT_TOKEN=')) {
            envContent = envContent.replace(/BOT_TOKEN=.*/, 'BOT_TOKEN="' + token + '"');
          } else {
            envContent = envContent + '\nBOT_TOKEN="' + token + '"';
          }
          
          fs.writeFileSync(envPath, envContent);
          process.env.BOT_TOKEN = token;
          
          console.log('✅ Bot registrado com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao registrar bot:', error);
          console.log('
🔍 Verifique se:');
          console.log('1. O dashboard está rodando em ' + botConfig.baseUrl);
          console.log('2. A rota /api/bots está implementada no dashboard');
          console.log('3. O formato dos dados enviados está correto');
          throw error;
        }
      }

      // Buscar lista atualizada de tenants do dashboard
      try {
        const response = await fetch(botConfig.baseUrl + '/api/bots/tenants', {
          headers: {
            'Authorization': 'Bearer ' + process.env.BOT_TOKEN
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error('Falha ao buscar tenants: ' + (errorData.message || 'Erro desconhecido'));
        }

        const tenants = await response.json();
        
        if (!Array.isArray(tenants)) {
          throw new Error('Resposta inválida do servidor: lista de tenants não encontrada');
        }

        // Atualizar conexões
        for (const tenant of tenants) {
          const tenantId = tenant.id;
          
          // Verificar se o tenant já existe e se precisa ser atualizado
          if (!this.tenantConnections[tenantId] || 
              this.lastSync[tenantId] < tenant.updatedAt) {
            
            // Criar ou atualizar conexão
            this.tenantConnections[tenantId] = createBotConnection({
              ...botConfig,
              token: tenant.token,
              userId: tenant.userId,
              tenantId: tenant.id
            });

            this.lastSync[tenantId] = Date.now();
            
            // Atualizar arquivo .env com as novas informações
            this.updateEnvFile(tenant);
          }
        }

        // Remover tenants que não existem mais
        for (const tenantId of Object.keys(this.tenantConnections)) {
          if (!tenants.find((t: any) => t.id === tenantId)) {
            delete this.tenantConnections[tenantId];
            delete this.lastSync[tenantId];
            this.removeTenantFromEnv(tenantId);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar tenants:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro na sincronização dos tenants:', error);
      throw error;
    }
  }

  private updateEnvFile(tenant: any) {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Atualizar ou adicionar variáveis do tenant
    const tenantVars = [
      'TENANT_' + tenant.id + '_TOKEN="' + tenant.token + '"',
      'TENANT_' + tenant.id + '_USER_ID="' + tenant.userId + '"',
      'TENANT_' + tenant.id + '_MAX_TOKENS=' + tenant.maxTokens,
      'TENANT_' + tenant.id + '_MAX_REQUESTS=' + tenant.maxRequests
    ];

    for (const var_ of tenantVars) {
      const [key] = var_.split('=');
      const regex = new RegExp('^' + key + '.*$', 'm');
      
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, var_);
      } else {
        envContent = envContent + '
' + var_;
      }
    }

    fs.writeFileSync(envPath, envContent);
  }

  private removeTenantFromEnv(tenantId: string) {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Remover todas as variáveis do tenant
    const regex = new RegExp('^TENANT_' + tenantId + '_.*$', 'gm');
    envContent = envContent.replace(regex, '').replace(/

+/g, '
');

    fs.writeFileSync(envPath, envContent);
  }

  public startSync(interval = 5 * 60 * 1000) { // 5 minutos por padrão
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sincronização inicial
    this.syncTenants();
    
    // Configurar sincronização periódica
    this.syncInterval = setInterval(() => this.syncTenants(), interval);
  }

  public stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  public getConnections() {
    return this.tenantConnections;
  }

  public getConnection(tenantId: string) {
    return this.tenantConnections[tenantId];
  }
}

// Exportar instância do gerenciador de sincronização
export const tenantSync = TenantSyncManager.getInstance();

// Exportar conexões para compatibilidade com código existente
export const botConnection = tenantSync.getConnections();
export const getTenantConnection = (tenantId: string) => tenantSync.getConnection(tenantId);