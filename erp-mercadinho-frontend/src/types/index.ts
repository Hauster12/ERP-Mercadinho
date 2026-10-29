export type UserRole = 'ADMIN' | 'FUNCIONARIO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  ativo: boolean;
  avatarUrl?: string | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export type Unit = 'UN' | 'KG' | 'L' | 'CX' | 'PCT';

export interface Produto {
  id: string;
  categoriaId: string;
  categoria?: Categoria;
  categoriaNome?: string;
  fornecedorId?: string | null;
  nome: string;
  sku: string;
  codigoBarras?: string | null;
  unidade: Unit;
  precoCusto: number;
  precoVenda: number;
  estoqueMinimo: number;
  estoqueAtual: number;
  imagemUrl?: string | null;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  limiteCredito: number;
  ativo: boolean;
  totalComprado?: number;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  ativo: boolean;
}

export type CashStatus = 'ABERTO' | 'FECHADO';
export type CashOperationType = 'SANGRIA' | 'REFORCO' | 'ABERTURA' | 'FECHAMENTO';

export interface OperacaoCaixa {
  id: string;
  caixaId: string;
  usuarioId: string;
  usuario?: Usuario;
  tipo: CashOperationType;
  valor: number;
  observacao?: string | null;
  criadoEm: string;
}

export interface Caixa {
  id: string;
  numeroCaixa?: number;
  usuarioId: string;
  usuario?: Usuario;
  usuarioNome?: string;
  valorInicial: number;
  valorFinal?: number | null;
  abertoEm: string;
  fechadoEm?: string | null;
  status: CashStatus;
  operacoes?: OperacaoCaixa[];
  saldoAtual?: number;
  totalEntradas?: number;
  totalSaidas?: number;
  totalVendas?: number;
}

export type PaymentMethod = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';
export type SaleStatus = 'CONCLUIDA' | 'CANCELADA' | 'EM_ANDAMENTO';

export interface ItemVenda {
  id: string;
  vendaId: string;
  produtoId: string;
  produtoNome: string;
  produtoSku: string;
  quantidade: number;
  precoUnitario: number;
  custoUnitario: number;
  subtotal: number;
}

export interface Pagamento {
  id: string;
  forma: PaymentMethod;
  valor: number;
  confirmado: boolean;
  referenciaExterna?: string | null;
}

export interface Venda {
  id: string;
  caixaId: string;
  usuarioId: string;
  usuarioNome?: string;
  clienteId?: string | null;
  clienteNome?: string | null;
  subtotal: number;
  desconto: number;
  valorTotal: number;
  status: SaleStatus;
  chaveIdempotencia: string;
  motivoCancelamento?: string | null;
  canceladoEm?: string | null;
  criadoEm: string;
  itens?: ItemVenda[];
  pagamentos?: Pagamento[];
  documentoFiscal?: {
    tipo: string;
    status: string;
    numero: string;
    mensagem: string;
    emitidoEm: string;
  } | null;
}

export interface DashboardData {
  vendasHoje: number;
  receitaHoje: number;
  lucroBrutoHoje: number;
  produtosAtivos: number;
  estoqueBaixo: Array<{
    id: string;
    nome: string;
    sku: string;
    estoqueAtual: number;
    estoqueMinimo: number;
  }>;
  receitas?: number;
  despesas?: number;
}

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  produto?: Produto;
  usuarioId: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  origem: 'VENDA' | 'COMPRA' | 'INVENTARIO_MANUAL' | 'DEVOLUCAO' | 'PERDA';
  quantidade: number;
  custoUnitario?: number | null;
  observacao?: string | null;
  criadoEm: string;
}

export interface LancamentoFinanceiro {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  descricao: string;
  valor: number;
  vencimento: string;
  pagamentoEm?: string | null;
  status: 'PAGO' | 'PENDENTE' | 'CANCELADO';
  criadoEm: string;
}

export interface ItemPedidoCompra {
  id: string;
  pedidoCompraId: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  custoUnitario: number;
  subtotal: number;
}

export interface PedidoCompra {
  id: string;
  fornecedorId: string;
  fornecedor?: Fornecedor;
  numero: string;
  numeroNota?: string | null;
  valorTotal: number;
  status: 'PENDENTE' | 'RECEBIDO' | 'CANCELADO';
  criadoEm: string;
  recebidoEm?: string | null;
  itens?: ItemPedidoCompra[];
  usuario?: { nome: string };
}

export interface ConfiguracaoEmpresa {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  ambienteNFCe: string;
  impressoraPadrao: string;
}

export interface RecadoOperador {
  id: string;
  caixaId?: string;
  numeroCaixa?: number;
  usuarioNome: string;
  mensagem: string;
  criadoEm: string;
}

export interface AvisoAdmin {
  id: string;
  caixaId?: string;
  numeroCaixa?: number;
  usuarioNome: string;
  recadoAdmin: string;
  conferencia?: string;
  criadoEm: string;
}
