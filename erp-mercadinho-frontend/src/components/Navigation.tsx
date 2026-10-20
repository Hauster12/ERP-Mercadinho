import React from 'react';
import { LogOut } from 'lucide-react';
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
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, caixaAtual, logout } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    adminOnly?: boolean;
    badge?: string;
  }> = [
    { id: 'pdv', label: 'PDV / Caixa Rápido', badge: 'PDV' },
    { id: 'dashboard', label: 'Dashboard', adminOnly: true },
    { id: 'produtos', label: 'Produtos & Estoque' },
    { id: 'compras', label: 'Compras & Pedidos', adminOnly: true },
    { id: 'caixa', label: 'Gestão de Caixa' },
    { id: 'vendas', label: 'Histórico de Vendas' },
    { id: 'estoque', label: 'Movimentações' },
    { id: 'financeiro', label: 'Financeiro', adminOnly: true },
    { id: 'cadastros', label: 'Cadastros Gerais' },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Uploaded Logo */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between w-full">
            <img
              src="/logo-full.png"
              alt="NexusERP"
              className="h-10 w-auto object-contain"
            />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
              PDV
            </span>
          </div>
        </div>

        {/* Cash register quick status banner */}
        <div className="mx-3 my-3 p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                caixaAtual?.status === 'ABERTO'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {caixaAtual?.status === 'ABERTO' ? 'Caixa Aberto' : 'Caixa Fechado'}
            </span>
          </div>
          <button
            onClick={() => handleSelect('caixa')}
            className="text-[11px] font-mono font-bold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer"
          >
            {caixaAtual?.status === 'ABERTO' ? 'Ver Saldo' : 'Abrir'}
          </button>
        </div>

        {/* Navigation list without icons */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-50 text-cyan-900 border-l-4 border-cyan-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.nome || 'Operador'}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {user?.perfil || 'FUNCIONARIO'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Encerrar Sessão"
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
