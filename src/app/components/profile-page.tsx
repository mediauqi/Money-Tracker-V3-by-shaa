import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/auth-context';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Edit2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/app/components/theme-provider';

const emojiList = ['😊', '😎', '🤑', '💰', '🎯', '🚀', '⭐', '💎', '🌟', '✨', '🔥', '💪', '🎨', '🌈', '🦄', '🎭', '🎪', '🎬', '🎮', '🎸'];

type Props = {
  onBack: () => void;
};

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
};

export function ProfilePage({ onBack }: Props) {
  const { user, updateEmoji } = useAuth();
  const { theme } = useTheme();
  const [balance, setBalance] = useState({ balance: 0, totalIncome: 0, totalExpenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isEditingEmoji, setIsEditingEmoji] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(user?.emoji || '😊');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTransactions();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4053ac61/profile/${user?.id}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setBalance({
        balance: data.balance,
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      setTransactions(data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSaveEmoji = async () => {
    await updateEmoji(selectedEmoji);
    setIsEditingEmoji(false);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Prepare chart data
  const chartData = transactions
    .slice()
    .reverse()
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      income: t.type === 'income' ? t.amount : 0,
      expense: t.type === 'expense' ? t.amount : 0,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 dark:from-gray-900 dark:via-rose-950 dark:to-gray-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/40 dark:bg-black/40 border-b border-white/50 dark:border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 sm:h-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-white/50 dark:hover:bg-black/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white ml-3">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="p-6 sm:p-8 backdrop-blur-xl bg-gradient-to-br from-white/60 to-purple-100/40 dark:from-black/40 dark:to-purple-900/20 border-white/50 dark:border-white/10 shadow-2xl text-center">
            {/* Profile emoji */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl text-6xl sm:text-7xl shadow-2xl mb-4">
                  {user?.emoji}
                </div>
                <Button
                  size="icon"
                  onClick={() => setIsEditingEmoji(!isEditingEmoji)}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Emoji picker */}
              {isEditingEmoji && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 backdrop-blur-xl bg-white/50 dark:bg-black/30 rounded-2xl border border-white/50 dark:border-white/10 shadow-xl max-w-md"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Pilih emoji baru:</p>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {emojiList.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`text-3xl p-3 rounded-xl transition-all hover:scale-110 ${
                          selectedEmoji === emoji
                            ? 'bg-purple-500/40 scale-110 shadow-lg'
                            : 'bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEmoji}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Simpan
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingEmoji(false);
                        setSelectedEmoji(user?.emoji || '😊');
                      }}
                      variant="outline"
                      className="flex-1 bg-white/50 dark:bg-black/30"
                    >
                      Batal
                    </Button>
                  </div>
                </motion.div>
              )}

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1">
                {user?.username}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">LovePocket User</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-orange-400/30 dark:from-yellow-600/20 dark:to-orange-600/20 border border-white/50 dark:border-white/10">
                <div className="flex items-center justify-center mb-2">
                  <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">Saldo Saat Ini</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(balance.balance)}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-green-400/30 to-emerald-400/30 dark:from-green-600/20 dark:to-emerald-600/20 border border-white/50 dark:border-white/10">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">Total Pemasukan</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(balance.totalIncome)}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-400/30 to-pink-400/30 dark:from-red-600/20 dark:to-pink-600/20 border border-white/50 dark:border-white/10">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1">Total Pengeluaran</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(balance.totalExpenses)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/50 dark:bg-black/30 border-white/50 dark:border-white/10 shadow-xl">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-white">
                Grafik Transaksi Terakhir
              </h3>
              <ResponsiveContainer width="100%" height={300}>
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
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Pemasukan" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Pengeluaran" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 backdrop-blur-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-600/20 dark:to-purple-600/20 border border-white/50 dark:border-white/10 rounded-2xl"
        >
          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>Tip:</strong> Screenshot halaman ini untuk menyimpan summary keuangan kamu dengan tampilan yang rapih dan menarik!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
