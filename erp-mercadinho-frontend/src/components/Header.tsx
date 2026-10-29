import React, { useState, useEffect } from 'react';
import { Menu, Wifi, WifiOff, Clock, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';
import type { ActiveTab } from './Navigation';

interface HeaderProps {
  activeTab: ActiveTab;
  setMobileOpen: (open: boolean) => void;
  onOpenQuickCashModal?: (tipo: 'SANGRIA' | 'REFORCO') => void;
  avisosAdminCount?: number;
  onOpenAvisosAdmin?: () => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  pdv: { title: 'Ponto de Venda', subtitle: 'Operação de caixa e vendas rápidas' },
  dashboard: { title: 'Dashboard Executivo', subtitle: 'Métricas e faturamento em tempo real' },
  produtos: { title: 'Produtos & Estoque', subtitle: 'Catálogo de itens, preços e níveis de estoque' },
  compras: { title: 'Gestão de Compras', subtitle: 'Pedidos aos fornecedores, entrada de mercadorias e custos' },
  caixa: { title: 'Gestão de Caixa', subtitle: 'Abertura, fechamento, sangrias e conciliação' },
  vendas: { title: 'Histórico de Vendas', subtitle: 'Extrato de cupons, cancelamentos e pagamentos' },
  estoque: { title: 'Movimentações de Estoque', subtitle: 'Kardex de entradas, saídas e ajustes físicos' },
  financeiro: { title: 'Controle Financeiro', subtitle: 'Fluxo de despesas, receitas e liquidações' },
  cadastros: { title: 'Cadastros Gerais', subtitle: 'Clientes, fornecedores, categorias e usuários' },
  avisarAdmin: { title: 'Mensagem ao Administrador', subtitle: 'Envio de chamados e solicitações urgentes ao admin' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setMobileOpen,
  onOpenQuickCashModal,
  avisosAdminCount = 0,
  onOpenAvisosAdmin,
}) => {
  const { user, caixaAtual } = useAuth();
  const [time, setTime] = useState<string>('');
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${BASE_URL}/health`);
        setConnected(res.ok);
      } catch {
        setConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentInfo = tabTitles[activeTab];

  return (
    <header className="h-16 px-3 sm:px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sticky top-0 z-30">
      {/* Left: Mobile trigger & Page info */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base lg:text-lg font-bold text-slate-900 font-['Syne'] tracking-tight flex items-center gap-2">
            {currentInfo.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick actions, cash status & live indicators */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Admin Recados / Avisos Button */}
        {user?.perfil === 'ADMIN' && onOpenAvisosAdmin && (
          <button
            type="button"
            onClick={onOpenAvisosAdmin}
            title={
              avisosAdminCount > 0
                ? `${avisosAdminCount} aviso(s) dos caixas pendente(s)`
                : 'Avisos e recados dos caixas'
            }
            className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
              avisosAdminCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            {avisosAdminCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {avisosAdminCount}
              </span>
            )}
          </button>
        )}

        {/* Quick cash operation buttons if cash is open */}
        {caixaAtual?.status === 'ABERTO' && onOpenQuickCashModal && (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onOpenQuickCashModal('REFORCO')}
              className="px-2.5 py-1 text-xs font-bold text-cyan-800 bg-cyan-100/60 hover:bg-cyan-100 rounded transition-colors cursor-pointer"
            >
              + Reforço
            </button>
            <button
              onClick={() => onOpenQuickCashModal('SANGRIA')}
              className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100/60 hover:bg-amber-100 rounded transition-colors cursor-pointer"
            >
              - Sangria
            </button>
          </div>
        )}

        {/* Digital Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{time}</span>
        </div>

        {/* API connection indicator */}
        <div
          title={connected ? `Conectado à API (${BASE_URL})` : 'Desconectado da API'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-semibold ${
            connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
