import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Verifique se o caminho está correto no seu projeto
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  TrendingUp, History, X, Timer, Pickaxe, Gem, Crown, 
  Sparkles, Star, Award, Clock, Loader2, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---
interface Product {
  id: string;
  name: string;
  price: number;
  daily_return: number;
  duration_days: number;
  tier: string;
  icon: string;
}

interface Investment {
  id: string;
  product_name: string;
  amount: number;
  daily_return: number;
  days_remaining: number;
  created_at: string;
}

// --- CONFIGURAÇÃO DE CORES E ÍCONES ---
const tierColors: Record<string, { bg: string; border: string; icon: string }> = {
  bronze: { bg: 'from-amber-900/20 to-amber-800/20', border: 'border-amber-700/30', icon: 'text-amber-500' },
  silver: { bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/30', icon: 'text-gray-400' },
  gold: { bg: 'from-yellow-600/20 to-yellow-700/20', border: 'border-yellow-600/30', icon: 'text-yellow-500' },
  platinum: { bg: 'from-cyan-600/20 to-cyan-700/20', border: 'border-cyan-600/30', icon: 'text-cyan-400' },
  diamond: { bg: 'from-blue-600/20 to-blue-700/20', border: 'border-blue-600/30', icon: 'text-blue-400' },
  emerald: { bg: 'from-emerald-600/20 to-emerald-700/20', border: 'border-emerald-600/30', icon: 'text-emerald-400' },
  elite: { bg: 'from-[#22c55e]/20 to-[#16a34a]/20', border: 'border-[#22c55e]/30', icon: 'text-[#22c55e]' },
};

const getIcon = (iconName: string, className: string) => {
  const icons: Record<string, JSX.Element> = {
    pickaxe: <Pickaxe className={className} />,
    gem: <Gem className={className} />,
    crown: <Crown className={className} />,
    sparkles: <Sparkles className={className} />,
    star: <Star className={className} />,
    award: <Award className={className} />,
  };
  return icons[iconName] || <Pickaxe className={className} />;
};

// --- PRODUTOS DE EMERGÊNCIA (Caso o Firebase esteja vazio) ---
const FALLBACK_PRODUCTS: Product[] = [
  { id: 'f1', name: 'Minerador Starter', price: 50, daily_return: 5, duration_days: 30, tier: 'bronze', icon: 'pickaxe' },
  { id: 'f2', name: 'Minerador Advanced', price: 100, daily_return: 12, duration_days: 30, tier: 'silver', icon: 'gem' },
  { id: 'f3', name: 'Minerador Master', price: 250, daily_return: 35, duration_days: 30, tier: 'gold', icon: 'sparkles' }
];

export default function ProductsPage() {
  const { user, token, refreshUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resProd, resInv] = await Promise.all([
        fetch('/api/products'),
        token ? fetch('/api/investments', { headers: { 'Authorization': `Bearer ${token}` } }) : Promise.resolve(null)
      ]);

      if (resProd && resProd.ok) {
        const data = await resProd.json();
        // Se a API vier vazia, usamos o fallback
        setProducts(data.length > 0 ? data : FALLBACK_PRODUCTS);
      } else {
        setProducts(FALLBACK_PRODUCTS);
        setError(true);
      }

      if (resInv && resInv.ok) {
        const data = await resInv.json();
        setInvestments(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setProducts(FALLBACK_PRODUCTS);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (productId: string, price: number) => {
    if (!user || Number(user.balance) < price) {
      toast.error("Saldo insuficiente", { description: "Faça um depósito para continuar." });
      return;
    }

    try {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        toast.success("Máquina Ativada!", { description: "O seu rendimento diário começou." });
        refreshUser();
        loadData();
      } else {
        const errData = await response.json();
        toast.error(errData.error || "Erro na compra");
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
        <Loader2 className="w-10 h-10 text-[#22c55e] animate-spin mb-4" />
        <p className="text-gray-400">A carregar máquinas de mineração...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 px-4 pt-4 min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">MÁQUINAS</h1>
          <p className="text-gray-400 text-xs">Escolha o seu poder de mineração</p>
        </div>
        <Button
          onClick={() => setShowHistory(true)}
          className="bg-[#111111] border border-white/10 text-white hover:bg-white/5"
        >
          <History className="w-4 h-4 mr-2" />
          Histórico
        </Button>
      </div>

      {/* Alerta de erro de base de dados */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3 text-amber-500 text-xs">
          <AlertCircle size={18} />
          <span>A mostrar produtos de demonstração. Verifique a sua ligação ou permissões do Firebase.</span>
        </div>
      )}

      {/* Saldo Rápido */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center">
            <TrendingUp className="text-[#22c55e] w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold">O seu saldo</p>
            <p className="text-white font-bold text-lg">R$ {Number(user?.balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid gap-4">
        {products.map((product) => {
          const colors = tierColors[product.tier] || tierColors.bronze;
          const canAfford = Number(user?.balance || 0) >= product.price;

          return (
            <div
              key={product.id}
              className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-3xl overflow-hidden relative`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5">
                      {getIcon(product.icon, `w-7 h-7 ${colors.icon}`)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{product.name}</h3>
                      <div className="flex items-center gap-1 text-[#22c55e]">
                        <span className="text-sm font-bold">R$</span>
                        <span className="text-2xl font-black">{Number(product.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Lucro Diário</p>
                    <p className="text-[#22c55e] font-bold text-sm">+ R$ {Number(product.daily_return).toFixed(2)}</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ciclo Total</p>
                    <p className="text-white font-bold text-sm">{product.duration_days} Dias</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleBuy(product.id, product.price)}
                  className={`w-full py-7 rounded-2xl font-black text-sm transition-all ${
                    canAfford 
                    ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-lg shadow-[#22c55e]/20' 
                    : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {canAfford ? 'ATIVAR AGORA' : 'SALDO INSUFICIENTE'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Histórico */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Minhas Máquinas</span>
              <X className="w-5 h-5 text-gray-500" onClick={() => setShowHistory(false)} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {investments.length > 0 ? (
              investments.map((inv) => (
                <div key={inv.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-white">{inv.product_name}</h4>
                    <span className="text-[#22c55e] font-bold text-xs">+R$ {inv.daily_return}/dia</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>Expira em {inv.days_remaining} dias</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Pickaxe className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma máquina ativa no momento.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
