import { sessionManager } from '@/lib/session-manager';
import { loggingService } from './logging';

interface MessageData {
  messageId: string;
  userId: string;
  tenantId: string;
  botId: string;
  content: string;
  timestamp: number;
  tokens: number;
}

class AIAdminIntegration {
  private static instance: AIAdminIntegration;
  private messageQueue: MessageData[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minuto

  private constructor() {
    this.startPeriodicFlush();
  }

  public static getInstance(): AIAdminIntegration {
    if (!AIAdminIntegration.instance) {
      AIAdminIntegration.instance = new AIAdminIntegration();
    }
    return AIAdminIntegration.instance;
  }

  public async handleMessage(token: string, content: string, tokens: number) {
    const session = sessionManager.getSession(token);
    if (!session) return;

    const messageData: MessageData = {
      messageId: crypto.randomUUID(),
      userId: session.userId,
      tenantId: session.tenantId,
      botId: session.botId,
      content,
      timestamp: Date.now(),
      tokens
    };

    // Registrar consumo de tokens
    loggingService.logTokenConsumption(
      token,
      tokens,
      messageData.messageId,
      'message'
    );

    // Adicionar mensagem à fila
    this.messageQueue.push(messageData);
    await this.checkQueueSize();

    return messageData.messageId;
  }

  private async checkQueueSize() {
    if (this.messageQueue.length >= this.BATCH_SIZE) {
      await this.flushMessages();
    }
  }

  private startPeriodicFlush() {
    setInterval(() => this.flushMessages(), this.FLUSH_INTERVAL);
  }

  private async flushMessages() {
    if (this.messageQueue.length === 0) return;

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    try {
      await fetch(`${process.env.DASHBOARD_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOT_TOKEN}`
        },
        body: JSON.stringify({ messages: messagesToSend })
      });
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      // Recolocar as mensagens na fila em caso de erro
      this.messageQueue = [...messagesToSend, ...this.messageQueue];
    }
  }

  public async getUserMessages(token: string, limit = 50, offset = 0) {
    const session = sessionManager.getSession(token);
    if (!session) return [];

    try {
      const response = await fetch(
        `${process.env.DASHBOARD_URL}/api/messages?userId=${session.userId}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.BOT_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar mensagens');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }
}

export const aiAdminIntegration = AIAdminIntegration.getInstance(); 