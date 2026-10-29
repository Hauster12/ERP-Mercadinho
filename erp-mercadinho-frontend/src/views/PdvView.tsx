import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  User,
  Sparkles,
  Printer,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Produto, Categoria, Cliente, PaymentMethod, RecadoOperador } from '../types';

interface CartItem {
  produto: Produto;
  quantidade: number;
}

export const PdvView: React.FC = () => {
  const { caixaAtual, refreshCaixa, user } = useAuth();
  const { success, error, warning } = useToast();

  // State
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');
  const [clienteId, setClienteId] = useState<string>('');

  // Cart
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [desconto, setDesconto] = useState<number>(0);

  // Payment
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>('DINHEIRO');
  const [valorRecebidoDinheiro, setValorRecebidoDinheiro] = useState<string>('');
  const [finalizando, setFinalizando] = useState(false);

  // Sale Success Modal
  const [vendaConcluida, setVendaConcluida] = useState<any | null>(null);

  // Open Cash Register State
  const [numeroCaixaEscolhido, setNumeroCaixaEscolhido] = useState<number>(1);
  const [valorInicialAbertura, setValorInicialAbertura] = useState('100.00');
  const [recadoTurnoAbertura, setRecadoTurnoAbertura] = useState<RecadoOperador | null>(null);
  const [carregandoRecadoAbertura, setCarregandoRecadoAbertura] = useState(false);
  const [abrindoCaixa, setAbrindoCaixa] = useState(false);

  // Monitor shift notes for the chosen register when cash is closed
  useEffect(() => {
    if (!caixaAtual || caixaAtual.status !== 'ABERTO') {
      let cancel = false;
      setCarregandoRecadoAbertura(true);
      api.getUltimoRecadoCaixa(numeroCaixaEscolhido)
        .then((rec) => {
          if (!cancel) setRecadoTurnoAbertura(rec);
        })
        .catch(() => {
          if (!cancel) setRecadoTurnoAbertura(null);
        })
        .finally(() => {
          if (!cancel) setCarregandoRecadoAbertura(false);
        });
      return () => {
        cancel = true;
      };
    }
  }, [caixaAtual?.status, numeroCaixaEscolhido]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, cliRes] = await Promise.all([
        api.getProdutos({ limite: 100 }),
        api.getCategorias(),
        api.getClientes(),
      ]);
      setProdutos(prodRes);
      setCategorias(catRes);
      setClientes(cliRes);
    } catch (err: any) {
      error('Erro ao carregar catálogo', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Search filter
  const produtosFiltrados = produtos.filter((p) => {
    if (!p.ativo) return false;
    const matchCat = categoriaAtiva === 'todas' || p.categoriaId === categoriaAtiva;
    const q = busca.toLowerCase().trim();
    const matchBusca =
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.includes(q));
    return matchCat && matchBusca;
  });

  // Handle Barcode scanner Enter press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const termo = busca.trim();
      if (!termo) return;

      const exato = produtos.find(
        (p) =>
          p.ativo &&
          (p.codigoBarras === termo || p.sku.toLowerCase() === termo.toLowerCase())
      );

      if (exato) {
        adicionarAoCarrinho(exato);
        setBusca('');
      } else if (produtosFiltrados.length === 1) {
        adicionarAoCarrinho(produtosFiltrados[0]);
        setBusca('');
      } else if (produtosFiltrados.length === 0) {
        warning('Produto não localizado', `Nenhum item com código ou SKU "${termo}"`);
      }
    }
  };

  // Cart operations
  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho((prev) => {
      const index = prev.findIndex((item) => item.produto.id === produto.id);
      if (index >= 0) {
        const novo = [...prev];
        const novaQtd = Number((novo[index].quantidade + 1).toFixed(3));
        novo[index] = { ...novo[index], quantidade: novaQtd };
        return novo;
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho((prev) =>
      prev
        .map((item) => {
          if (item.produto.id === produtoId) {
            const novaQtd = Number((item.quantidade + delta).toFixed(3));
            return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    setDesconto(0);
    setValorRecebidoDinheiro('');
  };

  // Calculations
  const subtotal = carrinho.reduce(
    (acc, item) => acc + Number(item.produto.precoVenda) * item.quantidade,
    0
  );
  const total = Math.max(0, subtotal - (Number(desconto) || 0));

  const valorRecebidoNum = parseFloat(valorRecebidoDinheiro) || total;
  const troco = Math.max(0, valorRecebidoNum - total);

  // Finalize Sale
  const handleFinalizarVenda = async () => {
    if (!caixaAtual || caixaAtual.status !== 'ABERTO') {
      error('Caixa fechado', 'Abra o caixa antes de realizar vendas.');
      return;
    }

    if (carrinho.length === 0) {
      warning('Carrinho vazio', 'Adicione pelo menos um produto para continuar.');
      return;
    }

    try {
      setFinalizando(true);

      const chaveIdempotencia = `vd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        caixaId: caixaAtual.id,
        clienteId: clienteId || undefined,
        chaveIdempotencia,
        desconto: Number(desconto) || 0,
        itens: carrinho.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        })),
        pagamentos: [
          {
            forma: metodoPagamento,
            valor: total,
          },
        ],
      };

      const venda = await api.finalizarVenda(payload);
      success('Venda concluída com sucesso!', `Total: R$ ${total.toFixed(2)}`);

      setVendaConcluida({
        ...venda,
        itensDetalhados: carrinho,
        troco: metodoPagamento === 'DINHEIRO' ? troco : 0,
        valorRecebido: metodoPagamento === 'DINHEIRO' ? valorRecebidoNum : total,
        forma: metodoPagamento,
      });

      limparCarrinho();
      carregarDados();
      refreshCaixa();
    } catch (err: any) {
      error('Falha ao concluir venda', err.message);
    } finally {
      setFinalizando(false);
    }
  };

  // Open cash register
  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAbrindoCaixa(true);
      const val = parseFloat(valorInicialAbertura) || 0;
      await api.abrirCaixa(val, numeroCaixaEscolhido);
      await refreshCaixa();
      success('Caixa aberto com sucesso!', `Caixa 0${numeroCaixaEscolhido} iniciado com R$ ${val.toFixed(2)}`);
    } catch (err: any) {
      error('Erro ao abrir caixa', err.message);
    } finally {
      setAbrindoCaixa(false);
    }
  };

  // If cash is not open, show Open Cash Register screen
  if (!caixaAtual || caixaAtual.status !== 'ABERTO') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[calc(100vh-5rem)]">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center mx-auto mb-5">
            <Receipt className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 font-['Syne'] tracking-tight">
            Caixa Operacional Fechado
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Selecione qual ponto de atendimento deseja operar e informe o fundo de troco para iniciar as vendas.
          </p>

          <form onSubmit={handleAbrirCaixa} className="mt-6 space-y-4">
            {/* Escolha entre Caixa 01 e Caixa 02 */}
            <div className="text-left">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                Ponto de Venda (Terminal) *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((num) => {
                  const ativo = numeroCaixaEscolhido === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumeroCaixaEscolhido(num)}
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

            {/* Shift Note for this specific register */}
            {carregandoRecadoAbertura ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center animate-pulse">
                Verificando avisos do turno anterior para Caixa 0{numeroCaixaEscolhido}...
              </div>
            ) : recadoTurnoAbertura?.mensagem ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Aviso do Turno Anterior (Caixa 0{numeroCaixaEscolhido}):</span>
                </div>
                <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">
                  {recadoTurnoAbertura.mensagem}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Operador: <strong>{recadoTurnoAbertura.usuarioNome}</strong></span>
                  <span>{new Date(recadoTurnoAbertura.criadoEm).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ) : null}

            <div className="text-left">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Fundo de Troco / Suprimento Inicial (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorInicialAbertura}
                  onChange={(e) => setValorInicialAbertura(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 pl-10 pr-3.5 py-3 rounded-lg text-lg font-mono outline-none transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={abrindoCaixa}
              className="w-full py-3.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{abrindoCaixa ? 'Abrindo Caixa...' : `Abrir Caixa 0${numeroCaixaEscolhido} e Iniciar Vendas`}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 pb-28 sm:p-3 sm:pb-5 lg:p-5 flex flex-col xl:flex-row gap-5 min-h-[calc(100vh-4rem)]">
      {/* LEFT COLUMN: Catalog & Rapid Barcode Search */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Rapid Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="relative">
            <Barcode className="w-5 h-5 text-cyan-600 absolute left-3.5 top-3.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Código de barras, SKU ou nome do produto..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 pl-11 pr-24 py-3 rounded-lg text-sm outline-none transition-colors placeholder:text-slate-400 font-sans"
              autoFocus
            />
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-200 px-2 py-1 rounded border border-slate-300 font-bold">
              <span>[ENTER]</span>
            </div>
          </div>

          {/* Category Chips Filter */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoriaAtiva('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                categoriaAtiva === 'todas'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todos ({produtos.filter((p) => p.ativo).length})
            </button>
            {categorias
              .filter((c) => c.ativo)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    categoriaAtiva === cat.id
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat.nome}
                </button>
              ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3.5 overflow-y-auto max-h-[50dvh] sm:max-h-[calc(100vh-16rem)] xl:max-h-none shadow-xs">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Carregando catálogo de produtos...
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <span>Nenhum produto encontrado com os filtros atuais</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {produtosFiltrados.map((prod) => {
                const emFalta = Number(prod.estoqueAtual) <= 0;
                const baixoEstoque =
                  Number(prod.estoqueAtual) <= Number(prod.estoqueMinimo);

                return (
                  <button
                    key={prod.id}
                    onClick={() => adicionarAoCarrinho(prod)}
                    className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all text-left flex flex-col justify-between group relative overflow-hidden active:scale-[0.99] cursor-pointer"
                  >
                    {/* Top line: SKU & stock badge */}
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-[10px] font-mono text-slate-500 font-bold truncate max-w-[65%]">
                        {prod.sku}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          emFalta
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : baixoEstoque
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {Number(prod.estoqueAtual)} {prod.unidade}
                      </span>
                    </div>

                    {/* Product Name */}
                    <p className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2 mb-2 leading-tight">
                      {prod.nome}
                    </p>

                    {/* Price */}
                    <div className="w-full flex items-baseline justify-between mt-auto pt-1.5 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono font-bold">VALOR</span>
                      <span className="text-sm font-extrabold font-mono text-amber-700">
                        R$ {Number(prod.precoVenda).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Cart & Checkout Terminal */}
      <div className="w-full xl:w-[420px] 2xl:w-[460px] bg-white border border-slate-200 rounded-xl flex flex-col shadow-lg overflow-hidden shrink-0">
        {/* Terminal Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-900 font-['Syne'] tracking-wide">
              CUPOM FISCAL / CHECKOUT
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Customer Select */}
        <div className="p-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-600 font-medium"
            >
              <option value="">Consumidor Final (Não identificado)</option>
              {clientes
                .filter((c) => c.ativo)
                .map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nome} {cli.cpfCnpj ? `(${cli.cpfCnpj})` : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[220px] max-h-[350px]">
          {carrinho.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Barcode className="w-10 h-10 mb-2 opacity-30 text-cyan-600" />
              <p className="text-xs font-bold text-slate-600">Carrinho vazio</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bipe ou clique em um produto</p>
            </div>
          ) : (
            carrinho.map((item, idx) => {
              const itemTotal = Number(item.produto.precoVenda) * item.quantidade;

              return (
                <div
                  key={item.produto.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">#{idx + 1}</span>
                      <p className="font-bold text-slate-900 truncate">{item.produto.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>R$ {Number(item.produto.precoVenda).toFixed(2)} un</span>
                      <span>•</span>
                      <span className="text-cyan-700 font-bold">R$ {itemTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200">
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, -1)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-slate-900 px-1.5 min-w-[24px] text-center">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removerDoCarrinho(item.produto.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Financial Summary & Payment */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Subtotal & Discount row */}
          <div className="space-y-1.5 text-xs text-slate-600 font-mono border-b border-slate-200 pb-2.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-slate-900 font-bold">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Desconto (R$):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={desconto || ''}
                onChange={(e) => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-24 bg-white border border-slate-300 text-right text-slate-900 font-mono rounded px-2 py-0.5 outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          {/* Grand Total Callout */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-amber-800 uppercase">
                TOTAL A PAGAR
              </span>
              <p className="text-2xl font-black font-mono text-amber-700 tracking-tight">
                R$ {total.toFixed(2)}
              </p>
            </div>
            {carrinho.length > 0 && (
              <button
                onClick={limparCarrinho}
                className="text-[11px] font-mono text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
              >
                Cancelar Venda
              </button>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
                { id: 'PIX', label: 'PIX', icon: QrCode },
                { id: 'CARTAO_DEBITO', label: 'Débito', icon: CreditCard },
                { id: 'CARTAO_CREDITO', label: 'Crédito', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const active = metodoPagamento === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodoPagamento(m.id as PaymentMethod)}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Change Calculator */}
          {metodoPagamento === 'DINHEIRO' && total > 0 && (
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-mono font-semibold">Valor Recebido:</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1 text-slate-400 font-mono text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={valorRecebidoDinheiro}
                    onChange={(e) => setValorRecebidoDinheiro(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 text-right font-mono text-slate-900 rounded px-2 py-0.5 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              {/* Quick Bill shortcuts */}
              <div className="flex items-center gap-1">
                {[10, 20, 50, 100].map((nota) => (
                  <button
                    key={nota}
                    type="button"
                    onClick={() => setValorRecebidoDinheiro(String(nota))}
                    className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
                  >
                    R$ {nota}
                  </button>
                ))}
              </div>

              {/* Troco alert */}
              <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-semibold">Troco a Devolver:</span>
                <span className="font-extrabold text-cyan-800 text-sm">
                  R$ {troco.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Checkout Submit Button */}
          <button
            onClick={handleFinalizarVenda}
            disabled={finalizando || carrinho.length === 0}
            className="hidden sm:flex w-full py-3.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm tracking-wide transition-all shadow-md items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{finalizando ? 'Processando Venda...' : `FINALIZAR VENDA (R$ ${total.toFixed(2)})`}</span>
          </button>
        </div>
      </div>

      <div className="pdv-mobile-checkout">
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Total
          </span>
          <span className="block truncate text-lg font-black font-mono text-amber-700">
            R$ {total.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleFinalizarVenda}
          disabled={finalizando || carrinho.length === 0}
          className="min-h-12 flex-[1.5] rounded-lg bg-cyan-600 px-3 py-3 text-xs font-black text-white shadow-md transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {finalizando ? 'Processando...' : 'FINALIZAR VENDA'}
        </button>
      </div>

      {/* Sale Success Receipt Modal */}
      {vendaConcluida && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 font-['Syne']">
                Venda Registrada com Sucesso!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprovante interno sem valor fiscal emitido
              </p>
            </div>

            {/* Simulated Receipt Slip */}
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-mono space-y-2 text-slate-700">
              <div className="text-center border-b border-slate-200 pb-2">
                <p className="font-bold text-slate-900 tracking-widest">NEXUS ERP — MERCADINHO</p>
                <p className="text-[10px] text-slate-500">DOCUMENTO NÃO FISCAL</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>OPERADOR:</span>
                  <span className="text-slate-900 font-bold">{user?.nome || 'Operador'}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATA / HORA:</span>
                  <span>{new Date().toLocaleTimeString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>FORMA:</span>
                  <span className="text-cyan-700 font-bold">{vendaConcluida.forma}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL PAGO:</span>
                  <span className="text-amber-700">R$ {Number(vendaConcluida.valorTotal).toFixed(2)}</span>
                </div>
                {vendaConcluida.troco > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>TROCO:</span>
                    <span>R$ {vendaConcluida.troco.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir Cupom</span>
              </button>
              <button
                onClick={() => setVendaConcluida(null)}
                className="flex-1 py-2.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Nova Venda</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
