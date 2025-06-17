import { useState, useEffect } from 'react';

interface User {
  id: string;
  email?: string;
  name?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aqui você pode implementar a lógica para verificar se o usuário está autenticado
    // Por exemplo, verificar um token no localStorage ou fazer uma chamada à API
    const checkAuth = async () => {
      try {
        // Implemente sua lógica de autenticação aqui
        // Por enquanto, vamos apenas simular um usuário
        setUser({
          id: '1',
          email: 'usuario@exemplo.com',
          name: 'Usuário Exemplo'
        });
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  };
}; 