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
  remisePercent: 0,
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
let _loaded = false;
let _loadedAt = 0;
const SETTINGS_TTL = 2 * 60 * 1000; // 2 minutes
let _loadPromise: Promise<BusinessSettings> | null = null;

/** Mapping from App (camelCase) to DB (snake_case) */
const toDB = (s: Partial<BusinessSettings>) => {
  const settings: any = {};
  if (s.tvaPercent !== undefined) settings.tvaPercent = s.tvaPercent;
  if (s.fodecPercent !== undefined) settings.fodecPercent = s.fodecPercent;
  if (s.remisePercent !== undefined) settings.remisePercent = s.remisePercent;
  if (s.timbreFiscal !== undefined) settings.timbreFiscal = s.timbreFiscal;
  if (s.validityDays !== undefined) settings.validityDays = s.validityDays;
  if (s.phone1 !== undefined) settings.phone1 = s.phone1;
  if (s.phone2 !== undefined) settings.phone2 = s.phone2;
  if (s.whatsapp !== undefined) settings.whatsapp = s.whatsapp;
  if (s.email !== undefined) settings.email = s.email;
  if (s.address !== undefined) settings.address = s.address;
  if (s.city !== undefined) settings.city = s.city;
  if (s.hoursWeekday !== undefined) settings.hoursWeekday = s.hoursWeekday;
  if (s.hoursSaturday !== undefined) settings.hoursSaturday = s.hoursSaturday;
  if (s.sundayHours !== undefined) settings.sundayHours = s.sundayHours;
  if (s.companyFullName !== undefined) settings.companyFullName = s.companyFullName;
  if (s.matriculeFiscal !== undefined) settings.matriculeFiscal = s.matriculeFiscal;
  if (s.rib !== undefined) settings.rib = s.rib;
  if (s.facebook !== undefined) settings.facebook = s.facebook;
  if (s.instagram !== undefined) settings.instagram = s.instagram;
  
  return {
    settings,
    updated_at: new Date().toISOString()
  };
};

/** Mapping from DB (snake_case) to App (camelCase) */
const fromDB = (row: any): BusinessSettings => {
  const s = row.settings || {};
  return {
    ...DEFAULTS,
    remisePercent: s.remisePercent ?? DEFAULTS.remisePercent,
    tvaPercent: s.tvaPercent ?? DEFAULTS.tvaPercent,
    fodecPercent: s.fodecPercent ?? DEFAULTS.fodecPercent,
    timbreFiscal: s.timbreFiscal ?? DEFAULTS.timbreFiscal,
    validityDays: s.validityDays ?? DEFAULTS.validityDays,
    phone1: s.phone1 ?? DEFAULTS.phone1,
    phone2: s.phone2 ?? DEFAULTS.phone2,
    whatsapp: s.whatsapp ?? DEFAULTS.whatsapp,
    email: s.email ?? DEFAULTS.email,
    address: s.address ?? DEFAULTS.address,
    city: s.city ?? DEFAULTS.city,
    hoursWeekday: s.hoursWeekday ?? DEFAULTS.hoursWeekday,
    hoursSaturday: s.hoursSaturday ?? DEFAULTS.hoursSaturday,
    sundayHours: s.sundayHours ?? DEFAULTS.sundayHours,
    companyFullName: s.companyFullName ?? DEFAULTS.companyFullName,
    matriculeFiscal: s.matriculeFiscal ?? DEFAULTS.matriculeFiscal,
    rib: s.rib ?? DEFAULTS.rib,
    facebook: s.facebook ?? DEFAULTS.facebook,
    instagram: s.instagram ?? DEFAULTS.instagram,
  };
};

export async function loadSettings(): Promise<BusinessSettings> {
  // Deduplicate concurrent calls — only one Supabase fetch at a time
  if (_loadPromise) return _loadPromise;
  _loadPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('key', 'default')
        .maybeSingle();
      
      if (error || !data) return cache;
      cache = fromDB(data);
      return cache;
    } catch {
      return cache;
    } finally {
      _loaded = true;
      _loadedAt = Date.now();
      _loadPromise = null;
    }
  })();
  return _loadPromise;
}

/** Returns true if settings have been loaded from Supabase at least once */
export function isSettingsLoaded(): boolean {
  return _loaded;
}

export const ensureSettingsLoaded = async () => {
  const now = Date.now();
  if (_loaded && (now - _loadedAt) < SETTINGS_TTL) {
    return cache;
  }
  await loadSettings();
  _loaded = true;
  _loadedAt = now;
  return cache;
};

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
      .eq('key', 'default')
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('business_settings')
        .update(dbPatch)
        .eq('id', existing.id);
    } else {
      // If no row exists, insert the full cached state
      await supabase
        .from('business_settings')
        .insert({ key: 'default', ...toDB(cache) });
    }
  } catch (err) {
    console.error('Settings sync failed:', err);
    throw err;
  }
}

export async function resetSettings(): Promise<void> {
  cache = { ...DEFAULTS };
  try {
    const { data } = await supabase
      .from('business_settings')
      .select('id')
      .eq('key', 'default')
      .maybeSingle();
    
    if (data?.id) {
      await supabase
        .from('business_settings')
        .update(toDB(DEFAULTS))
        .eq('id', data.id);
    }
  } catch { /* ignore */ }
}

// ── Realtime: auto-invalidate cache on any settings change ──
supabase
  .channel('settings-realtime')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'business_settings' },
    () => { _loaded = false; }
  )
  .subscribe();
