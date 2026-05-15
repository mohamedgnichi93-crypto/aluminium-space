import { supabase } from '../lib/supabase';

export interface MeasureRequest {
  id: string;
  date: string;
  productId: string;
  productName: string;
  width: number | null;
  height: number | null;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'converted' | 'pending';
}

const reqToRow = (req: MeasureRequest) => ({
  id: req.id,
  product_id: req.productId,
  product_name: req.productName,
  client_name: req.clientName || '',
  client_phone: req.clientPhone || '',
  client_email: req.clientEmail || '',
  client_address: req.clientAddress || '',
  notes: req.notes || '',
  status: req.status || 'pending',
  width: req.width || null,
  height: req.height || null,
  created_at: req.date || new Date().toISOString(),
});

const rowToRequest = (row: any): MeasureRequest => ({
  id: row.id,
  date: row.created_at || row.date,
  productId: row.product_id || row.productId,
  productName: row.product_name || row.productName,
  width: row.width,
  height: row.height,
  clientName: row.client_name || row.clientName,
  clientPhone: row.client_phone || row.clientPhone,
  clientEmail: row.client_email,
  clientAddress: row.client_address,
  notes: row.notes,
  status: row.status,
});

// ─── Supabase-only API ────────────────────────────────────────────────────────

export const getMeasureRequests = async (): Promise<MeasureRequest[]> => {
  const { data, error } = await supabase
    .from('measure_requests')
    .select('*')
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

export const deleteMeasureRequest = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('measure_requests')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
