import { supabase } from '../lib/supabase';

export interface MeasureRequest {
  id: string;
  date: string;
  productId: string;
  productName: string;
  width: number | null;
  height: number | null;
  quantity: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  notes?: string;
  adminNotes?: string;
  convertedOrderId?: string;
  status: 'new' | 'contacted' | 'converted' | 'pending';
  deletedAt?: string | null;
}

const reqToRow = (req: MeasureRequest) => ({
  client_name: req.clientName || '',
  client_phone: req.clientPhone || '',
  client_email: req.clientEmail || '',
  client_address: req.clientAddress || '',
  product_id: req.productId || '',
  product_name: req.productName || '',
  width: req.width || null,
  height: req.height || null,
  quantity: req.quantity || 1,
  notes: req.notes || '',
  status: req.status || 'pending',
  admin_notes: req.adminNotes || '',
  converted_order_id: req.convertedOrderId || '',
});

const rowToRequest = (row: any): MeasureRequest => ({
  id: row.id,
  date: row.created_at || row.date,
  productId: row.product_id || row.productId,
  productName: row.product_name || row.productName,
  width: row.width,
  height: row.height,
  quantity: row.quantity ?? 1,
  clientName: row.client_name || row.clientName,
  clientPhone: row.client_phone || row.clientPhone,
  clientEmail: row.client_email || '',
  clientAddress: row.client_address || '',
  notes: row.notes || '',
  adminNotes: row.admin_notes || '',
  convertedOrderId: row.converted_order_id || '',
  status: row.status,
  deletedAt: row.deleted_at,
});

// ─── Supabase-only API ────────────────────────────────────────────────────────

export const getMeasureRequests = async (): Promise<MeasureRequest[]> => {
  const { data, error } = await supabase
    .from('measure_requests')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(rowToRequest);
};

export const saveMeasureRequest = async (
  req: Omit<MeasureRequest, 'id' | 'date' | 'status'>
): Promise<MeasureRequest> => {
  const newReq: MeasureRequest = { 
    ...req, 
    id: crypto.randomUUID(), 
    date: new Date().toISOString(), 
    status: 'pending' 
  };
  
  const { error } = await supabase.from('measure_requests').insert(reqToRow(newReq));
  if (error) throw error;
  
  return newReq;
};

export const updateMeasureRequest = async (
  id: string, 
  updates: Partial<MeasureRequest>
): Promise<void> => {
  const rowUpdates: any = {};
  if (updates.clientName !== undefined) rowUpdates.client_name = updates.clientName;
  if (updates.clientPhone !== undefined) rowUpdates.client_phone = updates.clientPhone;
  if (updates.clientEmail !== undefined) rowUpdates.client_email = updates.clientEmail;
  if (updates.clientAddress !== undefined) rowUpdates.client_address = updates.clientAddress;
  if (updates.productId !== undefined) rowUpdates.product_id = updates.productId;
  if (updates.productName !== undefined) rowUpdates.product_name = updates.productName;
  if (updates.width !== undefined) rowUpdates.width = updates.width;
  if (updates.height !== undefined) rowUpdates.height = updates.height;
  if (updates.quantity !== undefined) rowUpdates.quantity = updates.quantity;
  if (updates.notes !== undefined) rowUpdates.notes = updates.notes;
  if (updates.adminNotes !== undefined) rowUpdates.admin_notes = updates.adminNotes;
  if (updates.convertedOrderId !== undefined) rowUpdates.converted_order_id = updates.convertedOrderId;
  if (updates.status !== undefined) rowUpdates.status = updates.status;

  const { error } = await supabase
    .from('measure_requests')
    .update(rowUpdates)
    .eq('id', id);
  
  if (error) throw error;
};

export const updateMeasureRequestStatus = async (
  id: string, 
  status: MeasureRequest['status'] | string
): Promise<void> => {
  const { error } = await supabase
    .from('measure_requests')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
};

export const addAdminNote = async (id: string, note: string): Promise<void> => {
  const { error } = await supabase
    .from('measure_requests')
    .update({ admin_notes: note })
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteMeasureRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('measure_requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
};

export const getDeletedMeasureRequests = async (): Promise<MeasureRequest[]> => {
  const { data, error } = await supabase
    .from('measure_requests')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToRequest);
};

export const restoreMeasureRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('measure_requests')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) throw error;
};

export const permanentDeleteMeasureRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('measure_requests')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
