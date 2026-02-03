import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/auth-context';
import { useTheme } from '@/app/components/theme-provider';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card } from '@/app/components/ui/card';
import { LogOut, Sun, Moon, TrendingUp, TrendingDown, Wallet, Calculator, Plus, Trash2, Coins, LineChart as LineChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
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
  history: { value: number }[]; // Mini chart data
};

type StockIndex = {
  value: number;
  change: number;
  changePercent: number;
  history: { value: number }[]; // Mini chart data
};

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [balance, setBalance] = useState<Balance>({ balance: 0, totalIncome: 0, totalExpenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Market data states with history for mini charts
  const [goldPrice, setGoldPrice] = useState<GoldPrice>({ 
    buy: 1250000, 
    sell: 1240000, 
    change: 2.5,
    history: Array.from({ length: 20 }, (_, i) => ({ value: 1240000 + Math.random() * 20000 }))
  });
  const [stockIndex, setStockIndex] = useState<StockIndex>({ 
    value: 7250.50, 
    change: 45.25, 
    changePercent: 0.63,
    history: Array.from({ length: 20 }, (_, i) => ({ value: 7200 + Math.random() * 100 }))
  });
  
  // Form states
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchTransactions();
      fetchMarketData();
      
      // Fetch market data every 30 seconds for "live" effect
      const interval = setInterval(fetchMarketData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const fetchMarketData = () => {
    // Simulate live data with random fluctuations
    setGoldPrice(prev => {
      const newBuy = Math.round(prev.buy + (Math.random() - 0.5) * 5000);
      const newSell = Math.round(prev.sell + (Math.random() - 0.5) * 5000);
      const newHistory = [...prev.history.slice(1), { value: newBuy }];
      
      return {
        buy: newBuy,
        sell: newSell,
        change: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
        history: newHistory,
      };
    });
    
    setStockIndex(prev => {
      const newValue = parseFloat((prev.value + (Math.random() - 0.5) * 100).toFixed(2));
      const newHistory = [...prev.history.slice(1), { value: newValue }];
      
      return {
        value: newValue,
        change: parseFloat(((Math.random() - 0.5) * 50).toFixed(2)),
        changePercent: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
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

  // Prepare chart data - Bar Chart
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 dark:from-gray-900 dark:via-rose-950 dark:to-gray-900">
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="backdrop-blur-xl bg-white/40 dark:bg-black/40 border-b border-white/50 dark:border-white/10 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Profile icon on the left */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile(true)}
                className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl sm:rounded-2xl text-2xl sm:text-3xl hover:shadow-2xl transition-shadow shadow-lg"
              >
                {user?.emoji}
              </motion.button>
              
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">LovePocket</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Hi, {user?.username} - your LovePocket is ready 💗</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Calculator button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70"
                >
                  <Calculator className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70"
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="icon"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="mb-6 sm:mb-8 p-4 sm:p-5 backdrop-blur-xl bg-gradient-to-r from-rose-400/20 to-pink-400/20 dark:from-rose-900/30 dark:to-pink-900/30 border border-white/50 dark:border-white/10 rounded-2xl shadow-lg"
        >
          <p className="text-center text-sm sm:text-base text-gray-700 dark:text-gray-200 font-medium">
            ✨ Jangan lupa menabung dan mencatat pemasukan dan pengeluaran kamu ya! 😊
          </p>
        </motion.div>

        <div className="flex gap-6 relative">
          {/* Main content */}
          <div className={`flex-1 transition-all duration-300 ${showCalculator ? 'sm:mr-[380px]' : ''}`}>
            {/* Market Data - Harga Emas & IHSG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-amber-400/30 to-yellow-500/30 dark:from-amber-600/20 dark:to-yellow-700/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Harga Emas (Hari Ini)</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      goldPrice.change >= 0 
                        ? 'bg-green-500/30 text-green-700 dark:text-green-300' 
                        : 'bg-red-500/30 text-red-700 dark:text-red-300'
                    }`}>
                      {goldPrice.change >= 0 ? '▲' : '▼'} {Math.abs(goldPrice.change).toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Harga Beli</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(goldPrice.buy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Harga Jual</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(goldPrice.sell)}</p>
                    </div>
                  </div>
                  {/* Mini chart */}
                  <div className="mt-2">
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={goldPrice.history}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={goldPrice.change >= 0 ? '#10b981' : '#ef4444'} 
                          strokeWidth={2} 
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-blue-400/30 to-indigo-500/30 dark:from-blue-600/20 dark:to-indigo-700/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-200">IHSG (Hari Ini)</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      stockIndex.changePercent >= 0 
                        ? 'bg-green-500/30 text-green-700 dark:text-green-300' 
                        : 'bg-red-500/30 text-red-700 dark:text-red-300'
                    }`}>
                      {stockIndex.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stockIndex.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{formatNumber(stockIndex.value)}</p>
                  <p className={`text-sm font-semibold mb-2 ${
                    stockIndex.change >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stockIndex.change >= 0 ? '+' : ''}{formatNumber(stockIndex.change)} poin
                  </p>
                  {/* Mini chart */}
                  <div className="mt-2">
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={stockIndex.history}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={stockIndex.changePercent >= 0 ? '#10b981' : '#ef4444'} 
                          strokeWidth={2} 
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Balance cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, rotate: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-yellow-400/30 to-orange-400/30 dark:from-yellow-600/20 dark:to-orange-600/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Saldo Saat Ini</p>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </motion.div>
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(balance.balance)}</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, rotate: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-green-400/30 to-emerald-400/30 dark:from-green-600/20 dark:to-emerald-600/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Total Pemasukan</p>
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </motion.div>
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(balance.totalIncome)}</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, rotate: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-red-400/30 to-pink-400/30 dark:from-red-600/20 dark:to-pink-600/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Total Pengeluaran</p>
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </motion.div>
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(balance.totalExpenses)}</p>
                </Card>
              </motion.div>
            </div>

            {/* Add transaction form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.01 }}
              className="mb-6 sm:mb-8"
            >
              <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/50 dark:bg-black/30 border-white/50 dark:border-white/10 shadow-xl">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                  Tambah Transaksi
                </h2>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-gray-700 dark:text-gray-200">Tipe</Label>
                      <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
                        <SelectTrigger className="bg-white/70 dark:bg-black/50 border-white/50 dark:border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">💰 Pemasukan</SelectItem>
                          <SelectItem value="expense">💸 Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-gray-700 dark:text-gray-200">Jumlah</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="bg-white/70 dark:bg-black/50 border-white/50 dark:border-white/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gray-700 dark:text-gray-200">Kategori</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Makanan, Transport, Gaji, dll"
                        className="bg-white/70 dark:bg-black/50 border-white/50 dark:border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 dark:text-gray-200">Deskripsi</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Catatan (opsional)"
                        className="bg-white/70 dark:bg-black/50 border-white/50 dark:border-white/10"
                      />
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    >
                      {loading ? 'Menambahkan...' : 'Tambah Transaksi'}
                    </Button>
                  </motion.div>
                </form>
              </Card>
            </motion.div>

            {/* Chart - Bar Chart */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.01 }}
                className="mb-6 sm:mb-8"
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/50 dark:bg-black/30 border-white/50 dark:border-white/10 shadow-xl">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white">Grafik Transaksi</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ccc'} opacity={0.3} />
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
                          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          color: theme === 'dark' ? '#fff' : '#000',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="Pemasukan" fill="#10b981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            )}

            {/* Transaction list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/50 dark:bg-black/30 border-white/50 dark:border-white/10 shadow-xl">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white">Riwayat Transaksi</h2>
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Belum ada transaksi</p>
                  ) : (
                    <AnimatePresence>
                      {transactions.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="flex items-center justify-between p-3 sm:p-4 backdrop-blur-sm bg-white/40 dark:bg-black/20 rounded-xl border border-white/30 dark:border-white/10 hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.3 }}
                              className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                                transaction.type === 'income'
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {transaction.type === 'income' ? (
                                <TrendingUp className="w-5 h-5" />
                              ) : (
                                <TrendingDown className="w-5 h-5" />
                              )}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white truncate">
                                {transaction.category || (transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{transaction.description || '-'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(transaction.date).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <p className={`font-bold text-sm sm:text-base ${
                              transaction.type === 'income'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-500/20 h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Budget Calculator - Side panel */}
          <AnimatePresence>
            {showCalculator && (
              <>
                {/* Mobile overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                  onClick={() => setShowCalculator(false)}
                />
                
                {/* Calculator panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed sm:absolute right-0 top-0 w-full sm:w-[360px] h-full sm:h-auto z-50 sm:z-0"
                >
                  <BudgetCalculator onClose={() => setShowCalculator(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}