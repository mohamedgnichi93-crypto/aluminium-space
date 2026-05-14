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

const KEY = 'alu_business_settings';

export function getSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveSettings(patch: Partial<BusinessSettings>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...patch }));
}

export function resetSettings(): void {
  localStorage.removeItem(KEY);
}
