import React from 'react';
import {
  Boxes,
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Receipt,
  ShoppingBasket,
  ShoppingCart,
  UsersRound,
  Vault,
  X,
  type LucideIcon,
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
  | 'cadastros'
  | 'avisarAdmin';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAbrirCaixaModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  collapsed,
  onToggleCollapsed,
  onAbrirCaixaModal,
}) => {
  const { user, caixaAtual, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: LucideIcon;
    adminOnly?: boolean;
    badge?: string;
  }> = [
    { id: 'pdv', label: 'PDV / Caixa Rápido', icon: ShoppingCart, badge: 'PDV' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'produtos', label: 'Produtos & Estoque', icon: Package },
    { id: 'compras', label: 'Compras & Pedidos', icon: ShoppingBasket, adminOnly: true },
    { id: 'caixa', label: 'Gestão de Caixa', icon: Vault },
    { id: 'vendas', label: 'Histórico de Vendas', icon: Receipt },
    { id: 'estoque', label: 'Movimentações', icon: Boxes },
    { id: 'financeiro', label: 'Financeiro', icon: ChartNoAxesColumnIncreasing, adminOnly: true },
    { id: 'cadastros', label: 'Cadastros Gerais', icon: UsersRound },
    { id: 'avisarAdmin', label: 'Mensagem ao Admin', icon: MessageSquareText, badge: 'SOS' },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 ${
          collapsed ? 'w-64 md:w-16' : 'w-64'
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Uploaded Logo */}
        <div className={`h-20 ${collapsed ? 'px-5 md:px-2' : 'px-5'} flex items-center justify-between border-b border-slate-200 bg-white`}>
          <div className={`flex w-full items-center ${collapsed ? 'md:flex-col md:justify-center md:gap-1' : 'justify-between'}`}>
            <img
              src="/logo-full.png"
              alt="NexusERP"
              className={`h-auto w-full max-w-32 max-h-10 object-contain ${collapsed ? 'md:hidden' : ''}`}
            />
            <img
              src="/logo-icon.png"
              alt="NexusERP"
              className={`hidden h-8 w-8 max-h-full max-w-full object-contain ${collapsed ? 'md:block' : ''}`}
            />
            <span className={`text-[10px] text-slate-500 uppercase tracking-widest font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold ${collapsed ? 'md:hidden' : ''}`}>
              PDV
            </span>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className={`hidden md:flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 ${collapsed ? 'md:p-1' : ''}`}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cash register quick status banner */}
        <div className={`mx-3 my-3 p-3 ${collapsed ? 'md:mx-2 md:px-0 md:justify-center' : ''} rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between`}>
          <div className={`flex items-center gap-2 ${collapsed ? 'md:justify-center' : ''}`}>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                caixaAtual?.status === 'ABERTO'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
              }`}
            />
            <span className={`text-xs font-semibold text-slate-700 ${collapsed ? 'md:hidden' : ''}`}>
              {caixaAtual?.status === 'ABERTO'
                ? `Caixa 0${caixaAtual.numeroCaixa || 1} Aberto`
                : 'Caixa Fechado'}
            </span>
          </div>
          <button
            type="button"
            title={caixaAtual?.status === 'ABERTO' ? 'Ver saldo do caixa' : 'Abrir caixa'}
            onClick={() => {
              if (caixaAtual?.status === 'ABERTO') {
                handleSelect('caixa');
              } else if (onAbrirCaixaModal) {
                onAbrirCaixaModal();
              } else {
                handleSelect('caixa');
              }
            }}
            className={`text-[11px] font-mono font-bold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer ${collapsed ? 'md:hidden' : ''}`}
          >
            {caixaAtual?.status === 'ABERTO' ? 'Ver Saldo' : 'Abrir'}
          </button>
        </div>

        {/* Navigation list without icons */}
        <nav aria-label="Navegação principal" className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-2 space-y-1 overflow-y-auto`}>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const active = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? 'md:justify-center md:px-0' : 'justify-between px-3.5'} gap-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-50 text-cyan-900 border-l-4 border-cyan-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={`min-w-0 flex-1 text-left ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold ${collapsed ? 'md:hidden' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className={`p-3 ${collapsed ? 'md:px-2' : ''} border-t border-slate-200 bg-white`}>
          <div className={`flex items-center justify-between ${collapsed ? 'md:flex-col md:gap-2 md:p-1' : ''} p-2.5 rounded-lg bg-slate-50 border border-slate-200`}>
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
              type="button"
              onClick={logout}
              title="Encerrar Sessão"
              aria-label="Encerrar sessão"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
