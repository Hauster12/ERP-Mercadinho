import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Eye,
  Ban,
  X,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Venda } from '../types';

export const VendasView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isAdmin = user?.perfil === 'ADMIN';

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);

  // Cancel Modal
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [vendaParaCancelar, setVendaParaCancelar] = useState<Venda | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('Venda registrada por engano');
  const [cancelando, setCancelando] = useState(false);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      const lista = await api.getVendas({ limite: 100 });
      setVendas(lista);
    } catch (err: any) {
      error('Erro ao carregar vendas', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVendas();
  }, []);

  const verDetalhes = async (id: string) => {
    try {
      const v = await api.getVenda(id);
      setVendaSelecionada(v);
    } catch (err: any) {
      error('Erro ao carregar detalhe da venda', err.message);
    }
  };

  const handleCancelarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaParaCancelar) return;

    try {
      setCancelando(true);
      await api.cancelarVenda(vendaParaCancelar.id, motivoCancelamento);
      success('Venda cancelada com sucesso!');
      setModalCancelarAberto(false);
      setVendaParaCancelar(null);
      carregarVendas();
      if (vendaSelecionada?.id === vendaParaCancelar.id) {
        setVendaSelecionada(null);
      }
    } catch (err: any) {
      error('Falha ao cancelar venda', err.message);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 font-['Syne']">
              Histórico de Vendas & Cupons
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {vendas.length} operações registradas no sistema
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Carregando histórico de vendas...
          </div>
        ) : vendas.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nenhuma venda realizada até o momento.
          </div>
        ) : (
          vendas.map((v) => {
            const cancelada = v.status === 'CANCELADA';
            return (
              <article
                key={v.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {v.clienteNome || 'Consumidor Final'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(v.criadoEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                      cancelada
                        ? 'border-rose-200 bg-rose-100 text-rose-800'
                        : 'border-emerald-200 bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <p className="text-slate-500">Total</p>
                    <p className="mt-1 font-mono font-extrabold text-amber-700">
                      R$ {Number(v.valorTotal).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Desconto</p>
                    <p className="mt-1 font-mono font-semibold text-slate-700">
                      R$ {Number(v.desconto || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Operador</p>
                    <p className="mt-1 font-medium text-slate-800">
                      {v.usuarioNome || 'Operador'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => verDetalhes(v.id)}
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="h-4 w-4" />
                    Ver cupom
                  </button>
                  {isAdmin && !cancelada && (
                    <button
                      onClick={() => {
                        setVendaParaCancelar(v);
                        setModalCancelarAberto(true);
                      }}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Ban className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Sales Table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">DATA / HORA</th>
                <th className="py-3 px-3">OPERADOR</th>
                <th className="py-3 px-3">CLIENTE</th>
                <th className="py-3 px-3">TOTAL</th>
                <th className="py-3 px-3">DESCONTO</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Carregando histórico de vendas...
                  </td>
                </tr>
              ) : vendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma venda realizada até o momento.
                  </td>
                </tr>
              ) : (
                vendas.map((v) => {
                  const cancelada = v.status === 'CANCELADA';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(v.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {v.usuarioNome || 'Operador'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {v.clienteNome || 'Consumidor Final'}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-amber-700">
                        R$ {Number(v.valorTotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        R$ {Number(v.desconto || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            cancelada
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => verDetalhes(v.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Ver Cupom / Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && !cancelada && (
                            <button
                              onClick={() => {
                                setVendaParaCancelar(v);
                                setModalCancelarAberto(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Cancelar Venda"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SALE DETAILS MODAL */}
      {vendaSelecionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Cupom Detalhado da Venda
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  ID: {vendaSelecionada.id}
                </p>
              </div>
              <button
                onClick={() => setVendaSelecionada(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Receipt */}
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-mono space-y-3 text-slate-700">
              <div className="text-center border-b border-slate-200 pb-2">
                <p className="font-bold text-slate-900 tracking-widest">NEXUS ERP — COMPROVANTE</p>
                <p className="text-[10px] text-slate-500">
                  {vendaSelecionada.documentoFiscal?.mensagem || 'Sem valor fiscal'}
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>DATA / HORA:</span>
                  <span>{new Date(vendaSelecionada.criadoEm).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>OPERADOR:</span>
                  <span className="text-slate-900 font-bold">{vendaSelecionada.usuarioNome || 'Operador'}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="text-slate-900 font-bold">{vendaSelecionada.clienteNome || 'Consumidor Final'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase">ITENS:</p>
                {vendaSelecionada.itens?.map((it) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[200px] text-slate-800">
                      {it.quantidade}x {it.produtoNome}
                    </span>
                    <span className="text-slate-900 font-bold">R$ {Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Payments */}
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase">PAGAMENTO:</p>
                {vendaSelecionada.pagamentos?.map((p) => (
                  <div key={p.id} className="flex justify-between text-[11px]">
                    <span className="text-cyan-800 font-bold">{p.forma}</span>
                    <span className="text-slate-900 font-bold">R$ {Number(p.valor).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>TOTAL LIQUIDADO:</span>
                <span className="text-amber-700">
                  R$ {Number(vendaSelecionada.valorTotal).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setVendaSelecionada(null)}
                className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {modalCancelarAberto && vendaParaCancelar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-rose-700 font-['Syne']">
                Cancelar Venda
              </h3>
              <button
                onClick={() => setModalCancelarAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelarVenda} className="space-y-4">
              <p className="text-xs text-slate-700">
                Tem certeza que deseja cancelar a venda de{' '}
                <strong className="text-amber-800">
                  R$ {Number(vendaParaCancelar.valorTotal).toFixed(2)}
                </strong>
                ? Os itens retornarão automaticamente ao estoque.
              </p>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Justificativa de Cancelamento *
                </label>
                <input
                  type="text"
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-rose-500 text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCancelarAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={cancelando}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {cancelando ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
