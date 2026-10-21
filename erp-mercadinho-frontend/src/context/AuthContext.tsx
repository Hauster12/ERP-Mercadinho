import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Usuario, Caixa } from '../types';

interface AuthContextType {
  user: Usuario | null;
  caixaAtual: Caixa | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshCaixa: () => Promise<Caixa | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCaixa = async (): Promise<Caixa | null> => {
    try {
      const caixa = await api.getCaixaAtual();
      setCaixaAtual(caixa);
      return caixa;
    } catch {
      setCaixaAtual(null);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      await refreshCaixa();
    } catch {
      setUser(null);
      setCaixaAtual(null);
      api.logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = api.getToken();
        if (token) {
          await refreshUser();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setCaixaAtual(null);
    };

    window.addEventListener('api:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('api:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, senha: string) => {
    const loggedUser = await api.login(email, senha);
    setUser(loggedUser);
    await refreshCaixa();
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setCaixaAtual(null);
  };

  return (
    <AuthContext.Provider value={{ user, caixaAtual, loading, login, logout, refreshCaixa, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
