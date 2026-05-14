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
  status: 'new' | 'contacted' | 'converted';
}

const STORAGE_KEY = 'alu_measure_requests';

export const saveMeasureRequest = async (
  req: Omit<MeasureRequest, 'id' | 'date' | 'status'>
): Promise<MeasureRequest> => {
  const newRequest: MeasureRequest = {
    ...req,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    status: 'new',
  };

  // Save to localStorage
  const existing = getMeasureRequests();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newRequest, ...existing]));

  // Save to Supabase (upsert)
  try {
    const { error } = await supabase
      .from('measure_requests')
      .upsert(newRequest);

    if (error) {
      console.error('Error saving measure request to Supabase:', error);
    }
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
  }

  return newRequest;
};

export const getMeasureRequests = (): MeasureRequest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const updateMeasureRequestStatus = async (
  id: string,
  status: MeasureRequest['status']
): Promise<void> => {
  // Update localStorage
  const requests = getMeasureRequests();
  const updatedRequests = requests.map(r => 
    r.id === id ? { ...r, status } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests));

  // Update Supabase
  try {
    const { error } = await supabase
      .from('measure_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating measure request status in Supabase:', error);
    }
  } catch (err) {
    console.error('Failed to update Supabase:', err);
  }
};
