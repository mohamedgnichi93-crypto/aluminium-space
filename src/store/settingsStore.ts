import { supabase } from '../lib/supabase';

export interface BusinessSettings {
  remisePercent: number;
  tvaPercent: number;
  fodecPercent: number;
  timbreFiscal: number;
  validityDays: number;
  phone1: string;
  phone2: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  hoursWeekday: string;
  hoursSaturday: string;
  sundayHours: string;
  companyFullName: string;
  matriculeFiscal: string;
  rib: string;
  facebook: string;
  instagram: string;
}

const DEFAULTS: BusinessSettings = {
  remisePercent: 20,
  tvaPercent: 19,
  fodecPercent: 1,
  timbreFiscal: 1.000,
  validityDays: 10,
  phone1: '(+216) 53 186 611',
  phone2: '(+216) 57 099 070',
  whatsapp: '21657099070',
  email: 'contact@aluminiumspace.com',
  address: '125 lot Laaroussi, Mghira',
  city: 'Tunis, Tunisie',
  hoursWeekday: '8h00–17h00',
  hoursSaturday: '8h00–12h00',
  sundayHours: 'Fermé',
  companyFullName: 'Aluminium Space',
  matriculeFiscal: '',
  rib: '',
  facebook: '',
  instagram: '',
};

let cache: BusinessSettings = { ...DEFAULTS };

/** Mapping from App (camelCase) to DB (snake_case) */
const toDB = (s: Partial<BusinessSettings>) => {
  const patch: any = {};
  if (s.tvaPercent !== undefined) patch.tax_rate = s.tvaPercent;
  if (s.fodecPercent !== undefined) patch.fodec_rate = s.fodecPercent;
  if (s.remisePercent !== undefined) patch.remise_default = s.remisePercent;
  if (s.timbreFiscal !== undefined) patch.timbre_fiscal = s.timbreFiscal;
  if (s.validityDays !== undefined) patch.validity_days = s.validityDays;
  if (s.phone1 !== undefined) patch.phone1 = s.phone1;
  if (s.phone2 !== undefined) patch.phone2 = s.phone2;
  if (s.whatsapp !== undefined) patch.whatsapp = s.whatsapp;
  if (s.email !== undefined) patch.email = s.email;
  if (s.address !== undefined) patch.address = s.address;
  if (s.city !== undefined) patch.city = s.city;
  if (s.hoursWeekday !== undefined) patch.hours_weekday = s.hoursWeekday;
  if (s.hoursSaturday !== undefined) patch.hours_saturday = s.hoursSaturday;
  if (s.sundayHours !== undefined) patch.hours_sunday = s.sundayHours;
  if (s.companyFullName !== undefined) patch.company_name = s.companyFullName;
  if (s.matriculeFiscal !== undefined) patch.matricule_fiscal = s.matriculeFiscal;
  if (s.rib !== undefined) patch.rib = s.rib;
  if (s.facebook !== undefined) patch.facebook_url = s.facebook;
  if (s.instagram !== undefined) patch.instagram_url = s.instagram;
  
  patch.updated_at = new Date().toISOString();
  return patch;
};

/** Mapping from DB (snake_case) to App (camelCase) */
const fromDB = (row: any): BusinessSettings => ({
  ...DEFAULTS,
  remisePercent: row.remise_default ?? DEFAULTS.remisePercent,
  tvaPercent: row.tax_rate ?? DEFAULTS.tvaPercent,
  fodecPercent: row.fodec_rate ?? DEFAULTS.fodecPercent,
  timbreFiscal: row.timbre_fiscal ?? DEFAULTS.timbreFiscal,
  validityDays: row.validity_days ?? DEFAULTS.validityDays,
  phone1: row.phone1 ?? DEFAULTS.phone1,
  phone2: row.phone2 ?? DEFAULTS.phone2,
  whatsapp: row.whatsapp ?? DEFAULTS.whatsapp,
  email: row.email ?? DEFAULTS.email,
  address: row.address ?? DEFAULTS.address,
  city: row.city ?? DEFAULTS.city,
  hoursWeekday: row.hours_weekday ?? DEFAULTS.hoursWeekday,
  hoursSaturday: row.hours_saturday ?? DEFAULTS.hoursSaturday,
  sundayHours: row.hours_sunday ?? DEFAULTS.sundayHours,
  companyFullName: row.company_name ?? DEFAULTS.companyFullName,
  matriculeFiscal: row.matricule_fiscal ?? DEFAULTS.matriculeFiscal,
  rib: row.rib ?? DEFAULTS.rib,
  facebook: row.facebook_url ?? DEFAULTS.facebook,
  instagram: row.instagram_url ?? DEFAULTS.instagram,
});

export async function loadSettings(): Promise<BusinessSettings> {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .single();
    
    if (error || !data) return cache;
    cache = fromDB(data);
    return cache;
  } catch {
    return cache;
  }
}

export function getSettings(): BusinessSettings {
  return cache;
}

export async function saveSettings(patch: Partial<BusinessSettings>): Promise<void> {
  cache = { ...cache, ...patch };
  const dbPatch = toDB(patch);

  try {
    const { data: existing } = await supabase
      .from('business_settings')
      .select('id')
      .single();

    if (existing?.id) {
      await supabase
        .from('business_settings')
        .update(dbPatch)
        .eq('id', existing.id);
    } else {
      // If no row exists, insert the full cached state
      await supabase
        .from('business_settings')
        .insert(toDB(cache));
    }
  } catch (err) {
    console.error('Settings sync failed:', err);
  }
}

export async function resetSettings(): Promise<void> {
  cache = { ...DEFAULTS };
  try {
    const { data } = await supabase
      .from('business_settings')
      .select('id')
      .single();
    
    if (data?.id) {
      await supabase
        .from('business_settings')
        .update(toDB(DEFAULTS))
        .eq('id', data.id);
    }
  } catch { /* ignore */ }
}
