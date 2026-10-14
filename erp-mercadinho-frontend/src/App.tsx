import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navigation, type ActiveTab } from './components/Navigation';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { PdvView } from './views/PdvView';
import { DashboardView } from './views/DashboardView';
import { ProdutosView } from './views/ProdutosView';
import { CaixaView } from './views/CaixaView';
import { VendasView } from './views/VendasView';
import { EstoqueView } from './views/EstoqueView';
import { FinanceiroView } from './views/FinanceiroView';
import { CadastrosView } from './views/CadastrosView';
import { api } from './services/api';
import { X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading, caixaAtual, refreshCaixa } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pdv');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Quick cash modal state triggered from Header
  const [quickCashModal, setQuickCashModal] = useState<'SANGRIA' | 'REFORCO' | null>(null);
  const [quickCashValor, setQuickCashValor] = useState('50.00');
  const [quickCashObs, setQuickCashObs] = useState('');
  const [submittingCash, setSubmittingCash] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-700 font-sans">
        <div className="relative mb-4">
          <img
            src="/logo-icon.png"
            alt="NexusERP"
            className="h-12 w-auto animate-pulse"
          />
        </div>
        <p className="text-xs font-mono uppercase tracking-widest text-cyan-800 font-bold">
          Inicializando NexusERP...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleQuickCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAtual || !quickCashModal) return;

    try {
      setSubmittingCash(true);
      const val = parseFloat(quickCashValor) || 0;
      await api.registrarOperacaoCaixa(caixaAtual.id, {
        tipo: quickCashModal,
        valor: val,
        observacao: quickCashObs || (quickCashModal === 'SANGRIA' ? 'Sangria rápida' : 'Reforço rápido'),
      });
      success(
        `${quickCashModal === 'SANGRIA' ? 'Sangria' : 'Reforço'} realizado!`,
        `R$ ${val.toFixed(2)}`
      );
      setQuickCashModal(null);
      await refreshCaixa();
    } catch (err: any) {
      error('Falha na operação', err.message);
    } finally {
      setSubmittingCash(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          onOpenQuickCashModal={(tipo) => {
            setQuickCashModal(tipo);
            setQuickCashValor('50.00');
            setQuickCashObs(tipo === 'SANGRIA' ? 'Sangria de caixa' : 'Reforço de troco');
          }}
        />

        <main className="flex-1 bg-[#F8FAFC]">
          {activeTab === 'pdv' && <PdvView />}
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'produtos' && <ProdutosView />}
          {activeTab === 'caixa' && <CaixaView />}
          {activeTab === 'vendas' && <VendasView />}
          {activeTab === 'estoque' && <EstoqueView />}
          {activeTab === 'financeiro' && <FinanceiroView />}
          {activeTab === 'cadastros' && <CadastrosView />}
        </main>
      </div>

      {/* QUICK CASH MODAL */}
      {quickCashModal && caixaAtual && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                {quickCashModal === 'SANGRIA' ? 'Registrar Sangria' : 'Registrar Reforço'}
              </h3>
              <button
                onClick={() => setQuickCashModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCashSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quickCashValor}
                  onChange={(e) => setQuickCashValor(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 text-slate-900 px-3 py-2 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-700 font-bold mb-1">
                  Observação
                </label>
                <input
                  type="text"
                  value={quickCashObs}
                  onChange={(e) => setQuickCashObs(e.target.value)}
                  placeholder="Justificativa da movimentação"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickCashModal(null)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCash}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingCash ? 'Gravando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
