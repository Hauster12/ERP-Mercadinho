import React, { useState, useEffect } from 'react';
import {
  Boxes,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { MovimentacaoEstoque, Produto } from '../types';

export const EstoqueView: React.FC = () => {
  const { error } = useToast();
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [produtoFiltro, setProdutoFiltro] = useState('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [movRes, prodRes] = await Promise.all([
        api.getMovimentacoes({ produtoId: produtoFiltro || undefined, limite: 100 }),
        api.getProdutos({ limite: 100 }),
      ]);
      setMovimentacoes(movRes);
      setProdutos(prodRes);
    } catch (err: any) {
      error('Erro ao listar movimentações', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [produtoFiltro]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 font-['Syne']">
              Kardex & Rastreabilidade de Estoque
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Histórico auditável de todas as entradas, saídas e ajustes de saldo
            </p>
          </div>
        </div>

        {/* Filter by product */}
        <div className="flex items-center gap-2">
          <select
            value={produtoFiltro}
            onChange={(e) => setProdutoFiltro(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-900 font-medium rounded-lg px-3 py-2 outline-none focus:border-cyan-600"
          >
            <option value="">Todos os produtos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.sku})
              </option>
            ))}
          </select>

          <button
            onClick={carregarDados}
            className="p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">DATA / HORA</th>
                <th className="py-3 px-3">PRODUTO</th>
                <th className="py-3 px-3">TIPO</th>
                <th className="py-3 px-3">ORIGEM</th>
                <th className="py-3 px-3">QUANTIDADE</th>
                <th className="py-3 px-3">OBSERVAÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Carregando movimentações...
                  </td>
                </tr>
              ) : movimentacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhuma movimentação de estoque encontrada.
                  </td>
                </tr>
              ) : (
                movimentacoes.map((m) => {
                  const entrada = m.tipo === 'ENTRADA';
                  const ajuste = m.tipo === 'AJUSTE';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(m.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {m.produto?.nome || 'Produto'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            entrada
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : ajuste
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {m.origem}
                      </td>
                      <td
                        className={`py-3 px-3 font-mono font-extrabold ${
                          entrada ? 'text-emerald-700' : ajuste ? 'text-amber-700' : 'text-rose-700'
                        }`}
                      >
                        {entrada ? `+${Number(m.quantidade)}` : `${Number(m.quantidade)}`}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {m.observacao || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
