import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Eye,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { PedidoCompra, Fornecedor, Produto } from '../types';

interface ItemForm {
  produtoId: string;
  produtoNome: string;
  sku: string;
  unidade: string;
  quantidade: number;
  custoUnitario: number;
  subtotal: number;
}

export const ComprasView: React.FC = () => {
  const { success, error } = useToast();

  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filters
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'PENDENTE' | 'RECEBIDO' | 'CANCELADO'>('TODOS');

  // Modal Novo Pedido
  const [modalNovo, setModalNovo] = useState(false);
  const [fornecedorId, setFornecedorId] = useState('');
  const [numeroNota, setNumeroNota] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);

  // Item Draft in modal
  const [draftProdutoId, setDraftProdutoId] = useState('');
  const [draftQtd, setDraftQtd] = useState('1');
  const [draftCusto, setDraftCusto] = useState('0.00');

  // Modal Detalhes
  const [modalDetalhes, setModalDetalhes] = useState<PedidoCompra | null>(null);

  // Action confirmations
  const [confirmarReceberId, setConfirmarReceberId] = useState<string | null>(null);
  const [confirmarCancelarId, setConfirmarCancelarId] = useState<string | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [comprasRes, fornRes, prodRes] = await Promise.all([
        api.getCompras(),
        api.getFornecedores(),
        api.getProdutos({ limite: 100 }),
      ]);
      setPedidos(comprasRes);
      setFornecedores(fornRes.filter((f) => f.ativo));
      setProdutos(prodRes.filter((p) => p.ativo));
    } catch (err: any) {
      error('Erro ao carregar dados de compras', err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // When selected product changes in draft, auto-fill unit cost
  const handleProdutoDraftChange = (prodId: string) => {
    setDraftProdutoId(prodId);
    const prod = produtos.find((p) => p.id === prodId);
    if (prod) {
      setDraftCusto(Number(prod.precoCusto || 0).toFixed(2));
    }
  };

  const handleAddItem = () => {
    if (!draftProdutoId) {
      error('Selecione um produto');
      return;
    }

    const prod = produtos.find((p) => p.id === draftProdutoId);
    if (!prod) return;

    const qtd = parseFloat(draftQtd);
    const custo = parseFloat(draftCusto);

    if (isNaN(qtd) || qtd <= 0) {
      error('Quantidade inválida');
      return;
    }

    if (isNaN(custo) || custo < 0) {
      error('Custo unitário inválido');
      return;
    }

    // Check if product is already in items
    if (itens.some((i) => i.produtoId === draftProdutoId)) {
      error('Produto já adicionado', 'Edite a quantidade ou remova o item da lista antes de adicionar novamente.');
      return;
    }

    const subtotal = Math.round(qtd * custo * 100) / 100;

    setItens([
      ...itens,
      {
        produtoId: prod.id,
        produtoNome: prod.nome,
        sku: prod.sku,
        unidade: prod.unidade,
        quantidade: qtd,
        custoUnitario: custo,
        subtotal,
      },
    ]);

    // Reset draft
    setDraftProdutoId('');
    setDraftQtd('1');
    setDraftCusto('0.00');
  };

  const handleRemoveItem = (produtoId: string) => {
    setItens(itens.filter((i) => i.produtoId !== produtoId));
  };

  const totalNovoPedido = itens.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCriarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedorId) {
      error('Selecione um fornecedor');
      return;
    }
    if (itens.length === 0) {
      error('Adicione ao menos um produto no pedido');
      return;
    }

    try {
      setProcessandoAcao(true);
      await api.createCompra({
        fornecedorId,
        numeroNota: numeroNota.trim() || undefined,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          custoUnitario: i.custoUnitario,
        })),
      });

      success('Pedido de compra criado com sucesso!');
      setModalNovo(false);
      setFornecedorId('');
      setNumeroNota('');
      setItens([]);
      await carregarDados();
    } catch (err: any) {
      error('Erro ao registrar pedido', err.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleReceberCompra = async (id: string) => {
    try {
      setProcessandoAcao(true);
      await api.receberCompra(id);
      success(
        'Mercadoria recebida!',
        'Estoque atualizado, novo custo gravado e despesa registrada no financeiro.'
      );
      setConfirmarReceberId(null);
      await carregarDados();
    } catch (err: any) {
      error('Erro ao receber mercadorias', err.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleCancelarCompra = async (id: string) => {
    try {
      setProcessandoAcao(true);
      await api.cancelarCompra(id);
      success('Pedido de compra cancelado');
      setConfirmarCancelarId(null);
      await carregarDados();
    } catch (err: any) {
      error('Erro ao cancelar pedido', err.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Filtered list
  const pedidosFiltrados = pedidos.filter((p) => {
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    const termo = busca.toLowerCase();
    const matchBusca =
      !termo ||
      p.numero.toLowerCase().includes(termo) ||
      (p.numeroNota && p.numeroNota.toLowerCase().includes(termo)) ||
      (p.fornecedor?.razaoSocial && p.fornecedor.razaoSocial.toLowerCase().includes(termo)) ||
      (p.fornecedor?.nomeFantasia && p.fornecedor.nomeFantasia.toLowerCase().includes(termo));

    return matchStatus && matchBusca;
  });

  // Totais para os KPIs
  const totalGeral = pedidos.reduce((acc, p) => acc + Number(p.valorTotal || 0), 0);
  const totalPendentes = pedidos.filter((p) => p.status === 'PENDENTE').length;
  const totalRecebidos = pedidos.filter((p) => p.status === 'RECEBIDO').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-['Syne'] tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-600" />
            Gestão de Compras & Entrada de Mercadorias
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emita pedidos para fornecedores e dê entrada no estoque com atualização automática de custo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarDados}
            disabled={carregando}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-700 ${carregando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button
            onClick={() => setModalNovo(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido de Compra</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
            TOTAL DE PEDIDOS
          </span>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">{pedidos.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Registrados no sistema</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase text-amber-700">
            PENDENTES DE RECEBIMENTO
          </span>
          <p className="text-2xl font-black font-mono text-amber-700 mt-1">{totalPendentes}</p>
          <p className="text-[11px] text-slate-500 mt-1">Aguardando entrega do fornecedor</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase text-emerald-700">
            PEDIDOS RECEBIDOS
          </span>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{totalRecebidos}</p>
          <p className="text-[11px] text-slate-500 mt-1">Mercadorias integradas ao estoque</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
            VOLUME TOTAL COMPRADO
          </span>
          <p className="text-2xl font-black font-mono text-cyan-800 mt-1">
            R$ {totalGeral.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Somatório de todas as aquisições</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por fornecedor, NF ou nº pedido..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-600 focus:bg-white text-slate-900 pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'PENDENTE', label: 'Pendentes' },
            { id: 'RECEBIDO', label: 'Recebidos' },
            { id: 'CANCELADO', label: 'Cancelados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filtroStatus === tab.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pedidos Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Nº PEDIDO / DATA</th>
                <th className="py-3 px-3">FORNECEDOR</th>
                <th className="py-3 px-3">NOTA FISCAL</th>
                <th className="py-3 px-3 text-center">ITENS</th>
                <th className="py-3 px-3">VALOR TOTAL</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carregando ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Carregando pedidos de compra...
                  </td>
                </tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum pedido de compra encontrado.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p) => {
                  const dataFormatada = new Date(p.criadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900">
                          #{p.numero.slice(0, 8)}
                        </span>
                        <p className="text-[11px] text-slate-500 font-mono">{dataFormatada}</p>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.fornecedor?.razaoSocial || p.fornecedor?.nomeFantasia || 'Fornecedor'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {p.numeroNota ? `NF ${p.numeroNota}` : '-'}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                        {p.itens?.length ?? '-'}
                      </td>

                      <td className="py-3 px-3 font-mono font-black text-slate-900">
                        R$ {Number(p.valorTotal || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-3">
                        {p.status === 'PENDENTE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                        {p.status === 'RECEBIDO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Recebido
                          </span>
                        )}
                        {p.status === 'CANCELADO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-100 text-rose-900 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Cancelado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setModalDetalhes(p)}
                            title="Ver detalhes"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {p.status === 'PENDENTE' && (
                            <>
                              <button
                                onClick={() => setConfirmarReceberId(p.id)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors cursor-pointer"
                              >
                                Receber
                              </button>
                              <button
                                onClick={() => setConfirmarCancelarId(p.id)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </>
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

      {/* MODAL NOVO PEDIDO DE COMPRA */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Novo Pedido de Compra
                </h3>
              </div>
              <button
                onClick={() => setModalNovo(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarPedido} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Header Fields: Fornecedor e Nota Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Fornecedor *
                  </label>
                  <select
                    value={fornecedorId}
                    onChange={(e) => setFornecedorId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 focus:border-cyan-600 text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium cursor-pointer"
                  >
                    <option value="">Selecione o fornecedor...</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.razaoSocial} {f.nomeFantasia ? `(${f.nomeFantasia})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Nº da Nota Fiscal (opcional)
                  </label>
                  <input
                    type="text"
                    value={numeroNota}
                    onChange={(e) => setNumeroNota(e.target.value)}
                    placeholder="Ex: 001.234"
                    className="w-full bg-white border border-slate-300 focus:border-cyan-600 text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Add Items Box */}
              <div className="bg-cyan-50/50 border border-cyan-100 p-4 rounded-xl space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-cyan-900 tracking-wider">
                  Adicionar Itens ao Pedido
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                      Produto
                    </label>
                    <select
                      value={draftProdutoId}
                      onChange={(e) => handleProdutoDraftChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-cyan-600 text-slate-900 px-3 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                    >
                      <option value="">Selecione um produto...</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.sku}) - {p.unidade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={draftQtd}
                      onChange={(e) => setDraftQtd(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-cyan-600 text-slate-900 px-2 py-1.5 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                      Custo Unit. (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={draftCusto}
                      onChange={(e) => setDraftCusto(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-cyan-600 text-slate-900 px-2 py-1.5 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">PRODUTO</th>
                      <th className="py-2.5 px-3 text-center">UNIDADE</th>
                      <th className="py-2.5 px-3 text-center">QUANTIDADE</th>
                      <th className="py-2.5 px-3">CUSTO UNIT.</th>
                      <th className="py-2.5 px-3">SUBTOTAL</th>
                      <th className="py-2.5 px-3 text-right">REMOVER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Nenhum produto adicionado ainda. Adicione itens acima.
                        </td>
                      </tr>
                    ) : (
                      itens.map((item) => (
                        <tr key={item.produtoId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900">{item.produtoNome}</span>
                            <span className="ml-2 font-mono text-[10px] text-slate-500">
                              ({item.sku})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {item.unidade}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {item.quantidade}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            R$ {item.custoUnitario.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            R$ {item.subtotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.produtoId)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer with Total */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-slate-500">
                    Total do Pedido:
                  </span>
                  <p className="text-xl font-black font-mono text-cyan-900">
                    R$ {totalNovoPedido.toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNovo(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={processandoAcao || itens.length === 0}
                    className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {processandoAcao ? 'Gravando...' : 'Confirmar Pedido de Compra'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO PEDIDO */}
      {modalDetalhes && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Detalhes do Pedido #{modalDetalhes.numero.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">
                  Emitido em {new Date(modalDetalhes.criadoEm).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setModalDetalhes(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-mono text-slate-500">Fornecedor:</span>
                  <p className="font-bold text-slate-900">
                    {modalDetalhes.fornecedor?.razaoSocial || modalDetalhes.fornecedor?.nomeFantasia || '-'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-slate-500">Nota Fiscal:</span>
                  <p className="font-bold font-mono text-slate-900">
                    {modalDetalhes.numeroNota ? `NF ${modalDetalhes.numeroNota}` : 'Não informada'}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-slate-500">Status Atual:</span>
                  <p className="font-bold uppercase font-mono">
                    {modalDetalhes.status}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-slate-500">Data de Recebimento:</span>
                  <p className="font-bold text-slate-900">
                    {modalDetalhes.recebidoEm
                      ? new Date(modalDetalhes.recebidoEm).toLocaleString('pt-BR')
                      : 'Ainda não recebido'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-slate-700 mb-2">
                  Itens Adquiridos
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">PRODUTO</th>
                        <th className="py-2.5 px-3 text-center">QUANTIDADE</th>
                        <th className="py-2.5 px-3">CUSTO UNIT.</th>
                        <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalDetalhes.itens?.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{it.produtoNome}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                            {Number(it.quantidade)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            R$ {Number(it.custoUnitario).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            R$ {Number(it.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0 mt-3">
              <div>
                <span className="text-xs font-mono text-slate-500">Valor Total:</span>
                <p className="text-lg font-black font-mono text-cyan-900">
                  R$ {Number(modalDetalhes.valorTotal).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhes(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE RECEBIMENTO */}
      {confirmarReceberId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-700 mb-3">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                Confirmar Recebimento de Mercadorias?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Ao confirmar o recebimento, o sistema irá automaticamente:
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5 mb-5 font-medium">
              <li>Dar entrada das quantidades no <strong>estoque físico</strong>.</li>
              <li>Atualizar o <strong>preço de custo</strong> dos produtos.</li>
              <li>Lançar a <strong>despesa correspondente</strong> no controle financeiro.</li>
            </ul>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmarReceberId(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={processandoAcao}
                onClick={() => handleReceberCompra(confirmarReceberId)}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {processandoAcao ? 'Processando...' : 'Confirmar Recebimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE CANCELAMENTO */}
      {confirmarCancelarId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-700 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                Cancelar Pedido de Compra?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Esta ação cancelará o pedido pendente. Nenhuma alteração no estoque ou no financeiro será efetuada.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmarCancelarId(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={processandoAcao}
                onClick={() => handleCancelarCompra(confirmarCancelarId)}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {processandoAcao ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
