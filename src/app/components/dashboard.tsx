import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/auth-context';
import { useTheme } from '@/app/components/theme-provider';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card } from '@/app/components/ui/card';
import { LogOut, Sun, Moon, TrendingUp, TrendingDown, Wallet, Calculator, User, Plus, Trash2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [balance, setBalance] = useState<Balance>({ balance: 0, totalIncome: 0, totalExpenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Form states
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchTransactions();
    }
  }, [user]);

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

  // Prepare chart data
  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      income: t.type === 'income' ? t.amount : 0,
      expense: t.type === 'expense' ? t.amount : 0,
    }));

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (showProfile) {
    return <ProfilePage onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/40 dark:bg-black/40 border-b border-white/50 dark:border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Money Tracker</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Hi, {user?.username}! 👋</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCalculator(!showCalculator)}
                className="sm:hidden bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70"
              >
                {showCalculator ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* Desktop calculator button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCalculator(!showCalculator)}
                className="hidden sm:flex bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70"
              >
                <Calculator className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>

              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-xl sm:rounded-2xl text-2xl sm:text-3xl hover:scale-105 transition-transform shadow-lg"
              >
                {user?.emoji}
              </button>

              <Button
                onClick={signOut}
                variant="ghost"
                size="icon"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 p-4 sm:p-5 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-900/30 dark:to-purple-900/30 border border-white/50 dark:border-white/10 rounded-2xl shadow-lg"
        >
          <p className="text-center text-sm sm:text-base text-gray-700 dark:text-gray-200 font-medium">
            ✨ Jangan lupa menabung dan mencatat pemasukan dan pengeluaran kamu ya! 😊
          </p>
        </motion.div>

        <div className="flex gap-6 relative">
          {/* Main content */}
          <div className={`flex-1 transition-all duration-300 ${showCalculator ? 'sm:mr-[380px]' : ''}`}>
            {/* Balance cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-yellow-400/30 to-orange-400/30 dark:from-yellow-600/20 dark:to-orange-600/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Saldo Saat Ini</p>
                    <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(balance.balance)}</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-green-400/30 to-emerald-400/30 dark:from-green-600/20 dark:to-emerald-600/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Total Pemasukan</p>
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(balance.totalIncome)}</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-red-400/30 to-pink-400/30 dark:from-red-600/20 dark:to-pink-600/20 border-white/50 dark:border-white/10 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Total Pengeluaran</p>
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
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

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg"
                  >
                    {loading ? 'Menambahkan...' : 'Tambah Transaksi'}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Chart */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6 sm:mb-8"
              >
                <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/50 dark:bg-black/30 border-white/50 dark:border-white/10 shadow-xl">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white">Grafik Transaksi</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
                      <XAxis dataKey="date" stroke={theme === 'dark' ? '#fff' : '#000'} />
                      <YAxis stroke={theme === 'dark' ? '#fff' : '#000'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '12px',
                          color: theme === 'dark' ? '#fff' : '#000',
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Pemasukan" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Pengeluaran" />
                    </AreaChart>
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
                    transactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 sm:p-4 backdrop-blur-sm bg-white/40 dark:bg-black/20 rounded-xl border border-white/30 dark:border-white/10 hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                            transaction.type === 'income'
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : 'bg-red-500/20 text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                          </div>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-500/20 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
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
