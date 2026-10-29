import React, { useState, useEffect } from 'react';
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
import { ComprasView } from './views/ComprasView';
import { CadastrosView } from './views/CadastrosView';
import { AvisarAdminView } from './views/AvisarAdminView';
import { api } from './services/api';
import type { AvisoAdmin, RecadoOperador } from './types';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  User,
  CheckCheck,
  AlertTriangle,
  Vault
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading, caixaAtual, refreshCaixa } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pdv');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cash Opening Modal state (triggered from Navigation or PDV)
  const [modalAbrirCaixaAberto, setModalAbrirCaixaAberto] = useState(false);
  const [abrirNumeroCaixa, setAbrirNumeroCaixa] = useState<number>(1);
  const [abrirValorInicial, setAbrirValorInicial] = useState<string>('100.00');
  const [submittingAbrirCaixa, setSubmittingAbrirCaixa] = useState(false);
  const [recadoCaixaModal, setRecadoCaixaModal] = useState<RecadoOperador | null>(null);
  const [carregandoRecadoModal, setCarregandoRecadoModal] = useState(false);

  // Quick cash modal state triggered from Header
  const [quickCashModal, setQuickCashModal] = useState<'SANGRIA' | 'REFORCO' | null>(null);
  const [quickCashValor, setQuickCashValor] = useState('50.00');
  const [quickCashObs, setQuickCashObs] = useState('');
  const [submittingCash, setSubmittingCash] = useState(false);

  // Admin Notices state
  const [avisosAdmin, setAvisosAdmin] = useState<AvisoAdmin[]>([]);
  const [modalAvisosAberto, setModalAvisosAberto] = useState(false);
  const [dispensandoAviso, setDispensandoAviso] = useState<string | null>(null);
  const [dispensandoTodos, setDispensandoTodos] = useState(false);

  // Operator Shift Notice state
  const [recadoOperador, setRecadoOperador] = useState<RecadoOperador | null>(null);
  const [modalRecadoOperadorAberto, setModalRecadoOperadorAberto] = useState(false);

  // Load Admin Notices periodically if user is ADMIN
  const carregarAvisosAdmin = async () => {
    if (user?.perfil !== 'ADMIN') return;
    try {
      const lista = await api.getAvisosAdmin();
      setAvisosAdmin(lista);

      // Auto-open modal once per batch of notices in current session
      if (lista.length > 0) {
        const sessionKey = 'nexus_admin_aviso_popup_dismissed_ids';
        const dismissed = sessionStorage.getItem(sessionKey) || '';
        const unreadIds = lista.map((a) => a.id).sort().join(',');
        if (dismissed !== unreadIds) {
          setModalAvisosAberto(true);
        }
      }
    } catch {
      // Ignora erro em caso de perda de conexão temporária
    }
  };

  useEffect(() => {
    if (user?.perfil === 'ADMIN') {
      carregarAvisosAdmin();
      const interval = setInterval(carregarAvisosAdmin, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Monitor shift notes for register selection in opening modal
  useEffect(() => {
    if (modalAbrirCaixaAberto) {
      let cancel = false;
      setCarregandoRecadoModal(true);
      api.getUltimoRecadoCaixa(abrirNumeroCaixa)
        .then((r) => {
          if (!cancel) setRecadoCaixaModal(r);
        })
        .catch(() => {
          if (!cancel) setRecadoCaixaModal(null);
        })
        .finally(() => {
          if (!cancel) setCarregandoRecadoModal(false);
        });
      return () => {
        cancel = true;
      };
    }
  }, [modalAbrirCaixaAberto, abrirNumeroCaixa]);

  // Load Shift note for active operator of this specific cash register
  const carregarUltimoRecado = async (num?: number) => {
    try {
      const recado = await api.getUltimoRecadoCaixa(num);
      if (recado && recado.mensagem) {
        const visto = localStorage.getItem(`nexus_recado_visto_${recado.id}`);
        if (!visto) {
          setRecadoOperador(recado);
          setModalRecadoOperadorAberto(true);
        }
      }
    } catch {
      // Ignora erro em caso de perda de conexão temporária
    }
  };

  useEffect(() => {
    if (user && caixaAtual?.status === 'ABERTO') {
      carregarUltimoRecado(caixaAtual.numeroCaixa || 1);
    }
  }, [user, caixaAtual?.id, caixaAtual?.numeroCaixa, caixaAtual?.status]);

  const handleAbrirCaixaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAbrirCaixa(true);
      const val = parseFloat(abrirValorInicial) || 0;
      await api.abrirCaixa(val, abrirNumeroCaixa);
      await refreshCaixa();
      success('Caixa aberto com sucesso!', `Caixa 0${abrirNumeroCaixa} iniciado com R$ ${val.toFixed(2)}`);
      setModalAbrirCaixaAberto(false);
    } catch (err: any) {
      error('Erro ao abrir caixa', err.message);
    } finally {
      setSubmittingAbrirCaixa(false);
    }
  };

  const handleDispensarAviso = async (id: string) => {
    try {
      setDispensandoAviso(id);
      await api.dispensarAvisoAdmin(id);
      setAvisosAdmin((prev) => prev.filter((a) => a.id !== id));
      success('Aviso marcado como ciente!');
    } catch (err: any) {
      error('Erro ao dispensar aviso', err.message);
    } finally {
      setDispensandoAviso(null);
    }
  };

  const handleDispensarTodosAvisos = async () => {
    try {
      setDispensandoTodos(true);
      await api.dispensarTodosAvisosAdmin();
      setAvisosAdmin([]);
      setModalAvisosAberto(false);
      success('Todos os avisos foram marcados como cientes!');
    } catch (err: any) {
      error('Erro ao dispensar avisos', err.message);
    } finally {
      setDispensandoTodos(false);
    }
  };

  const handleFecharModalAvisos = () => {
    const unreadIds = avisosAdmin.map((a) => a.id).sort().join(',');
    sessionStorage.setItem('nexus_admin_aviso_popup_dismissed_ids', unreadIds);
    setModalAvisosAberto(false);
  };

  const handleDispensarRecadoOperador = () => {
    if (recadoOperador) {
      localStorage.setItem(`nexus_recado_visto_${recadoOperador.id}`, 'true');
    }
    setModalRecadoOperadorAberto(false);
    setRecadoOperador(null);
  };

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
        onAbrirCaixaModal={() => setModalAbrirCaixaAberto(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          avisosAdminCount={avisosAdmin.length}
          onOpenAvisosAdmin={() => setModalAvisosAberto(true)}
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
          {activeTab === 'compras' && <ComprasView />}
          {activeTab === 'caixa' && <CaixaView />}
          {activeTab === 'vendas' && <VendasView />}
          {activeTab === 'estoque' && <EstoqueView />}
          {activeTab === 'financeiro' && <FinanceiroView />}
          {activeTab === 'cadastros' && <CadastrosView />}
          {activeTab === 'avisarAdmin' && <AvisarAdminView />}
        </main>
      </div>

      {/* MODAL DE AVISOS PARA O ADMINISTRADOR */}
      {modalAvisosAberto && user?.perfil === 'ADMIN' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Syne'] flex items-center gap-2">
                    Avisos e Solicitações dos Caixas
                    {avisosAdmin.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-200 text-amber-900">
                        {avisosAdmin.length} pendente{avisosAdmin.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mensagens enviadas pelos operadores durante o fechamento de caixa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFecharModalAvisos}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {avisosAdmin.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    Nenhum aviso pendente no momento
                  </p>
                  <p className="text-xs text-slate-400">
                    Todos os recados dos caixas já foram atendidos ou arquivados.
                  </p>
                </div>
              ) : (
                avisosAdmin.map((aviso) => (
                  <div
                    key={aviso.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
                          {aviso.numeroCaixa ? `Caixa 0${aviso.numeroCaixa}` : `Caixa #${aviso.caixaId ? aviso.caixaId.slice(0, 8) : 'Geral'}`}
                        </span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {aviso.usuarioNome}
                        </span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(aviso.criadoEm).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="bg-white border border-amber-200 rounded-lg p-3 text-slate-900 shadow-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-800 block mb-1">
                        📢 Solicitação / Recado para o Administrador:
                      </span>
                      <p className="text-sm font-medium whitespace-pre-wrap text-slate-900">
                        {aviso.recadoAdmin}
                      </p>
                    </div>

                    {aviso.conferencia && (
                      <p className="text-[11px] text-slate-500 italic">
                        Observação de conferência: {aviso.conferencia}
                      </p>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleDispensarAviso(aviso.id)}
                        disabled={dispensandoAviso === aviso.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {dispensandoAviso === aviso.id ? 'Marcando...' : 'Marcar como Ciente'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              {avisosAdmin.length > 0 && (
                <button
                  type="button"
                  onClick={handleDispensarTodosAvisos}
                  disabled={dispensandoTodos}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>
                    {dispensandoTodos ? 'Marcando...' : 'Marcar Todos como Cientes'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleFecharModalAvisos}
                className="ml-auto px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP DE RECADO PARA O PRÓXIMO OPERADOR DESTE CAIXA */}
      {modalRecadoOperadorAberto && recadoOperador && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Aviso do Turno Anterior {recadoOperador.numeroCaixa ? `(Caixa 0${recadoOperador.numeroCaixa})` : ''}
                </h3>
                <p className="text-xs text-slate-500">
                  Recado deixado pelo operador anterior deste caixa específico
                </p>
              </div>
              <button
                type="button"
                onClick={handleDispensarRecadoOperador}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Operador: <strong className="text-slate-900">{recadoOperador.usuarioNome}</strong>
              </span>
              <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(recadoOperador.criadoEm).toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 text-slate-900">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-800 block mb-1">
                💬 Mensagem / Observação:
              </span>
              <p className="text-sm font-medium whitespace-pre-wrap text-slate-800">
                {recadoOperador.mensagem}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDispensarRecadoOperador}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-colors"
              >
                Entendido, ciente do recado
              </button>
            </div>
          </div>
        </div>
      )}
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
      {/* MODAL GLOBAL DE ABERTURA DE CAIXA (ACIONADO PELO CARD 'ABRIR' DA BARRA LATERAL) */}
      {modalAbrirCaixaAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800">
                  <Vault className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                    Abertura de Turno de Caixa
                  </h3>
                  <p className="text-xs text-slate-500">Selecione o caixa e informe o suprimento inicial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbrirCaixaAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAbrirCaixaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-2">
                  Selecione o Caixa *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((num) => {
                    const ativo = abrirNumeroCaixa === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAbrirNumeroCaixa(num)}
                        className={`py-3 px-4 rounded-xl border text-sm font-bold font-mono transition-all cursor-pointer text-center ${
                          ativo
                            ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        Caixa 0{num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recado específico do caixa selecionado se houver */}
              {carregandoRecadoModal ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center animate-pulse">
                  Verificando avisos do turno anterior para Caixa 0{abrirNumeroCaixa}...
                </div>
              ) : recadoCaixaModal?.mensagem ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Aviso do Turno Anterior (Caixa 0{abrirNumeroCaixa}):</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">
                    {recadoCaixaModal.mensagem}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Deixado por <strong>{recadoCaixaModal.usuarioNome}</strong> em{' '}
                    {new Date(recadoCaixaModal.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Fundo de Troco Inicial (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={abrirValorInicial}
                  onChange={(e) => setAbrirValorInicial(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2.5 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbrirCaixaAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAbrirCaixa}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingAbrirCaixa ? 'Abrindo...' : `Abrir Caixa 0${abrirNumeroCaixa}`}
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
