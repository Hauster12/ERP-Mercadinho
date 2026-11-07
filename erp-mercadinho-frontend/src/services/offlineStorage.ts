import type { Caixa, Categoria, Cliente, Produto, Usuario } from '../types';

const DATABASE_NAME = 'nexus-erp-offline';
const DATABASE_VERSION = 1;
const CACHE_STORE = 'cache';
const SALES_STORE = 'offlineSales';

export interface VendaOfflinePayload {
  caixaId: string;
  clienteId?: string;
  chaveIdempotencia: string;
  desconto?: number;
  itens: Array<{
    produtoId: string;
    quantidade: number;
    precoUnitarioEsperado: number;
  }>;
  pagamentos: Array<{
    forma: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO';
    valor: number;
  }>;
}

export interface VendaOffline {
  localId: string;
  usuarioId: string;
  payload: VendaOfflinePayload;
  itens: Array<{ produto: Produto; quantidade: number }>;
  total: number;
  forma: VendaOfflinePayload['pagamentos'][number]['forma'];
  criadoEm: string;
  status: 'pending' | 'review';
  erro?: string;
}

export interface DadosPdvOffline {
  produtos: Produto[];
  categorias: Categoria[];
  clientes: Cliente[];
  atualizadoEm: string;
}

export interface SessaoOffline {
  usuario: Usuario;
  caixa: Caixa | null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CACHE_STORE)) {
        database.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(SALES_STORE)) {
        database.createObjectStore(SALES_STORE, { keyPath: 'localId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o banco offline.'));
    request.onblocked = () => reject(new Error('Feche outras abas do ERP para atualizar o banco offline.'));
  });
}

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    let result!: T;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error ?? new Error('Falha ao acessar o banco offline.'));
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Transação offline cancelada.'));
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => database.close();
  }));
}

async function getCacheValue<T>(key: string): Promise<T | undefined> {
  const record = await withStore<{ key: string; value: T } | undefined>(
    CACHE_STORE,
    'readonly',
    (store) => store.get(key),
  );
  return record?.value;
}

async function setCacheValue<T>(key: string, value: T): Promise<void> {
  await withStore<IDBValidKey>(CACHE_STORE, 'readwrite', (store) =>
    store.put({ key, value }),
  );
}

function dispatchSalesUpdated() {
  window.dispatchEvent(new Event('offline-sales:updated'));
}

export async function saveOfflineSession(usuario: Usuario, caixa: Caixa | null) {
  await setCacheValue(`session:${usuario.id}`, { usuario, caixa } satisfies SessaoOffline);
}

export async function getOfflineSession(usuarioId: string): Promise<SessaoOffline | undefined> {
  return getCacheValue<SessaoOffline>(`session:${usuarioId}`);
}

export async function getOfflineSessionForToken(token: string): Promise<SessaoOffline | undefined> {
  let userId: string | undefined;
  try {
    const payload = token.split('.')[1];
    if (!payload) return undefined;
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string };
    if (!claims.sub) return undefined;
    userId = claims.sub;
  } catch {
    return undefined;
  }
  const session = await getOfflineSession(userId);
  return session?.usuario.id === userId ? session : undefined;
}

export async function saveOfflinePdvData(usuarioId: string, data: DadosPdvOffline) {
  await setCacheValue(`pdv:${usuarioId}`, data);
}

export async function getOfflinePdvData(usuarioId: string): Promise<DadosPdvOffline | undefined> {
  const data = await getCacheValue<DadosPdvOffline>(`pdv:${usuarioId}`);
  if (!data) return undefined;

  const sales = await getOfflineSales(usuarioId);
  const quantities = new Map<string, number>();
  for (const sale of sales) {
    for (const item of sale.itens) {
      quantities.set(
        item.produto.id,
        (quantities.get(item.produto.id) ?? 0) + item.quantidade,
      );
    }
  }
  return {
    ...data,
    produtos: data.produtos.map((produto) => {
      const quantidade = quantities.get(produto.id);
      return quantidade === undefined
        ? produto
        : { ...produto, estoqueAtual: Math.max(0, Number(produto.estoqueAtual) - quantidade) };
    }),
  };
}

export async function getOfflineSales(usuarioId?: string): Promise<VendaOffline[]> {
  const sales = await withStore<VendaOffline[]>(SALES_STORE, 'readonly', (store) =>
    store.getAll(),
  );
  return usuarioId ? sales.filter((sale) => sale.usuarioId === usuarioId) : sales;
}

export async function saveOfflineSale(sale: VendaOffline): Promise<void> {
  await withStore<IDBValidKey>(SALES_STORE, 'readwrite', (store) => store.add(sale));
  dispatchSalesUpdated();
}

export async function updateOfflineSale(sale: VendaOffline): Promise<void> {
  await withStore<IDBValidKey>(SALES_STORE, 'readwrite', (store) => store.put(sale));
  dispatchSalesUpdated();
}

export async function removeOfflineSale(localId: string): Promise<void> {
  await withStore<undefined>(SALES_STORE, 'readwrite', (store) => store.delete(localId));
  dispatchSalesUpdated();
  window.dispatchEvent(new Event('offline-sales:synced'));
}

export async function hasOfflineSalesForCash(caixaId: string): Promise<boolean> {
  return (await getOfflineSales()).some((sale) => sale.payload.caixaId === caixaId);
}
