// Copie para src/services/api.ts no frontend Vite.
const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
let token: string | null = null;
export const api = {
 async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(base + path, {
   method,
   headers: { ...(body !== undefined ? {'Content-Type': 'application/json'} : {}), ...(token ? {Authorization: `Bearer ${token}`} : {}) },
   ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
  });
  const data = await response.json();
  if (!response.ok) {
   if (response.status === 401) { token = null; window.dispatchEvent(new Event('api:unauthorized')); }
   throw new Error(Array.isArray(data.message) ? data.message.join('; ') : data.message || 'Falha na API');
  }
  return data as T;
 },
 async login(email: string, senha: string) {
  const data = await api.request<{accessToken: string; usuario: {id: string; nome: string; email: string; perfil: 'ADMIN' | 'FUNCIONARIO'; ativo: boolean}}>('/auth/login', 'POST', {email, senha});
  token = data.accessToken;
  return data.usuario;
 },
 logout() { token = null; },
 // Gere a chave apenas uma vez por venda lógica. Reutilize após erro de rede.
 finalizarVenda<T>(payload: {caixaId: string; clienteId?: string; chaveIdempotencia: string; desconto?: number; itens: {produtoId: string; quantidade: number}[]; pagamentos: {forma: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO'; valor: number}[]}) {
  return api.request<T>('/vendas', 'POST', payload);
 },
};
