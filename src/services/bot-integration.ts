import { AiAdminClient, createAiAdminClient } from 'dengun_ai-admin-client';
import { loggingService } from './logging';

interface BotConfig {
  dashboardUrl: string;
  botId: string;
  botSecret: string;
}

class BotIntegrationService {
  private static instance: BotIntegrationService;
  private connections: Map<string, AiAdminClient> = new Map();

  private constructor() {}

  public static getInstance(): BotIntegrationService {
    if (!BotIntegrationService.instance) {
      BotIntegrationService.instance = new BotIntegrationService();
    }
    return BotIntegrationService.instance;
  }

  public async reportTokenUsage(tenantId: string, userId: string, tokens: number, endpoint: string) {
    try {
      // Registrar no serviço de logging
      loggingService.logTokenConsumption(
        tenantId,
        tokens,
        crypto.randomUUID(),
        endpoint
      );

      // Registrar no dashboard
      let connection = this.connections.get(tenantId);
      if (!connection) {
        connection = createAiAdminClient({
          dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
          botId: process.env.BOT_ID || 'default-bot',
          botSecret: process.env.BOT_TOKEN || ''
        });
        await connection.initialize();
        this.connections.set(tenantId, connection);
      }

      const session = await connection.createUserSession(userId, tenantId);
      await connection.reportUsage({
        sessionId: session.sessionId,
        userId,
        tenantId,
        action: endpoint,
        tokensUsed: tokens
      });
    } catch (error) {
      console.error('Erro ao reportar uso de tokens:', error);
    }
  }

  public async getTokenUsage(tenantId: string) {
    try {
      let connection = this.connections.get(tenantId);
      if (!connection) {
        connection = createAiAdminClient({
          dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
          botId: process.env.BOT_ID || 'default-bot',
          botSecret: process.env.BOT_TOKEN || ''
        });
        await connection.initialize();
        this.connections.set(tenantId, connection);
      }

      const stats = await connection.getUsageStats({
        start: Date.now() - 30 * 24 * 60 * 60 * 1000, // últimos 30 dias
        end: Date.now()
      });
      
      return stats;
    } catch (error) {
      console.error('Erro ao obter uso de tokens:', error);
      return null;
    }
  }
}

export const botIntegration = BotIntegrationService.getInstance(); 