import { useState } from 'react';
import { useBotUsage } from '../hooks/useBotUsage';
import { useToast } from '../hooks/useToast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const {
    botInfo,
    isLoading: isBotLoading,
    error: botError,
    updateUsage,
    canInteract,
    getRemainingInteractions,
    getAccessStatus
  } = useBotUsage();

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const accessStatus = getAccessStatus();
    if (!accessStatus.hasAccess || !accessStatus.isActive || !accessStatus.hasInteractions) {
      toast({
        title: 'Acesso Restrito',
        description: accessStatus.reason || 'Você não tem permissão para usar este bot',
        status: 'warning',
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Adicionar mensagem do usuário
      const userMessage: Message = {
        role: 'user',
        content: inputMessage
      };
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');

      // Simular processamento da mensagem e obter tokens usados
      // Aqui você deve implementar a lógica real de processamento da mensagem
      const tokensUsed = await processMessage(inputMessage);
      
      // Atualizar uso do bot
      const success = await updateUsage(tokensUsed, 1);
      
      if (!success) {
        throw new Error('Falha ao atualizar uso do bot');
      }

      // Simular resposta do bot
      // Aqui você deve implementar a lógica real de resposta do bot
      const botResponse: Message = {
        role: 'assistant',
        content: 'Esta é uma resposta simulada do bot.'
      };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar mensagem',
        status: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Função simulada para processar mensagem e retornar tokens usados
  const processMessage = async (message: string): Promise<number> => {
    // Aqui você deve implementar a lógica real de processamento
    // Por enquanto, retornamos um valor simulado
    return message.length;
  };

  if (isBotLoading) {
    return <div>Carregando...</div>;
  }

  if (botError) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-600">Erro</h2>
        <p className="text-gray-600">{botError}</p>
      </div>
    );
  }

  const accessStatus = getAccessStatus();
  if (!accessStatus.hasAccess) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-600">Acesso Restrito</h2>
        <p className="text-gray-600">{accessStatus.reason}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho com informações do bot */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{botInfo?.bot_name}</h2>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            Interações restantes: {getRemainingInteractions()}
          </p>
          <span className={`px-2 py-1 rounded text-sm ${
            accessStatus.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {accessStatus.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Área de input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 p-2 border rounded"
            disabled={isProcessing || !accessStatus.hasInteractions}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !accessStatus.hasInteractions}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isProcessing ? 'Processando...' : 'Enviar'}
          </button>
        </div>
        {!accessStatus.hasInteractions && (
          <p className="mt-2 text-sm text-red-600">
            {accessStatus.reason}
          </p>
        )}
      </div>
    </div>
  );
}; 