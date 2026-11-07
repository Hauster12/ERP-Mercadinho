import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import type { Usuario, Caixa } from '../types';
import { getOfflineSessionForToken, saveOfflineSession } from '../services/offlineStorage';
import { sincronizarVendasOffline } from '../services/offlineSync';

async function carregarSessaoOffline(token: string) {
  try {
    return await getOfflineSessionForToken(token);
  } catch (error) {
    console.error('[Auth] Falha ao ler a sessão local:', error);
    return undefined;
  }
}

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

  const refreshCaixa = useCallback(async (): Promise<Caixa | null> => {
    try {
      const caixa = await api.getCaixaAtual();
      setCaixaAtual(caixa);
      if (user) await saveOfflineSession(user, caixa);
      return caixa;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) {
        setCaixaAtual(null);
        return null;
      }
      if (user) {
        const session = await carregarSessaoOffline(api.getToken() || '');
        if (session?.usuario.id === user.id) {
          setCaixaAtual(session.caixa);
          return session.caixa;
        }
      }
      setCaixaAtual(null);
      return null;
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      try {
        const caixa = await api.getCaixaAtual();
        setCaixaAtual(caixa);
        await saveOfflineSession(me, caixa);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== undefined) throw error;
        const session = await carregarSessaoOffline(api.getToken() || '');
        if (session?.usuario.id !== me.id) throw error;
        setCaixaAtual(session.caixa);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === undefined) {
        const session = await carregarSessaoOffline(api.getToken() || '');
        if (session) {
          setUser(session.usuario);
          setCaixaAtual(session.caixa);
          return;
        }
      }
      setUser(null);
      setCaixaAtual(null);
      api.logout();
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setCaixaAtual(null);
    };

    window.addEventListener('api:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('api:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    const sincronizar = () => {
      if (!navigator.onLine) return;
      sincronizarVendasOffline(user.id).catch((error: unknown) => {
        console.error('[Auth] Falha ao sincronizar vendas offline:', error);
      });
    };
    if (navigator.onLine) sincronizar();
    const interval = window.setInterval(() => {
      if (navigator.onLine) sincronizar();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const aoReconectar = () => {
      void refreshUser();
      sincronizarVendasOffline(user.id).catch((error: unknown) => {
        console.error('[Auth] Falha ao sincronizar vendas offline:', error);
      });
    };
    window.addEventListener('online', aoReconectar);
    return () => window.removeEventListener('online', aoReconectar);
  }, [user, refreshUser]);

  useEffect(() => {
    const aoSincronizarVenda = () => {
      void refreshCaixa();
    };
    window.addEventListener('offline-sales:synced', aoSincronizarVenda);
    return () => window.removeEventListener('offline-sales:synced', aoSincronizarVenda);
  }, [refreshCaixa]);

  const login = async (email: string, senha: string) => {
    const loggedUser = await api.login(email, senha);
    setUser(loggedUser);
    try {
      const caixa = await api.getCaixaAtual();
      setCaixaAtual(caixa);
      await saveOfflineSession(loggedUser, caixa);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      const session = await carregarSessaoOffline(api.getToken() || '');
      if (session?.usuario.id !== loggedUser.id) throw error;
      setCaixaAtual(session.caixa);
    }
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
