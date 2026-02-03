import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/auth-context';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import { ArrowLeft, TrendingUp, TrendingDown, Heart, Edit2, Check, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '@/app/components/theme-provider';

const emojiList = [
  '😊', '😎', '🤑', '💰', '🎯', '🚀', '⭐', '💎', '🌟', '✨', 
  '🔥', '💪', '🎨', '🌈', '🦄', '🎭', '🎪', '🎬', '🎮', '🎸',
  '🎤', '🎧', '🎼', '🎹', '🥁', '🎺', '🎻', '🎲', '🎰', '🎳',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓',
  '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣',
  '🤿', '🥊', '🥋', '🎿', '🛷', '⛷️', '🏂', '🪂', '🏋️', '🤸',
  '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗',
  '🚴', '🚵', '🤹', '🧖', '🧑‍🎓', '👨‍💼', '👩‍💻', '👨‍🍳', '👩‍🎨', '👨‍🔧',
  '💼', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '📹', '🎥'
];

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
  const { user, updateEmoji, updateBio } = useAuth();
  const { theme } = useTheme();
  const [balance, setBalance] = useState({ balance: 0, totalIncome: 0, totalExpenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isEditingEmoji, setIsEditingEmoji] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(user?.emoji || '😊');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTransactions();
      setBio(user.bio || '');
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

const handleSaveBio = async () => {
  await updateBio(bio);

  setUser((prev) => ({
    ...prev,
    bio: bio,
  }));

  setIsEditingBio(false);
};

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const chartData = transactions
    .slice()
    .reverse()
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      Pemasukan: t.type === 'income' ? t.amount : 0,
      Pengeluaran: t.type === 'expense' ? t.amount : 0,
    }));

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
      </div>

      {/* Header */}
      <div className="sticky top-4 z-40 mx-4 sm:mx-6 lg:mx-8 mt-4 mb-6">
        <div className="max-w-4xl mx-auto backdrop-blur-2xl bg-white/40 dark:bg-black/40 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl shadow-2xl shadow-pink-200/20 dark:shadow-pink-900/20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 sm:h-20">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-pink-100/50 dark:hover:bg-pink-900/30 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 dark:from-pink-400 dark:via-rose-400 dark:to-pink-400 bg-clip-text text-transparent ml-3">
                My Profile
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 relative z-10">
        {/* Profile card - Hero Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-pink-50/70 to-rose-50/70 dark:from-black/50 dark:via-pink-950/50 dark:to-rose-950/50 border-2 border-pink-300/50 dark:border-pink-800/30 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-pink-200/30 dark:shadow-pink-900/20">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-300/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-rose-300/30 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              {/* Profile emoji */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 rounded-3xl text-7xl sm:text-8xl shadow-2xl shadow-pink-400/50 dark:shadow-pink-700/50"
                  >
                    {user?.emoji}
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-5 h-5 text-white m-auto mt-1.5" />
                    </motion.div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="icon"
                      onClick={() => setIsEditingEmoji(!isEditingEmoji)}
                      className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 shadow-xl shadow-pink-400/50"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>

                {/* Emoji picker */}
                {isEditingEmoji && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mb-6 p-6 backdrop-blur-xl bg-white/80 dark:bg-black/50 rounded-3xl border-2 border-pink-300/50 dark:border-pink-800/30 shadow-2xl max-w-md w-full"
                  >
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Choose your emoji:</p>
                    <div className="grid grid-cols-5 gap-2 mb-5 max-h-60 overflow-y-auto scrollbar-hide">
                      {emojiList.map((emoji, index) => (
                        <motion.button
                          key={`${emoji}-${index}`}
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`text-3xl p-3 rounded-2xl transition-all ${
                            selectedEmoji === emoji
                              ? 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-xl scale-110'
                              : 'bg-pink-100/60 dark:bg-pink-900/30 hover:bg-pink-200/70 dark:hover:bg-pink-900/40'
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveEmoji}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg h-11"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingEmoji(false);
                          setSelectedEmoji(user?.emoji || '😊');
                        }}
                        variant="outline"
                        className="flex-1 bg-white/70 dark:bg-black/50 border-2 border-pink-300/50 dark:border-pink-800/30 h-11"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-3">
                  {user?.username}
                </h2>
                
                {/* Custom Bio Section */}
                <div className="w-full max-w-md mx-auto">
                  {!isEditingBio ? (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-center gap-2 group min-h-[32px] px-4 py-2 rounded-full bg-pink-100/50 dark:bg-pink-900/30 border border-pink-200/50 dark:border-pink-800/30"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                        {user?.bio || '✨ Click to add your bio'}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingBio(true);
                          setBio(user?.bio || '');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-pink-200/50 dark:hover:bg-pink-900/50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 p-4 backdrop-blur-xl bg-white/80 dark:bg-black/50 rounded-2xl border-2 border-pink-300/50 dark:border-pink-800/30 shadow-xl"
                    >
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Write your bio..."
                        className="mb-3 bg-white/90 dark:bg-black/60 border-2 border-pink-200/50 dark:border-pink-800/30 text-sm min-h-[70px] resize-none text-center rounded-xl"
                        maxLength={100}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveBio}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-10"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsEditingBio(false);
                            setBio(user?.bio || '');
                          }}
                          variant="outline"
                          className="flex-1 bg-white/70 dark:bg-black/50 border-2 border-pink-300/50 dark:border-pink-800/30 h-10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Stats - Modern Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-10">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-pink-200/70 via-rose-200/70 to-pink-300/70 dark:from-pink-900/30 dark:via-rose-900/30 dark:to-pink-800/30 border-2 border-pink-300/60 dark:border-pink-700/40 shadow-xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-3 right-3"
                  >
                    <Heart className="w-7 h-7 text-pink-600/30 dark:text-pink-400/30 fill-current" />
                  </motion.div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">Current Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(balance.balance)}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-pink-100/70 via-rose-100/70 to-pink-200/70 dark:from-pink-900/25 dark:via-rose-900/25 dark:to-pink-800/25 border-2 border-pink-200/50 dark:border-pink-700/30 shadow-lg"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-3 right-3"
                  >
                    <TrendingUp className="w-6 h-6 text-pink-600/40 dark:text-pink-400/40" />
                  </motion.div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">Total Income</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(balance.totalIncome)}
                  </p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-rose-100/70 via-pink-100/70 to-rose-200/70 dark:from-rose-900/25 dark:via-pink-900/25 dark:to-rose-800/25 border-2 border-rose-200/50 dark:border-rose-700/30 shadow-lg"
                >
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-3 right-3"
                  >
                    <TrendingDown className="w-6 h-6 text-rose-600/40 dark:text-rose-400/40" />
                  </motion.div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">Total Expenses</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(balance.totalExpenses)}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chart - Modern Card */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <div className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-white/70 via-rose-50/60 to-white/70 dark:from-black/50 dark:via-rose-950/40 dark:to-black/50 border-2 border-pink-200/50 dark:border-pink-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-rose-300/20 to-transparent rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                  Recent Transactions
                </h3>
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

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-gradient-to-r from-pink-200/50 via-rose-200/50 to-pink-200/50 dark:from-pink-900/30 dark:via-rose-900/30 dark:to-pink-900/30 border-2 border-pink-300/50 dark:border-pink-800/30 rounded-2xl p-5 shadow-lg"
        >
          <p className="text-center text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <strong>Tip:</strong> Screenshot this page to save your beautiful financial summary!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
