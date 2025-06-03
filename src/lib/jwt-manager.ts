import { jwtVerify } from 'jose';

export class JWTManager {
  private static instance: JWTManager;
  private publicKey: Uint8Array;

  private constructor() {
    // A chave pública será fornecida pelo dashboard
    this.publicKey = new TextEncoder().encode(
      process.env.JWT_PUBLIC_KEY || ''
    );
  }

  public static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager();
    }
    return JWTManager.instance;
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, this.publicKey);
      return payload;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }
} 