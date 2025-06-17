import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToast = () => {
  const toast = useCallback(({ title, description, status, duration = 5000 }: ToastOptions) => {
    // Aqui você deve implementar a lógica real de toast
    // Por exemplo, usando react-toastify ou outro sistema de notificação
    console.log(`[${status.toUpperCase()}] ${title}: ${description}`);
    
    // Exemplo de implementação com react-toastify:
    // toast({
    //   title,
    //   description,
    //   status,
    //   duration,
    //   isClosable: true,
    // });
  }, []);

  return { toast };
}; 