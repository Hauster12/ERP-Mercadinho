import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { LancamentoFinanceiro, PedidoCompra, Fornecedor, Produto } from '../types';

export const FinanceiroView: React.FC = () => {
  const { success, error, warning } = useToast();

  const [abaAtiva, setAbaAtiva] = useState<'lancamentos' | 'compras'>('lancamentos');
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [compras, setCompras] = useState<PedidoCompra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // New Financial Entry Modal
  const [modalLancamentoAberto, setModalLancamentoAberto] = useState(false);
  const [formTipo, setFormTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState('150.00');
  const [formVencimento, setFormVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [salvando, setSalvando] = useState(false);

  // New Purchase Order Modal
  const [modalCompraAberto, setModalCompraAberto] = useState(false);
  const [compraFornecedorId, setCompraFornecedorId] = useState('');
  const [compraProdutoId, setCompraProdutoId] = useState('');
  const [compraQtd, setCompraQtd] = useState('10');
  const [compraCusto, setCompraCusto] = useState('3.00');
  const [compraNota, setCompraNota] = useState('');

  const carregarDados = async () => {
    try {
      const [lancRes, compRes, fornRes, prodRes] = await Promise.all([
        api.getFinanceiro(),
        api.getCompras(),
        api.getFornecedores(),
        api.getProdutos({ limite: 100 }),
      ]);
      setLancamentos(lancRes);
      setCompras(compRes);
      setFornecedores(fornRes);
      setProdutos(prodRes);
      if (fornRes.length > 0) setCompraFornecedorId(fornRes[0].id);
      if (prodRes.length > 0) setCompraProdutoId(prodRes[0].id);
    } catch (err: any) {
      error('Erro ao carregar dados financeiros', err.message);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvarLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescricao || !formValor) {
      warning('Preencha os campos obrigatórios');
      return;
    }

    try {
      setSalvando(true);
      await api.createLancamento({
        tipo: formTipo,
        descricao: formDescricao,
        valor: parseFloat(formValor) || 0,
        vencimento: new Date(formVencimento).toISOString(),
      });
      success('Lançamento registrado com sucesso!');
      setModalLancamentoAberto(false);
      setFormDescricao('');
      carregarDados();
    } catch (err: any) {
      error('Erro ao criar lançamento', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handlePagarLancamento = async (id: string) => {
    try {
      await api.pagarLancamento(id);
      success('Lançamento baixado como PAGO!');
      carregarDados();
    } catch (err: any) {
      error('Erro ao baixar lançamento', err.message);
    }
  };

  const handleSalvarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compraFornecedorId || !compraProdutoId) {
      warning('Selecione o fornecedor e o produto');
      return;
    }

    try {
      setSalvando(true);
      await api.createCompra({
        fornecedorId: compraFornecedorId,
        numeroNota: compraNota || undefined,
        itens: [
          {
            produtoId: compraProdutoId,
            quantidade: parseFloat(compraQtd) || 1,
            custoUnitario: parseFloat(compraCusto) || 1,
          },
        ],
      });
      success('Pedido de compra criado com sucesso!');
      setModalCompraAberto(false);
      carregarDados();
    } catch (err: any) {
      error('Erro ao criar pedido de compra', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleReceberCompra = async (id: string) => {
    try {
      await api.receberCompra(id);
      success('Mercadorias recebidas!', 'Estoque atualizado e despesa lançada.');
      carregarDados();
    } catch (err: any) {
      error('Erro ao receber compra', err.message);
    }
  };

  // Calculations
  const totalReceitas = lancamentos
    .filter((l) => l.tipo === 'RECEITA' && l.status === 'PAGO')
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const totalDespesas = lancamentos
    .filter((l) => l.tipo === 'DESPESA' && l.status === 'PAGO')
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Financial Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-bold mb-2">
            <span>RECEITAS PAGAS</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700">
            R$ {totalReceitas.toFixed(2)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-bold mb-2">
            <span>DESPESAS PAGAS</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700">
            R$ {totalDespesas.toFixed(2)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-bold mb-2">
            <span>SALDO LÍQUIDO</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p
            className={`text-xl font-black font-mono ${
              saldoLiquido >= 0 ? 'text-cyan-800' : 'text-rose-700'
            }`}
          >
            R$ {saldoLiquido.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAbaAtiva('lancamentos')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              abaAtiva === 'lancamentos'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Lançamentos (Contas a Pagar/Receber)
          </button>
          <button
            onClick={() => setAbaAtiva('compras')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              abaAtiva === 'compras'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Pedidos de Compra a Fornecedores
          </button>
        </div>

        {abaAtiva === 'lancamentos' ? (
          <button
            onClick={() => setModalLancamentoAberto(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        ) : (
          <button
            onClick={() => setModalCompraAberto(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Pedido de Compra</span>
          </button>
        )}
      </div>

      {/* Content */}
      {abaAtiva === 'lancamentos' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">TIPO</th>
                  <th className="py-3 px-3">DESCRIÇÃO</th>
                  <th className="py-3 px-3">VALOR</th>
                  <th className="py-3 px-3">VENCIMENTO</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lancamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum lançamento financeiro registrado.
                    </td>
                  </tr>
                ) : (
                  lancamentos.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            l.tipo === 'RECEITA'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {l.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{l.descricao}</td>
                      <td
                        className={`py-3 px-3 font-mono font-extrabold ${
                          l.tipo === 'RECEITA' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        R$ {Number(l.valor).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(l.vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            l.status === 'PAGO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : l.status === 'PENDENTE'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {l.status === 'PENDENTE' && (
                          <button
                            onClick={() => handlePagarLancamento(l.id)}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Dar Baixa (Pagar)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nº PEDIDO</th>
                  <th className="py-3 px-3">FORNECEDOR</th>
                  <th className="py-3 px-3">VALOR TOTAL</th>
                  <th className="py-3 px-3">DATA</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compras.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum pedido de compra registrado.
                    </td>
                  </tr>
                ) : (
                  compras.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 font-bold">{c.numero.slice(0, 8)}...</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {c.fornecedor?.razaoSocial || 'Fornecedor'}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-amber-700">
                        R$ {Number(c.valorTotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(c.criadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            c.status === 'RECEBIDO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : c.status === 'PENDENTE'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {c.status === 'PENDENTE' && (
                          <button
                            onClick={() => handleReceberCompra(c.id)}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Receber Mercadorias
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW ENTRY MODAL */}
      {modalLancamentoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                Novo Lançamento Financeiro
              </h3>
              <button
                onClick={() => setModalLancamentoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarLancamento} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTipo('DESPESA')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      formTipo === 'DESPESA'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    DESPESA (CONTA A PAGAR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTipo('RECEITA')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      formTipo === 'RECEITA'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    RECEITA (A RECEBER)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Conta de energia elétrica, aluguel"
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={formVencimento}
                    onChange={(e) => setFormVencimento(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalLancamentoAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW PURCHASE ORDER MODAL */}
      {modalCompraAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                Novo Pedido de Compra
              </h3>
              <button
                onClick={() => setModalCompraAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarCompra} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Fornecedor *
                </label>
                <select
                  value={compraFornecedorId}
                  onChange={(e) => setCompraFornecedorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                >
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Produto a Adquirir *
                </label>
                <select
                  value={compraProdutoId}
                  onChange={(e) => setCompraProdutoId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={compraQtd}
                    onChange={(e) => setCompraQtd(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                    Custo Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={compraCusto}
                    onChange={(e) => setCompraCusto(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCompraAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Gerando...' : 'Criar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
