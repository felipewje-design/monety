import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import CheckIn from '../components/CheckIn';
import Roulette from '../components/Roulette';
import { TrendingUp, Users, Wallet, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ todayEarnings: 0, newInvites: 0 });
  const [error, setError] = useState(false);

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 403) {
        setError(true); // Erro de permissão do Firebase
      }
    } catch (err) {
      console.error('Erro ao buscar stats:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs">Bem-vindo</p>
          <h1 className="text-xl font-bold">{user?.email?.split('@')[0] || 'Investidor'}</h1>
        </div>
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold">
          {user?.email?.[0].toUpperCase() || 'U'}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle size={16} />
          Erro de permissão no Banco de Dados. Verifique as Regras do Firebase.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-[#111111] border-none">
          <CardContent className="p-4">
            <TrendingUp size={16} className="text-green-500 mb-1" />
            <p className="text-xs text-gray-400">Ganhos Hoje</p>
            <p className="text-lg font-bold text-green-500">R$ {Number(stats.todayEarnings || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-none">
          <CardContent className="p-4">
            <Users size={16} className="text-green-500 mb-1" />
            <p className="text-xs text-gray-400">Convidados</p>
            <p className="text-lg font-bold">{stats.newInvites || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-green-600/20 to-green-900/20 border border-green-500/30 p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-gray-400 mb-1 text-sm">
          <Wallet size={16} /> Saldo Total
        </div>
        <h2 className="text-3xl font-black text-white">R$ {Number(user?.balance || 0).toFixed(2)}</h2>
      </div>

      <CheckIn onCheckInComplete={fetchStats} />
      <Roulette onSpinComplete={fetchStats} />
    </div>
  );
}
