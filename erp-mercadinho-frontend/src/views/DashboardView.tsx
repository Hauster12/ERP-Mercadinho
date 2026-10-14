import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DashboardData } from '../types';
import type { ActiveTab } from '../components/Navigation';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { error } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarMetricas = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      error('Erro ao carregar Dashboard', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Banner with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-['Syne'] tracking-tight">
            Painel de Desempenho Operacional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de faturamento, margem e giro de estoque em tempo real
          </p>
        </div>

        <button
          onClick={carregarMetricas}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-700 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Indicadores</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Hoje */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              FATURAMENTO HOJE
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">
            R$ {Number(data?.receitaHoje || 0).toFixed(2)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-700 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Fluxo de vendas consolidado</span>
          </div>
        </div>

        {/* Lucro Bruto Hoje */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              LUCRO BRUTO HOJE
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-amber-700 tracking-tight">
            R$ {Number(data?.lucroBrutoHoje || 0).toFixed(2)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>Receita menos custo dos produtos</span>
          </div>
        </div>

        {/* Quantidade de Vendas */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              VENDAS REALIZADAS
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">
            {data?.vendasHoje || 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>Cupons emitidos no turno</span>
          </div>
        </div>

        {/* Produtos Ativos */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              PRODUTOS NO CATÁLOGO
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 tracking-tight">
            {data?.produtosAtivos || 0}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span>Itens aptos para venda</span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('pdv')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs group flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
              Abrir PDV
            </p>
            <p className="text-[10px] text-slate-500">Caixa rápido</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => setActiveTab('caixa')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs group flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              Gestão de Caixa
            </p>
            <p className="text-[10px] text-slate-500">Sangrias e fechamento</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => setActiveTab('produtos')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs group flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
              Cadastrar Produto
            </p>
            <p className="text-[10px] text-slate-500">Novo SKU / preço</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs group flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Financeiro
            </p>
            <p className="text-[10px] text-slate-500">Contas a pagar</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Low Stock Priority Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 font-['Syne'] tracking-wide">
              ALERTAS DE REPOSIÇÃO (ESTOQUE BAIXO)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {data?.estoqueBaixo?.length || 0} produtos críticos
          </span>
        </div>

        {(!data?.estoqueBaixo || data.estoqueBaixo.length === 0) ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum produto em nível crítico de estoque no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">PRODUTO</th>
                  <th className="py-2.5 px-3">ESTOQUE ATUAL</th>
                  <th className="py-2.5 px-3">ESTOQUE MÍNIMO</th>
                  <th className="py-2.5 px-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.estoqueBaixo.map((item) => {
                  const esgotado = Number(item.estoqueAtual) <= 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">{item.sku}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{item.nome}</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-600">
                        {Number(item.estoqueAtual)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {Number(item.estoqueMinimo)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            esgotado
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {esgotado ? 'Esgotado' : 'Reposição'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
