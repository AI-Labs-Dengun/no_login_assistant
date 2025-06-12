import { loggingService } from './logging';

interface BotConfig {
  dashboardUrl: string;
  botId: string;
  botSecret: string;
}

class BotIntegrationService {
  private static instance: BotIntegrationService;

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
    } catch (error) {
      console.error('Erro ao reportar uso de tokens:', error);
    }
  }

  public async getTokenUsage(tenantId: string) {
    try {
      // Retornar null já que não temos mais integração com o dashboard
      return null;
    } catch (error) {
      console.error('Erro ao obter uso de tokens:', error);
      return null;
    }
  }
}

export const botIntegration = BotIntegrationService.getInstance(); 