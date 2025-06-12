interface UsageData {
  tokens: number;
  requests: number;
  duration: number;
  userId: string;
  tenantId: string;
  botId: string;
}

async function reportUsage(data: {
  tokens: number;
  requests: number;
  duration: number;
  metadata: {
    userId: string;
    tenantId: string;
    botId: string;
  };
}) {
  const response = await fetch(`${process.env.DASHBOARD_URL}/api/usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BOT_TOKEN}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Erro ao reportar uso: ${response.statusText}`);
  }

  return response.json();
}

export async function reportBotUsage(usage: UsageData) {
  try {
    await reportUsage({
      tokens: usage.tokens,
      requests: usage.requests,
      duration: usage.duration,
      metadata: {
        userId: usage.userId,
        tenantId: usage.tenantId,
        botId: usage.botId
      }
    });
  } catch (error) {
    console.error('Erro ao reportar uso:', error);
    // Implementar retry logic ou queue se necessário
  }
}

// Função para reportar uso em lote
export async function reportBatchUsage(usages: UsageData[]) {
  try {
    await Promise.all(usages.map(usage => reportBotUsage(usage)));
  } catch (error) {
    console.error('Erro ao reportar uso em lote:', error);
  }
} 