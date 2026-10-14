import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Produto, Categoria } from '../types';

export const ProdutosView: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const isAdmin = user?.perfil === 'ADMIN';

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Modals
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null);

  const [modalEstoqueAberto, setModalEstoqueAberto] = useState(false);
  const [produtoParaEstoque, setProdutoParaEstoque] = useState<Produto | null>(null);
  const [tipoMovimento, setTipoMovimento] = useState<'ENTRADA' | 'AJUSTE'>('ENTRADA');
  const [qtdMovimento, setQtdMovimento] = useState('10');
  const [obsMovimento, setObsMovimento] = useState('Entrada de mercadoria');

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCodigoBarras, setFormCodigoBarras] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState('');
  const [formUnidade, setFormUnidade] = useState('UN');
  const [formPrecoCusto, setFormPrecoCusto] = useState('1.00');
  const [formPrecoVenda, setFormPrecoVenda] = useState('2.00');
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState('5');
  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProdutos({ limite: 100 }),
        api.getCategorias(),
      ]);
      setProdutos(prodRes);
      setCategorias(catRes);
      if (catRes.length > 0 && !formCategoriaId) {
        setFormCategoriaId(catRes[0].id);
      }
    } catch (err: any) {
      error('Erro ao listar produtos', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirModalCriar = () => {
    setEditandoProduto(null);
    setFormNome('');
    setFormSku(`SKU-${Date.now().toString().slice(-4)}`);
    setFormCodigoBarras('');
    setFormUnidade('UN');
    setFormPrecoCusto('2.00');
    setFormPrecoVenda('5.00');
    setFormEstoqueMinimo('5');
    if (categorias.length > 0) setFormCategoriaId(categorias[0].id);
    setModalProdutoAberto(true);
  };

  const abrirModalEditar = (prod: Produto) => {
    setEditandoProduto(prod);
    setFormNome(prod.nome);
    setFormSku(prod.sku);
    setFormCodigoBarras(prod.codigoBarras || '');
    setFormCategoriaId(prod.categoriaId);
    setFormUnidade(prod.unidade || 'UN');
    setFormPrecoCusto(String(prod.precoCusto));
    setFormPrecoVenda(String(prod.precoVenda));
    setFormEstoqueMinimo(String(prod.estoqueMinimo));
    setModalProdutoAberto(true);
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome || !formSku || !formCategoriaId) {
      warning('Preencha os campos obrigatórios', 'Nome, SKU e Categoria');
      return;
    }

    try {
      setSalvando(true);
      const payload = {
        categoriaId: formCategoriaId,
        nome: formNome,
        sku: formSku,
        codigoBarras: formCodigoBarras || undefined,
        unidade: formUnidade,
        precoCusto: parseFloat(formPrecoCusto) || 0,
        precoVenda: parseFloat(formPrecoVenda) || 0,
        estoqueMinimo: parseFloat(formEstoqueMinimo) || 0,
        ativo: true,
      };

      if (editandoProduto) {
        await api.updateProduto(editandoProduto.id, payload);
        success('Produto atualizado com sucesso!');
      } else {
        await api.createProduto(payload);
        success('Produto cadastrado com sucesso!');
      }

      setModalProdutoAberto(false);
      carregarDados();
    } catch (err: any) {
      error('Falha ao salvar produto', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleInativar = async (prod: Produto) => {
    if (!confirm(`Deseja inativar o produto "${prod.nome}"?`)) return;
    try {
      await api.inativarProduto(prod.id);
      success('Produto inativado');
      carregarDados();
    } catch (err: any) {
      error('Erro ao inativar produto', err.message);
    }
  };

  const abrirModalEstoque = (prod: Produto) => {
    setProdutoParaEstoque(prod);
    setTipoMovimento('ENTRADA');
    setQtdMovimento('10');
    setObsMovimento('Entrada de mercadoria manual');
    setModalEstoqueAberto(true);
  };

  const handleSalvarEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoParaEstoque) return;

    try {
      setSalvando(true);
      await api.registrarMovimentacao({
        produtoId: produtoParaEstoque.id,
        tipo: tipoMovimento,
        quantidade: parseFloat(qtdMovimento) || 0,
        observacao: obsMovimento,
      });
      success('Movimentação registrada com sucesso!');
      setModalEstoqueAberto(false);
      carregarDados();
    } catch (err: any) {
      error('Falha na movimentação de estoque', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = categoriaFiltro === 'todas' || p.categoriaId === categoriaFiltro;
    const q = busca.toLowerCase().trim();
    const matchBusca =
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.includes(q));
    return matchCat && matchBusca;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 font-['Syne']">
              Gestão de Produtos & Inventário
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {produtos.length} produtos cadastrados no sistema
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={abrirModalCriar}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NOVO PRODUTO</span>
          </button>
        )}
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 pl-9 pr-3.5 py-2 rounded-lg text-xs outline-none transition-colors"
          />
        </div>

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="w-full sm:w-56 bg-slate-50 border border-slate-300 text-xs text-slate-900 font-medium rounded-lg px-3 py-2 outline-none focus:border-cyan-600"
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">PRODUTO</th>
                <th className="py-3 px-3">CÓD. BARRAS</th>
                <th className="py-3 px-3">CATEGORIA</th>
                <th className="py-3 px-3">CUSTO</th>
                <th className="py-3 px-3">VENDA</th>
                <th className="py-3 px-3">MARGEM</th>
                <th className="py-3 px-3">ESTOQUE</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Carregando tabela de produtos...
                  </td>
                </tr>
              ) : produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((prod) => {
                  const custo = Number(prod.precoCusto);
                  const venda = Number(prod.precoVenda);
                  const margem = custo > 0 ? (((venda - custo) / custo) * 100).toFixed(1) : '100';
                  const baixoEstoque = Number(prod.estoqueAtual) <= Number(prod.estoqueMinimo);

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-600">{prod.sku}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{prod.nome}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {prod.codigoBarras || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {prod.categoria?.nome || prod.categoriaNome || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        R$ {custo.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-amber-700">
                        R$ {venda.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-700">
                        +{margem}%
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            baixoEstoque
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'text-slate-800'
                          }`}
                        >
                          {Number(prod.estoqueAtual)} {prod.unidade}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            prod.ativo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {prod.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => abrirModalEstoque(prod)}
                              title="Ajustar / Lançar Estoque"
                              className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => abrirModalEditar(prod)}
                              title="Editar Produto"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && prod.ativo && (
                            <button
                              onClick={() => handleInativar(prod)}
                              title="Inativar Produto"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalProdutoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                {editandoProduto ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setModalProdutoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarProduto} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Arroz Tipo 1 - 1kg"
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Ex: ARROZ-001"
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Código de Barras (EAN)
                  </label>
                  <input
                    type="text"
                    value={formCodigoBarras}
                    onChange={(e) => setFormCodigoBarras(e.target.value)}
                    placeholder="Ex: 7891234567890"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="L">L (Litro)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="PCT">PCT (Pacote)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Preço Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecoCusto}
                    onChange={(e) => setFormPrecoCusto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Preço Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrecoVenda}
                    onChange={(e) => setFormPrecoVenda(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formEstoqueMinimo}
                    onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalProdutoAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {modalEstoqueAberto && produtoParaEstoque && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Lançamento de Estoque
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Item: <span className="text-cyan-800 font-bold">{produtoParaEstoque.nome}</span>
                </p>
              </div>
              <button
                onClick={() => setModalEstoqueAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEstoque} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Tipo de Operação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMovimento('ENTRADA')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      tipoMovimento === 'ENTRADA'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    ENTRADA (+ QTD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoMovimento('AJUSTE')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      tipoMovimento === 'AJUSTE'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    AJUSTE FÍSICO
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  {tipoMovimento === 'ENTRADA' ? 'Quantidade a Adicionar' : 'Nova Contagem Física'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={qtdMovimento}
                  onChange={(e) => setQtdMovimento(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Justificativa / Observação
                </label>
                <input
                  type="text"
                  value={obsMovimento}
                  onChange={(e) => setObsMovimento(e.target.value)}
                  placeholder="Ex: Compra de lote, acerto de inventário"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEstoqueAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Gravando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
