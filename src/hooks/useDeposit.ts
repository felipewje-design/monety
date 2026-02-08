import { useState } from 'react';
import { useAuth } from './useAuth';

export function useDeposit() {
  const { user, createDeposit } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const initiateDeposit = async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    setLoading(true);
    setPixCode(null);

    try {
      const result = await createDeposit(amount);
      
      if (result.success && result.pixCode) {
        setPixCode(result.pixCode);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Erro ao iniciar depósito:', error);
      return { success: false, error: error.message || 'Erro desconhecido' };
    } finally {
      setLoading(false);
    }
  };

  const resetDeposit = () => {
    setPixCode(null);
  };

  return {
    loading,
    pixCode,
    initiateDeposit,
    resetDeposit
  };
}
