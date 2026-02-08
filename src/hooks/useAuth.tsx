import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  increment
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { User } from '../types';

const PIPEDREAM_API_URL = 'https://eottot41sx25yyz.m.pipedream.net';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authObject, setAuthObject] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setAuthObject(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({
              id: currentUser.uid,
              email: currentUser.email || '',
              ...docSnap.data()
            } as User);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Erro ao buscar dados:", error);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // DEPÓSITO REAL VIA PIPEDREAM
  const createDeposit = async (amount: number): Promise<{ success: boolean; pixCode?: string; error?: string }> => {
    if (!user || !authObject) return { success: false, error: 'Usuário não autenticado' };
    if (amount < 30) return { success: false, error: 'Depósito mínimo é R$ 30,00' };

    try {
      // Chamar Pipedream para gerar PIX
      const response = await fetch(`${PIPEDREAM_API_URL}/deposito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          amount: amount
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com gateway');
      }

      const data = await response.json();
      
      if (!data.pix_copia_e_cola) {
        throw new Error('Código PIX não retornado');
      }

      // Salvar depósito como pending no Firestore
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'users', user.id, 'deposits'), {
        amount,
        pixCode: data.pix_copia_e_cola,
        status: 'pending',
        createdAt: serverTimestamp(),
        gatewayId: data.depositId || null
      });

      return { success: true, pixCode: data.pix_copia_e_cola };

    } catch (error: any) {
      console.error("Erro no depósito:", error);
      return { success: false, error: error.message || 'Erro ao gerar PIX' };
    }
  };

  // SAQUE REAL VIA PIPEDREAM
  const requestWithdraw = async (amount: number, pixKey: string, pixType: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    if (amount < 35) return { success: false, error: 'Saque mínimo é R$ 35,00' };
    if (user.balance < amount * 1.1) return { success: false, error: 'Saldo insuficiente (inclui taxa de 10%)' };

    // Validar horário (09h-17h BRT)
    const now = new Date();
    const brasiliaOffset = -3 * 60; // UTC-3 em minutos
    const localOffset = now.getTimezoneOffset();
    const brasiliaTime = new Date(now.getTime() + (localOffset + brasiliaOffset) * 60000);
    const hour = brasiliaTime.getHours();

    if (hour < 9 || hour >= 17) {
      return { success: false, error: 'Saques permitidos apenas das 09:00 às 17:00 (horário de Brasília)' };
    }

    try {
      // Chamar Pipedream para processar saque
      const response = await fetch(`${PIPEDREAM_API_URL}/saque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount,
          pixKey,
          pixType
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao processar saque');
      }

      // Descontar saldo (valor + taxa 10%)
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        balance: increment(-(amount * 1.1))
      });

      // Registrar saque como processing
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'users', user.id, 'withdrawals'), {
        amount,
        pixKey,
        pixType,
        status: 'processing',
        createdAt: serverTimestamp()
      });

      return { success: true };

    } catch (error: any) {
      console.error("Erro no saque:", error);
      return { success: false, error: error.message || 'Falha na solicitação de saque' };
    }
  };

  return {
    user,
    isLoading,
    logout,
    createDeposit,
    requestWithdraw
  };
}
