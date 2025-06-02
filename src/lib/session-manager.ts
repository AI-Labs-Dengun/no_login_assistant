import { jwtDecode } from 'jwt-decode';

export interface SessionData {
  userId: string;
  tenantId: string;
  botId: string;
  permissions: string[];
  tokenLimit: number;
  userData: any;
  lastActivity: number;
}

interface TokenClaims {
  sub: string;
  tenant_id: string;
  bot_id: string;
  permissions: string[];
  token_limit: number;
  exp: number;
}

class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, SessionData> = new Map();
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    // Iniciar limpeza periódica de sessões
    setInterval(() => this.cleanupSessions(), 60 * 60 * 1000); // 1 hora
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async validateAndStoreSession(token: string): Promise<SessionData | null> {
    try {
      const claims = jwtDecode<TokenClaims>(token);
      
      // Verificar se o token expirou
      if (claims.exp * 1000 < Date.now()) {
        return null;
      }
      
      const sessionData: SessionData = {
        userId: claims.sub,
        tenantId: claims.tenant_id,
        botId: claims.bot_id,
        permissions: claims.permissions,
        tokenLimit: claims.token_limit,
        userData: {},
        lastActivity: Date.now()
      };

      this.sessions.set(token, sessionData);
      return sessionData;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return null;
    }
  }

  public getSession(token: string): SessionData | undefined {
    return this.sessions.get(token);
  }

  public updateSessionActivity(token: string) {
    const session = this.sessions.get(token);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  public shouldRefreshToken(token: string): boolean {
    const session = this.sessions.get(token);
    if (!session) return false;

    const timeUntilExpiry = session.lastActivity + this.TOKEN_REFRESH_THRESHOLD;
    return Date.now() >= timeUntilExpiry;
  }

  private cleanupSessions() {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now - session.lastActivity > 24 * 60 * 60 * 1000) { // 24 horas
        this.sessions.delete(token);
      }
    }
  }
}

export const sessionManager = SessionManager.getInstance(); 