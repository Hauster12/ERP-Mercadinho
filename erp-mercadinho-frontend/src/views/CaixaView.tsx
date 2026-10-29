import React, { useState, useEffect } from 'react';
import {
  Vault,
  PlusCircle,
  MinusCircle,
  Lock,
  History,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Caixa } from '../types';

export const CaixaView: React.FC = () => {
  const { caixaAtual, refreshCaixa, user } = useAuth();
  const { success, error } = useToast();

  const [historicoCaixas, setHistoricoCaixas] = useState<Caixa[]>([]);
  const [caixaDetalhes, setCaixaDetalhes] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick Operation Modal (Sangria / Reforço)
  const [modalOperacaoAberto, setModalOperacaoAberto] = useState(false);
  const [tipoOperacao, setTipoOperacao] = useState<'SANGRIA' | 'REFORCO'>('SANGRIA');
  const [valorOperacao, setValorOperacao] = useState('');
  const [obsOperacao, setObsOperacao] = useState('');
  const [salvandoOp, setSalvandoOp] = useState(false);

  // Close Cash Register Modal
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [valorFinalContado, setValorFinalContado] = useState('');
  const [obsFechamento, setObsFechamento] = useState('Conferência de turno');
  const [fechando, setFechando] = useState(false);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const lista = await api.getCaixas();
      setHistoricoCaixas(lista);
      if (caixaAtual) {
        const det = await api.getCaixa(caixaAtual.id);
        setCaixaDetalhes(det);
      }
    } catch (err: any) {
      error('Erro ao listar caixas', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [caixaAtual?.id]);

  const abrirModalOperacao = (tipo: 'SANGRIA' | 'REFORCO') => {
    setTipoOperacao(tipo);
    setValorOperacao('20.00');
    setObsOperacao(tipo === 'SANGRIA' ? 'Sangria para cofre central' : 'Reforço de moedas/troco');
    setModalOperacaoAberto(true);
  };

  const handleSalvarOperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAtual) return;

    try {
      setSalvandoOp(true);
      const val = parseFloat(valorOperacao) || 0;
      await api.registrarOperacaoCaixa(caixaAtual.id, {
        tipo: tipoOperacao,
        valor: val,
        observacao: obsOperacao,
      });

      success(
        `${tipoOperacao === 'SANGRIA' ? 'Sangria' : 'Reforço'} realizado!`,
        `R$ ${val.toFixed(2)}`
      );
      setModalOperacaoAberto(false);
      await refreshCaixa();
      carregarHistorico();
    } catch (err: any) {
      error('Falha na operação de caixa', err.message);
    } finally {
      setSalvandoOp(false);
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAtual) return;

    try {
      setFechando(true);
      const valorFinal = parseFloat(valorFinalContado) || 0;
      await api.fecharCaixa(caixaAtual.id, {
        valorFinal,
        observacao: obsFechamento,
      });

      success('Caixa fechado com sucesso!');
      setModalFechamentoAberto(false);
      await refreshCaixa();
      carregarHistorico();
    } catch (err: any) {
      error('Erro ao fechar caixa', err.message);
    } finally {
      setFechando(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6">
      {/* Current Cash Register Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Vault className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 font-['Syne']">
                  Turno de Caixa Atual
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    caixaAtual?.status === 'ABERTO'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {caixaAtual?.status === 'ABERTO' ? 'ABERTO' : 'FECHADO'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Operador: <span className="text-slate-800 font-bold">{user?.nome}</span> • Aberto em:{' '}
                {caixaAtual?.abertoEm
                  ? new Date(caixaAtual.abertoEm).toLocaleString('pt-BR')
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Cash Actions */}
          {caixaAtual?.status === 'ABERTO' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => abrirModalOperacao('REFORCO')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Reforço</span>
              </button>

              <button
                onClick={() => abrirModalOperacao('SANGRIA')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition-colors cursor-pointer"
              >
                <MinusCircle className="w-4 h-4" />
                <span>Sangria</span>
              </button>

              <button
                onClick={() => {
                  setValorFinalContado(String(caixaDetalhes?.saldoAtual || caixaAtual.valorInicial));
                  setModalFechamentoAberto(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Fechar Turno</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Balance Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Fundo Inicial</span>
            <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              R$ {Number(caixaAtual?.valorInicial || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Vendas no Turno</span>
            <p className="text-lg font-bold font-mono text-cyan-700 mt-0.5">
              R$ {Number(caixaDetalhes?.totalVendas || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Sangrias Realizadas</span>
            <p className="text-lg font-bold font-mono text-amber-700 mt-0.5">
              R$ {Number(caixaDetalhes?.totalSaidas || 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200">
            <span className="text-[10px] font-mono font-bold text-cyan-900 uppercase">Saldo em Gaveta</span>
            <p className="text-lg font-black font-mono text-cyan-800 mt-0.5">
              R$ {Number(caixaDetalhes?.saldoAtual || caixaAtual?.valorInicial || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Cash Turnovers */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Syne'] tracking-wide">
              HISTÓRICO DE TURNOS DE CAIXA
            </h3>
          </div>
          <button
            onClick={carregarHistorico}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">OPERADOR</th>
                <th className="py-2.5 px-3">ABERTURA</th>
                <th className="py-2.5 px-3">FECHAMENTO</th>
                <th className="py-2.5 px-3">VALOR INICIAL</th>
                <th className="py-2.5 px-3 text-right">VALOR FINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicoCaixas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Nenhum turno registrado.
                  </td>
                </tr>
              ) : (
                historicoCaixas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          c.status === 'ABERTO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {c.usuario?.nome || c.usuarioNome || 'Operador'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {new Date(c.abertoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {c.fechadoEm ? new Date(c.fechadoEm).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      R$ {Number(c.valorInicial).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right font-extrabold text-amber-700">
                      {c.valorFinal !== null && c.valorFinal !== undefined
                        ? `R$ ${Number(c.valorFinal).toFixed(2)}`
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SANGRIA / REFORÇO MODAL */}
      {modalOperacaoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                Registrar {tipoOperacao === 'SANGRIA' ? 'Sangria (Retirada)' : 'Reforço (Suprimento)'}
              </h3>
              <button
                onClick={() => setModalOperacaoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarOperacao} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Valor da Operação (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorOperacao}
                  onChange={(e) => setValorOperacao(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2.5 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={obsOperacao}
                  onChange={(e) => setObsOperacao(e.target.value)}
                  placeholder="Ex: Pagamento fornecedor, troco extra"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOperacaoAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoOp}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {salvandoOp ? 'Gravando...' : 'Confirmar Operação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FECHAMENTO DE CAIXA MODAL */}
      {modalFechamentoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                Fechamento & Conciliação de Turno
              </h3>
              <button
                onClick={() => setModalFechamentoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFecharCaixa} className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span>Saldo Teórico em Gaveta:</span>
                  <span className="text-cyan-800 font-bold">
                    R$ {Number(caixaDetalhes?.saldoAtual || caixaAtual?.valorInicial || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Valor Físico Contado na Gaveta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorFinalContado}
                  onChange={(e) => setValorFinalContado(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2.5 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Observações de Fechamento
                </label>
                <input
                  type="text"
                  value={obsFechamento}
                  onChange={(e) => setObsFechamento(e.target.value)}
                  placeholder="Conferência de fechamento"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFechamentoAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={fechando}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {fechando ? 'Processando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
