import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/auth-context';
import { useTheme } from '@/app/components/theme-provider';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card } from '@/app/components/ui/card';
import { LogOut, Sun, Moon, TrendingUp, TrendingDown, Heart, Calculator, Plus, Trash2, Coins, Activity, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { BudgetCalculator } from '@/app/components/budget-calculator';
import { ProfilePage } from '@/app/components/profile-page';

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
};

type Balance = {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
};

type GoldPrice = {
  buy: number;
  sell: number;
  change: number;
  history: { value: number; time: number }[];
};

type StockIndex = {
  value: number;
  change: number;
  changePercent: number;
  history: { value: number; time: number }[];
};

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [balance, setBalance] = useState<Balance>({ balance: 0, totalIncome: 0, totalExpenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const [goldPrice, setGoldPrice] = useState<GoldPrice>({ 
    buy: 1456000, 
    sell: 1441000, 
    change: 1.2,
    history: Array.from({ length: 30 }, (_, i) => ({ 
      value: 1441000 + (Math.sin(i * 0.3) * 15000) + (Math.random() * 5000), 
      time: Date.now() - (30 - i) * 60000 
    }))
  });
  const [stockIndex, setStockIndex] = useState<StockIndex>({ 
    value: 7125.32, 
    change: 38.14, 
    changePercent: 0.54,
    history: Array.from({ length: 30 }, (_, i) => ({ 
      value: 7100 + (Math.sin(i * 0.4) * 40) + (Math.random() * 20), 
      time: Date.now() - (30 - i) * 60000 
    }))
  });
  
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchTransactions();
      fetchMarketData();
      
      const interval = setInterval(fetchMarketData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const fetchMarketData = () => {
    const now = Date.now();
    
    setGoldPrice(prev => {
      const fluctuation = (Math.random() - 0.5) * 8000;
      const newBuy = Math.round(prev.buy + fluctuation);
      const newSell = Math.round(newBuy - 15000);
      const newHistory = [...prev.history.slice(1), { value: newBuy, time: now }];
      const changePercent = ((newBuy - prev.history[0].value) / prev.history[0].value) * 100;
      
      return {
        buy: newBuy,
        sell: newSell,
        change: parseFloat(changePercent.toFixed(2)),
        history: newHistory,
      };
    });
    
    setStockIndex(prev => {
      const fluctuation = (Math.random() - 0.5) * 60;
      const newValue = parseFloat((prev.value + fluctuation).toFixed(2));
      const newHistory = [...prev.history.slice(1), { value: newValue, time: now }];
      const change = newValue - prev.history[0].value;
      const changePercent = (change / prev.history[0].value) * 100;
      
      return {
        value: newValue,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        history: newHistory,
      };
    });
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4053ac61/balance/${user?.id}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4053ac61/transactions/${user?.id}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4053ac61/transaction/${user?.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            type,
            amount: parseFloat(amount),
            description,
            category,
            date: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        setAmount('');
        setDescription('');
        setCategory('');
        await fetchBalance();
        await fetchTransactions();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
    setLoading(false);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4053ac61/transaction/${transactionId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        await fetchBalance();
        await fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      Pemasukan: t.type === 'income' ? t.amount : 0,
      Pengeluaran: t.type === 'expense' ? t.amount : 0,
    }));

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-rose-100 dark:from-gray-950 dark:via-pink-950 dark:to-black relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-pink-300/30 to-rose-300/30 dark:from-pink-600/20 dark:to-rose-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 -right-20 w-96 h-96 bg-gradient-to-br from-rose-300/30 to-pink-300/30 dark:from-rose-600/20 dark:to-pink-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-rose-200/30 dark:from-pink-700/20 dark:to-rose-700/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header - Modern Floating Style */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-4 z-40 mx-4 sm:mx-6 lg:mx-8 mt-4"
      >
        <div className="max-w-7xl mx-auto backdrop-blur-2xl bg-white/40 dark:bg-black/40 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl shadow-2xl shadow-pink-200/20 dark:shadow-pink-900/20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfile(true)}
                  className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 rounded-2xl text-2xl sm:text-3xl shadow-xl shadow-pink-300/50 dark:shadow-pink-700/50 hover:shadow-2xl transition-all"
                >
                  {user?.emoji}
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>
                
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 dark:from-pink-400 dark:via-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
                    LovePocket
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                    Same Love, Different Wallets
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCalculator(!showCalculator)}
                    className="bg-gradient-to-br from-pink-100/80 to-rose-100/80 dark:from-pink-900/40 dark:to-rose-900/40 hover:from-pink-200/90 hover:to-rose-200/90 dark:hover:from-pink-900/60 dark:hover:to-rose-900/60 text-pink-700 dark:text-pink-300 border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg"
                  >
                    <Calculator className="w-5 h-5" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="bg-gradient-to-br from-pink-100/80 to-rose-100/80 dark:from-pink-900/40 dark:to-rose-900/40 hover:from-pink-200/90 hover:to-rose-200/90 dark:hover:from-pink-900/60 dark:hover:to-rose-900/60 text-pink-700 dark:text-pink-300 border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg"
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={signOut}
                    variant="ghost"
                    size="icon"
                    className="bg-gradient-to-br from-rose-100/80 to-pink-100/80 dark:from-rose-900/40 dark:to-pink-900/40 hover:from-rose-200/90 hover:to-pink-200/90 dark:hover:from-rose-900/60 dark:hover:to-pink-900/60 text-rose-700 dark:text-rose-300 border-2 border-rose-200/50 dark:border-rose-800/30 shadow-lg"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Welcome Banner - New Modern Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-r from-pink-200/50 via-rose-200/50 to-pink-200/50 dark:from-pink-900/30 dark:via-rose-900/30 dark:to-pink-900/30 border-2 border-pink-300/50 dark:border-pink-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-300/30 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-pink-500" />
                  Hi, {user?.username}!
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Track your love & money with style 💖✨
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="hidden sm:block"
              >
                <Heart className="w-16 h-16 text-pink-400/30 dark:text-pink-600/30" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6 relative">
          <div className={`flex-1 transition-all duration-300 ${showCalculator ? 'lg:mr-[420px]' : ''}`}>
            
            {/* Balance Cards - Hero Section with New Layout */}
            <div className="mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-pink-50/70 to-rose-50/70 dark:from-black/50 dark:via-pink-950/50 dark:to-rose-950/50 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-300/20 to-transparent rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                      Your Financial Love Story
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Saldo Card - Larger & Featured */}
                    <motion.div
                      whileHover={{ scale: 1.03, y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="sm:col-span-3 lg:col-span-1"
                    >
                      <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-pink-300/60 via-rose-300/60 to-pink-400/60 dark:from-pink-700/40 dark:via-rose-700/40 dark:to-pink-600/40 border-2 border-pink-400/60 dark:border-pink-600/40 rounded-2xl p-6 shadow-xl">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                          className="absolute top-4 right-4"
                        >
                          <Heart className="w-8 h-8 text-pink-600/30 dark:text-pink-400/30 fill-current" />
                        </motion.div>
                        <p className="text-xs sm:text-sm font-semibold text-pink-900/80 dark:text-pink-200/80 mb-2">
                          Current Balance
                        </p>
                        <p className="text-2xl sm:text-4xl font-bold text-pink-900 dark:text-white mb-1">
                          {formatCurrency(balance.balance)}
                        </p>
                        <p className="text-xs text-pink-800/70 dark:text-pink-200/70">Your love pocket 💗</p>
                      </div>
                    </motion.div>

                    {/* Income Card */}
                    <motion.div
                      whileHover={{ scale: 1.03, y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-pink-100/70 via-rose-100/70 to-pink-200/70 dark:from-pink-900/30 dark:via-rose-900/30 dark:to-pink-800/30 border-2 border-pink-300/50 dark:border-pink-700/30 rounded-2xl p-5 shadow-lg">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute top-4 right-4"
                        >
                          <TrendingUp className="w-6 h-6 text-pink-600/40 dark:text-pink-400/40" />
                        </motion.div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Income
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(balance.totalIncome)}
                        </p>
                      </div>
                    </motion.div>

                    {/* Expense Card */}
                    <motion.div
                      whileHover={{ scale: 1.03, y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-rose-100/70 via-pink-100/70 to-rose-200/70 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-rose-800/30 border-2 border-rose-300/50 dark:border-rose-700/30 rounded-2xl p-5 shadow-lg">
                        <motion.div
                          animate={{ y: [0, 8, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute top-4 right-4"
                        >
                          <TrendingDown className="w-6 h-6 text-rose-600/40 dark:text-rose-400/40" />
                        </motion.div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Expenses
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(balance.totalExpenses)}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Market Data - Sparkline Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Gold Price Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-pink-50/60 to-rose-50/60 dark:from-black/50 dark:via-pink-950/40 dark:to-rose-950/40 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-300/20 to-transparent rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-200/60 to-rose-200/60 dark:from-pink-800/40 dark:to-rose-800/40 rounded-xl">
                          <Coins className="w-6 h-6 text-pink-700 dark:text-pink-300" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Live Gold Price</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">Real-time Updates</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                          goldPrice.change >= 0 
                            ? 'bg-green-500/30 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                            : 'bg-red-500/30 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}
                      >
                        {goldPrice.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(goldPrice.change).toFixed(2)}%
                      </motion.div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/60 dark:bg-black/30 rounded-xl p-3 border border-pink-200/40 dark:border-pink-800/20">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Buy</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(goldPrice.buy)}</p>
                      </div>
                      <div className="bg-white/60 dark:bg-black/30 rounded-xl p-3 border border-pink-200/40 dark:border-pink-800/20">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sell</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(goldPrice.sell)}</p>
                      </div>
                    </div>
                    
                    <div className="h-24 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goldPrice.history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={goldPrice.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={goldPrice.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={goldPrice.change >= 0 ? '#10b981' : '#ef4444'} 
                            strokeWidth={2.5}
                            fill="url(#goldGradient)"
                            dot={false}
                            isAnimationActive={true}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-2">Last 30 market updates</p>
                  </div>
                </div>
              </motion.div>

              {/* IHSG Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-rose-50/60 to-pink-50/60 dark:from-black/50 dark:via-rose-950/40 dark:to-pink-950/40 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-300/20 to-transparent rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-rose-200/60 to-pink-200/60 dark:from-rose-800/40 dark:to-pink-800/40 rounded-xl">
                          <Activity className="w-6 h-6 text-rose-700 dark:text-rose-300" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">IHSG Index</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">Real-time Updates</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                          stockIndex.changePercent >= 0 
                            ? 'bg-green-500/30 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                            : 'bg-red-500/30 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}
                      >
                        {stockIndex.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(stockIndex.changePercent).toFixed(2)}%
                      </motion.div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatNumber(stockIndex.value)}
                      </p>
                      <p className={`text-sm font-semibold flex items-center gap-1 ${
                        stockIndex.change >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stockIndex.change >= 0 ? '▲' : '▼'}
                        {Math.abs(stockIndex.change).toFixed(2)} points
                      </p>
                    </div>
                    
                    <div className="h-24 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stockIndex.history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={stockIndex.changePercent >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={stockIndex.changePercent >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={stockIndex.changePercent >= 0 ? '#10b981' : '#ef4444'} 
                            strokeWidth={2.5}
                            fill="url(#stockGradient)"
                            dot={false}
                            isAnimationActive={true}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-2">Last 30 market updates</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Add Transaction Form - Modern Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 sm:mb-8"
            >
              <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-pink-50/60 to-white/70 dark:from-black/50 dark:via-pink-950/40 dark:to-black/50 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-300/20 to-transparent rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 rounded-2xl shadow-lg">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                        Add Transaction
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track your income & expenses</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddTransaction} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-gray-700 dark:text-gray-300 font-medium">Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
                          <SelectTrigger className="bg-white/80 dark:bg-black/60 border-2 border-pink-200/50 dark:border-pink-800/30 h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">💰 Income</SelectItem>
                            <SelectItem value="expense">💸 Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-gray-700 dark:text-gray-300 font-medium">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="bg-white/80 dark:bg-black/60 border-2 border-pink-200/50 dark:border-pink-800/30 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-700 dark:text-gray-300 font-medium">Category</Label>
                        <Input
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Food, Transport, Salary, etc"
                          className="bg-white/80 dark:bg-black/60 border-2 border-pink-200/50 dark:border-pink-800/30 h-12 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-medium">Description</Label>
                        <Input
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Optional notes"
                          className="bg-white/80 dark:bg-black/60 border-2 border-pink-200/50 dark:border-pink-800/30 h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold text-base rounded-xl shadow-xl shadow-pink-300/50 dark:shadow-pink-900/50 hover:shadow-2xl transition-all"
                      >
                        {loading ? 'Adding...' : '✨ Add Transaction'}
                      </Button>
                    </motion.div>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Chart Section - Modern Card */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6 sm:mb-8"
              >
                <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-rose-50/60 to-white/70 dark:from-black/50 dark:via-rose-950/40 dark:to-black/50 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-rose-300/20 to-transparent rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500 rounded-2xl shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                          Transaction Chart
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your recent financial activity</p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#e5e5e5'} opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke={theme === 'dark' ? '#fff' : '#000'} 
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke={theme === 'dark' ? '#fff' : '#000'}
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => `${(value / 1000)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
                            border: 'none',
                            borderRadius: '16px',
                            color: theme === 'dark' ? '#fff' : '#000',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="Pemasukan" fill="#ec4899" radius={[12, 12, 0, 0]} />
                        <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transaction History - Modern Card List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-pink-50/60 to-white/70 dark:from-black/50 dark:via-pink-950/40 dark:to-black/50 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-300/20 to-transparent rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                    Transaction History
                  </h2>
                  
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-pink-300 dark:text-pink-700 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Start tracking your finances!</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {transactions.map((transaction, index) => (
                          <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02, x: 8 }}
                            className="group relative overflow-hidden backdrop-blur-sm bg-gradient-to-r from-pink-50/70 via-white/70 to-rose-50/70 dark:from-pink-900/20 dark:via-black/30 dark:to-rose-900/20 rounded-2xl border-2 border-pink-200/40 dark:border-pink-800/20 p-4 shadow-md hover:shadow-xl transition-all"
                          >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-pink-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    transaction.type === 'income'
                                      ? 'bg-pink-200/60 text-pink-800 dark:bg-pink-800/30 dark:text-pink-300'
                                      : 'bg-rose-200/60 text-rose-800 dark:bg-rose-800/30 dark:text-rose-300'
                                  }`}>
                                    {transaction.type === 'income' ? '💰 Income' : '💸 Expense'}
                                  </span>
                                  {transaction.category && (
                                    <span className="px-3 py-1 bg-pink-100/60 dark:bg-pink-900/30 rounded-full text-xs text-gray-700 dark:text-gray-300">
                                      {transaction.category}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xl sm:text-2xl font-bold ${
                                  transaction.type === 'income' 
                                    ? 'text-pink-700 dark:text-pink-400' 
                                    : 'text-rose-700 dark:text-rose-400'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                </p>
                                {transaction.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{transaction.description}</p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {new Date(transaction.date).toLocaleDateString('id-ID', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <motion.div whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 rounded-xl"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Budget Calculator Sidebar - Modern Floating Style */}
          <AnimatePresence>
            {showCalculator && (
              <motion.div
                initial={{ x: 420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 h-screen w-[400px] z-50 hidden lg:block p-4"
              >
                <div className="h-full overflow-y-auto backdrop-blur-2xl bg-gradient-to-br from-white/80 via-pink-50/80 to-rose-50/80 dark:from-black/80 dark:via-pink-950/80 dark:to-rose-950/80 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl shadow-2xl">
                  <div className="sticky top-0 bg-gradient-to-r from-pink-200/70 to-rose-200/70 dark:from-pink-900/50 dark:to-rose-900/50 backdrop-blur-xl border-b-2 border-pink-300/50 dark:border-pink-800/30 p-5 z-10 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl">
                          <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Budget Calculator</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCalculator(false)}
                        className="hover:bg-pink-200/50 dark:hover:bg-pink-900/50 rounded-xl"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  <div className="p-5">
                    <BudgetCalculator />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
