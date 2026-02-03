import { ThemeProvider } from '@/app/components/theme-provider';
import { AuthProvider, useAuth } from '@/app/components/auth-context';
import { LoginPage } from '@/app/components/login-page';
import { Dashboard } from '@/app/components/dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}