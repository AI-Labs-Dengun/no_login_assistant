import { sessionManager } from '@/lib/session-manager';

interface LogEntry {
  timestamp: number;
  userId: string;
  tenantId: string;
  botId: string;
  action: 'token_consumption' | 'user_access';
  details: {
    tokens?: number;
    requestId?: string;
    endpoint?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

class LoggingService {
  private static instance: LoggingService;
  private logQueue: LogEntry[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minuto

  private constructor() {
    this.startPeriodicFlush();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public logTokenConsumption(token: string, tokens: number, requestId: string, endpoint: string) {
    const session = sessionManager.getSession(token);
    if (!session) return;

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      userId: session.userId,
      tenantId: session.tenantId,
      botId: session.botId,
      action: 'token_consumption',
      details: {
        tokens,
        requestId,
        endpoint
      }
    };

    this.logQueue.push(logEntry);
    this.checkQueueSize();
  }

  public logUserAccess(token: string, userAgent: string, ipAddress: string) {
    const session = sessionManager.getSession(token);
    if (!session) return;

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      userId: session.userId,
      tenantId: session.tenantId,
      botId: session.botId,
      action: 'user_access',
      details: {
        userAgent,
        ipAddress
      }
    };

    this.logQueue.push(logEntry);
    this.checkQueueSize();
  }

  private async checkQueueSize() {
    if (this.logQueue.length >= this.BATCH_SIZE) {
      await this.flushLogs();
    }
  }

  private startPeriodicFlush() {
    setInterval(() => this.flushLogs(), this.FLUSH_INTERVAL);
  }

  private async flushLogs() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch(`${process.env.DASHBOARD_URL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOT_TOKEN}`
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      console.error('Erro ao enviar logs:', error);
      // Recolocar os logs na fila em caso de erro
      this.logQueue = [...logsToSend, ...this.logQueue];
    }
  }
}

export const loggingService = LoggingService.getInstance(); 