import { useState } from 'react';
import { useBotUsage } from '../hooks/useBotUsage';
import { useToast } from '../hooks/useToast';
import { botUsageService } from '../services/botUsageService';

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
    updateBotUsage,
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

      // Obter consumo real de tokens da LLM
      const tokensUsed = await botUsageService.getLLMTokenUsage(
        inputMessage,
        messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      );
      
      // Registrar o uso do bot com o consumo real de tokens
      await updateBotUsage(tokensUsed);
      
      // Simular resposta do bot
      // Aqui você deve implementar a lógica real de resposta do bot
      const botResponse: Message = {
        role: 'assistant',
        content: 'Esta é uma resposta simulada do bot.'
      };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar mensagem. Tente novamente.',
        status: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isBotLoading) {
    return <div>Carregando...</div>;
  }

  if (botError) {
    return <div>Erro: {botError}</div>;
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={isProcessing || !canInteract()}
        />
        <button
          onClick={handleSendMessage}
          disabled={isProcessing || !canInteract()}
        >
          Enviar
        </button>
      </div>
      {!canInteract() && (
        <div className="access-warning">
          {getAccessStatus().reason || 'Você não tem permissão para usar este bot'}
        </div>
      )}
    </div>
  );
}; 