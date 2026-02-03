import { useState } from 'react';
import { useAuth } from '@/app/components/auth-context';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Heart, User, Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const emojiList = ['😊', '😎', '🤑', '💰', '🎯', '🚀', '⭐', '💎', '🌟', '✨', '🔥', '💪', '🎨', '🌈', '🦄'];

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Username dan password harus diisi');
      setLoading(false);
      return;
    }

    const result = isSignUp 
      ? await signUp(username, password, selectedEmoji)
      : await signIn(username, password);

    if (!result.success) {
      setError(result.error || 'Terjadi kesalahan');
    }
    
    setLoading(false);
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-500 dark:from-rose-900 dark:via-pink-900 dark:to-fuchsia-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glass morphism card */}
        <div className="backdrop-blur-2xl bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-3xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl mb-4 shadow-xl cursor-pointer"
            >
              <Heart className="w-10 h-10 text-white fill-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">LovePocket</h1>
            <p className="text-white/80 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" />
              Same Love, Different Wallets
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="pl-11 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 backdrop-blur-sm h-12"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-11 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 backdrop-blur-sm h-12"
                />
              </div>
            </div>

            {/* Emoji picker for sign up */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label className="text-white font-medium">
                  Pilih emoji profil kamu
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-3xl p-3 rounded-xl transition-all hover:scale-110 ${
                        selectedEmoji === emoji
                          ? 'bg-white/40 scale-110 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-300/50 text-white px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold h-12 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              {loading ? 'Memproses...' : isSignUp ? 'Daftar Akun' : 'Masuk'}
            </Button>
          </form>

          {/* Toggle sign up/sign in */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-white hover:text-white/80 transition-colors underline underline-offset-2"
            >
              {isSignUp
                ? 'Sudah punya akun? Masuk di sini'
                : 'Belum punya akun? Daftar di sini'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}