import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import CheckIn from '../components/CheckIn';
import Roulette from '../components/Roulette';
import { TrendingUp, Users, Wallet, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ todayEarnings: 0, newInvites: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Tenta buscar stats, mas se não tiver token, apenas para o loading
    if (token) {
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setStats(data);
      } else {
        console.warn("API de stats não retornou JSON válido, usando zeros.");
      }
    } catch (err) {
      console.error('Erro ao buscar stats (usando padrão):', err);
    } finally {
      // Garante que o loading pare para exibir a tela
      setLoadingStats(false);
    }
  };

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserName = () => {
    return user?.email ? user.email.split('@')[0] : 'Investidor';
  };

  // Se estiver carregando E não tiver dados do usuário ainda, mostra loader.
  // Se tiver usuário, mostra a tela mesmo carregando stats em segundo plano.
  if (loadingStats && !user) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 px-4 pt-4 min-h-screen bg-black/90">
      {/* Header do Usuário */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Bem-vindo de volta</p>
          <h1 className="text-xl font-bold text-white">
            {getUserName()}
          </h1>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center shadow-lg shadow-[#22c55e]/30">
          <span className="text-xl font-bold text-white">{getUserInitial()}</span>
        </div>
      </div>

      {/* Grid de Ganhos e Convites */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card Ganhos Hoje */}
        <Card className="bg-[#111111] border-[#1a1a1a]">
          <CardContent className="pt-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              </div>
              <span className="text-gray-400 text-xs">Ganhos Hoje</span>
            </div>
            <p className="text-xl font-bold text-[#22c55e]">
              R$ {Number(stats?.todayEarnings || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Card Convidados */}
        <Card className="bg-[#111111] border-[#1a1a1a]">
          <CardContent className="pt-4 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-[#22c55e]" />
              </div>
              <span className="text-gray-400 text-xs">Convidados</span>
            </div>
            <p className="text-xl font-bold text-white">{stats?.newInvites || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Card Saldo Principal */}
      <Card className="bg-[#111111] border-[#22c55e]/30">
        <CardContent className="pt-5 pb-5 px-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-[#22c55e]" />
            <span className="text-gray-400 text-sm">Saldo Disponível</span>
          </div>
          <p className="text-3xl font-extrabold text-white mb-3">
            R$ {Number(user?.balance || 0).toFixed(2)}
          </p>
          <div className="pt-3 border-t border-[#1a1a1a]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Ganhos</span>
              <span className="text-[#22c55e] font-semibold">
                R$ {Number(user?.totalEarned || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Diário */}
      <Card className="bg-[#111111] border-[#1a1a1a]">
        <CardContent className="pt-6">
          <h3 className="text-white font-bold mb-4">Login Diário</h3>
          <CheckIn onCheckInComplete={fetchStats} />
        </CardContent>
      </Card>

      {/* Roleta */}
      <div className="pb-4">
        <Roulette onSpinComplete={fetchStats} />
      </div>
    </div>
  );
}
