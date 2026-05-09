// ═══════════════════════════════════════════════════════════════
//  ALU SPACE — AI Agent Service v3
//  Offline, multilingual (FR·AR·TN·EN·IT), full price calc
// ═══════════════════════════════════════════════════════════════

import { calculatePrice } from '../utils/priceCalculator';
import { BUSINESS_CONFIG } from '../config/businessConfig';

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
    | 'open_3d_viewer'
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
  navigating?: boolean;
  detectedLang?: Lang;
  productImage?: string;
  devisButton?: DevisButton;
  comparisonTable?: ComparisonTable;
  loadingType?: 'search' | 'calculate' | 'think';
}

// ─── PRODUCTS ────────────────────────────────────────────────────
const PRODUCTS: Record<string, {
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
    description: 'Moustiquaire enroulable pour fenêtre à caisson supérieur',
    features: [
      'Mécanisme à ressort', 'Coulisses latérales à doubles joints-brosses',
      'Barre de charge avec cordon de tirage',
      'Panneau en fibre de verre recouverte de PVC', 'Structure en aluminium blanc',
    ],
    caisson: '45mm', tailleEffective: '52mm',
    minW: 35, maxW: 200, minH: 50, maxH: 170,
    startPrice: 263,
    image: '/images/colibri-50.png', path: '/produits/colibri-50',
  },
  'sidney-50': {
    name: 'SIDNEY 50',
    category: 'Moustiquaires Enroulables',
    type: 'porte',
    description: 'Moustiquaire pour portes à caisson latéral',
    features: [
      'Mécanisme à ressort', 'Coulisses latérales à doubles joints-brosses',
      'Barre de charge à poignée externe pliante',
      'Panneau en fibre de verre recouverte de PVC', 'Structure en aluminium blanc',
    ],
    caisson: '45mm', tailleEffective: '58mm',
    minW: 35, maxW: 200, minH: 70, maxH: 260,
    startPrice: 611,
    image: '/images/sidney-50.png', path: '/produits/sidney-50',
  },
  'sidney-50-ac': {
    name: 'SIDNEY 50 AC',
    category: 'Moustiquaires Enroulables',
    type: 'grande-porte',
    description: 'Moustiquaire pour portes à double caisson latéral (grandes ouvertures)',
    features: [
      'Système à deux caissons pour grandes ouvertures', 'Mécanisme à ressort double',
      'Coulisses à doubles joints-brosses',
      'Barre de charge à poignées externes pliantes', 'Structure en aluminium blanc',
    ],
    caisson: '45mm', tailleEffective: '58mm',
    minW: 70, maxW: 400, minH: 70, maxH: 260,
    startPrice: 1224,
    image: '/images/sidney-50-ac.png', path: '/produits/sidney-50-ac',
  },
  'elba': {
    name: 'ELBA',
    category: 'Moustiquaires à Panneau Fixe',
    type: 'fixe',
    description: 'Moustiquaire à panneau fixe pour fenêtre',
    features: [
      'Châssis fixe en aluminium blanc',
      'Panneau en fibre de verre recouverte de PVC',
      'Fixations murales en nylon', 'Joint-brosse périmétral',
      'Options: aluminium ou acier inox',
    ],
    caisson: null, tailleEffective: '10mm',
    minW: 30, maxW: 120, minH: 30, maxH: 250,
    pricePerM2: { fibre: 143, aluminium: 183, inox: 262 },
    image: '/images/elba.png', path: '/produits/elba',
  },
};

// ─── COMPANY ─────────────────────────────────────────────────────
const COMPANY = {
  name: BUSINESS_CONFIG.COMPANY_NAME,
  address: BUSINESS_CONFIG.COMPANY_ADDRESS + ', Tunisie',
  phone1: BUSINESS_CONFIG.COMPANY_PHONE1,
  phone2: BUSINESS_CONFIG.COMPANY_PHONE2,
  whatsapp: BUSINESS_CONFIG.WHATSAPP,
  email: BUSINESS_CONFIG.COMPANY_EMAIL,
  hours: 'Lundi–Samedi, 8h00–17h00',
  mapUrl: 'https://maps.google.com/?q=125+lot+Laaroussi+Mghira',
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
  const raw = calculatePrice({ productId, width: w, height: h });
  if (!raw) return null;
  const unitPrice = raw / 1000; // convert millimes to DT
  const totalBrut = unitPrice * qty;
  const remise = totalBrut * 0.20;
  const netHT = totalBrut - remise;
  const fodec = netHT * 0.01;
  const baseTVA = netHT + fodec;
  const tva = baseTVA * 0.19;
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
  // casual_howru must come BEFORE greeting (labes 3lik starts with "labes" which is also in greeting)
  if (/(kif 7alek|kifech|comment.*vas|ca va\??|how are you|come stai|كيف حالك|لاباس|labes 3lik|labess\??|labas\??|labes\??|7alek|kifeha|kif enti|kif nta|kifentom|shnowa\??|chnowa\??|wesh\b|esh 5barak|ach 5bark)/.test(m)) return 'casual_howru';
  if (/^(salut|bonjour|bonsoir|hello|hi\b|hey\b|ciao|salve|buongiorno|salam|ahla|labas|labes|wesh|slt|bjr|marhba|مرحبا|السلام|اهلا|صباح|كيف|واش|yesslm|aslema|aslama|alsema)/.test(m)) return 'greeting';
  if (/(au revoir|bye|goodbye|arrivederci|بسلامة|مع السلامة|bslama|besslema|ciao\b|tchao|ma3assalama)/.test(m)) return 'goodbye';
  if (/(merci|shukran|grazie|شكرا|barak|thanks|thank|يسلمو|y3tik|tislam|yikhlik)/.test(m)) return 'thanks';
  if (/(compare|comparaison|comparer|difference|versus|vs\b|mieux|better|quale|meglio|ahsen|قارن|مقارنة|فرق|احسن|far9\b)/.test(m)) return 'comparison';
  if (/(tous.*produit|liste.*produit|gamme|catalogue|show.*all|list.*product|tutti.*prodott|kol.*produit|tous.*modele|منتجات.*كل|كل.*منتجاتك)/.test(m) && !/(fenetre|porte|fixe|colibri|sidney|elba)/.test(m)) return 'product_list';
  if (/(colibri|colibrì|fenetre|window|finestra|chbek|chbabek|للشباك|للنافذة|شباك|نافذة|شبابيك)/.test(m)) return 'product_colibri';
  if (/(grande.*porte|porte.*double|double.*porte|sidney.?ac|bibian.*kbira|باب.*كبير|porta.*doppia|400\b|terrasse)/.test(m)) return 'product_sidneyAC';
  if (/(porte\b|door\b|porta\b|باب|بيبان|sidney|bibia|للباب)/.test(m) && !/(ac\b|double|grande|400)/.test(m)) return 'product_sidney';
  if (/(fixe|fixed|elba|panneau|panel|pannello|ثابت|لوح|إلبا)/.test(m)) return 'product_elba';
  if (extractAllDimensions(msg).length > 0) return 'dimensions_provided';
  if (/(devis|preventivo|quote|estimation|estimer|calcul|عرض.*سعر|تقدير|ديفيس|yehsibli|ahsibli|namel.*devis|n7eb.*devis|3ardh)/.test(m)) return 'devis_request';
  if (/(prix|tarif|combien|cout|coût|cher|price|cost|prezzo|quanto|thaman|ثمن|سعر|قداش|9adech|b9adech|becha|يكلف|ye5lef|thmen\b)/.test(m)) return 'price_inquiry';
  if (/(me contacter|rappel|rappelez|callback|اتصل بي|kallemni)/.test(m)) return 'callback_request';
  if (/(contact|telephone|tel|appel|appeler|whatsapp|watsap|numero|numéro|chiamare|telefono|واتساب|اتصل|رقم|هاتف|تلفون|atslni|teslni)/.test(m)) return 'contact';
  if (/(adresse|address|localisation|ou\b|où|fouchana|indirizzo|dove|وين|فين|فوشانة|عنوان|maps|win nla9akom|winfin ntom)/.test(m)) return 'location';
  if (/(horaire|heure|ouvert|ferme|fermé|orario|aperto|متى|ساعة|وقت|wa9t|9adeh.*se3a|quand.*ouvr)/.test(m)) return 'hours';
  if (/(installation|installer|montage|pose|installazione|تركيب|نصب|nrakkeb|yrakbouha)/.test(m)) return 'installation';
  if (/(livraison|livrer|delivery|consegna|delai|délai|توصيل|أجل|9adech.*wa9t|wa9teh|waktha)/.test(m)) return 'delivery';
  if (/(garantie|warranty|garanzia|daman|ضمان|combien.*garanti|how long.*warranty)/.test(m)) return 'warranty';
  if (/(nettoyer|nettoyage|entretien|maintenance|clean|pulizia|تنظيف|نظافة|ndhafa)/.test(m)) return 'maintenance';
  if (/(couleur|color|colore|blanc|noir|gris|white|black|grey|bianco|nero|لون|أبيض|أسود|loun)/.test(m)) return 'colors';
  if (/(paiement|payer|payment|pay\b|virement|cheque|espece|cash|carte|kif nkhales|khlas|دفع|pagamento|nkhales|3arboun|عربون)/.test(m)) return 'payment';
  if (/(showroom|visite|visiter|venir|boutique|magasin|niji|nayek|معرض|زيارة|sala.*mostra|visitare)/.test(m)) return 'showroom';
  if (/(propos|about|histoire|fondation|societe|company|entreprise|qui.*(vous|etes|siamo)|tarikh|متى.*بدأ|kima ta3melou|chnya ta3melou)/.test(m)) return 'about';
  if (/(recommendation|conseille|conseil|ansahni|recommend|consigliami|توصية|tansahni|ahsen.*produit)/.test(m)) return 'recommendation';
  if (/(promo|promotion|remise|reduction|offre.*special|discount|sconto|تخفيض|عرض.*خاص|ريميز)/.test(m)) return 'promo';
  if (/(ton nom|t'appelles|qui es.tu|who are you|come ti chiami|اسمك|شكون انت|comment tu t'appelles)/.test(m)) return 'casual_name';
  if (/(kif 7alek|kifech|comment.*vas|ca va|how are you|come stai|كيف حالك|لاباس|labes 3lik)/.test(m)) return 'casual_howru';
  if (/(aide|help|aiuto|3awenni|mساعدة|comment.*fonctionne|how.*work|come.*funziona)/.test(m)) return 'help';
  if (/(oui|yes|si\b|aya|na3am|ok\b|bien|d'accord|mrigla|nchallah|nheb|nwafaq|exactement)/.test(m)) return 'affirmation';
  if (/(non|no\b|la\b|moch|naya|maynhebch|je.*veux.*pas|i don't|no grazie)/.test(m)) return 'negation';
  return 'not_understood';
}

// ─── NAVIGATION DETECTION ────────────────────────────────────────
function detectNavTarget(msg: string): string | null {
  const m = norm(msg);
  if (/(yhezni.*(devis|calc)|emmeni.*(devis)|rouh.*(devis)|go.*(devis|quote)|aller.*(devis)|ouvre.*devis|faire.*devis|page.*devis|portami.*preventivo|apri.*preventivo|n7eb.*devis\b)/.test(m)) return '/devis';
  if (/(yhezni.*(produit|catalogue)|emmeni.*(produit)|rouh.*(produit)|go.*(produit|product)|aller.*(produit)|voir.*produit|show.*product|portami.*prodott)/.test(m)) return '/produits';
  if (/(yhezni.*(contact|appel)|emmeni.*contact|rouh.*contact|go.*contact|aller.*contact|voir.*contact|portami.*contact)/.test(m)) return '/contact';
  if (/(yhezni.*(propos|about)|emmeni.*(propos)|rouh.*(propos)|go.*(about|propos)|aller.*(propos)|voir.*(propos)|chi.*siamo|storia.*azienda)/.test(m)) return '/about';
  if (/(yhezni.*accueil|emmeni.*accueil|rouh.*accueil|go.*home|aller.*accueil|home.*page|torna.*home)/.test(m)) return '/';
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
    fr: `Pour un **${productName}** en ${w}×${h} cm${qtyStr} :\n• Prix HT : ${fmt(b.unitPrice)}\n• Remise 20% : -${fmt(b.remise)}\n• Total TTC : ${fmt(b.totalTTC)}\n\n${greet}Voulez-vous passer au devis ?`,
    tn: `Lel **${productName}** f ${w}×${h} cm${qtyStr} :\n• Prix HT : ${fmt(b.unitPrice)}\n• Remise 20% : -${fmt(b.remise)}\n• Total TTC : ${fmt(b.totalTTC)}\n\n${greet}T7eb namel devis ?`,
    ar: `لـ **${productName}** بـ ${w}×${h} سم${qtyStr} :\n• السعر بدون TVA : ${fmt(b.unitPrice)}\n• خصم 20% : -${fmt(b.remise)}\n• الإجمالي مع TVA : ${fmt(b.totalTTC)}\n\n${greet}هل تريد إعداد عرض الأسعار؟`,
    en: `For a **${productName}** in ${w}×${h} cm${qtyStr}:\n• Price excl. VAT: ${fmt(b.unitPrice)}\n• Discount 20%: -${fmt(b.remise)}\n• Total incl. VAT: ${fmt(b.totalTTC)}\n\n${greet}Would you like to proceed with a quote?`,
    it: `Per una **${productName}** in ${w}×${h} cm${qtyStr}:\n• Prezzo IVA escl.: ${fmt(b.unitPrice)}\n• Sconto 20%: -${fmt(b.remise)}\n• Totale IVA incl.: ${fmt(b.totalTTC)}\n\n${greet}Vuoi procedere con un preventivo?`,
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
    headers: ['', 'COLIBRÌ 50', 'SIDNEY 50', 'SIDNEY 50 AC', 'ELBA'],
    rows: [
      { label: l.type, colibri: '🪟 Fenêtre', sidney: '🚪 Porte', sidneyAC: '🚪🚪 Grande porte', elba: '🪟 Fixe' },
      { label: l.maxW, colibri: '200 cm', sidney: '200 cm', sidneyAC: '400 cm', elba: '120 cm' },
      { label: l.maxH, colibri: '170 cm', sidney: '260 cm', sidneyAC: '260 cm', elba: '250 cm' },
      { label: l.price, colibri: 'dès 263 DT', sidney: 'dès 611 DT', sidneyAC: 'dès 1224 DT', elba: '143 DT/m²' },
      { label: l.caisson, colibri: '45mm', sidney: '45mm', sidneyAC: '2×45mm', elba: 'Aucun' },
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

// ─── SUGGESTIONS ─────────────────────────────────────────────────
const SUGGESTIONS: Record<string, Record<Lang, string[]>> = {
  greeting: {
    fr: ['Calculer un prix', 'Voir les produits', 'Faire un devis'],
    tn: ['N9der el thmen', 'Chouf les produits', 'Namel devis'],
    ar: ['احسب السعر', 'أرى المنتجات', 'أطلب عرض أسعار'],
    en: ['Calculate a price', 'View products', 'Get a quote'],
    it: ['Calcola prezzo', 'Vedi prodotti', 'Richiedi preventivo'],
  },
  price: {
    fr: ['Voir le devis complet', 'Calculer une autre dimension', 'Contacter le showroom'],
    tn: ['Chouf el devis complet', '7seb dimensions 5rin', 'Attasil bel showroom'],
    ar: ['عرض الأسعار الكامل', 'احسب أبعاداً أخرى', 'اتصل بالمعرض'],
    en: ['View full quote', 'Calculate another size', 'Contact showroom'],
    it: ['Vedi preventivo completo', 'Calcola altra dimensione', 'Contatta showroom'],
  },
  product: {
    fr: ['Calculer le prix', 'Voir les autres produits', 'Prendre rendez-vous'],
    tn: ['N9der el thmen', 'Chouf 3tini produits', 'Kheth rendez-vous'],
    ar: ['احسب السعر', 'أرى المنتجات الأخرى', 'حدد موعداً'],
    en: ['Calculate price', 'See other products', 'Book appointment'],
    it: ['Calcola prezzo', 'Vedi altri prodotti', 'Prenota appuntamento'],
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
  if (['product_colibri', 'product_sidney', 'product_sidneyAC', 'product_elba'].includes(intent)) return SUGGESTIONS.product[lang] || SUGGESTIONS.product.fr;
  if (['price_inquiry', 'dimensions_provided'].includes(intent)) return SUGGESTIONS.price[lang] || SUGGESTIONS.price.fr;
  return SUGGESTIONS.greeting[lang] || SUGGESTIONS.greeting.fr;
}

// ─── OPENAI FALLBACK ─────────────────────────────────────────────
async function processWithOpenAI(
  userText: string,
  history: Message[],
  lang: Lang,
  base64Image?: string | null,
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return null;

  const langInstruction: Record<string, string> = {
    fr: 'CRITICAL: Respond ONLY in French. Never mix languages. Every single word must be French.',
    ar: 'CRITICAL: Respond ONLY in Modern Standard Arabic (العربية الفصحى). Never mix languages. Every single word must be Arabic.',
    tn: 'CRITICAL: Respond ONLY in Tunisian Arabic dialect (تونسي). Use Tunisian words and expressions only. Never mix with French.',
    en: 'CRITICAL: Respond ONLY in English. Never mix languages. Every single word must be English.',
    it: 'CRITICAL: Respond ONLY in Italian. Never mix languages. Every single word must be Italian.',
  };

  const systemPrompt = `Tu es ALU, l'assistant virtuel d'Aluminium Space — entreprise tunisienne spécialisée dans la fabrication et l'installation de moustiquaires de qualité italienne Grifo Flex.

PRODUITS:
• COLIBRÌ 50 — Moustiquaire enroulable fenêtre. Max 200×170 cm. Dès 263 DT HT.
• SIDNEY 50 — Moustiquaire enroulable porte. Max 200×260 cm. Dès 611 DT HT.
• SIDNEY 50 AC — Moustiquaire grande porte double. Max 400×260 cm. Dès 1224 DT HT.
• ELBA — Panneau fixe. Max 120×250 cm. 143 DT/m² (fibre), 183 DT/m² (alu), 262 DT/m² (inox).

COULEURS: Blanc (standard) et Noir.
ADRESSE: 125 lot Laaroussi Mghira, Tunis, Tunisie.
TÉLÉPHONE: +216 53 186 611 / +216 57 099 070. WhatsApp: +216 57 099 070.
HORAIRES: Lundi–Samedi 8h00–17h00. Fermé dimanche.
GARANTIE: 2 ans structure aluminium, 1 an grille.
REMISE: 20% incluse dans tous les devis. TVA 19%, FODEC 1%.
DÉLAIS: 7 à 14 jours ouvrables après commande.
PAIEMENT: Cash, virement, chèque certifié, acompte 30%.

RÈGLES:
- ${langInstruction[lang]}
- Sois chaleureux, concis (2-4 phrases max).
- Pour un prix précis: demande les dimensions format LargeurXHauteur (ex: 150×120).
- Ne fabrique pas de prix exacts toi-même — l'outil de calcul le fera.
- Pour naviguer, suggère à l'utilisateur de cliquer sur le bouton ou le menu.`;

  try {
    const recentHistory = history.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'system',
            content: `REMINDER: You must respond in ${lang === 'fr' ? 'French' : lang === 'ar' ? 'Arabic' : lang === 'tn' ? 'Tunisian Arabic' : lang === 'en' ? 'English' : 'Italian'} ONLY. Do not switch languages under any circumstances.`
          },
          ...recentHistory,
          {
            role: 'user',
            content: base64Image ? [
              { type: 'text', text: `[User language: ${lang}] ${userText}\nAnalyze this image. If it shows a window or door opening, suggest the most appropriate Grifo Flex mosquito screen model and explain why.` },
              { type: 'image_url', image_url: { url: base64Image } }
            ] : `[User language: ${lang}] ${userText}`
          },
        ],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    let aiText = (data.choices?.[0]?.message?.content as string) || '';

    // Fix 4: Validation and Retry
    const isArabicScript = /[\u0600-\u06FF]/.test(aiText);
    const needsArabic = lang === 'ar' || lang === 'tn';
    const needsFrench = lang === 'fr';

    if ((needsArabic && !isArabicScript) || (needsFrench && isArabicScript)) {
      // Retry once
      const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: lang === 'fr' ? 'RÉPONDS EN FRANÇAIS UNIQUEMENT. PAS D\'ARABE.' : 'أجب بالعربية فقط. لا تستخدم أي لغة أخرى.' },
            ...recentHistory,
            { role: 'user', content: `[RETRY - Language Violation] ${userText}` },
          ],
          max_tokens: 350,
          temperature: 0.3, // Lower temperature for more strict adherence
        }),
      });
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        aiText = retryData.choices?.[0]?.message?.content || aiText;
      }
    }

    return aiText || null;
  } catch {
    return null;
  }
}

// ─── MAIN PROCESS FUNCTION ───────────────────────────────────────
export async function processLocalMessage(
  userText: string,
  history: Message[],
  preferredLang?: Lang,
  base64Image?: string | null,
): Promise<AIResponse> {
  // Image handling forces OpenAI fallback immediately
  if (base64Image) {
    const aiText = await processWithOpenAI(userText, history, preferredLang || 'fr', base64Image);
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
      const texts: Record<Lang, string> = {
        fr: `⚠️ Les dimensions ${w}×${h} cm dépassent les limites du **${product.name}** (max ${product.maxW}×${product.maxH} cm). Vérifiez vos mesures ou contactez-nous.`,
        tn: `⚠️ El dimensions ${w}×${h} cm kbar 3al **${product.name}** (max ${product.maxW}×${product.maxH} cm). 3awedha tnajem walla atslna.`,
        ar: `⚠️ الأبعاد ${w}×${h} سم تتجاوز حدود **${product.name}** (الحد الأقصى ${product.maxW}×${product.maxH} سم). تحقق من قياساتك.`,
        en: `⚠️ Dimensions ${w}×${h} cm exceed **${product.name}** limits (max ${product.maxW}×${product.maxH} cm). Check your measurements.`,
        it: `⚠️ Le dimensioni ${w}×${h} cm superano i limiti di **${product.name}** (max ${product.maxW}×${product.maxH} cm). Verifica le misure.`,
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

  // DEVIS REQUEST (Guided Flow)
  if (intent === 'devis_request') {
    if (!mem.lastWidth || !mem.lastHeight) {
      return {
        text: {
          fr: "Quelle largeur × hauteur (en cm) souhaitez-vous pour ce devis ?",
          tn: "A3tini el 3ardh × toul (b cm) lel devis hetha ?",
          ar: "ما هو العرض × الارتفاع (بالسم) الذي تريده لعرض الأسعار هذا؟",
          en: "What width × height (in cm) would you like for this quote?",
          it: "Che larghezza × altezza (in cm) desideri per questo preventivo?",
        }[lang] || "Dimensions?",
        detectedLang: lang,
      };
    }
    if (!mem.lastProduct) {
      return {
        text: {
          fr: "Quel produit souhaitez-vous ? (Colibrì 50, Sidney 50, Elba...)",
          tn: "Asch produit t7eb ? (Colibrì 50, Sidney 50, Elba...)",
          ar: "أي منتج تريد؟ (Colibrì 50, Sidney 50, Elba...)",
          en: "Which product would you like? (Colibrì 50, Sidney 50, Elba...)",
          it: "Quale prodotto desideri? (Colibrì 50, Sidney 50, Elba...)",
        }[lang] || "Product?",
        detectedLang: lang,
      };
    }
    
    // Have both: calculate and show button
    const b = calcPriceBreakdown(mem.lastProduct, mem.lastWidth, mem.lastHeight);
    if (b) {
      return {
        text: priceResponse(lang, PRODUCTS[mem.lastProduct].name, mem.lastWidth, mem.lastHeight, 1, b, clientName),
        action: { type: 'open_devis_wizard', params: { productId: mem.lastProduct, width: mem.lastWidth, height: mem.lastHeight } },
        actionLabel: { fr: '📋 Ouvrir le Devis Wizard', tn: '📋 Iftah el Devis', ar: '📋 فتح الديفيس', en: '📋 Open Quote Wizard', it: '📋 Apri Preventivo' }[lang] || '📋 Ouvrir le Devis Wizard',
        detectedLang: lang,
      };
    }
  }

  // PRODUCT INTENTS
  if (intent === 'product_colibri') {
    return {
      text: productInfoResponse(lang, 'colibri-50', clientName),
      detectedLang: lang,
      suggestions: getSuggestions('product', lang),
      productImage: PRODUCTS['colibri-50'].image,
      action: { type: 'navigate_to_page', params: { path: PRODUCTS['colibri-50'].path } },
      actionLabel: { fr: '🔍 Voir COLIBRÌ 50', tn: '🔍 Chouf COLIBRÌ 50', ar: '🔍 رؤية COLIBRÌ 50', en: '🔍 View COLIBRÌ 50', it: '🔍 Vedi COLIBRÌ 50' }[lang] || '🔍 Voir COLIBRÌ 50',
    };
  }
  if (intent === 'product_sidney') {
    return {
      text: productInfoResponse(lang, 'sidney-50', clientName),
      detectedLang: lang,
      suggestions: getSuggestions('product', lang),
      productImage: PRODUCTS['sidney-50'].image,
      action: { type: 'navigate_to_page', params: { path: PRODUCTS['sidney-50'].path } },
      actionLabel: { fr: '🔍 Voir SIDNEY 50', tn: '🔍 Chouf SIDNEY 50', ar: '🔍 رؤية SIDNEY 50', en: '🔍 View SIDNEY 50', it: '🔍 Vedi SIDNEY 50' }[lang] || '🔍 Voir SIDNEY 50',
    };
  }
  if (intent === 'product_sidneyAC') {
    return {
      text: productInfoResponse(lang, 'sidney-50-ac', clientName),
      detectedLang: lang,
      suggestions: getSuggestions('product', lang),
      productImage: PRODUCTS['sidney-50-ac'].image,
      action: { type: 'navigate_to_page', params: { path: PRODUCTS['sidney-50-ac'].path } },
      actionLabel: { fr: '🔍 Voir SIDNEY 50 AC', tn: '🔍 Chouf SIDNEY 50 AC', ar: '🔍 رؤية SIDNEY 50 AC', en: '🔍 View SIDNEY 50 AC', it: '🔍 Vedi SIDNEY 50 AC' }[lang] || '🔍 Voir SIDNEY 50 AC',
    };
  }
  if (intent === 'product_elba') {
    return {
      text: productInfoResponse(lang, 'elba', clientName),
      detectedLang: lang,
      suggestions: getSuggestions('product', lang),
      productImage: PRODUCTS['elba'].image,
      action: { type: 'navigate_to_page', params: { path: PRODUCTS['elba'].path } },
      actionLabel: { fr: '🔍 Voir ELBA', tn: '🔍 Chouf ELBA', ar: '🔍 رؤية ELBA', en: '🔍 View ELBA', it: '🔍 Vedi ELBA' }[lang] || '🔍 Voir ELBA',
    };
  }

  // COMPARISON
  if (intent === 'comparison') {
    const texts: Record<Lang, string> = {
      fr: `⚖️ **Comparatif des moustiquaires :**\n\n🪟 **Colibrì 50** : Fenêtre (Enroulable)\n💰 Dès 263 DT | Idéal pour chambres.\n\n🚪 **Sidney 50** : Porte (Enroulable latérale)\n💰 Dès 611 DT | Idéal pour balcons.\n\n🚪🚪 **Sidney 50 AC** : Grande Porte (Double)\n💰 Dès 1224 DT | Pour grandes ouvertures.\n\n🖼️ **Elba** : Panneau Fixe\n💰 143 DT/m² | Fixation permanente.\n\nLequel vous intéresse ?`,
      tn: `⚖️ **Mokarana mte3 el moustiquaires :**\n\n🪟 **Colibrì 50** : Chbek (Yatlawa)\n💰 Min 263 DT | Behi lel byout.\n\n🚪 **Sidney 50** : Bab (Yatlawa)\n💰 Min 611 DT | Behi lel balcon.\n\n🚪🚪 **Sidney 50 AC** : Bab Kbir (Double)\n💰 Min 1224 DT | Lel biban lekbar.\n\n🖼️ **Elba** : Fixe\n💰 143 DT/m² | Fixe dima.\n\nAsch t7eb ?`,
      ar: `⚖️ **مقارنة الناموسيات :**\n\n🪟 **Colibrì 50** : نافذة (قابلة للطي)\n💰 من 263 DT | مثالية للغرف.\n\n🚪 **Sidney 50** : باب (طي جانبي)\n💰 من 611 DT | مثالية للشرفات.\n\n🚪🚪 **Sidney 50 AC** : باب كبير (مزدوج)\n💰 من 1224 DT | للفتحات الكبيرة.\n\n🖼️ **Elba** : لوح ثابت\n💰 143 DT/m² | تثبيت دائم.\n\nما الذي يهمك؟`,
      en: `⚖️ **Mosquito Screen Comparison:**\n\n🪟 **Colibrì 50**: Window (Roller)\n💰 From 263 DT | Ideal for bedrooms.\n\n🚪 **Sidney 50**: Door (Side Roller)\n💰 From 611 DT | Ideal for balconies.\n\n🚪🚪 **Sidney 50 AC**: Large Door (Double)\n💰 From 1224 DT | For large openings.\n\n🖼️ **Elba**: Fixed Panel\n💰 143 DT/m² | Permanent fixing.\n\nWhich one interests you?`,
      it: `⚖️ **Confronto Zanzariere:**\n\n🪟 **Colibrì 50**: Finestra (Avvolgibile)\n💰 Da 263 DT | Ideale per camere.\n\n🚪 **Sidney 50**: Porta (Avvolgibile laterale)\n💰 Da 611 DT | Ideale per balconi.\n\n🚪🚪 **Sidney 50 AC**: Porta Grande (Doppia)\n💰 Da 1224 DT | Per grandi aperture.\n\n🖼️ **Elba**: Pannello Fisso\n💰 143 DT/m² | Fissaggio permanente.\n\nQuale ti interessa?`,
    };
    return {
      text: texts[lang] || texts.fr,
      suggestions: ['Voir Colibrì 50', 'Voir Sidney 50', 'Voir Elba'],
      detectedLang: lang,
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
      fr: `🪟 **Nos 4 modèles de moustiquaires** :\n\n**1. COLIBRÌ 50** — Fenêtres enroulables\nDimensions max : 200×170 cm | Dès 263 DT\n\n**2. SIDNEY 50** — Portes enroulables\nDimensions max : 200×260 cm | Dès 611 DT\n\n**3. SIDNEY 50 AC** — Grandes portes (double)\nDimensions max : 400×260 cm | Dès 1224 DT\n\n**4. ELBA** — Panneau fixe\nDimensions max : 120×250 cm | Dès 143 DT/m²\n\nQuel modèle vous intéresse ?`,
      tn: `🪟 **4 modèles mte3 moustika** :\n\n**1. COLIBRÌ 50** — Chbabek enroulables\nMax : 200×170 cm | Min 263 DT\n\n**2. SIDNEY 50** — Biban enroulables\nMax : 200×260 cm | Min 611 DT\n\n**3. SIDNEY 50 AC** — Biban kbar (double)\nMax : 400×260 cm | Min 1224 DT\n\n**4. ELBA** — Panneau fixe\nMax : 120×250 cm | Min 143 DT/m²\n\nAsch modèle ye3jebek ?`,
      ar: `🪟 **منتجاتنا الأربعة** :\n\n**1. COLIBRÌ 50** — نوافذ قابلة للطي\nالحد الأقصى : 200×170 سم | ابتداءً من 263 DT\n\n**2. SIDNEY 50** — أبواب قابلة للطي\nالحد الأقصى : 200×260 سم | ابتداءً من 611 DT\n\n**3. SIDNEY 50 AC** — أبواب كبيرة (مزدوجة)\nالحد الأقصى : 400×260 سم | ابتداءً من 1224 DT\n\n**4. ELBA** — لوح ثابت\nالحد الأقصى : 120×250 سم | ابتداءً من 143 DT/m²\n\nأي موديل يعجبك؟`,
      en: `🪟 **Our 4 mosquito screen models** :\n\n**1. COLIBRÌ 50** — Window retractable\nMax: 200×170 cm | From 263 DT\n\n**2. SIDNEY 50** — Door retractable\nMax: 200×260 cm | From 611 DT\n\n**3. SIDNEY 50 AC** — Large doors (double)\nMax: 400×260 cm | From 1224 DT\n\n**4. ELBA** — Fixed panel\nMax: 120×250 cm | From 143 DT/m²\n\nWhich model interests you?`,
      it: `🪟 **I nostri 4 modelli di zanzariere** :\n\n**1. COLIBRÌ 50** — Finestre avvolgibili\nMax: 200×170 cm | Da 263 DT\n\n**2. SIDNEY 50** — Porte avvolgibili\nMax: 200×260 cm | Da 611 DT\n\n**3. SIDNEY 50 AC** — Porte grandi (doppie)\nMax: 400×260 cm | Da 1224 DT\n\n**4. ELBA** — Pannello fisso\nMax: 120×250 cm | Da 143 DT/m²\n\nQuale modello ti interessa?`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      suggestions: ['COLIBRÌ 50', 'SIDNEY 50', 'ELBA'],
      action: { type: 'navigate_to_page', params: { path: '/produits' } },
      actionLabel: { fr: '🛍 Voir le catalogue', tn: '🛍 Chouf el catalogue', ar: '🛍 عرض الكتالوج', en: '🛍 View catalogue', it: '🛍 Vedi catalogo' }[lang] || '🛍 Voir le catalogue',
    };
  }

  // COMPARISON
  if (intent === 'comparison') {
    const texts: Record<Lang, string> = {
      fr: `📊 **Comparatif de nos moustiquaires** :\n\nVoici les différences clés entre nos 4 modèles. Besoin d'aide pour choisir ?`,
      tn: `📊 **Comparaison mte3 moustika 7etna** :\n\nHouma el far9 bin el 4 modèles. T7eb n3awnek ta5tar ?`,
      ar: `📊 **مقارنة المستيكارات** :\n\nهذه الفروقات الرئيسية بين الأربعة موديلات. تحتاج مساعدة في الاختيار؟`,
      en: `📊 **Mosquito screen comparison** :\n\nHere are the key differences between our 4 models. Need help choosing?`,
      it: `📊 **Confronto zanzariere** :\n\nEcco le differenze chiave tra i 4 modelli. Hai bisogno di aiuto per scegliere?`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      comparisonTable: buildComparisonTable(lang),
      suggestions: getSuggestions('product', lang),
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

  // LOCATION
  if (intent === 'location') {
    const texts: Record<Lang, string> = {
      fr: `📍 **Showroom Aluminium Space** :\n${COMPANY.address}\n\n🗺 À Mghira, Tunis — facilement accessible depuis Tunis (20 min).`,
      tn: `📍 **Showroom mte3na** :\n${COMPANY.address}\n\n🗺 Fi Mghira, Tunis — 20 min men Tunis.`,
      ar: `📍 **معرض Aluminium Space** :\n${COMPANY.address}\n\n🗺 في مغيرة، تونس — 20 دقيقة من تونس العاصمة.`,
      en: `📍 **Aluminium Space Showroom** :\n${COMPANY.address}\n\n🗺 In Mghira, Tunis — 20 min from Tunis.`,
      it: `📍 **Showroom Aluminium Space** :\n${COMPANY.address}\n\n🗺 A Mghira, Tunis — 20 min da Tunisi.`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      suggestions: getSuggestions('contact', lang),
    };
  }

  // HOURS
  if (intent === 'hours') {
    const texts: Record<Lang, string> = {
      fr: `⏰ **Horaires d'ouverture** :\n\n${COMPANY.hours}\n\nNous sommes fermés le dimanche. Contactez-nous sur WhatsApp en dehors des heures.`,
      tn: `⏰ **Wa9t el 3mel** :\n\n${COMPANY.hours}\n\nEl had 8alaqa. Tnajem ta3melna WhatsApp fi d dehors des heures.`,
      ar: `⏰ **ساعات العمل** :\n\n${COMPANY.hours}\n\nمغلق الأحد. يمكنك التواصل عبر واتساب خارج ساعات العمل.`,
      en: `⏰ **Opening hours** :\n\n${COMPANY.hours}\n\nClosed on Sunday. Contact us on WhatsApp outside business hours.`,
      it: `⏰ **Orari di apertura** :\n\n${COMPANY.hours}\n\nChiusi la domenica. Contattaci su WhatsApp fuori orario.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
  }

  // ABOUT
  if (intent === 'about') {
    const texts: Record<Lang, string> = {
      fr: `🏢 **Aluminium Space** est spécialisé dans la fabrication et l'installation de moustiquaires de qualité italienne Grifo Flex.\n\n📍 Basé à Mghira, Tunis\n🏆 Produits certifiés, structure aluminium\n🇮🇹 Qualité italienne\n\nNous servons toute la Tunisie avec un service professionnel.`,
      tn: `🏢 **Aluminium Space** mta3 moustika de qualité italienne Grifo Flex.\n\n📍 Fi Mghira, Tunis\n🏆 Produits certifiés, haykel aluminium\n🇮🇹 Qualité italienne\n\nNkhedmou l kol tounes.`,
      ar: `🏢 **Aluminium Space** متخصص في تصنيع وتركيب مستيكارات إيطالية الجودة Grifo Flex.\n\n📍 في مغيرة، تونس\n🏆 منتجات معتمدة، هيكل ألومنيوم\n🇮🇹 جودة إيطالية\n\nنخدم كل تونس.`,
      en: `🏢 **Aluminium Space** specializes in manufacturing and installing quality Italian mosquito screens (Grifo Flex).\n\n📍 Based in Mghira, Tunis\n🏆 Certified products, aluminum structure\n🇮🇹 Italian quality\n\nServing all of Tunisia.`,
      it: `🏢 **Aluminium Space** è specializzata nella produzione e installazione di zanzariere di qualità italiana Grifo Flex.\n\n📍 A Mghira, Tunis\n🏆 Prodotti certificati, struttura in alluminio\n🇮🇹 Qualità italiana\n\nServiamo tutta la Tunisia.`,
    };
    return {
      text: texts[lang] || texts.fr,
      detectedLang: lang,
      suggestions: getSuggestions('greeting', lang),
      action: { type: 'navigate_to_page', params: { path: '/about' } },
      actionLabel: { fr: '📖 En savoir plus', tn: '📖 A3ref akther', ar: '📖 اعرف أكثر', en: '📖 Learn more', it: '📖 Scopri di più' }[lang] || '📖 En savoir plus',
    };
  }

  // INSTALLATION
  if (intent === 'installation') {
    const texts: Record<Lang, string> = {
      fr: `🔧 **Installation** :\n\nNous proposons l'installation professionnelle de nos moustiquaires par nos techniciens qualifiés.\n\n📞 Appelez-nous pour planifier une installation : ${COMPANY.phone1}\n💬 WhatsApp : +216 57 099 070`,
      tn: `🔧 **Tarkib** :\n\nNajem nrakboulek el moustika b mohtarfin mte3na.\n\n📞 Atslna bech nplaniflou : ${COMPANY.phone1}\n💬 WhatsApp : +216 57 099 070`,
      ar: `🔧 **التركيب** :\n\nنقدم التركيب الاحترافي لمستيكاراتنا من قبل فنيينا المؤهلين.\n\n📞 اتصل بنا للتخطيط : ${COMPANY.phone1}\n💬 واتساب : +216 57 099 070`,
      en: `🔧 **Installation** :\n\nWe offer professional installation by our qualified technicians.\n\n📞 Call us to schedule: ${COMPANY.phone1}\n💬 WhatsApp: +216 57 099 070`,
      it: `🔧 **Installazione** :\n\nOffriamo installazione professionale da parte dei nostri tecnici qualificati.\n\n📞 Chiamaci per programmare: ${COMPANY.phone1}\n💬 WhatsApp: +216 57 099 070`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
  }

  // DELIVERY
  if (intent === 'delivery') {
    const texts: Record<Lang, string> = {
      fr: `🚚 **Délais** :\n\n• Fabrication sur mesure : 7 à 14 jours ouvrables\n• Livraison possible sur tout le territoire\n• Délai de pose : 1 à 2 heures par unité\n\nContactez-nous pour plus de détails.`,
      tn: `🚚 **Delai** :\n\n• Fabrication sur mesure : 7 à 14 jours\n• Tawsil possible l kol bled\n• Tarkib : 1 à 2 sa3et lel wa7da\n\nAtslna bech ta3ref akther.`,
      ar: `🚚 **المواعيد** :\n\n• التصنيع على القياس : 7 إلى 14 يوم عمل\n• التوصيل ممكن لكل أنحاء البلاد\n• وقت التركيب : 1 إلى 2 ساعة للوحدة\n\nاتصل بنا للمزيد.`,
      en: `🚚 **Lead times** :\n\n• Custom manufacturing: 7 to 14 business days\n• Delivery available across Tunisia\n• Installation: 1 to 2 hours per unit\n\nContact us for more details.`,
      it: `🚚 **Tempi** :\n\n• Produzione su misura: 7-14 giorni lavorativi\n• Consegna disponibile in tutta la Tunisia\n• Installazione: 1-2 ore per unità\n\nContattaci per i dettagli.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
  }

  // WARRANTY
  if (intent === 'warranty') {
    const texts: Record<Lang, string> = {
      fr: `🛡️ **Garantie** :\n\n• Structure aluminium : 2 ans de garantie fabricant\n• Grille anti-insectes : 1 an\n• Service après-vente disponible\n\nNos produits Grifo Flex sont reconnus pour leur durabilité.`,
      tn: `🛡️ **Daman** :\n\n• Haykel aluminium : 2 snin daman\n• Grille : 1 sna\n• SAV disponible\n\nProduits Grifo Flex yestahmlou.`,
      ar: `🛡️ **الضمان** :\n\n• هيكل الألومنيوم : ضمان سنتان\n• الشبكة : سنة واحدة\n• خدمة ما بعد البيع متاحة\n\nمنتجات Grifo Flex معروفة بمتانتها.`,
      en: `🛡️ **Warranty** :\n\n• Aluminum structure: 2 years manufacturer warranty\n• Insect mesh: 1 year\n• After-sales service available\n\nGrifo Flex products are known for their durability.`,
      it: `🛡️ **Garanzia** :\n\n• Struttura in alluminio: 2 anni di garanzia\n• Rete anti-insetti: 1 anno\n• Servizio post-vendita disponibile\n\nI prodotti Grifo Flex sono noti per la durata.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
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
      fr: `💳 **Modalités de paiement** :\n\n• Espèces (cash)\n• Virement bancaire\n• Chèque certifié\n• Versement en acompte (30% à la commande)\n\nContactez-nous pour discuter des options.`,
      tn: `💳 **Kif tkhales** :\n\n• Cash\n• Virement bancaire\n• Chèque certifié\n• Acompte (30% 3al commande)\n\nAtslna bech ntet7adthou.`,
      ar: `💳 **طرق الدفع** :\n\n• نقداً\n• تحويل بنكي\n• شيك مصدق\n• دفعة مقدمة (30% عند الطلب)\n\nاتصل بنا لمناقشة الخيارات.`,
      en: `💳 **Payment options** :\n\n• Cash\n• Bank transfer\n• Certified check\n• Down payment (30% on order)\n\nContact us to discuss options.`,
      it: `💳 **Modalità di pagamento** :\n\n• Contanti\n• Bonifico bancario\n• Assegno certificato\n• Acconto (30% all'ordine)\n\nContattaci per discutere le opzioni.`,
    };
    return { text: texts[lang] || texts.fr, detectedLang: lang, suggestions: getSuggestions('contact', lang) };
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
      fr: `🎁 **Nos offres** :\n\nUne **remise de 20%** est déjà incluse dans tous nos devis.\n\nSuivez nos réseaux sociaux pour les promotions spéciales.`,
      tn: `🎁 **Promotions mte3na** :\n\nFi déjà **remise de 20%** fi kol devis mte3na.\n\nSuiv reseaux sociaux 7etna bech ta3ref promotions.`,
      ar: `🎁 **عروضنا** :\n\n**خصم 20%** مدرج بالفعل في كل ديفيسات.\n\nتابع شبكاتنا الاجتماعية للعروض الخاصة.`,
      en: `🎁 **Our offers** :\n\nA **20% discount** is already included in all our quotes.\n\nFollow our social media for special promotions.`,
      it: `🎁 **Le nostre offerte** :\n\nUno **sconto del 20%** è già incluso in tutti i preventivi.\n\nSeguici sui social media per promozioni speciali.`,
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
  const openAiText = await processWithOpenAI(userText, history, lang);
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
