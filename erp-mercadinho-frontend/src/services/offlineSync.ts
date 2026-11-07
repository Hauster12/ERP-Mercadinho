import { api, ApiError } from './api';
import {
  getOfflineSales,
  removeOfflineSale,
  updateOfflineSale,
  type VendaOffline,
} from './offlineStorage';

let syncInProgress: Promise<void> | null = null;

export function sincronizarVendasOffline(usuarioId: string): Promise<void> {
  if (syncInProgress) return syncInProgress;

  syncInProgress = (async () => {
    if (!navigator.onLine) return;

    const sales = await getOfflineSales(usuarioId);
    for (const sale of sales) {
      if (sale.status === 'review') continue;
      if (!navigator.onLine) break;

      try {
        await api.finalizarVenda(sale.payload);
        await removeOfflineSale(sale.localId);
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;

        if (error.status === undefined || error.status >= 500) break;
        if (error.status === 401 || error.status === 408 || error.status === 429) break;

        const saleForReview: VendaOffline = {
          ...sale,
          status: 'review',
          erro: error.message,
        };
        await updateOfflineSale(saleForReview);
      }
    }
  })().finally(() => {
    syncInProgress = null;
  });

  return syncInProgress;
}
