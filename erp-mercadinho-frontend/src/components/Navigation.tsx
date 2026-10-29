import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'pdv'
  | 'dashboard'
  | 'produtos'
  | 'compras'
  | 'caixa'
  | 'vendas'
  | 'estoque'
  | 'financeiro'
  | 'cadastros';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
}) => {
  const { user, caixaAtual, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const [revealedLabel, setRevealedLabel] = useState('');
  const labelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (labelTimeout.current) clearTimeout(labelTimeout.current);
    },
    [],
  );

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
    badge?: string;
  }> = [
    { id: 'pdv', label: 'PDV / Caixa Rápido', icon: Store, badge: 'PDV' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'produtos', label: 'Produtos & Estoque', icon: Package },
    { id: 'compras', label: 'Compras & Pedidos', icon: ShoppingCart, adminOnly: true },
    { id: 'caixa', label: 'Gestão de Caixa', icon: Wallet },
    { id: 'vendas', label: 'Histórico de Vendas', icon: Receipt },
    { id: 'estoque', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'financeiro', label: 'Financeiro', icon: BarChart3, adminOnly: true },
    { id: 'cadastros', label: 'Cadastros Gerais', icon: Users },
  ];

  const handleSelect = (tab: ActiveTab, label?: string) => {
    if (
      label &&
      collapsed &&
      window.matchMedia('(min-width: 768px)').matches
    ) {
      setRevealedLabel(label);
      if (labelTimeout.current) clearTimeout(labelTimeout.current);
      labelTimeout.current = setTimeout(() => setRevealedLabel(''), 1400);
    }
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => mobileOpen && setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out motion-reduce:transition-none md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 ${
          collapsed ? 'w-[min(18rem,calc(100vw-2rem))] md:w-20' : 'w-[min(18rem,calc(100vw-2rem))] md:w-64'
        } bg-white border-r border-slate-200 flex flex-col transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Brand Header with Uploaded Logo */}
      <div className={`min-h-20 px-3 md:px-4 flex items-center justify-between gap-2 border-b border-slate-200 bg-white ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
        <div className={`flex items-center justify-between min-w-0 ${collapsed ? 'md:justify-center md:w-full' : 'w-full'}`}>
          <img
            src="/logo-full.png"
            alt="NexusERP"
            className={`h-10 w-auto object-contain ${collapsed ? 'md:hidden' : ''}`}
          />
          {collapsed && (
            <img
              src="/logo-icon.png"
              alt=""
              aria-hidden="true"
              className="hidden h-10 w-10 object-contain md:block"
            />
          )}
          <span className={`text-[10px] text-slate-500 uppercase tracking-widest font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold ${collapsed ? 'md:hidden' : ''}`}>
            PDV
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          title={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
          className="hidden md:flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="flex md:hidden min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Cash register quick status banner */}
      <div className={`mx-2 md:mx-3 my-3 p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
        <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'md:justify-center' : ''}`}>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
                caixaAtual?.status === 'ABERTO'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
              }`}
            />
            <span className={`text-xs font-semibold text-slate-700 ${collapsed ? 'md:hidden' : ''}`}>
              {caixaAtual?.status === 'ABERTO' ? 'Caixa Aberto' : 'Caixa Fechado'}
            </span>
          </div>
          <button
            onClick={() => handleSelect('caixa')}
            title={caixaAtual?.status === 'ABERTO' ? 'Ver saldo' : 'Abrir caixa'}
            className={`text-[11px] font-mono font-bold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer ${collapsed ? 'md:hidden' : ''}`}
          >
            {caixaAtual?.status === 'ABERTO' ? 'Ver Saldo' : 'Abrir'}
          </button>
        </div>

        <nav className={`flex-1 py-2 space-y-1 overflow-y-auto ${collapsed ? 'px-2 md:px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const active = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id, item.label)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`group relative w-full min-h-11 flex items-center gap-3 rounded-lg text-sm font-semibold transition-[background-color,color,border-color,box-shadow,padding] duration-300 ease-in-out motion-reduce:transition-none cursor-pointer ${
                  active
                    ? 'bg-cyan-50 text-cyan-900 border-l-4 border-cyan-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${collapsed ? 'justify-start px-2' : 'justify-start px-3.5'}`}
              >
                <span className={`flex shrink-0 items-center justify-center overflow-hidden transition-[width] duration-300 ease-in-out motion-reduce:transition-none ${collapsed ? 'md:w-8' : 'md:w-4'}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-in-out motion-reduce:transition-none ${collapsed ? 'md:max-w-0 md:-translate-x-2 md:opacity-0' : 'md:max-w-44 md:translate-x-0 md:opacity-100'}`}>
                  {item.label}
                </span>
                {collapsed && (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none fixed left-[5.5rem] z-[60] rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-[opacity,transform] duration-200 md:group-hover:translate-x-0 md:group-hover:opacity-100 ${
                      revealedLabel === item.label
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-1 opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
                {item.badge && (
                  <span className={`ml-auto overflow-hidden whitespace-nowrap text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none ${collapsed ? 'md:max-w-0 md:px-0 md:opacity-0' : 'md:max-w-12 md:opacity-100'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-2 md:p-3 border-t border-slate-200 bg-white">
          <div className={`flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 ${collapsed ? 'md:flex-col md:gap-2 md:px-1.5' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
                <p className="text-xs font-bold text-slate-800 truncate">{user?.nome || 'Operador'}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {user?.perfil || 'FUNCIONARIO'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Encerrar Sessão"
              aria-label="Encerrar sessão"
              className="min-h-10 min-w-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
