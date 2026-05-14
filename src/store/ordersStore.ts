import { supabase } from '../lib/supabase';

export interface Order {
  id: string;
  date: string;
  clientInfo: {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
  };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    width: number;
    height: number;
    quantity: number;
    meshType?: string;
    color?: string;
    openingType?: 'fenetre' | 'porte' | null;
    baseUnitPrice: number;
    colorSurchargeAmount: number;
    colorSurchargePct: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalHT: number; // This is Total Brut HT
  remise: number;
  remisePercent?: number;
  netHT: number;
  fodec: number; // This is the percentage
  fodecAmount: number;
  baseForTVA: number;
  tva: number; // This is the percentage
  tvaAmount: number;
  timbre: number;
  totalTTC: number;
  status: 'pending' | 'confirmed' | 'en_fabrication' | 'pret' | 'installe' | 'cancelled' | 'livree';
  deletedAt?: string;
}

// ─── Supabase row shape ────────────────────────────────────────────────────────
interface OrderRow {
  id: string;
  date: string;
  client_info: Order['clientInfo'];
  items: Order['items'];
  total_ht: number;
  remise: number;
  remise_percent?: number;
  net_ht: number;
  fodec: number;
  fodec_amount: number;
  base_for_tva: number;
  tva: number;
  tva_amount: number;
  timbre: number;
  total_ttc: number;
  status: Order['status'];
  deleted_at: string | null;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    date: row.date,
    clientInfo: row.client_info,
    items: row.items,
    totalHT: row.total_ht,
    remise: row.remise,
    remisePercent: row.remise_percent,
    netHT: row.net_ht,
    fodec: row.fodec,
    fodecAmount: row.fodec_amount,
    baseForTVA: row.base_for_tva,
    tva: row.tva,
    tvaAmount: row.tva_amount,
    timbre: row.timbre,
    totalTTC: row.total_ttc,
    status: row.status,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  };
}

function orderToRow(order: Order): OrderRow {
  return {
    id: order.id,
    date: order.date,
    client_info: order.clientInfo,
    items: order.items,
    total_ht: order.totalHT,
    remise: order.remise,
    remise_percent: order.remisePercent,
    net_ht: order.netHT,
    fodec: order.fodec,
    fodec_amount: order.fodecAmount,
    base_for_tva: order.baseForTVA,
    tva: order.tva,
    tva_amount: order.tvaAmount,
    timbre: order.timbre,
    total_ttc: order.totalTTC,
    status: order.status,
    deleted_at: order.deletedAt ?? null,
  };
}

// ─── localStorage keys ────────────────────────────────────────────────────────
const STORAGE_KEY = 'aluminium_space_orders';
const TRASH_KEY = 'aluminium_space_trash';

// ─── Sync helpers (fire-and-forget — never block UI) ─────────────────────────
async function upsertToSupabase(order: Order): Promise<void> {
  try {
    await supabase.from('orders').upsert(orderToRow(order));
  } catch { /* offline gracefully */ }
}

async function updateStatusInSupabase(id: string, status: Order['status']): Promise<void> {
  try {
    await supabase.from('orders').update({ status }).eq('id', id);
  } catch { /* offline gracefully */ }
}

// ─── Sync from Supabase → localStorage (call on Dashboard mount) ──────────────
export async function syncOrdersFromSupabase(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (error || !data) return false;

    const orders: Order[] = (data as OrderRow[]).map(rowToOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
}

export async function syncTrashedFromSupabase(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error || !data) return false;

    const trash: Order[] = (data as OrderRow[]).map(rowToOrder);
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    return true;
  } catch {
    return false;
  }
}

// ─── Synchronous localStorage API (unchanged for all existing callers) ────────
export const getOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getTrashedOrders = (): Order[] => {
  const data = localStorage.getItem(TRASH_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOrder = (order: Omit<Order, 'id' | 'date' | 'status'>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    status: 'pending',
  };
  orders.push(newOrder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  upsertToSupabase(newOrder); // async sync — non-blocking
  return newOrder;
};

export const updateOrderStatus = (id: string, status: Order['status']): void => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    updateStatusInSupabase(id, status); // async sync
  }
};

export const updateOrder = (id: string, updates: Partial<Order>): Order | null => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx < 0) return null;
  const updated: Order = { ...orders[idx], ...updates, id };
  // Recalculate totals when items or remisePercent change
  if (updates.items || updates.remise !== undefined || updates.remisePercent !== undefined) {
    const items = updated.items;
    const totalHT = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const remisePct = updates.remisePercent ?? updated.remisePercent ?? 0;
    const remise = Math.round(totalHT * (remisePct / 100));
    const fodec = updated.fodec ?? 1; // Default to 1% if not specified
    const tva = updated.tva ?? 19;    // Default to 19% if not specified
    const timbre = updated.timbre ?? 1; // Default to 1.000 DT

    // 5-Step Tunisian Fiscal Formula
    const netHT = totalHT - remise;
    const fodecAmount = netHT * (fodec / 100);
    const baseForTVA = netHT + fodecAmount;
    const tvaAmount = baseForTVA * (tva / 100);
    const totalTTC = Math.round(baseForTVA + tvaAmount + timbre);

    updated.totalHT = totalHT;
    updated.remise = remise;
    updated.remisePercent = remisePct;
    updated.netHT = netHT;
    updated.fodecAmount = fodecAmount;
    updated.baseForTVA = baseForTVA;
    updated.tvaAmount = tvaAmount;
    updated.totalTTC = totalTTC;
    updated.timbre = timbre;
    updated.fodec = fodec;
    updated.tva = tva;
  }
  orders[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  upsertToSupabase(updated);
  return updated;
};

export const moveToTrash = (id: string): void => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    const order = orders[idx];
    order.deletedAt = new Date().toISOString();
    orders.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    const trash = getTrashedOrders();
    trash.push(order);
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    upsertToSupabase(order); // update deleted_at in Supabase
  }
};

export const restoreFromTrash = (id: string): void => {
  const trash = getTrashedOrders();
  const idx = trash.findIndex(o => o.id === id);
  if (idx >= 0) {
    const order = trash[idx];
    delete order.deletedAt;
    trash.splice(idx, 1);
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    upsertToSupabase(order);
  }
};

export const permanentlyDelete = (id: string): void => {
  const trash = getTrashedOrders();
  const updatedTrash = trash.filter(o => o.id !== id);
  localStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
  try { supabase.from('orders').delete().eq('id', id); } catch { /**/ }
};

export const emptyTrash = (): void => {
  const trash = getTrashedOrders();
  localStorage.setItem(TRASH_KEY, JSON.stringify([]));
  trash.forEach(o => {
    try { supabase.from('orders').delete().eq('id', o.id); } catch { /**/ }
  });
};

export const getOrderById = (id: string): Order | undefined => {
  const orders = getOrders();
  return orders.find(o => o.id.toUpperCase() === id.trim().toUpperCase());
};

export const cleanOldTrash = (): void => {
  const trash = getTrashedOrders();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const updated = trash.filter(o => o.deletedAt && new Date(o.deletedAt) >= thirtyDaysAgo);
  if (updated.length !== trash.length) {
    localStorage.setItem(TRASH_KEY, JSON.stringify(updated));
  }
};
