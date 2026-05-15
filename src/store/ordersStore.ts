import { supabase } from '../lib/supabase';

export interface Order {
  id: string; // This will be the human-readable code (AS-XXXX)
  date: string;
  clientInfo: {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    notes?: string;
  };
  items: any[];
  totalHT: number;
  netHT: number;
  remisePercent: number;
  remise: number;
  fodec: number;
  fodecAmount: number;
  baseForTVA: number;
  tva: number;
  tvaAmount: number;
  timbre: number;
  totalTTC: number;
  status: 'pending' | 'confirmed' | 'en_fabrication' | 'pret' | 'installe' | 'livree' | 'cancelled';
  deletedAt?: string | null;
  // Fields for backward compatibility or direct row access
  brutHT?: number;
  baseTVA?: number;
  totalSurcharge?: number;
  baseBrutHT?: number;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function orderToRow(order: Order): any {
  return {
    order_number: order.id,
    client_name: order.clientInfo?.fullName || '',
    client_phone: order.clientInfo?.phone || '',
    client_address: order.clientInfo?.address || '',
    client_info: order.clientInfo || {},
    items: order.items || [],
    total_ht: order.totalHT || 0,
    net_ht: order.netHT || order.totalHT || 0,
    remise_percent: order.remisePercent || 0,
    remise: order.remise || 0,
    fodec_amount: order.fodecAmount || 0,
    tva_amount: order.tvaAmount || 0,
    base_for_tva: order.baseForTVA || 0,
    total_ttc: order.totalTTC || 0,
    timbre: order.timbre || 1000,
    status: order.status || 'pending',
    notes: order.clientInfo?.notes || '',
    created_at: order.date || new Date().toISOString(),
  };
}

export function rowToOrder(row: any): Order {
  // Handle nested client_info or flattened columns
  const clientInfo = row.client_info || {
    fullName: row.client_name || '',
    phone: row.client_phone || '',
    email: row.client_email || '',
    address: row.client_address || '',
    notes: row.notes || ''
  };

  return {
    id: row.order_number || row.id,
    date: row.created_at || row.date,
    clientInfo,
    items: row.items || [],
    totalHT: row.total_ht || row.brut_ht || 0,
    netHT: row.net_ht || row.total_ht || 0,
    remisePercent: row.remise_percent || 0,
    remise: row.remise || 0,
    fodec: 1, // default 1%
    fodecAmount: row.fodec_amount || 0,
    baseForTVA: row.base_for_tva || 0,
    tva: 19, // default 19%
    tvaAmount: row.tva_amount || 0,
    timbre: row.timbre || 1000,
    totalTTC: row.total_ttc || row.total_price || 0,
    status: row.status || 'pending',
    deletedAt: row.deleted_at,
    // extra fields for PDF
    brutHT: row.total_ht || row.brut_ht || 0,
    baseTVA: row.base_for_tva || 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOrderCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AS-${code}`;
}

// ─── Supabase-only API ────────────────────────────────────────────────────────

export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToOrder);
};

export const getTrashOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToOrder);
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  // Search by order_number (AS-XXXX) primarily
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', id)
    .maybeSingle();

  if (data) return rowToOrder(data);

  // Fallback to ID if it looks like a UUID
  if (id.length > 20) {
    const { data: dataById } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (dataById) return rowToOrder(dataById);
  }

  return null;
};

export const saveOrder = async (order: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
  const newOrder: Order = {
    ...order,
    id: generateOrderCode(),
    date: new Date().toISOString(),
    status: 'pending',
  };

  const { error } = await supabase.from('orders').insert(orderToRow(newOrder));
  if (error) throw error;

  return newOrder;
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<void> => {
  // Use order_number for lookup
  const { error } = await supabase
    .from('orders')
    .update({
      status: updates.status,
      client_name: updates.clientInfo?.fullName,
      client_phone: updates.clientInfo?.phone,
      client_address: updates.clientInfo?.address,
      client_info: updates.clientInfo, // Update full JSON info too
      notes: updates.clientInfo?.notes,
      items: updates.items,
      total_ttc: updates.totalTTC
    })
    .eq('order_number', id);

  if (error) throw error;
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_number', id);

  if (error) throw error;
};

export const moveToTrash = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('order_number', id);

  if (error) throw error;
};

export const restoreFromTrash = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: null })
    .eq('order_number', id);

  if (error) throw error;
};

export const permanentlyDeleteOrder = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('order_number', id);

  if (error) throw error;
};

export const emptyTrash = async (): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .not('deleted_at', 'is', null);

  if (error) throw error;
};
