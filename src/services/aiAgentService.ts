// ═══════════════════════════════════════════════════════════════
//  ALU SPACE — AI Agent Service v3
//  Offline, multilingual (FR·AR·TN·EN·IT), full price calc
// ═══════════════════════════════════════════════════════════════

import { calculatePrice } from '../utils/priceCalculator';
import { BUSINESS_CONFIG } from '../data/businessConfig';
import { getSettings } from '../store/settingsStore';

export type Lang = 'fr' | 'ar' | 'tn' | 'en' | 'it';

export interface ConvMemory {
  clientName: string | null;
  lastProduct: string | null;
  lastWidth: number | null;
  lastHeight: number | null;
  lastQuantity: number | null;
  lastPrice: number | null;
  awaitingDimensions: boolean;
  awaitingProduct: boolean;
  awaitingPhone: boolean;
  mentionCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: AgentAction;
  actionLabel?: string;
  suggestions?: string[];
  detectedLang?: Lang;
  productImage?: string;
  devisButton?: DevisButton;
  rating?: 'up' | 'down' | null;
  comparisonTable?: ComparisonTable;
}

export interface AgentAction {
  type:
  | 'navigate_to_page'

  | 'open_devis_wizard'
  | 'calculate_price'
  | 'show_product_comparison'
  | 'scroll_to_section';
  params?: Record<string, string | number>;
  closeAfter?: boolean;
}

export interface DevisButton {
  show: boolean;
  productId: string;
  width: number;
  height: number;
  price: number;
  label?: string;
}

export interface ComparisonRow {
  label: string;
  colibri: string;
  sidney: string;
  sidneyAC: string;
  elba: string;
  plisse31: string;
}

export interface ComparisonTable {
  headers: string[];
  rows: ComparisonRow[];
}

export interface AIResponse {
  text: string;
  action?: AgentAction;
  actionLabel?: string;
  suggestions?: string[];
  productImage?: string;
  comparisonTable?: ComparisonTable;
  detectedLang?: Lang;
  navigating?: boolean;
  devisButton?: DevisButton;
  loadingType?: 'calculate' | 'search' | 'compare';
}

export const PRODUCTS: Record<string, {
  name: string; category: string; type: string; description: string;
  features: string[]; caisson: string | null; tailleEffective: string;
  minW: number; maxW: number; minH: number; maxH: number;
  startPrice?: number; pricePerM2?: Record<string, number>;
  image: string; path: string;
}> = {
  'colibri-50': {
    name: 'COLIBRÌ 50',
    category: 'Moustiquaires Enroulables',
    type: 'fenetre',
    description: 'Moustiquaire enroulable pour FENÊTRE. Idéal pour fenêtres standard et appartements. Installation en 30 minutes par vissage mural.',
    features: [
      'Mécanisme à ressort silencieux', 'Coulisses latérales à doubles joints-brosses',
      'Barre de charge avec cordon de tirage',
    ],
    caisson: 'supérieur (en haut) 50mm', tailleEffective: '44mm',
    minW: 60, maxW: 200, minH: 60, maxH: 250, // maxW is 160 if H > 170
    startPrice: 263,
    image: '/images/colibri-50.png', path: '/produits/colibri-50',
  },
  'sidney-50': {
    name: 'SIDNEY 50',
    category: 'Moustiquaires Enroulables',
    type: 'porte',
    description: "Moustiquaire enroulable pour PORTE. Idéal pour portes d'entrée et portes-fenêtres avec poignée pliante discrète.",
    features: [
      'Mécanisme à ressort', 'Coulisses latérales à doubles joints-brosses',
      'Barre de charge à poignée externe pliante',
    ],
    caisson: 'latéral (sur le côté) 50mm', tailleEffective: '44mm',
    minW: 60, maxW: 200, minH: 150, maxH: 260,
    startPrice: 611,
    image: '/images/sidney-50.png', path: '/produits/sidney-50',
  },
  'sidney-50-ac': {
    name: 'SIDNEY 50 AC',
    category: 'Moustiquaires Enroulables',
    type: 'grande-porte',
    description: 'Moustiquaire double caisson pour GRANDE OUVERTURE. Ouverture centrale bidirectionnelle, s\'ouvre des deux côtés, idéal pour grandes baies vitrées et terrasses.',
    features: [
      'Système 2 caissons latéraux', 'Ouverture centrale bidirectionnelle',
      'Mécanisme à ressort', 'Coulisses doubles joints-brosses',
    ],
    caisson: '50mm', tailleEffective: '44mm',
    minW: 100, maxW: 400, minH: 150, maxH: 260,
    startPrice: 1224,
    image: '/images/sidney-50-ac.png', path: '/produits/sidney-50-ac',
  },
  'elba': {
    name: 'ELBA',
    category: 'Moustiquaires à Panneau Fixe',
    type: 'fixe',
    description: 'Moustiquaire à PANNEAU FIXE pour fenêtre. Très économique et durable (pas de mécanisme).',
    features: [
      'Châssis fixe en aluminium blanc',
      'Panneau en fibre de verre recouverte de PVC',
      'Fixations murales en nylon', 'Joint brosse périmétral',
    ],
    caisson: null, tailleEffective: '10mm',
    minW: 40, maxW: 9999, minH: 40, maxH: 9999,
    startPrice: 326,
    image: '/images/elba.png', path: '/produits/elba',
  },
  'plisse31': {
    name: 'PLISSÉ 31 BILATÉRALE',
    category: 'Moustiquaires Plissées',
    type: 'plisse',
    description: 'Moustiquaire plissée bilatérale (31mm). Idéale pour grandes ouvertures jusqu\'à 5000mm. Déverrouillage à aimant, rail extra plat et maille noire de série.',
    features: [
      'Déverrouillage à aimant',
      'Rail extra plat',
      'Maille noire de série'
    ],
    caisson: '31mm', tailleEffective: '31mm',
    minW: 100, maxW: 500, minH: 100, maxH: 300,
    startPrice: 1115,
    image: '/images/plisse31.webp', path: '/produits/plisse31',
  },
};

// ─── COMPANY ─────────────────────────────────────────────────────
const settings = getSettings();
const COMPANY = {
  name: 'ALUMINIUM SPACE',
  description: 'Spécialiste menuiserie aluminium à Mghira, Tunis. Partenaire Grifo Flex Tunisie.',
  address: `${settings.address}, ${settings.city}`,
  phone1: settings.phone1,
  phone2: settings.phone2,
  whatsapp: settings.whatsapp,
  email: settings.email,
  hours: 'Lundi–Samedi, 8h00–17h00',
  installation: 'Installation sous 3-7 jours ouvrables. Zone de service: Tunis et Grand Tunis.',
  garantie: '3 ans sur toutes les moustiquaires Grifo Flex.',
  paiement: 'Paiement: espèces, virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL',
  mapUrl: 'https://maps.google.com/?q=125+lot+Laaroussi+Mghira',
  grifoFlex: 'Marque italienne fondée en Italie (Grifoflex® Spa). Présente en Tunisie depuis 2012. Grifo Flex Tunisie: succursale italienne à Mégrine, Ben Arous. 1200 m² de surface de production, 15 employés. 3 ans de garantie sur tous les produits. +200 km parcourus chaque mois pour livraisons. SAV: 71 434 209. Matériaux: aluminium + fibre de verre recouverte de PVC. Couleurs: Blanc RAL 9010, Noir mat. Qualité certifiée italienne.',
};

// ─── FORMAT PRICE ─────────────────────────────────────────────────
const fmt = (n: number) => n.toFixed(3).replace('.', ',') + ' DT';

// ─── PRICE CALCULATION ───────────────────────────────────────────
interface PriceBreakdown {
  unitPrice: number;
  totalBrut: number;
  remise: number;
  netHT: number;
  fodec: number;
  baseTVA: number;
  tva: number;
  timbre: number;
  totalTTC: number;
}

function calcPriceBreakdown(productId: string, w: number, h: number, qty = 1): PriceBreakdown | null {
  const result = calculatePrice({ productId, width: w, height: h, color: 'Blanc' });
  if (!result) return null;
  const unitPrice = result.unitPrice / 1000; // convert millimes to DT
  const totalBrut = unitPrice * qty;
  const remise = totalBrut * (BUSINESS_CONFIG.remisePct / 100);
  const netHT = totalBrut - remise;
  const fodec = netHT * (BUSINESS_CONFIG.fodecPct / 100);
  const baseTVA = netHT + fodec;
  const tva = baseTVA * (BUSINESS_CONFIG.tvaPct / 100);
  const timbre = 1.000;
  const totalTTC = baseTVA + tva + timbre;
  return { unitPrice, totalBrut, remise, netHT, fodec, baseTVA, tva, timbre, totalTTC };
}

// ─── MULTI-DIMENSION EXTRACTION ─────────────────────────────────
function extractAllDimensions(msg: string): Array<{ w: number; h: number }> {
  const regex = /(\d{2,4})\s*[x×X*]\s*(\d{2,4})/g;
  const results: Array<{ w: number; h: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(msg)) !== null) {
    results.push({ w: parseInt(m[1]), h: parseInt(m[2]) });
  }
  return results;
}

// ─── NORMALISE ────────────────────────────────────────────────────
function norm(s: string) {
  return s.toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôõö]/g, 'o').replace(/[ùûü]/g, 'u')
    .replace(/[ç]/g, 'c');
}

// ─── SESSION STATE ───────────────────────────────────────────────
const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('alu_chat_lang') as Lang : null;
let sessionLang: Lang = savedLang || 'fr';

function updateSessionLang(l: Lang) {
  sessionLang = l;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('alu_chat_lang', l);
  }
}
let sessionCount = 0;

export function resetSessionCount(lang?: Lang) { sessionCount = 0; updateSessionLang(lang || 'fr'); }

// ─── LANGUAGE DETECTION ──────────────────────────────────────────
export function detectLanguage(msg: string): Lang {
  const m = msg.trim();
  const mn = norm(m);

  // Explicit switches
  if (/(b arbi|a7ki.*arbi|a7ki.*3arbi|en arabe|parle.*arabe|reponds.*arabe|تكلم عربي|بالعربية|رد بالعربي|speak.*arabic|respond.*arabic|in arabic)/.test(mn)) { updateSessionLang('ar'); return 'ar'; }
  if (/(b tounsi|a7ki.*tounsi|en tounsi|parle.*tunisien|speak.*tunisian|b dialecte)/.test(mn)) { updateSessionLang('tn'); return 'tn'; }
  if (/(b français|b francais|en français|en francais|parle.*français|parle.*francais|speak.*french|in french|reponds.*francais)/.test(mn)) { updateSessionLang('fr'); return 'fr'; }
  if (/(in english|speak.*english|parle.*anglais|b anglais|respond.*english|reply.*english)/.test(mn)) { updateSessionLang('en'); return 'en'; }
  if (/(in italiano|parla.*italiano|speak.*italian|in italian|rispondi.*italiano)/.test(mn)) { updateSessionLang('it'); return 'it'; }

  // Arabic script
  if (/[؀-ۿ]/.test(m)) {
    if (/(علاش|وقتاش|فاش|شنوة|شنية|كيفاش|برشة|مزيان|باهي|اللي|متاع|هكا|هاكا|عندي|نحب|نقدر|تكون|معايا|معاك|قداه|باش|تو\b|ياسر|حاجة)/.test(m)) { updateSessionLang('tn'); return 'tn'; }
    updateSessionLang('ar'); return 'ar';
  }

  // Tunisian latin
  if (/\b(labes|labas|mrigla|mrigel|chnowa|chnoua|chniya|chnya|kifech|ya5i|ya5u|sahbi|barka|3andy|3andi|n7eb|nheb|9al|9oulou|bech|bch|wle|barcha|mlih|mzyan|9adech|qadech|haka|heka|hedha|kima|9bal|mazel|hmdullah|sah\b|s7i7|nchallah|9adeh|7kini|ntaw|nbadel|najem|nes2el|nes2lkom|emmeni|nhezk|yhezni|rouh\b|nawrih|9rib|bzaf|barsha|ma3ndich|ma9derch|twahacht|mezyan|se3a|eddi|wli|la9it|mch\b|mich|hkaya|dima|weqt|bled|famma|fama\b|henni|3la\b|hedha|haka|3mrou|ahla\b|yaamel|t3ml|n3ml|chbik|bch\b|9adeh|ta3melou|becha|ye5lef|shnowa|yo5roj|tji\b|tben|ywali|saha\b|chouf|3andi\b|fouchana|tounsi\b|wahed\b|zouz\b|7aja\b|emta\b|tmchi\b|chbek\b|chbabek\b|b9adech\b|atslni\b|teslni\b|moust|ynajem|9alha\b|wesh|ki\b|eli\b|mta\b|mte3\b|tsawer\b|sou9\b|chwiya\b|manich\b|moch\b|3ndek\b|thmen\b|y3ml\b|ta7t\b|fo9\b|jdid\b|9dim\b|far9\b|yani\b|mazelt\b|twali\b|wlek\b|khoya\b|enti\b|ena\b|fih\b|smiti\b|ismi\b)\b/.test(mn)) { sessionLang = 'tn'; return 'tn'; }

  // Italian
  if (/\b(ciao|salve|buongiorno|buonasera|grazie|prego|quanto|costa|vorrei|voglio|zanzariera|finestra|porta|prezzo|posso|aiutare|italiano|arrivederci|preventivo)\b/.test(mn)) { sessionLang = 'it'; return 'it'; }

  // English
  if (/\b(hello|hi\b|hey\b|good|thank|please|what|how|can|want|need|price|door|window|mosquito|screen|quote|contact|where|when|help|yes|okay|ok|looking|i need|i want)\b/.test(mn)) { sessionLang = 'en'; return 'en'; }

  // French
  if (/\b(bonjour|salut|bonsoir|merci|oui|non|je|tu|il|nous|vous|le|la|les|un|une|des|est|sont|avec|pour|dans|sur|que|qui|comment|combien|où|quand|quel|quelle|votre|notre|mon|ton)\b/.test(mn)) { sessionLang = 'fr'; return 'fr'; }

  return sessionLang;
}

// ─── EXTRACT CLIENT NAME ─────────────────────────────────────────
function extractClientName(msg: string): string | null {
  const patterns = [
    /je m[''']appelle\s+([A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿ]{1,20})/i,
    /mon nom est\s+([A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿ]{1,20})/i,
    /my name is\s+([A-Z][a-z]{1,20})/i,
    /mi chiamo\s+([A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿ]{1,20})/i,
    /(?:ismi|esmi|smiti|ana ismi)\s+([A-Za-zÀ-ÿ]{2,20})(?:\s|$)/i,
    /(?:اسمي|أنا اسمي)\s+([؀-ۿ]{2,20})(?:\s|$)/,
  ];
  const skip = /^(un|une|le|la|les|the|a|an|de|du|des|au|aux|en|pour|sur|pas|non|bien|très|aussi|me|se|ne)$/i;
  for (const pat of patterns) {
    const match = msg.match(pat);
    if (match) {
      const name = match[1].trim();
      if (!skip.test(name) && name.length >= 2) return name;
    }
  }
  return null;
}

// ─── BUILD MEMORY FROM HISTORY ───────────────────────────────────
function buildMemory(history: Message[]): ConvMemory {
  const mem: ConvMemory = {
    clientName: null, lastProduct: null, lastWidth: null, lastHeight: null,
    lastQuantity: null, lastPrice: null, awaitingDimensions: false,
    awaitingProduct: false, awaitingPhone: false, mentionCount: 0,
  };

  for (const msg of [...history].reverse()) {
    const mn = norm(msg.content);
    if (!mem.lastProduct) {
      if (/(colibri|fenetre|window|finestra|chbek|chbabek)/.test(mn)) mem.lastProduct = 'colibri-50';
      else if (/(sidney.?ac|grande.*porte|porte.*double|double.*porte)/.test(mn)) mem.lastProduct = 'sidney-50-ac';
      else if (/(sidney|porte\b|door|bibia)/.test(mn)) mem.lastProduct = 'sidney-50';
      else if (/(plisse|plissé|plisse31|مطوية|بليسي)/.test(mn)) mem.lastProduct = 'plisse31';
      else if (/(elba|fixe|fixed|panneau)/.test(mn)) mem.lastProduct = 'elba';
    }
    if (!mem.lastWidth || !mem.lastHeight) {
      const dims = msg.content.match(/(\d{2,4})\s*[x×X*]\s*(\d{2,4})/i);
      if (dims) { mem.lastWidth = parseInt(dims[1]); mem.lastHeight = parseInt(dims[2]); }
    }
    if (!mem.clientName && msg.role === 'user') {
      mem.clientName = extractClientName(msg.content);
    }
    if (msg.role === 'assistant' && /(rappel|téléphone|phone|رقم)/i.test(msg.content)) {
      mem.awaitingPhone = true;
    }
  }
  return mem;
}

// ─── DETECT INTENT ───────────────────────────────────────────────
function detectIntent(msg: string): string {
  const m = norm(msg);

  if (/(je m[''']appelle|mon nom est|my name is|mi chiamo|ismi\b|esmi\b|smiti\b|اسمي|ana ismi)/.test(m)) return 'name_provided';
  if (/(parle.*arabe|b arbi|a7ki.*arbi|en arabe|speak.*arabic|parle.*tounsi|b tounsi|speak.*tunisian|in english|speak.*english|in italiano|parla.*italiano|en français|parle.*français|speak.*french)/.test(m)) return 'switch_language';
  if (/(kif 7alek|kifech|comment.*vas|ca va\??|how are you|come stai|كيف حالك|لاباس|labes 3lik|labess\??|labas\??|labes\??|7alek|kifeha|kif enti|kif nta|kifentom|shnowa\??|chnowa\??|wesh\b|esh 5barak|ach 5bark)/.test(m)) return 'casual_howru';
  if (/^(salut|bonjour|bonsoir|hello|hi\b|hey\b|ciao|salve|buongiorno|salam|ahla|labas|labes|wesh|slt|bjr|marhba|مرحبا|السلام|اهلا|صباح|كيف|واش|yesslm|aslema|aslama|alsema)/.test(m)) return 'greeting';
  if (/(au revoir|bye|goodbye|arrivederci|بسلامة|مع السلامة|bslama|besslema|ciao\b|tchao|ma3assalama)/.test(m)) return 'goodbye';
  if (/(merci|shukran|grazie|شكرا|barak|thanks|thank|يسلمو|y3tik|tislam|yikhlik)/.test(m)) return 'thanks';
  if (/(compare|comparaison|comparer|difference|versus|vs\b|mieux|better|quale|meglio|ahsen|قارن|مقارنة|فرق|احسن|far9\b|différence entre|quel produit choisir)/.test(m)) return 'comparison';
  if (/(tous.*produit|liste.*produit|gamme|catalogue|show.*all|list.*product|tutti.*prodott|kol.*produit|tous.*modele|منتجات.*كل|كل.*منتجاتك)/.test(m) && !/(fenetre|porte|fixe|colibri|sidney|elba|plisse|plissé|plisse31|مطوية|بليسي)/.test(m)) return 'product_list';
  if (/(colibri|colibrì|fenetre|window|finestra|chbek|chbabek|للشباك|للنافذة|شباك|نافذة|شبابيك)/.test(m)) return 'product_colibri';
  if (/(grande.*porte|porte.*double|double.*porte|sidney.?ac|bibian.*kbira|باب.*كبير|porta.*doppia|400\b|terrasse)/.test(m)) return 'product_sidneyAC';
  if (/(porte\b|door\b|porta\b|باب|بيبان|sidney|bibia|للباب)/.test(m) && !/(ac\b|double|grande|400)/.test(m)) return 'product_sidney';
  if (/(plisse|plissé|plisse31|مطوية|بليسي)/.test(m)) return 'product_plisse31';
  if (/(fixe|fixed|elba|panneau|panel|pannello|ثابت|لوح|إلبا)/.test(m)) return 'product_elba';
  if (extractAllDimensions(msg).length > 0) return 'dimensions_provided';
  if (/(devis|preventivo|quote|estimation|estimer|calcul|عرض.*سعر|تقدير|ديفيس|yehsibli|ahsibli|namel.*devis|n7eb.*devis|3ardh)/.test(m)) return 'devis_request';
  if (/(prix|tarif|combien|cout|coût|cher|price|cost|prezzo|quanto|thaman|ثمن|سعر|قداش|9adech|b9adech|becha|يكلف|ye5lef|thmen\b)/.test(m)) return 'price_inquiry';
  if (/(me contacter|rappel|rappelez|callback|اتصل بي|kallemni)/.test(m)) return 'callback_request';
  if (/(contact|telephone|tel|appel|appeler|whatsapp|watsap|numero|numéro|chiamare|telefono|واتساب|اتصل|رقم|هاتف|تلفون|atslni|teslni)/.test(m)) return 'contact';
  if (/(adresse|address|localisation|ou\b|où|fouchana|indirizzo|dove|وين|فين|فوشانة|عنوان|maps|win nla9akom|winfin ntom)/.test(m)) return 'location';
  if (/(horaire|heure|ouvert|ferme|fermé|orario|aperto|متى|ساعة|وقت|wa9t|9adeh.*se3a|quand.*ouvr)/.test(m)) return 'hours';
  if (/(installation|installer|montage|pose|installazione|تركيب|نصب|nrakkeb|yrakbouha)/.test(m)) return 'installation';
  if (/(delai|délai|delivery|consegna|أجل|9adech.*wa9t|wa9teh|waktha|mta twasselna|متى التسليم)/.test(m)) return 'delivery';
  if (/(zone|livraison|livrer|wilayet|vous livrez ou|توصيل|مناطق|où livrez-vous)/.test(m)) return 'zone';
  if (/(garantie|warranty|garanzia|daman|dhamen|ضمان|combien.*garanti|how long.*warranty)/.test(m)) return 'warranty';
  if (/(nettoyer|nettoyage|entretien|maintenance|clean|pulizia|تنظيف|نظافة|ndhafa)/.test(m)) return 'maintenance';
  if (/(couleur|color|colore|blanc|noir|gris|white|black|grey|bianco|nero|لون|أبيض|أسود|loun)/.test(m)) return 'colors';
  if (/(paiement|payer|payment|pay\b|virement|cheque|espece|cash|carte|kif nkhales|khlas|دفع|pagamento|nkhales|3arboun|عربون|comment payer)/.test(m)) return 'payment';
  if (/(showroom|visite|visiter|venir|boutique|magasin|niji|nayek|معرض|زيارة|sala.*mostra|visitare)/.test(m)) return 'showroom';
  if (/(propos|about|histoire|fondation|societe|company|entreprise|qui.*(vous|etes|siamo)|tarikh|متى.*بدأ|kima ta3melou|chnya ta3melou)/.test(m)) return 'about';
  if (/(recommendation|conseille|conseil|ansahni|recommend|consigliami|توصية|tansahni|ahsen.*produit)/.test(m)) return 'recommendation';
  if (/(promo|promotion|remise|reduction|offre.*special|discount|sconto|تخفيض|عرض.*خاص|ريميز)/.test(m)) return 'promo';
  if (/(ton nom|t'appelles|qui es.tu|who are you|come ti chiami|اسمك|شكون انت|comment tu t'appelles)/.test(m)) return 'casual_name';
  if (/(aide|help|aiuto|3awenni|mساعدة|comment.*fonctionne|how.*work|come.*funziona)/.test(m)) return 'help';
  if (/(oui|yes|si\b|aya|na3am|ok\b|bien|d'accord|mrigla|nchallah|nheb|nwafaq|exactement)/.test(m)) return 'affirmation';
  if (/(non|no\b|la\b|moch|naya|maynhebch|je.*veux.*pas|i don't|no grazie)/.test(m)) return 'negation';
  if (/(origine|source|d'ou viennent|provenance|مصدر|أين منتجاتكم|italie|grifo flex|maroc|tunisie|made in|من أين|d'où viennent)/.test(m)) return 'origin';
  if (/(specs|technique|caracteristiques|details|معلومات تقنية)/.test(m)) return 'specs';
  if (/(mesurer|comment mesurer|kif n9is|قياس|كيف أقيس|كيفاش نقيس)/.test(m)) return 'measure';
  return 'not_understood';
}

// ─── NAVIGATION DETECTION ────────────────────────────────────────
function detectNavTarget(msg: string): string | null {
  const m = norm(msg);
  
  // DEVIS / QUOTE
  if (/(devis|quote|preventivo|3ardh|عرض سعر|ديفيس|calcul|احسب|calcola|n7eb.*devis|nheb.*devis|faire.*devis|demander.*devis|ouvre.*devis|page.*devis|portami.*preventivo|apri.*preventivo|yhezni.*devis|emmeni.*devis|rouh.*devis|go.*devis|aller.*devis)/.test(m)) return '/produits';

  // PRODUCTS / CATALOGUE  
  if (/(produit|product|prodotto|catalogue|gamme|منتجات|كتالوج|les produits|voir.*produit|show.*product|chouf.*produit|portami.*prodott|yhezni.*produit|emmeni.*produit|rouh.*produit|go.*produit|aller.*produit)/.test(m)) return '/produits';

  // CONTACT
  if (/(contact|appel|appeler|telephone|whatsapp|atslni|teslni|اتصل|تواصل|contatto|chiamare|yhezni.*contact|emmeni.*contact|rouh.*contact|go.*contact|aller.*contact)/.test(m)) return '/contact';

  // ABOUT
  if (/(propos|about|histoire|societe|entreprise|qui.*vous|من نحن|عننا|chi siamo|storia|yhezni.*propos|emmeni.*propos|rouh.*propos|go.*about|aller.*propos)/.test(m)) return '/about';

  // HOME
  if (/(accueil|home|homepage|الرئيسية|الصفحة الرئيسية|home page|torna.*home|yhezni.*accueil|rouh.*accueil|go.*home|aller.*accueil)/.test(m)) return '/';

  return null;
}

// ─── MULTILINGUAL PRICE RESPONSE ─────────────────────────────────
function priceResponse(
  lang: Lang,
  productName: string,
  w: number,
  h: number,
  qty: number,
  b: PriceBreakdown,
  clientName: string | null,
): string {
  const qtyStr = qty > 1 ? ` × ${qty}` : '';
  const greet = clientName ? clientName + ', ' : '';

  const lines = {
    fr: `Pour un **${productName}** en ${w}×${h} cm${qtyStr} :\n• Prix HT : ${fmt(b.unitPrice)}\n• Remise ${BUSINESS_CONFIG.remisePct}% : -${fmt(b.remise)}\n• Total TTC : ${fmt(b.totalTTC)}\n\n${greet}Voulez-vous passer au devis ?`,
    tn: `Lel **${productName}** f ${w}×${h} cm${qtyStr} :\n• Prix HT : ${fmt(b.unitPrice)}\n• Remise ${BUSINESS_CONFIG.remisePct}% : -${fmt(b.remise)}\n• Total TTC : ${fmt(b.totalTTC)}\n\n${greet}T7eb namel devis ?`,
    ar: `لـ **${productName}** بـ ${w}×${h} سم${qtyStr} :\n• السعر بدون TVA : ${fmt(b.unitPrice)}\n• خصم ${BUSINESS_CONFIG.remisePct}% : -${fmt(b.remise)}\n• الإجمالي مع TVA : ${fmt(b.totalTTC)}\n\n${greet}هل تريد إعداد عرض الأسعار؟`,
    en: `For a **${productName}** in ${w}×${h} cm${qtyStr}:\n• Price excl. VAT: ${fmt(b.unitPrice)}\n• Discount ${BUSINESS_CONFIG.remisePct}%: -${fmt(b.remise)}\n• Total incl. VAT: ${fmt(b.totalTTC)}\n\n${greet}Would you like to proceed with a quote?`,
    it: `Per una **${productName}** in ${w}×${h} cm${qtyStr}:\n• Prezzo IVA escl.: ${fmt(b.unitPrice)}\n• Sconto ${BUSINESS_CONFIG.remisePct}%: -${fmt(b.remise)}\n• Totale IVA incl.: ${fmt(b.totalTTC)}\n\n${greet}Vuoi procedere con un preventivo?`,
  };
  return lines[lang] || lines.fr;
}

// ─── MULTI-WINDOW RESPONSE ───────────────────────────────────────
function multiWindowResponse(
  lang: Lang,
  productId: string,
  dims: Array<{ w: number; h: number }>,
  clientName: string | null,
): { text: string; totalTTC: number } {
  const product = PRODUCTS[productId];
  const productName = product?.name || productId;
  const rows: string[] = [];
  let grandTotal = 0;

  dims.forEach((d, i) => {
    const b = calcPriceBreakdown(productId, d.w, d.h);
    if (b) {
      rows.push(`  ${i + 1}. ${d.w}×${d.h}cm → ${fmt(b.totalTTC)}`);
      grandTotal += b.totalTTC;
    } else {
      rows.push(`  ${i + 1}. ${d.w}×${d.h}cm → hors dimensions`);
    }
  });

  const greet = clientName ? clientName + ', ' : '';
  const texts: Record<Lang, string> = {
    fr: `📐 Calcul multi-fenêtres **${productName}** :\n\n${rows.join('\n')}\n\n━━━━━━━━━━━━━━━\n💳 **TOTAL GLOBAL TTC : ${fmt(grandTotal)}**\n\n${greet}Voulez-vous un devis complet ?`,
    tn: `📐 7sab multi-chbabek **${productName}** :\n\n${rows.join('\n')}\n\n━━━━━━━━━━━━━━━\n💳 **TOTAL TTC : ${fmt(grandTotal)}**\n\n${greet}T7eb namel devis complet ?`,
    ar: `📐 حساب متعدد النوافذ **${productName}** :\n\n${rows.join('\n')}\n\n━━━━━━━━━━━━━━━\n💳 **الإجمالي الكلي مع TVA : ${fmt(grandTotal)}**\n\n${greet}هل تريد عرض أسعار كاملاً؟`,
    en: `📐 Multi-window calculation for **${productName}**:\n\n${rows.join('\n')}\n\n━━━━━━━━━━━━━━━\n💳 **GRAND TOTAL incl. VAT: ${fmt(grandTotal)}**\n\n${greet}Would you like a full quote?`,
    it: `📐 Calcolo multi-finestra **${productName}**:\n\n${rows.join('\n')}\n\n━━━━━━━━━━━━━━━\n💳 **TOTALE GLOBALE IVA incl.: ${fmt(grandTotal)}**\n\n${greet}Vuoi un preventivo completo?`,
  };

  return { text: texts[lang] || texts.fr, totalTTC: grandTotal };
}

// ─── COMPARISON TABLE ────────────────────────────────────────────
function buildComparisonTable(lang: Lang): ComparisonTable {
  const labels: Record<Lang, { dims: string; price: string; type: string; caisson: string; maxW: string; maxH: string; }> = {
    fr: { dims: 'Dimensions max', price: 'Prix de départ', type: 'Type', caisson: 'Caisson', maxW: 'Larg. max', maxH: 'Haut. max' },
    ar: { dims: 'الأبعاد القصوى', price: 'السعر من', type: 'النوع', caisson: 'الصندوق', maxW: 'أقصى عرض', maxH: 'أقصى ارتفاع' },
    tn: { dims: 'Dimensioun kbar', price: 'Thmen min', type: 'Naw3', caisson: 'Caisson', maxW: 'A3adh max', maxH: 'Toul max' },
    en: { dims: 'Max dimensions', price: 'Starting price', type: 'Type', caisson: 'Housing', maxW: 'Max width', maxH: 'Max height' },
    it: { dims: 'Dimensioni max', price: 'Prezzo base', type: 'Tipo', caisson: 'Cassone', maxW: 'Larg. max', maxH: 'Alt. max' },
  };
  const l = labels[lang] || labels.fr;
  return {
    headers: ['', 'COLIBRÌ 50', 'SIDNEY 50', 'SIDNEY 50 AC', 'ELBA', 'PLISSÉ 31'],
    rows: [
      { label: l.type, colibri: '🪟 Fenêtre', sidney: '🚪 Porte', sidneyAC: '🚪🚪 Grande porte', elba: '🪟 Fixe', plisse31: '🪟 Plissé' },
      { label: l.maxW, colibri: '200 cm', sidney: '200 cm', sidneyAC: '400 cm', elba: 'Sur mesure', plisse31: '500 cm' },
      { label: l.maxH, colibri: '250 cm', sidney: '260 cm', sidneyAC: '260 cm', elba: 'Sur mesure', plisse31: '300 cm' },
      { label: l.price, colibri: 'dès 263 DT', sidney: 'dès 611 DT', sidneyAC: 'dès 1224 DT', elba: 'dès 326 DT/m²', plisse31: 'dès 1115 DT' },
      { label: l.caisson, colibri: '50mm', sidney: '50mm', sidneyAC: '50mm', elba: 'Aucun', plisse31: 'Aucun' },
    ],
  };
}

// ─── PRODUCT INFO RESPONSE ───────────────────────────────────────
function productInfoResponse(lang: Lang, productId: string, clientName: string | null): string {
  const p = PRODUCTS[productId];
  if (!p) return '';
  const greet = clientName ? clientName + ', ' : '';
  const features = p.features.slice(0, 3).map(f => `• ${f}`).join('\n');
  const priceInfo = p.startPrice
    ? { fr: `dès ${p.startPrice} DT HT`, tn: `min ${p.startPrice} DT`, ar: `ابتداءً من ${p.startPrice} DT`, en: `from ${p.startPrice} DT`, it: `da ${p.startPrice} DT` }
    : { fr: `${Object.values(p.pricePerM2 || {})[0] || '?'} DT/m²`, tn: `${Object.values(p.pricePerM2 || {})[0] || '?'} DT/m²`, ar: `${Object.values(p.pricePerM2 || {})[0] || '?'} DT/m²`, en: `${Object.values(p.pricePerM2 || {})[0] || '?'} DT/m²`, it: `${Object.values(p.pricePerM2 || {})[0] || '?'} DT/m²` };

  const texts: Record<Lang, string> = {
    fr: `🪟 **${p.name}** — ${p.category}\n\n${p.description}\n\n${features}\n\n📏 Max : ${p.maxW}×${p.maxH} cm\n💰 ${priceInfo.fr}\n\n${greet}Voulez-vous calculer un prix ? Envoyez vos dimensions (ex: 150×120)`,
    tn: `🪟 **${p.name}** — ${p.category}\n\n${p.description}\n\n${features}\n\n📏 Max : ${p.maxW}×${p.maxH} cm\n💰 ${priceInfo.tn}\n\n${greet}T7eb n9der el thmen ? Baathe les dimensions (ex: 150×120)`,
    ar: `🪟 **${p.name}** — ${p.category}\n\n${p.description}\n\n${features}\n\n📏 الحد الأقصى : ${p.maxW}×${p.maxH} cm\n💰 ${priceInfo.ar}\n\n${greet}هل تريد حساب السعر؟ أرسل الأبعاد (مثال: 150×120)`,
    en: `🪟 **${p.name}** — ${p.category}\n\n${p.description}\n\n${features}\n\n📏 Max: ${p.maxW}×${p.maxH} cm\n💰 ${priceInfo.en}\n\n${greet}Want to calculate a price? Send your dimensions (e.g. 150×120)`,
    it: `🪟 **${p.name}** — ${p.category}\n\n${p.description}\n\n${features}\n\n📏 Max: ${p.maxW}×${p.maxH} cm\n💰 ${priceInfo.it}\n\n${greet}Vuoi calcolare un prezzo? Invia le dimensioni (es: 150×120)`,
  };
  return texts[lang] || texts.fr;
}

// ─── SUGGESTIONS ───────────────────────────────────────────────
const SUGGESTIONS: Record<string, Record<Lang, string[]>> = {
  greeting: {
    fr: ['Calculer un prix', 'Voir les produits', 'Demander un devis'],
    tn: ['A7seb thmen', 'Chouf les produits', 'Nheb devis'],
    ar: ['احسب السعر', 'عرض المنتجات', 'طلب عرض أسعار'],
    en: ['Calculate price', 'View products', 'Request a quote'],
    it: ['Calcola prezzo', 'Vedi prodotti', 'Richiedi preventivo'],
  },
  product: {
    fr: ['Demander ce devis', 'Calculer un prix', 'Voir un autre modèle'],
    tn: ['A3mel devis hetha', 'A7seb thmen', 'Chouf modèle e5er'],
    ar: ['طلب هذا العرض', 'احسب السعر', 'رؤية موديل آخر'],
    en: ['Request this quote', 'Calculate price', 'See another model'],
    it: ['Richiedi questo preventivo', 'Calcola prezzo', 'Vedi altro modello'],
  },
  price: {
    fr: ['Ouvrir le devis', 'Voir les produits', 'Prendre rendez-vous'],
    tn: ['Iftah devis', 'Chouf les produits', 'Khoudh rendez-vous'],
    ar: ['فتح عرض الأسعار', 'عرض المنتجات', 'احجز موعداً'],
    en: ['Open quote', 'View products', 'Book appointment'],
    it: ['Apri preventivo', 'Vedi prodotti', 'Prenota appuntamento'],
  },
  contact: {
    fr: ['Appeler maintenant', 'WhatsApp', 'Voir sur la carte'],
    tn: ['3ayyet taw', 'WhatsApp', 'Chouf lel karta'],
    ar: ['اتصل الآن', 'واتساب', 'انظر على الخريطة'],
    en: ['Call now', 'WhatsApp', 'View on map'],
    it: ['Chiama ora', 'WhatsApp', 'Vedi sulla mappa'],
  },
};

function getSuggestions(intent: string, lang: Lang): string[] {
  if (SUGGESTIONS[intent]) return SUGGESTIONS[intent][lang] || SUGGESTIONS[intent].fr;
  if (['product_colibri', 'product_sidney', 'product_sidneyAC', 'product_elba', 'product_plisse31'].includes(intent)) return SUGGESTIONS.product[lang] || SUGGESTIONS.product.fr;
  if (['price_inquiry', 'dimensions_provided'].includes(intent)) return SUGGESTIONS.price[lang] || SUGGESTIONS.price.fr;
  return SUGGESTIONS.greeting[lang] || SUGGESTIONS.greeting.fr;
}

// ─── OPENAI FALLBACK ─────────────────────────────────────────────
async function processWithOpenAI(
  userText: string,
  history: Message[],
  lang: Lang,
  onChunk: (chunk: string) => void,
  base64Image?: string | null,
): Promise<string | null> {
  const systemPrompt = `Tu es ALU, l'assistant commercial expert d'Aluminium Space, spécialiste menuiserie aluminium et partenaire Grifo Flex (Italie) à Mghira, Tunis, Tunisie.

TON OBJECTIF : Convertir chaque visiteur en client. Chaque réponse rapproche l'utilisateur d'une commande ou d'un contact.

━━━ IDENTITÉ ━━━
- Prénom : ALU
- Ton : Chaleureux, expert, direct. Comme un ami qui connaît le produit.
- Tu détectes automatiquement la langue et réponds DANS LA MÊME LANGUE :
  → Darija tunisienne → réponds en Darija tunisienne
  → Arabe classique → réponds en arabe classique
  → Français → réponds en français
  → English → respond in English
  → Italiano → rispondi in italiano
  → Mélange → utilise le même mélange
- Tu ne parles QUE de moustiquaires, menuiserie aluminium, et Aluminium Space.
- Hors-sujet → "Je suis spécialisé uniquement dans nos produits 😊 Puis-je vous aider ?"

━━━ PRODUITS MOUSTIQUAIRES GRIFO FLEX ━━━
Structure : aluminium (Blanc RAL 9010 ou Noir mat)
Panneau : fibre de verre recouverte de PVC
Garantie : 3 ans. Fabriquées en Italie. Certifiées Grifoflex® Spa.

1. Colibrì 50 → Fenêtres. Enroulable à ressort. BESTSELLER.
2. Sidney 50 → Portes battantes/coulissantes. Idéale entrées.
3. Sidney 50 AC → Grandes baies vitrées. Double caisson, ouverture centrale bidirectionnelle.
4. Elba → Ouvertures fixes. Panneau fixe sur mesure. Discret et solide.
5. Plissé 31 Bilatérale → Grandes ouvertures. Protection bilatérale. Rail extra plat 31mm.

PRIX INDICATIFS (seulement si demandé sans dimensions) :
- Colibrì 50 : à partir de 180 DT (100x120cm)
- Sidney 50 : à partir de 220 DT (100x210cm)
- Sidney 50 AC : à partir de 280 DT (200x210cm)
- Elba : à partir de 326 DT/m²
- Plissé 31 : à partir de 320 DT (200x210cm)
Prix HT. TVA 19% + FODEC 1% s'appliquent. Remise possible sur commande groupée.

━━━ MENUISERIE ALUMINIUM ━━━
Aluminium Space est aussi spécialiste en menuiserie aluminium : portes, fenêtres, baies vitrées, façades, pergolas et plus.
Pour tout projet aluminium → orienter vers le contact direct (pas de prix en ligne).

━━━ RÈGLES PRIX ━━━
- Ne JAMAIS donner un prix fixe sans dimensions pour les moustiquaires.
- Toujours demander : "Donnez-moi vos dimensions (Largeur × Hauteur en cm) pour un prix précis."
- Si insistance : donner le prix indicatif ci-dessus avec "à partir de".

━━━ CONTACT & INFOS ━━━
- Tél : (+216) 53 186 611 / (+216) 57 099 070
- WhatsApp : +216 57 099 070 → https://wa.me/21657099070
- Email : contact@aluminiumspace.com
- Adresse : 125 lot Laaroussi, Mghira, Tunis, Tunisie
- Horaires : Lun–Ven 8h00–17h00 | Sam 8h00–12h00 | Dim Fermé
- Zone : Tunis et Grand Tunis uniquement. Hors zone → "Laissez votre contact, on vous informe dès l'extension."

━━━ STRATÉGIE DE CONVERSION ━━━
- Hésite → "La Colibrì est notre bestseller, la plus rapide à installer. Vos dimensions ?"
- Veut devis → "Cliquez sur 'Faire un Devis' pour un prix en 2 minutes !"
- Veut appeler → "WhatsApp : +216 57 099 070, on répond rapidement 😊"
- "Je réfléchis" → "L'été arrive vite et l'installation prend 3–7 jours. On calcule le prix maintenant ?"
- Projet aluminium → "Pour vos projets aluminium, contactez-nous directement : +216 57 099 070"
- Toujours terminer par une question ou un appel à l'action.

━━━ NAVIGATION ━━━
Tu peux guider l'utilisateur vers les pages du site.
Si l'utilisateur veut voir les produits → dis "Je vous emmène sur la page produits !" et utilise navigate /produits
Si l'utilisateur veut un devis → dis "Je vous emmène vers nos produits pour choisir !" et utilise navigate /produits  
Si l'utilisateur veut nous contacter → dis "Je vous emmène sur la page contact !" et utilise navigate /contact
Si l'utilisateur veut en savoir plus sur nous → dis "Je vous emmène sur la page À propos !" et utilise navigate /about

━━━ FORMAT ━━━
- Maximum 3 phrases. Percutant et naturel.
- Jamais de listes à puces dans la réponse.
- Toujours terminer par une question ou CTA.`;

  try {
    const recentHistory = history.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const messages = [
      ...recentHistory,
      {
        role: 'user',
        content: base64Image ? [
          { type: 'text', text: `[User language: ${lang}] ${userText}\nAnalyze this image. If it shows a window or door opening, suggest the most appropriate Grifo Flex mosquito screen model and explain why.` },
          { type: 'image_url', image_url: { url: base64Image } }
        ] : `[User language: ${lang}] ${userText}`
      },
    ];

    const response = await fetch('https://boitmxnutzsvxlbsmdow.supabase.co/functions/v1/ai-chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ messages, systemPrompt }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.content) {
      onChunk(data.content); // Call once so the UI still renders the text
    }
    
    return data.content || null;
  } catch (error) {
    console.error('AI Error:', error);
    return null;
  }
}

// ─── MAIN PROCESS FUNCTION ───────────────────────────────────────
export async function processLocalMessage(
  userText: string,
  history: Message[],
  onChunk: (chunk: string) => void,
  preferredLang?: Lang,
  base64Image?: string | null,
): Promise<AIResponse> {
  // Image handling forces OpenAI fallback immediately
  if (base64Image) {
    const aiText = await processWithOpenAI(userText, history, preferredLang || 'fr', onChunk, base64Image);
    return { text: aiText || 'Erreur image', detectedLang: preferredLang || 'fr' };
  }
  // Seed session language from site language on first message
  if (preferredLang && sessionCount === 0) updateSessionLang(preferredLang);
  sessionCount++;
  const lang = detectLanguage(userText);
  const intent = detectIntent(userText);
  const mem = buildMemory(history);
  const clientName = mem.clientName || extractClientName(userText);

  // NAME
  if (intent === 'name_provided') {
    const name = extractClientName(userText) || clientName;
    const texts: Record<Lang, string> = {
      fr: `Enchanté, **${name}** ! 😊 Je suis ALU, votre assistant Aluminium Space. Comment puis-je vous aider aujourd'hui ?`,
      tn: `Ahlén ${name}! 😊 Ana ALU, el-mosa3ed mte3 Aluminium Space. Kfeh naa3awnek ?`,
      ar: `أهلاً ${name}! 😊 أنا ALU، مساعد Aluminium Space. كيف يمكنني مساعدتك؟`,
      en: `Nice to meet you, **${name}**! 😊 I'm ALU, your Aluminium Space assistant. How can I help?`,
      it: `Piacere, **${name}**! 😊 Sono ALU, il tuo assistente Aluminium Space. Come posso aiutarti?`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // SWITCH LANGUAGE
  if (intent === 'switch_language') {
    const texts: Record<Lang, string> = {
      fr: "Bien sûr ! Je parle maintenant en français. Comment puis-je vous aider ?",
      tn: "Mrigla ! Taw n7ki b tounsi. Kfeh n3awnek ?",
      ar: "حسناً! سأتحدث الآن بالعربية. كيف يمكنني مساعدتك؟",
      en: "Sure! I'm now speaking English. How can I help you?",
      it: "Certo! Parlo ora in italiano. Come posso aiutarti?",
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // GREETING
  if (intent === 'greeting') {
    const name = clientName ? ` **${clientName}**` : '';
    const texts: Record<Lang, string> = {
      fr: `Bonjour${name} ! 👋 Je suis **ALU**, l'assistant Aluminium Space. Comment puis-je vous aider ?`,
      tn: `Aslema${name} ! 👋 Ana **ALU**, el-mosa3ed mte3 Aluminium Space. Kfeh n3awnek ?`,
      ar: `أهلاً${name}! 👋 أنا **ALU**، مساعد Aluminium Space. كيف يمكنني مساعدتك؟`,
      en: `Hello${name}! 👋 I'm **ALU**, the Aluminium Space assistant. How can I help you?`,
      it: `Ciao${name}! 👋 Sono **ALU**, l'assistente Aluminium Space. Come posso aiutarti?`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // DIMENSIONS PROVIDED
  if (intent === 'dimensions_provided') {
    const dims = extractAllDimensions(userText);
    const productId = mem.lastProduct || 'colibri-50';
    const product = PRODUCTS[productId];

    if (!product) {
      const texts: Record<Lang, string> = {
        fr: "Pour quel produit souhaitez-vous calculer ? (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, ou ELBA)",
        tn: "Asch produit t7eb n9der ? (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, walla ELBA)",
        ar: "لأي منتج تريد الحساب؟ (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, أو ELBA)",
        en: "Which product to calculate? (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, or ELBA)",
        it: "Per quale prodotto calcolare? (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, o ELBA)",
      };
      return { text: texts[lang] || texts.fr, detectedLang: lang };
    }

    // Multi-window
    if (dims.length > 1) {
      const result = multiWindowResponse(lang, productId, dims, clientName);
      const firstValid = dims.find(d => calcPriceBreakdown(productId, d.w, d.h) !== null);
      const totalB = firstValid ? calcPriceBreakdown(productId, firstValid.w, firstValid.h) : null;
      return {
        text: result.text,
        detectedLang: lang,
        suggestions: getSuggestions('price', lang),
        productImage: product.image,
        devisButton: firstValid && totalB ? {
          show: true,
          productId,
          width: firstValid.w,
          height: firstValid.h,
          price: result.totalTTC,
          label: `➕ Ajouter au devis — ${fmt(result.totalTTC)} TTC`,
        } : undefined,
        loadingType: 'calculate',
      };
    }

    // Single dimension
    const { w, h } = dims[0];
    const breakdown = calcPriceBreakdown(productId, w, h);

    if (!breakdown) {
      let limitStr = `${product.maxW}×${product.maxH}`;
      if (productId === 'colibri-50') {
        limitStr = h > 170 ? '160×250' : '200×250';
      }

      const texts: Record<Lang, string> = {
        fr: `⚠️ Les dimensions ${w}×${h} cm dépassent les limites du **${product.name}** (max ${limitStr} cm). Vérifiez vos mesures ou contactez-nous.`,
        tn: `⚠️ El dimensions ${w}×${h} cm kbar 3al **${product.name}** (max ${limitStr} cm). 3awedha tnajem walla atslna.`,
        ar: `⚠️ الأبعاد ${w}×${h} سم تتجاوز حدود **${product.name}** (الحد الأقصى ${limitStr} سم). تحقق من قياساتك.`,
        en: `⚠️ Dimensions ${w}×${h} cm exceed **${product.name}** limits (max ${limitStr} cm). Check your measurements.`,
        it: `⚠️ Le dimensioni ${w}×${h} cm superano i limiti di **${product.name}** (max ${limitStr} cm). Verifica le misure.`,
      };
      return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('price', lang) };
    }

    return {
      text: priceResponse(lang, product.name, w, h, 1, breakdown, clientName),
      detectedLang: lang,
      suggestions: getSuggestions('price', lang),
      productImage: product.image,
      devisButton: {
        show: true,
        productId,
        width: w,
        height: h,
        price: breakdown.totalTTC,
        label: `📋 Demander ce devis — ${fmt(breakdown.totalTTC)}`,
      },
      action: { type: 'open_devis_wizard', params: { productId, width: w, height: h } },
      actionLabel: undefined,
      loadingType: 'calculate',
    };
  }

  // PRICE INQUIRY without dimensions
  if (intent === 'price_inquiry') {
    const productId = mem.lastProduct;
    if (!productId) {
      const texts: Record<Lang, string> = {
        fr: "💡 Pour calculer le prix, précisez :\n1. Le produit (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, ELBA)\n2. Les dimensions en cm (ex: **150×120**)\n\nQuel est votre produit ?",
        tn: "💡 Bech n9der el thmen, 9olli :\n1. El produit (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, ELBA)\n2. El dimensions en cm (ex: **150×120**)\n\nAsch produit t7eb ?",
        ar: "💡 لحساب السعر، حدد:\n1. المنتج (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, ELBA)\n2. الأبعاد بالسنتيمتر (مثال: **150×120**)\n\nأي منتج تريد؟",
        en: "💡 To calculate a price, specify:\n1. The product (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, ELBA)\n2. Dimensions in cm (e.g. **150×120**)\n\nWhich product?",
        it: "💡 Per calcolare il prezzo, specifica:\n1. Il prodotto (COLIBRÌ 50, SIDNEY 50, SIDNEY 50 AC, ELBA)\n2. Le dimensioni in cm (es: **150×120**)\n\nQuale prodotto?",
      };
      return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: ['COLIBRÌ 50', 'SIDNEY 50', 'ELBA'] };
    }

    // Has product but no dims
    if (!mem.lastWidth || !mem.lastHeight) {
      const p = PRODUCTS[productId];
      const texts: Record<Lang, string> = {
        fr: `Pour **${p?.name}**, envoyez les dimensions en cm.\nExemple: **150×120** (largeur × hauteur)\nMax: ${p?.maxW}×${p?.maxH} cm`,
        tn: `Bech **${p?.name}**, ba3ath el dimensions b cm.\nMethel: **150×120** (3ardh × toul)\nMax: ${p?.maxW}×${p?.maxH} cm`,
        ar: `لـ **${p?.name}**، أرسل الأبعاد بالسنتيمتر.\nمثال: **150×120** (عرض × ارتفاع)\nالحد الأقصى: ${p?.maxW}×${p?.maxH} سم`,
        en: `For **${p?.name}**, send dimensions in cm.\nExample: **150×120** (width × height)\nMax: ${p?.maxW}×${p?.maxH} cm`,
        it: `Per **${p?.name}**, invia le dimensioni in cm.\nEsempio: **150×120** (larghezza × altezza)\nMax: ${p?.maxW}×${p?.maxH} cm`,
      };
      return { text: texts[lang] || texts.fr, detectedLang: lang };
    }

    // Has product and dims — calculate
    const b = calcPriceBreakdown(productId, mem.lastWidth!, mem.lastHeight!);
    if (!b) {
      const texts: Record<Lang, string> = {
        fr: "Dimensions hors limites. Veuillez vérifier les dimensions du produit.",
        tn: "El dimensions kbar. Vérifiez dimensions el produit.",
        ar: "الأبعاد خارج الحدود. تحقق من أبعاد المنتج.",
        en: "Dimensions out of range. Please check product dimensions.",
        it: "Dimensioni fuori range. Verifica le dimensioni del prodotto.",
      };
      return { text: texts[lang] || texts.fr, detectedLang: lang };
    }
    const p = PRODUCTS[productId];
    return {
      text: priceResponse(lang, p?.name || productId, mem.lastWidth!, mem.lastHeight!, 1, b, clientName),
      detectedLang: lang,
      suggestions: getSuggestions('price', lang),
      productImage: p?.image,
      devisButton: { show: true, productId, width: mem.lastWidth!, height: mem.lastHeight!, price: b.totalTTC, label: `📋 Demander ce devis — ${fmt(b.totalTTC)}` },
      loadingType: 'calculate',
    };
  }

  //   // COMPARISON / CHOICE
  if (intent === 'comparison' || intent === 'choosing') {
    const texts: Record<Lang, string> = {
      fr: `⚖️ **Quel produit choisir :**\n\n• Fenêtre normale → **COLIBRÌ 50**\n• Porte simple → **SIDNEY 50**\n• Grande baie / terrasse → **SIDNEY 50 AC**\n• Budget serré / fenêtre fixe → **ELBA**\n\nLequel vous intéresse ?`,
      tn: `⚖️ **Asch ta5tar :**\n\n• Chbek 3adi → **COLIBRÌ 50**\n• Beb 3adi → **SIDNEY 50**\n• Baie vitrée kbira → **SIDNEY 50 AC**\n• Budget sghir walla chbek fixe → **ELBA**\n\nAsch t7eb ?`,
      ar: `⚖️ **أي منتج تختار :**\n\n• نافذة عادية → **COLIBRÌ 50**\n• باب بسيط → **SIDNEY 50**\n• نافذة كبيرة → **SIDNEY 50 AC**\n• ميزانية محدودة / نافذة ثابتة → **ELBA**\n\nما الذي يهمك؟`,
      en: `⚖️ **Which product to choose:**\n\n• Standard window → **COLIBRÌ 50**\n• Single door → **SIDNEY 50**\n• Large opening → **SIDNEY 50 AC**\n• Budget/Fixed → **ELBA**\n\nWhich one interests you?`,
      it: `⚖️ **Quale prodotto scegliere:**\n\n• Finestra standard → **COLIBRÌ 50**\n• Porta singola → **SIDNEY 50**\n• Grande apertura → **SIDNEY 50 AC**\n• Economica/Fissa → **ELBA**\n\nQuale ti interessa?`,
    };
    return {
      text: texts[lang] || texts.fr,
      suggestions: ['Voir Colibrì 50', 'Voir Sidney 50', 'Voir Elba'],
      detectedLang: lang,
      comparisonTable: buildComparisonTable(lang),
    };
  }

  // CALLBACK REQUEST
  if (intent === 'callback_request' || mem.awaitingPhone) {
    const phoneMatch = userText.match(/(?:(?:(?:\+|00)216)?[\s.-]*[234579]\d{7})/);
    const extractedPhone = phoneMatch ? phoneMatch[0] : null;

    if (extractedPhone && clientName) {
      const waUrl = `https://wa.me/${BUSINESS_CONFIG.WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(`Nouveau rappel demandé: ${clientName} - ${extractedPhone}`)}`;
      return {
        text: {
          fr: `Merci ${clientName}. J'ai noté votre numéro ${extractedPhone}. Je transmets la demande !`,
          tn: `Ayshek ${clientName}. 9ayedt numrourek ${extractedPhone}. Taw nkalmok!`,
          ar: `شكراً ${clientName}. لقد سجلت رقمك ${extractedPhone}. سأنقل طلبك!`,
          en: `Thank you ${clientName}. I have noted your number ${extractedPhone}. I'm forwarding the request!`,
          it: `Grazie ${clientName}. Ho annotato il tuo numero ${extractedPhone}. Inoltro la richiesta!`,
        }[lang] || `Merci.`,
        action: { type: 'navigate_to_page', params: { path: waUrl } },
        actionLabel: '💬 Ouvrir WhatsApp',
        detectedLang: lang,
      };
    } else if (clientName && !extractedPhone) {
      return {
        text: {
          fr: "Quel est votre numéro de téléphone pour que nous puissions vous rappeler ?",
          tn: "A3tini numrourek bech nkalmok ?",
          ar: "ما هو رقم هاتفك لكي نتمكن من الاتصال بك؟",
          en: "What is your phone number so we can call you back?",
          it: "Qual è il tuo numero di telefono per richiamarti?",
        }[lang] || "Phone number?",
        detectedLang: lang,
      };
    } else if (!clientName) {
      return {
        text: {
          fr: "Quel est votre nom et votre numéro de téléphone pour le rappel ?",
          tn: "Asmk w numrourek bech nkalmok ?",
          ar: "ما هو اسمك ورقم هاتفك للاتصال بك؟",
          en: "What is your name and phone number for the callback?",
          it: "Qual è il tuo nome e numero di telefono per il richiamo?",
        }[lang] || "Name and phone?",
        detectedLang: lang,
      };
    }
  }

  // PRODUCT LIST
  if (intent === 'product_list') {
    const texts: Record<Lang, string> = {
      fr: `🪟 **Nos 5 modèles de moustiquaires** :\n\n**1. COLIBRÌ 50** — Fenêtres enroulables\nDimensions max : 200 cm × 250 cm | Dès 263 DT\n\n**2. SIDNEY 50** — Portes enroulables\nDimensions max : 200×260 cm | Dès 611 DT\n\n**3. SIDNEY 50 AC** — Grandes portes (double)\nDimensions max : 400×260 cm | Dès 1224 DT\n\n**4. ELBA** — Panneau fixe\nDimensions max : Sur mesure | Dès 326 DT/m²\n\n**5. PLISSÉ 31** — Plissé bilatéral\nDimensions max : 500×300 cm | Dès 1115 DT\n\nQuel modèle vous intéresse ?`,
      tn: `🪟 **5 modèles mte3 moustika** :\n\n**1. COLIBRÌ 50** — Chbabek enroulables\nMax : 200 cm × 250 cm | Min 263 DT\n\n**2. SIDNEY 50** — Biban enroulables\nMax : 200×260 cm | Min 611 DT\n\n**3. SIDNEY 50 AC** — Biban kbar (double)\nMax : 400×260 cm | Min 1224 DT\n\n**4. ELBA** — Panneau fixe\nMax : Sur mesure | Min 326 DT/m²\n\n**5. PLISSÉ 31** — Plissé bilatéral\nMax : 500×300 cm | Min 1115 DT\n\nAsch modèle ye3jebek ?`,
      ar: `🪟 **منتجاتنا الخمسة** :\n\n**1. COLIBRÌ 50** — نوافذ قابلة للطي\nالحد الأقصى : 200 cm × 250 سم | ابتداءً من 263 DT\n\n**2. SIDNEY 50** — أبواب قابلة للطي\nالحد الأقصى : 200×260 سم | ابتداءً من 611 DT\n\n**3. SIDNEY 50 AC** — أبواب كبيرة (مزدوجة)\nالحد الأقصى : 400×260 سم | ابتداءً من 1224 DT\n\n**4. ELBA** — لوح ثابت\nالحد الأقصى : Sur mesure | ابتداءً من 326 DT/m²\n\n**5. PLISSÉ 31** — مطوية ثنائية\nالحد الأقصى : 500×300 سم | ابتداءً من 1115 DT\n\nأي موديل يعجبك؟`,
      en: `🪟 **Our 5 mosquito screen models** :\n\n**1. COLIBRÌ 50** — Window retractable\nMax: 200 cm × 250 cm | From 263 DT\n\n**2. SIDNEY 50** — Door retractable\nMax: 200×260 cm | From 611 DT\n\n**3. SIDNEY 50 AC** — Large doors (double)\nMax: 400×260 cm | From 1224 DT\n\n**4. ELBA** — Fixed panel\nMax: Sur mesure | From 326 DT/m²\n\n**5. PLISSÉ 31** — Bilateral pleated\nMax: 500×300 cm | From 1115 DT\n\nWhich model interests you?`,
      it: `🪟 **I nostri 5 modelli di zanzariere** :\n\n**1. COLIBRÌ 50** — Finestre avvolgibili\nMax: 200 cm × 250 cm | Da 263 DT\n\n**2. SIDNEY 50** — Porte avvolgibili\nMax: 200×260 cm | Da 611 DT\n\n**3. SIDNEY 50 AC** — Porte grandi (doppie)\nMax: 400×260 cm | Da 1224 DT\n\n**4. ELBA** — Pannello fisso\nMax: Sur mesure | Da 326 DT/m²\n\n**5. PLISSÉ 31** — Plissettata bilaterale\nMax: 500×300 cm | Da 1115 DT\n\nQuale modello ti interessa?`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      suggestions: ['COLIBRÌ 50', 'SIDNEY 50', 'ELBA'],
      action: { type: 'navigate_to_page', params: { path: '/produits' } },
      actionLabel: { fr: '🛍 Voir le catalogue', tn: '🛍 Chouf el catalogue', ar: '🛍 عرض الكتالوج', en: '🛍 View catalogue', it: '🛍 Vedi catalogo' }[lang] || '🛍 Voir le catalogue',
    };
  }

  // RECOMMENDATION
  if (intent === 'recommendation') {
    const texts: Record<Lang, string> = {
      fr: `🎯 **Voici mon conseil** :\n\n🪟 Pour une **fenêtre** → **COLIBRÌ 50** (enroulable discret)\n🚪 Pour une **porte standard** → **SIDNEY 50** (avec poignée pliante)\n🚪🚪 Pour une **grande baie** → **SIDNEY 50 AC** (double caisson)\n📌 Pour une **solution économique** → **ELBA** (panneau fixe)\n\nDites-moi votre ouverture et je calcule le prix !`,
      tn: `🎯 **Conseils mte3i** :\n\n🪟 Pour **chbek** → **COLIBRÌ 50** (enroulable)\n🚪 Pour **bab standard** → **SIDNEY 50** (b poignée)\n🚪🚪 Pour **bab kbir** → **SIDNEY 50 AC** (double)\n📌 Pour **7el rkhis** → **ELBA** (fixe)\n\nChapit 3tini dimensions w n9der el thmen !`,
      ar: `🎯 **توصياتي** :\n\n🪟 للـ**نافذة** → **COLIBRÌ 50**\n🚪 للـ**باب العادي** → **SIDNEY 50**\n🚪🚪 للـ**الفتحة الكبيرة** → **SIDNEY 50 AC**\n📌 للـ**حل الاقتصادي** → **ELBA**\n\nأرسل لي الأبعاد لحساب السعر!`,
      en: `🎯 **My recommendation** :\n\n🪟 For a **window** → **COLIBRÌ 50**\n🚪 For a **standard door** → **SIDNEY 50**\n🚪🚪 For a **large opening** → **SIDNEY 50 AC**\n📌 For a **budget option** → **ELBA**\n\nTell me your opening size and I'll calculate the price!`,
      it: `🎯 **La mia raccomandazione** :\n\n🪟 Per una **finestra** → **COLIBRÌ 50**\n🚪 Per una **porta standard** → **SIDNEY 50**\n🚪🚪 Per una **grande apertura** → **SIDNEY 50 AC**\n📌 Per una **soluzione economica** → **ELBA**\n\nDimmi le dimensioni e calcolo il prezzo!`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      comparisonTable: buildComparisonTable(lang),
      suggestions: getSuggestions('product', lang),
    };
  }

  // CONTACT
  if (intent === 'contact') {
    const texts: Record<Lang, string> = {
      fr: `📞 **Contactez-nous** :\n\n📱 ${COMPANY.phone1}\n📱 ${COMPANY.phone2}\n💬 WhatsApp : +216 57 099 070\n📧 ${COMPANY.email}\n\n⏰ Horaires : ${COMPANY.hours}`,
      tn: `📞 **Atslna** :\n\n📱 ${COMPANY.phone1}\n📱 ${COMPANY.phone2}\n💬 WhatsApp : +216 57 099 070\n📧 ${COMPANY.email}\n\n⏰ Wa9t : ${COMPANY.hours}`,
      ar: `📞 **اتصل بنا** :\n\n📱 ${COMPANY.phone1}\n📱 ${COMPANY.phone2}\n💬 واتساب : +216 57 099 070\n📧 ${COMPANY.email}\n\n⏰ ساعات العمل : ${COMPANY.hours}`,
      en: `📞 **Contact us** :\n\n📱 ${COMPANY.phone1}\n📱 ${COMPANY.phone2}\n💬 WhatsApp: +216 57 099 070\n📧 ${COMPANY.email}\n\n⏰ Hours: ${COMPANY.hours}`,
      it: `📞 **Contattaci** :\n\n📱 ${COMPANY.phone1}\n📱 ${COMPANY.phone2}\n💬 WhatsApp: +216 57 099 070\n📧 ${COMPANY.email}\n\n⏰ Orari: ${COMPANY.hours}`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      suggestions: getSuggestions('contact', lang),
      action: { type: 'navigate_to_page', params: { path: '/contact' } },
      actionLabel: { fr: '📍 Voir la page contact', tn: '📍 Chouf contact', ar: '📍 صفحة الاتصال', en: '📍 Contact page', it: '📍 Pagina contatti' }[lang] || '📍 Voir la page contact',
    };
  }

  // LOCATION / ZONE
  if (intent === 'location' || intent === 'zone') {
    const texts: Record<Lang, string> = {
      fr: "📍 Tunis et Grand Tunis. Pour d'autres régions, contactez-nous.",
      tn: "📍 Tunis w Grand Tunis. Kenek fi blassa okhra, atslna.",
      ar: "📍 تونس وتونس الكبرى. لمناطق أخرى، اتصل بنا.",
      en: "📍 Tunis and Greater Tunis. For other regions, contact us.",
      it: "📍 Tunisi e Grande Tunisi. Per altre regioni, contattaci."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
  }

  // DELIVERY
  if (intent === 'delivery' || intent === 'delay') {
    const texts: Record<Lang, string> = {
      fr: "🚚 Installation sous 3 à 7 jours ouvrables après confirmation de commande.",
      tn: "🚚 El tarkib bin 3 w 7 ayam ba3d ma tconfirmili el commande.",
      ar: "🚚 التركيب خلال 3 إلى 7 أيام عمل بعد تأكيد الطلب.",
      en: "🚚 Installation within 3 to 7 business days after order confirmation.",
      it: "🚚 Installazione entro 3-7 giorni lavorativi dopo la conferma."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // WARRANTY
  if (intent === 'warranty') {
    const texts: Record<Lang, string> = {
      fr: "🛡️ 3 ans de garantie sur toutes les moustiquaires Grifo Flex. SAV disponible, installation incluse dans la garantie.",
      tn: "🛡️ 3 snin daman 3al moustikaret Grifo Flex lkol. SAV mawjoud w tarkib da5el fel daman.",
      ar: "🛡️ ضمان 3 سنوات على جميع منتجات Grifo Flex. خدمة ما بعد البيع متاحة والتركيب مشمول.",
      en: "🛡️ 3 years warranty on all Grifo Flex mosquito nets. After-sales service available, installation included.",
      it: "🛡️ 3 anni di garanzia su tutte le zanzariere Grifo Flex. Servizio post-vendita e installazione inclusi."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // ORIGIN / SOURCE / ABOUT
  if (intent === 'about' || intent === 'origin') {
    const texts: Record<Lang, string> = {
      fr: "Grifo Flex est une marque italienne (Grifoflex® Spa). Aluminium Space est partenaire en Tunisie. Tous les produits sont fabriqués en Italie avec des matériaux premium.",
      tn: "Grifo Flex hia marka talianya. Aluminium Space homa el partenaire fi Tounes. Kol chay masnou3 fi Italia.",
      ar: "Grifo Flex هي علامة تجارية إيطالية. Aluminium Space هو الشريك المعتمد في تونس. جميع المنتجات مصنوعة في إيطاليا بمواد عالية الجودة.",
      en: "Grifo Flex is an Italian brand. Aluminium Space is the certified partner in Tunisia. All products are made in Italy with premium materials.",
      it: "Grifo Flex è un marchio italiano. Aluminium Space è il partner certificato in Tunisia. Tutti i prodotti sono realizzati in Italia con materiali premium."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // SPECS
  if (intent === 'specs' || intent === 'technical_info') {
    const productId = mem.lastProduct;
    if (productId && PRODUCTS[productId]) {
      return {
        text: productInfoResponse(lang, productId, clientName),
        detectedLang: lang,
        suggestions: getSuggestions('product', lang),
        productImage: PRODUCTS[productId].image,
      };
    }
    const texts: Record<Lang, string> = {
      fr: "Nos moustiquaires sont en aluminium et fibre de verre recouverte de PVC. Couleurs : Blanc RAL 9010 ou Noir mat. De quel produit souhaitez-vous les caractéristiques techniques ?",
      tn: "El moustikaret mte3na b aluminium w fibre de verre bel PVC. Lwoun: Blanc RAL 9010 wella Noir mat. 3ala anehou produit t7eb ta3ref ?",
      ar: "مستيكاراتنا مصنوعة من الألومنيوم والألياف الزجاجية المغطاة بـ PVC. الألوان: أبيض RAL 9010 أو أسود غير لامع. عن أي منتج تريد معلومات تقنية؟",
      en: "Our screens are made of aluminum and fiberglass covered with PVC. Colors: White RAL 9010 or Matte Black. Which product would you like specs for?",
      it: "Le nostre zanzariere sono in alluminio e fibra di vetro rivestita in PVC. Colori: Bianco RAL 9010 o Nero opaco. Per quale prodotto desideri le specifiche?"
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: ['COLIBRÌ 50', 'SIDNEY 50', 'ELBA'] };
  }

  // MEASURE
  if (intent === 'measure') {
    const texts: Record<Lang, string> = {
      fr: "Mesurez la largeur (L) et la hauteur (H) de votre ouverture en cm. Pour fenêtre : mesure intérieure du cadre. Pour porte : mesure de l'ouverture totale. Format: LargeurXHauteur (ex: 140×120).",
      tn: "9is el 3ardh w el toul b cm. Lel chbek: 9is men de5el. Lel beb: 9is el fet7a lkol. Format: 3ardhXtoul (ex: 140×120).",
      ar: "قس العرض والارتفاع لفتحتك بالسنتيمتر. للنافذة: القياس الداخلي للإطار. للباب: قياس الفتحة الكلية. مثال: 140×120.",
      en: "Measure the width (W) and height (H) of your opening in cm. For window: inner frame measure. For door: total opening. Format: WidthXHeight (e.g., 140×120).",
      it: "Misura la larghezza (L) e l'altezza (H) in cm. Finestra: misura interna del telaio. Porta: apertura totale. Es: 140×120."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // MAINTENANCE
  if (intent === 'maintenance') {
    const texts: Record<Lang, string> = {
      fr: `🧹 **Entretien** :\n\n• Nettoyez la grille avec un chiffon doux légèrement humide\n• Évitez les produits abrasifs\n• Lubrifiez les coulisses une fois par an\n• Vérifiez les joints-brosses annuellement\n\nFacile à entretenir pour une durée optimale !`,
      tn: `🧹 **Ndhafa** :\n\n• Ndhef el grille b chiffon mo3alla chwiya\n• Tevit produits abrasifs\n• Dhen el coulisses marra f sna\n• Verifie el joints marra f sna\n\nSahel el ndhafa !`,
      ar: `🧹 **الصيانة** :\n\n• نظف الشبكة بقطعة قماش مبللة قليلاً\n• تجنب المواد الكاشطة\n• زيت المزالق مرة في السنة\n• افحص الجوانت سنوياً\n\nسهل الصيانة !`,
      en: `🧹 **Maintenance** :\n\n• Clean the mesh with a soft, slightly damp cloth\n• Avoid abrasive products\n• Lubricate the runners once a year\n• Check brush seals annually\n\nEasy to maintain!`,
      it: `🧹 **Manutenzione** :\n\n• Pulire la rete con un panno morbido leggermente umido\n• Evitare prodotti abrasivi\n• Lubrificare le guide una volta l'anno\n• Verificare le spazzole perimetrali annualmente\n\nFacile da mantenere!`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // COLORS
  if (intent === 'colors') {
    const texts: Record<Lang, string> = {
      fr: `🎨 **Couleurs disponibles** :\n\nNos moustiquaires sont disponibles en :\n• ⬜ **Blanc** (standard)\n• ⬛ **Noir**\n\nLa grille est en fibre de verre grise standard. Vous pouvez choisir votre couleur lors du devis.`,
      tn: `🎨 **Lwoun disponibles** :\n\n• ⬜ **Blanc** (standard)\n• ⬛ **Noir**\n\nT5tar el loun mte3ek f el devis.`,
      ar: `🎨 **الألوان المتاحة** :\n\n• ⬜ **أبيض** (قياسي)\n• ⬛ **أسود**\n\nيمكنك اختيار اللون عند إعداد الديفيس.`,
      en: `🎨 **Available colors** :\n\n• ⬜ **White** (standard)\n• ⬛ **Black**\n\nYou can choose your color when creating the quote.`,
      it: `🎨 **Colori disponibili** :\n\n• ⬜ **Bianco** (standard)\n• ⬛ **Nero**\n\nPuoi scegliere il colore durante la creazione del preventivo.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // PAYMENT
  if (intent === 'payment') {
    const texts: Record<Lang, string> = {
      fr: "💳 Paiement en espèces ou virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      tn: "💳 Tnajem tkhales cash walla virement bancaire. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      ar: "💳 الدفع نقداً أو تحويل بنكي. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      en: "💳 Payment in cash or bank transfer. RIB: 11 05500 01215002788 56 - Agence BOUMHEL.",
      it: "💳 Pagamento in contanti o bonifico bancario. RIB: 11 05500 01215002788 56 - Agence BOUMHEL."
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // SHOWROOM
  if (intent === 'showroom') {
    const texts: Record<Lang, string> = {
      fr: `🏪 **Visitez notre showroom** :\n\n${COMPANY.address}\n\n⏰ ${COMPANY.hours}\n\nVenez découvrir nos produits en avant-première ! Nos conseillers vous accueilleront.`,
      tn: `🏪 **Zour showroom mte3na** :\n\n${COMPANY.address}\n\n⏰ ${COMPANY.hours}\n\nAji tchouf produits mte3na ! Jem3a fiha mohtarfin.`,
      ar: `🏪 **زُر معرضنا** :\n\n${COMPANY.address}\n\n⏰ ${COMPANY.hours}\n\nتعال لرؤية منتجاتنا ! مستشارونا في انتظارك.`,
      en: `🏪 **Visit our showroom** :\n\n${COMPANY.address}\n\n⏰ ${COMPANY.hours}\n\nCome see our products! Our advisors will welcome you.`,
      it: `🏪 **Visita il nostro showroom** :\n\n${COMPANY.address}\n\n⏰ ${COMPANY.hours}\n\nVieni a scoprire i nostri prodotti! I nostri consulenti ti accoglieranno.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
  }

  // PROMO
  if (intent === 'promo') {
    const texts: Record<Lang, string> = {
      fr: `🎁 **Nos offres** :\n\nUne **remise de ${BUSINESS_CONFIG.remisePct}%** est déjà incluse dans tous nos devis.\n\nSuivez nos réseaux sociaux pour les promotions spéciales.`,
      tn: `🎁 **Promotions mte3na** :\n\nFi déjà **remise de ${BUSINESS_CONFIG.remisePct}%** fi kol devis mte3na.\n\nSuiv reseaux sociaux 7etna bech ta3ref promotions.`,
      ar: `🎁 **عروضنا** :\n\n**خصم ${BUSINESS_CONFIG.remisePct}%** مدرج بالفعل في كل ديفيسات.\n\nتابع شبكاتنا الاجتماعية للعروض الخاصة.`,
      en: `🎁 **Our offers** :\n\nA **${BUSINESS_CONFIG.remisePct}% discount** is already included in all our quotes.\n\nFollow our social media for special promotions.`,
      it: `🎁 **Le nostre offerte** :\n\nUno **sconto del ${BUSINESS_CONFIG.remisePct}%** è già incluso in tutti i preventivi.\n\nSeguici sui social media per promozioni speciali.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // THANKS
  if (intent === 'thanks') {
    const greet = clientName ? ` ${clientName}` : '';
    const texts: Record<Lang, string> = {
      fr: `De rien${greet} ! 😊 N'hésitez pas si vous avez d'autres questions.`,
      tn: `Yikhlik${greet} ! 😊 Iza 3andek chi so2el 5er, ana hna.`,
      ar: `على الرحب والسعة${greet}! 😊 لا تتردد إذا كان لديك أسئلة أخرى.`,
      en: `You're welcome${greet}! 😊 Feel free to ask if you have more questions.`,
      it: `Prego${greet}! 😊 Non esitare se hai altre domande.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // GOODBYE
  if (intent === 'goodbye') {
    const greet = clientName ? ` ${clientName}` : '';
    const texts: Record<Lang, string> = {
      fr: `À bientôt${greet} ! 👋 Revenez quand vous voulez. Aluminium Space est là pour vous !`,
      tn: `Bslama${greet} ! 👋 Erja3 wa9teh ma t7eb. Aluminium Space dima hna !`,
      ar: `مع السلامة${greet}! 👋 عد متى تشاء. Aluminium Space دائماً هنا!`,
      en: `Goodbye${greet}! 👋 Come back anytime. Aluminium Space is here for you!`,
      it: `Arrivederci${greet}! 👋 Torna quando vuoi. Aluminium Space è qui per te!`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang };
  }

  // CASUAL: HOW ARE YOU
  if (intent === 'casual_howru') {
    const responses: Record<Lang, string[]> = {
      fr: [
        `Très bien merci, et toi ? 😊`,
        `Ça va super ! 🙂 Et toi, tout va bien ?`,
        `Bien, merci ! 😊 Et toi ?`,
      ],
      tn: [
        `Labess el7amdullah ! 😊 W enti kfeh ?`,
        `Mrigla barak ! 😄 W enti sah ?`,
        `Labess w 3afia w enti ? 😊`,
      ],
      ar: [
        `بخير الحمد لله وأنت؟ 😊`,
        `تمام شكراً، وأنت كيف حالك؟ 🙂`,
        `الحمد لله بخير، وأنت؟ 😊`,
      ],
      en: [
        `I'm great, thanks! 😊 And how are you?`,
        `All good! 🙂 How are you doing?`,
        `Doing well, thanks! 😊 And you?`,
      ],
      it: [
        `Benissimo grazie, e tu? 😊`,
        `Tutto bene! 🙂 Come stai?`,
        `Sto bene, grazie! 😊 E tu?`,
      ],
    };
    const arr = responses[lang] || responses.fr;
    return { text: arr[sessionCount % arr.length], detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // CASUAL: BOT NAME
  if (intent === 'casual_name') {
    const texts: Record<Lang, string> = {
      fr: `Je suis **ALU** 🤖, l'assistant virtuel d'**Aluminium Space** ! Je suis là pour vous aider à choisir vos moustiquaires et calculer vos prix.`,
      tn: `Ana **ALU** 🤖, el-mosa3ed mte3 **Aluminium Space** ! Hna bech n3awnek ta5tar moustika w n9der thmen.`,
      ar: `أنا **ALU** 🤖، المساعد الافتراضي لـ**Aluminium Space** ! هنا لمساعدتك في اختيار المستيكارات وحساب الأسعار.`,
      en: `I'm **ALU** 🤖, the virtual assistant of **Aluminium Space**! Here to help you choose mosquito screens and calculate prices.`,
      it: `Sono **ALU** 🤖, l'assistente virtuale di **Aluminium Space**! Qui per aiutarti a scegliere le zanzariere e calcolare i prezzi.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // AFFIRMATION
  if (intent === 'affirmation') {
    const productId = mem.lastProduct;
    if (productId && (!mem.lastWidth || !mem.lastHeight)) {
      const p = PRODUCTS[productId];
      const texts: Record<Lang, string> = {
        fr: `Parfait ! Pour **${p?.name}**, envoyez les dimensions : **largeur×hauteur** en cm.\nEx: 150×120`,
        tn: `Mrigla ! Pour **${p?.name}**, ba3ath dimensions : **3ardh×toul** b cm.\nEx: 150×120`,
        ar: `ممتاز ! لـ **${p?.name}**، أرسل الأبعاد : **عرض×ارتفاع** بالسنتيمتر.\nمثال: 150×120`,
        en: `Great! For **${p?.name}**, send dimensions: **width×height** in cm.\nE.g: 150×120`,
        it: `Perfetto! Per **${p?.name}**, invia le dimensioni: **larghezza×altezza** in cm.\nEs: 150×120`,
      };
      return { text: texts[lang] || texts.fr, detectedLang: lang };
    }
    const texts: Record<Lang, string> = {
      fr: "Super ! Comment puis-je vous aider ensuite ?",
      tn: "Mrigla ! Chneya 3andek akther ?",
      ar: "رائع ! كيف يمكنني مساعدتك أكثر؟",
      en: "Great! How can I help you next?",
      it: "Perfetto! Come posso aiutarti ora?",
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // HELP
  if (intent === 'help') {
    const texts: Record<Lang, string> = {
      fr: `🆘 **Que puis-je faire pour vous ?** :\n\n• 💰 Calculer le prix (envoyez un produit + dimensions)\n• 🪟 Présenter nos produits\n• 📋 Ouvrir le formulaire de devis\n• 📞 Vous donner nos coordonnées\n• 🗺 Vous donner notre adresse\n\nOu posez simplement votre question !`,
      tn: `🆘 **Chneya n3amel ?** :\n\n• 💰 N9der el thmen (ba3ath produit + dimensions)\n• 🪟 N3arfek bel produits\n• 📋 Niftah devis\n• 📞 N3tik coordonnées\n• 🗺 N3tik adresse\n\nWella is2el chi so2el !`,
      ar: `🆘 **كيف يمكنني مساعدتك؟** :\n\n• 💰 حساب السعر (أرسل منتج + أبعاد)\n• 🪟 عرض المنتجات\n• 📋 فتح نموذج الديفيس\n• 📞 إعطاء معلومات الاتصال\n• 🗺 إعطاء العنوان\n\nأو اطرح سؤالك مباشرة!`,
      en: `🆘 **What can I do for you?** :\n\n• 💰 Calculate prices (send product + dimensions)\n• 🪟 Present our products\n• 📋 Open the quote form\n• 📞 Give contact details\n• 🗺 Give our address\n\nOr just ask your question!`,
      it: `🆘 **Cosa posso fare per te?** :\n\n• 💰 Calcolare il prezzo (invia prodotto + dimensioni)\n• 🪟 Presentare i prodotti\n• 📋 Aprire il modulo preventivo\n• 📞 Dare i contatti\n• 🗺 Dare l'indirizzo\n\nO fai semplicemente la tua domanda!`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('greeting', lang) };
  }

  // NAVIGATE (explicit navigation request)
  const navTarget = detectNavTarget(userText);
  if (navTarget || intent === 'navigate') {
    const target = navTarget || '/';
    const texts: Record<Lang, string> = {
      fr: `Je vous redirige vers ${target === '/' ? 'l\'accueil' : target.replace('/', '')}...`,
      tn: `Nwajhek l ${target}...`,
      ar: `أعيد توجيهك إلى ${target}...`,
      en: `Redirecting to ${target}...`,
      it: `Reindirizzamento a ${target}...`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      action: { type: 'navigate_to_page', params: { path: target } },
      navigating: true,
    };
  }

  // NOT UNDERSTOOD — try OpenAI before static fallback
  const sessionLangLocal = sessionLang;
  const openAiText = await processWithOpenAI(userText, history, lang, onChunk);
  if (openAiText) {
    return {
      text: openAiText,
      detectedLang: lang,
      suggestions: getSuggestions('greeting', lang),
    };
  }

  // Static fallback (offline / API unavailable)
  const fallbacks: Record<Lang, string[]> = {
    fr: [
      `Je ne suis pas sûr d'avoir bien compris. 🤔 Pouvez-vous reformuler ? Je peux calculer des prix, présenter nos produits, ou créer un devis.`,
      `Hmm, je n'ai pas saisi. 😅 Dites-moi ce que vous cherchez — moustiquaire pour fenêtre, porte, dimensions, prix ?`,
      `Je n'ai pas tout compris. 🤔 Essayez par exemple : "prix pour 150×120" ou "je veux un devis".`,
    ],
    tn: [
      `Ma fhamtekch mezyen. 🤔 3awedha bch nfahem — t7eb thmen, produit, walla devis ?`,
      `Hmm, manich fahem. 😅 9olili ach t7eb — moustika lel chbek, bib, walla 3andek dimensions ?`,
      `Ma fhamtekch. 🤔 Jreb 9oul "thmen 150×120" wella "nheb namel devis".`,
    ],
    ar: [
      `لم أفهم جيداً. 🤔 ممكن تعيد الصياغة؟ أستطيع حساب أسعار أو تقديم منتجات أو إعداد ديفيس.`,
      `عذراً، لم أفهم. 😅 قل لي ما تبحث عنه — مستيكار للنافذة، الباب، الأبعاد، السعر؟`,
      `لم أستوعب. 🤔 جرب مثلاً: "سعر 150×120" أو "أريد عرض أسعار".`,
    ],
    en: [
      `I'm not sure I caught that. 🤔 Could you rephrase? I can calculate prices, show products, or make a quote.`,
      `Hmm, I didn't quite get that. 😅 Tell me what you need — screen for window, door, dimensions, price?`,
      `Didn't understand. 🤔 Try for example: "price for 150×120" or "I want a quote".`,
    ],
    it: [
      `Non ho capito bene. 🤔 Puoi riformulare? Posso calcolare prezzi, presentare prodotti o creare un preventivo.`,
      `Hmm, non ho afferrato. 😅 Dimmi cosa cerchi — zanzariera per finestra, porta, dimensioni, prezzo?`,
      `Non ho capito. 🤔 Prova ad esempio: "prezzo per 150×120" o "voglio un preventivo".`,
    ],
  };
  const arr = fallbacks[sessionLangLocal as Lang] || fallbacks.fr;

  return {
    text: arr[sessionCount % arr.length],
    detectedLang: sessionLangLocal as Lang,
    suggestions: getSuggestions('greeting', sessionLangLocal as Lang),
  };
}
