import React, { useState, useEffect } from 'react';
import { Menu, Wifi, WifiOff, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { ActiveTab } from './Navigation';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenNavigation: () => void;
  onOpenQuickCashModal?: (tipo: 'SANGRIA' | 'REFORCO') => void;
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
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNavigation,
  onOpenQuickCashModal,
}) => {
  const { caixaAtual } = useAuth();
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
        const res = await fetch('/api/health');
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
    <header className="min-h-16 px-3 sm:px-4 lg:px-6 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sticky top-0 z-30">
      {/* Left: Mobile trigger & Page info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={onOpenNavigation}
          aria-label="Abrir menu"
          title="Abrir menu lateral"
          className="min-w-11 min-h-11 shrink-0 md:hidden flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 font-['Syne'] tracking-tight truncate">
            {currentInfo.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden md:block truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick actions, cash status & live indicators */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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
          title={connected ? 'Conectado à API' : 'Desconectado da API'}
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
