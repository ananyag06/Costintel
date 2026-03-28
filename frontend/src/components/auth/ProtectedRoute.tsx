import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate?: (page: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onNavigate }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse text-sm uppercase tracking-widest">Verifying Identity...</p>
      </div>
    );
  }

  if (!user) {
    if (onNavigate) onNavigate('login');
    return null;
  }

  return <>{children}</>;
};
