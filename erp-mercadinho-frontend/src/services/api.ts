import type {
  Usuario,
  Categoria,
  Produto,
  Cliente,
  Fornecedor,
  Caixa,
  Venda,
  DashboardData,
  MovimentacaoEstoque,
  LancamentoFinanceiro,
  PedidoCompra,
  ConfiguracaoEmpresa,
  RecadoOperador,
  AvisoAdmin
} from '../types';

export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

let currentToken: string | null = localStorage.getItem('nexus_erp_token');

export const api = {
  getToken(): string | null {
    return currentToken;
  },

  setToken(token: string | null) {
    currentToken = token;
    if (token) {
      localStorage.setItem('nexus_erp_token', token);
    } else {
      localStorage.removeItem('nexus_erp_token');
    }
  },

  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (netErr: any) {
      console.error(`[API Network Error] ${method} ${path}:`, netErr);
      throw new Error(
        `Sem conexão com o servidor (${BASE_URL}). Verifique se o backend está em execução.`
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new Event('api:unauthorized'));
      }
      const message = Array.isArray(data?.message)
        ? data.message.join('; ')
        : data?.message || `Falha na requisição (${response.status})`;
      throw new Error(message);
    }

    return data as T;
  },

  // Auth
  async login(email: string, senha: string) {
    const data = await this.request<{
      accessToken: string;
      usuario: Usuario;
      usuarioNome?: string;
    }>('/auth/login', 'POST', { email, senha });

    this.setToken(data.accessToken);
    return data.usuario;
  },

  async getMe() {
    return this.request<Usuario>('/auth/me');
  },

  logout() {
    this.setToken(null);
  },

  // Dashboard
  async getDashboard() {
    return this.request<DashboardData>('/dashboard');
  },

  // Produtos
  async getProdutos(params?: { busca?: string; pagina?: number; limite?: number }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set('busca', params.busca);
    if (params?.pagina) query.set('pagina', String(params.pagina));
    if (params?.limite) query.set('limite', String(Math.min(params.limite, 100)));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Produto[]>(`/produtos${qs}`);
  },

  async getProduto(id: string) {
    return this.request<Produto>(`/produtos/${id}`);
  },

  async createProduto(payload: {
    categoriaId: string;
    nome: string;
    sku: string;
    codigoBarras?: string;
    unidade?: string;
    precoCusto: number;
    precoVenda: number;
    estoqueMinimo?: number;
    ativo?: boolean;
  }) {
    return this.request<Produto>('/produtos', 'POST', payload);
  },

  async updateProduto(id: string, payload: {
    categoriaId: string;
    nome: string;
    sku: string;
    codigoBarras?: string;
    unidade?: string;
    precoCusto: number;
    precoVenda: number;
    estoqueMinimo?: number;
    ativo?: boolean;
  }) {
    return this.request<Produto>(`/produtos/${id}`, 'PUT', payload);
  },

  async inativarProduto(id: string) {
    return this.request<Produto>(`/produtos/${id}/inativar`, 'PATCH');
  },

  // Categorias
  async getCategorias(params?: { busca?: string }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set('busca', params.busca);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Categoria[]>(`/categorias${qs}`);
  },

  async createCategoria(payload: { nome: string; descricao?: string; ativo?: boolean }) {
    return this.request<Categoria>('/categorias', 'POST', payload);
  },

  async updateCategoria(id: string, payload: { nome: string; descricao?: string; ativo?: boolean }) {
    return this.request<Categoria>(`/categorias/${id}`, 'PUT', payload);
  },

  // Caixa
  async getCaixaAtual() {
    return this.request<Caixa | null>('/caixas/atual');
  },

  async getCaixas() {
    return this.request<Caixa[]>('/caixas');
  },

  async getCaixa(id: string) {
    return this.request<Caixa>(`/caixas/${id}`);
  },

  async abrirCaixa(valorInicial: number, numeroCaixa = 1) {
    return this.request<Caixa>('/caixas/abrir', 'POST', { valorInicial, numeroCaixa });
  },

  async registrarOperacaoCaixa(caixaId: string, payload: {
    tipo: 'SANGRIA' | 'REFORCO';
    valor: number;
    observacao?: string;
  }) {
    return this.request<any>(`/caixas/${caixaId}/operacoes`, 'POST', payload);
  },

  async fecharCaixa(caixaId: string, payload: {
    valorFinal: number;
    observacao?: string;
    recadoProximoOperador?: string;
    recadoAdmin?: string;
    numeroCaixa?: number;
  }) {
    return this.request<any>(`/caixas/${caixaId}/fechar`, 'POST', payload);
  },

  async getUltimoRecadoCaixa(numeroCaixa?: number) {
    const qs = numeroCaixa ? `?numeroCaixa=${numeroCaixa}` : '';
    return this.request<RecadoOperador | null>(`/caixas/ultimo-recado${qs}`);
  },

  async enviarAvisoAdmin(payload: { mensagem: string; numeroCaixa?: number }) {
    return this.request<{ ok: boolean; aviso: any }>('/caixas/avisar-admin', 'POST', payload);
  },

  async getAvisosAdmin() {
    return this.request<AvisoAdmin[]>('/caixas/avisos-admin');
  },

  async dispensarAvisoAdmin(id: string) {
    return this.request<{ ok: boolean }>(`/caixas/avisos-admin/${id}/dispensar`, 'POST');
  },

  async dispensarTodosAvisosAdmin() {
    return this.request<{ ok: boolean }>('/caixas/avisos-admin/dispensar-todos', 'POST');
  },

  // Vendas
  async getVendas(params?: { pagina?: number; limite?: number }) {
    const query = new URLSearchParams();
    if (params?.pagina) query.set('pagina', String(params.pagina));
    if (params?.limite) query.set('limite', String(Math.min(params.limite, 100)));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Venda[]>(`/vendas${qs}`);
  },

  async getVenda(id: string) {
    return this.request<Venda>(`/vendas/${id}`);
  },

  async finalizarVenda(payload: {
    caixaId: string;
    clienteId?: string;
    chaveIdempotencia: string;
    desconto?: number;
    itens: Array<{ produtoId: string; quantidade: number }>;
    pagamentos: Array<{ forma: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO'; valor: number }>;
  }) {
    return this.request<Venda>('/vendas', 'POST', payload);
  },

  async cancelarVenda(id: string, motivo: string) {
    return this.request<Venda>(`/vendas/${id}/cancelar`, 'POST', { motivo });
  },

  // Estoque
  async getMovimentacoes(params?: { produtoId?: string; limite?: number }) {
    const query = new URLSearchParams();
    if (params?.produtoId) query.set('produtoId', params.produtoId);
    if (params?.limite) query.set('limite', String(Math.min(params.limite, 100)));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<MovimentacaoEstoque[]>(`/estoque/movimentacoes${qs}`);
  },

  async registrarMovimentacao(payload: {
    produtoId: string;
    tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
    quantidade: number;
    observacao?: string;
  }) {
    return this.request<MovimentacaoEstoque>('/estoque/movimentacoes', 'POST', payload);
  },

  // Clientes
  async getClientes(params?: { busca?: string }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set('busca', params.busca);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Cliente[]>(`/clientes${qs}`);
  },

  async createCliente(payload: {
    nome: string;
    cpfCnpj?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    limiteCredito?: number;
    ativo?: boolean;
  }) {
    return this.request<Cliente>('/clientes', 'POST', payload);
  },

  async updateCliente(id: string, payload: {
    nome: string;
    cpfCnpj?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    limiteCredito?: number;
    ativo?: boolean;
  }) {
    return this.request<Cliente>(`/clientes/${id}`, 'PUT', payload);
  },

  async deleteCliente(id: string) {
    return this.request<any>(`/clientes/${id}`, 'DELETE');
  },

  // Fornecedores
  async getFornecedores(params?: { busca?: string }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set('busca', params.busca);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Fornecedor[]>(`/fornecedores${qs}`);
  },

  async createFornecedor(payload: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpj?: string;
    telefone?: string;
    email?: string;
    ativo?: boolean;
  }) {
    return this.request<Fornecedor>('/fornecedores', 'POST', payload);
  },

  async updateFornecedor(id: string, payload: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpj?: string;
    telefone?: string;
    email?: string;
    ativo?: boolean;
  }) {
    return this.request<Fornecedor>(`/fornecedores/${id}`, 'PUT', payload);
  },

  // Financeiro
  async getFinanceiro() {
    return this.request<LancamentoFinanceiro[]>('/financeiro');
  },

  async createLancamento(payload: {
    tipo: 'RECEITA' | 'DESPESA';
    descricao: string;
    valor: number;
    vencimento: string;
  }) {
    return this.request<LancamentoFinanceiro>('/financeiro', 'POST', payload);
  },

  async pagarLancamento(id: string) {
    return this.request<LancamentoFinanceiro>(`/financeiro/${id}/pagar`, 'POST');
  },

  async cancelarLancamento(id: string) {
    return this.request<LancamentoFinanceiro>(`/financeiro/${id}/cancelar`, 'POST');
  },

  // Compras
  async getCompras() {
    return this.request<PedidoCompra[]>('/compras');
  },

  async createCompra(payload: {
    fornecedorId: string;
    numeroNota?: string;
    itens: Array<{ produtoId: string; quantidade: number; custoUnitario: number }>;
  }) {
    return this.request<PedidoCompra>('/compras', 'POST', payload);
  },

  async receberCompra(id: string) {
    return this.request<any>(`/compras/${id}/receber`, 'POST');
  },

  async cancelarCompra(id: string) {
    return this.request<any>(`/compras/${id}/cancelar`, 'POST');
  },

  // Usuários
  async getUsuarios() {
    return this.request<Usuario[]>('/usuarios');
  },

  async createUsuario(payload: {
    nome: string;
    email: string;
    senha: string;
    perfil: 'ADMIN' | 'FUNCIONARIO';
    ativo?: boolean;
  }) {
    return this.request<Usuario>('/usuarios', 'POST', payload);
  },

  async updateUsuario(id: string, payload: {
    nome?: string;
    email?: string;
    senha?: string;
    perfil?: 'ADMIN' | 'FUNCIONARIO';
    ativo?: boolean;
  }) {
    return this.request<Usuario>(`/usuarios/${id}`, 'PATCH', payload);
  },

  async deleteUsuario(id: string) {
    return this.request<any>(`/usuarios/${id}`, 'DELETE');
  },

  // Configurações
  async getConfiguracoes() {
    return this.request<ConfiguracaoEmpresa>('/configuracoes');
  },

  async updateConfiguracoes(payload: Partial<ConfiguracaoEmpresa>) {
    return this.request<ConfiguracaoEmpresa>('/configuracoes', 'PUT', payload);
  },
};
