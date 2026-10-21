import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon
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
  const [tipoGrafico, setTipoGrafico] = useState<'barras' | 'pizza' | 'linhas'>('barras');

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
    <div className="p-3 sm:p-4 lg:p-6 space-y-5 sm:space-y-6">
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          onClick={() => setActiveTab('compras')}
          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs group flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
              Compras
            </p>
            <p className="text-[10px] text-slate-500">Entrada & pedidos</p>
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

      {/* Financial Chart Section */}
      {(() => {
        const receitas = Number(data?.receitas || 0);
        const despesas = Number(data?.despesas || 0);
        const saldoLiquido = receitas - despesas;
        const totalVolume = receitas + despesas;
        const percReceitas = totalVolume > 0 ? Math.round((receitas / totalVolume) * 100) : 0;
        const percDespesas = totalVolume > 0 ? Math.round((despesas / totalVolume) * 100) : 0;
        const maxVal = Math.max(receitas, despesas, Math.abs(saldoLiquido), 100);

        // Donut calculations
        const radius = 52;
        const circumference = 2 * Math.PI * radius;
        const receitasArc = totalVolume > 0 ? (receitas / totalVolume) * circumference : 0;
        const despesasArc = totalVolume > 0 ? (despesas / totalVolume) * circumference : 0;

        return (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne'] tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  Balanço Financeiro: Receitas vs Despesas
                </h3>
                <p className="text-xs text-slate-500">
                  Consolidação de entradas, saídas pagas e resultado líquido operacional
                </p>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  onClick={() => setTipoGrafico('barras')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    tipoGrafico === 'barras'
                      ? 'bg-white text-cyan-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Barras</span>
                </button>

                <button
                  onClick={() => setTipoGrafico('pizza')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    tipoGrafico === 'pizza'
                      ? 'bg-white text-cyan-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Pizza / Rosca</span>
                </button>

                <button
                  onClick={() => setTipoGrafico('linhas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    tipoGrafico === 'linhas'
                      ? 'bg-white text-cyan-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LineIcon className="w-3.5 h-3.5" />
                  <span>Linhas</span>
                </button>
              </div>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">
                    RECEITAS LIQUIDADAS
                  </span>
                  <p className="text-xl font-black font-mono text-emerald-900 mt-0.5">
                    R$ {receitas.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {percReceitas}% do total
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-800">
                    DESPESAS PAGAS
                  </span>
                  <p className="text-xl font-black font-mono text-rose-900 mt-0.5">
                    R$ {despesas.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    {percDespesas}% do total
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                saldoLiquido >= 0
                  ? 'bg-cyan-50/70 border-cyan-200/80'
                  : 'bg-rose-50/70 border-rose-200/80'
              }`}>
                <div>
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    saldoLiquido >= 0 ? 'text-cyan-800' : 'text-rose-800'
                  }`}>
                    SALDO LÍQUIDO OPERACIONAL
                  </span>
                  <p className={`text-xl font-black font-mono mt-0.5 ${
                    saldoLiquido >= 0 ? 'text-cyan-900' : 'text-rose-900'
                  }`}>
                    R$ {saldoLiquido.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    saldoLiquido >= 0
                      ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {saldoLiquido >= 0 ? '+ Superávit' : '- Déficit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="pt-2">
              {/* 1. GRÁFICO DE BARRAS */}
              {tipoGrafico === 'barras' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <div className="h-64 flex items-end justify-center gap-12 sm:gap-20 pt-8 pb-4 border-b border-slate-200 relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200" />
                    <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200" />

                    {/* Barra Receitas */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-20 sm:w-28 group">
                      <span className="font-mono text-xs font-bold text-emerald-800 group-hover:scale-110 transition-transform">
                        R$ {receitas.toFixed(2)}
                      </span>
                      <div
                        style={{
                          height: `${Math.max((receitas / maxVal) * 100, 8)}%`,
                        }}
                        className="w-full bg-linear-to-t from-emerald-600 to-emerald-400 rounded-t-lg shadow-sm group-hover:from-emerald-700 group-hover:to-emerald-500 transition-all duration-300 flex items-center justify-center text-white font-mono text-[11px] font-bold"
                      >
                        {percReceitas}%
                      </div>
                    </div>

                    {/* Barra Despesas */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-20 sm:w-28 group">
                      <span className="font-mono text-xs font-bold text-rose-800 group-hover:scale-110 transition-transform">
                        R$ {despesas.toFixed(2)}
                      </span>
                      <div
                        style={{
                          height: `${Math.max((despesas / maxVal) * 100, 8)}%`,
                        }}
                        className="w-full bg-linear-to-t from-rose-600 to-rose-400 rounded-t-lg shadow-sm group-hover:from-rose-700 group-hover:to-rose-500 transition-all duration-300 flex items-center justify-center text-white font-mono text-[11px] font-bold"
                      >
                        {percDespesas}%
                      </div>
                    </div>

                    {/* Barra Saldo Líquido */}
                    <div className="flex flex-col items-center gap-2 h-full justify-end w-20 sm:w-28 group">
                      <span className={`font-mono text-xs font-bold group-hover:scale-110 transition-transform ${
                        saldoLiquido >= 0 ? 'text-cyan-800' : 'text-rose-800'
                      }`}>
                        R$ {saldoLiquido.toFixed(2)}
                      </span>
                      <div
                        style={{
                          height: `${Math.max((Math.abs(saldoLiquido) / maxVal) * 100, 8)}%`,
                        }}
                        className={`w-full rounded-t-lg shadow-sm transition-all duration-300 flex items-center justify-center text-white font-mono text-[11px] font-bold ${
                          saldoLiquido >= 0
                            ? 'bg-linear-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-700 group-hover:to-cyan-500'
                            : 'bg-linear-to-t from-amber-600 to-amber-400 group-hover:from-amber-700 group-hover:to-amber-500'
                        }`}
                      >
                        {saldoLiquido >= 0 ? 'Líquido' : 'Déficit'}
                      </div>
                    </div>
                  </div>

                  {/* Labels underneath */}
                  <div className="flex items-center justify-center gap-12 sm:gap-20 pt-3 text-xs font-bold font-mono text-slate-700">
                    <span className="w-20 sm:w-28 text-center text-emerald-800">RECEITAS</span>
                    <span className="w-20 sm:w-28 text-center text-rose-800">DESPESAS</span>
                    <span className="w-20 sm:w-28 text-center text-cyan-800">MARGEM</span>
                  </div>
                </div>
              )}

              {/* 2. GRÁFICO DE PIZZA / ROSCA */}
              {tipoGrafico === 'pizza' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14">
                  {/* SVG Donut */}
                  <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                      {/* Background track circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        className="stroke-slate-200"
                        strokeWidth="20"
                        fill="transparent"
                      />

                      {totalVolume === 0 ? (
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          className="stroke-slate-300"
                          strokeWidth="20"
                          fill="transparent"
                        />
                      ) : (
                        <>
                          {/* Receitas Segment */}
                          <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            stroke="#10b981"
                            strokeWidth="20"
                            strokeDasharray={`${receitasArc} ${circumference}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-500"
                          />

                          {/* Despesas Segment */}
                          <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            stroke="#f43f5e"
                            strokeWidth="20"
                            strokeDasharray={`${despesasArc} ${circumference}`}
                            strokeDashoffset={`${-receitasArc}`}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-500"
                          />
                        </>
                      )}
                    </svg>

                    {/* Donut Center Info */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                        Resultado
                      </span>
                      <span className={`text-base font-black font-mono ${
                        saldoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        R$ {saldoLiquido.toFixed(0)}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">
                        {saldoLiquido >= 0 ? 'Positivo' : 'Negativo'}
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend & Details */}
                  <div className="space-y-4 max-w-sm w-full">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Receitas Liquidadas</p>
                          <p className="text-[11px] font-mono text-slate-500">Total de entradas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black font-mono text-emerald-700">
                          R$ {receitas.toFixed(2)}
                        </p>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {percReceitas}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Despesas Pagas</p>
                          <p className="text-[11px] font-mono text-slate-500">Total de saídas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black font-mono text-rose-700">
                          R$ {despesas.toFixed(2)}
                        </p>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {percDespesas}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. GRÁFICO DE LINHAS */}
              {tipoGrafico === 'linhas' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Receitas
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-700">
                        <span className="w-3 h-0.5 bg-rose-500 inline-block" /> Despesas
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-700">
                        <span className="w-3 h-0.5 bg-cyan-600 inline-block" /> Margem
                      </span>
                    </div>
                    <span>Visualização Comparativa</span>
                  </div>

                  <div className="relative h-56 w-full">
                    <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="500" y2="90" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#cbd5e1" />

                      {/* Area & Line Receitas */}
                      {(() => {
                        const yR = Math.max(150 - (receitas / maxVal) * 120, 20);
                        const dArea = `M 40,150 L 150,130 L 300,${Math.round(150 - (receitas / maxVal) * 70)} L 460,${Math.round(yR)} L 460,150 Z`;
                        const dLine = `M 40,150 L 150,130 L 300,${Math.round(150 - (receitas / maxVal) * 70)} L 460,${Math.round(yR)}`;
                        return (
                          <>
                            <path d={dArea} fill="url(#gradReceita)" />
                            <path d={dLine} fill="none" stroke="#10b981" strokeWidth="3" />
                            <circle cx="460" cy={yR} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                          </>
                        );
                      })()}

                      {/* Area & Line Despesas */}
                      {(() => {
                        const yD = Math.max(150 - (despesas / maxVal) * 120, 20);
                        const dArea = `M 40,150 L 150,140 L 300,${Math.round(150 - (despesas / maxVal) * 60)} L 460,${Math.round(yD)} L 460,150 Z`;
                        const dLine = `M 40,150 L 150,140 L 300,${Math.round(150 - (despesas / maxVal) * 60)} L 460,${Math.round(yD)}`;
                        return (
                          <>
                            <path d={dArea} fill="url(#gradDespesa)" />
                            <path d={dLine} fill="none" stroke="#f43f5e" strokeWidth="3" />
                            <circle cx="460" cy={yD} r="5" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                          </>
                        );
                      })()}

                      {/* Line Margem */}
                      {(() => {
                        const yM = Math.max(150 - (Math.max(saldoLiquido, 0) / maxVal) * 120, 20);
                        const dLine = `M 40,150 L 150,145 L 300,${Math.round(150 - (Math.max(saldoLiquido, 0) / maxVal) * 65)} L 460,${Math.round(yM)}`;
                        return (
                          <>
                            <path d={dLine} fill="none" stroke="#0891b2" strokeWidth="2" strokeDasharray="4 4" />
                            <circle cx="460" cy={yM} r="4" fill="#0891b2" />
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-200">
                    <span>Abertura do Período</span>
                    <span>Consolidação Parcial</span>
                    <span>Posição Atual (Hoje)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
