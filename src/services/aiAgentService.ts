import { ensureSettingsLoaded, getSettings, type BusinessSettings } from '../store/settingsStore';
import { getProducts, type SupabaseProduct } from '../store/productsStore';
import { products as localProducts } from '../data/products';
import { calculatePrice, getProductDimensionLimits } from '../utils/priceCalculator';
import { getRemisePercent } from '../utils/remiseCalculator';

export type AgentLanguage = 'fr' | 'en' | 'it' | 'ar' | 'tn';

export interface DevisAction {
  slug: string;
  w: number;
  h: number;
  qty: number;
}

export interface ConvMemory {
  clientName: string | null;
  lastProduct: string | null;
  lastWidth: number | null;
  lastHeight: number | null;
}

export interface AgentAction {
  type: 'navigate_to_page' | 'scroll_to_section';
  params?: Record<string, string | number>;
  closeAfter?: boolean;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  action?: AgentAction;
  actionLabel?: string;
  suggestions?: string[];
  detectedLang?: AgentLanguage;
  productImage?: string;
  rating?: 'up' | 'down' | null;
  image?: string;
  language?: AgentLanguage;
  awaitingDimensions?: boolean;
  awaitingQuantity?: boolean;
  devisAction?: DevisAction;
}

export interface AIResponse {
  text: string;
  image?: string;
  language: AgentLanguage;
  awaitingDimensions?: boolean;
  awaitingQuantity?: boolean;
  devisAction?: DevisAction;
  action?: AgentAction;
  actionLabel?: string;
  suggestions?: string[];
  detectedLang?: AgentLanguage;
  productImage?: string;
}

interface Dimensions {
  width: number;
  height: number;
}

type QuoteProduct = Pick<SupabaseProduct, 'slug' | 'name' | 'image_url'>;

interface CalculatedQuote {
  product: QuoteProduct;
  dimensions: Dimensions;
  quantity: number;
  color: string;
  unitPrice: number;
  grossHT: number;
  remisePercent: number;
  remise: number;
  netHT: number;
  fodec: number;
  tva: number;
  timbre: number;
  totalTTC: number;
}

const VALID_LANGUAGES: AgentLanguage[] = ['fr', 'en', 'it', 'ar', 'tn'];
const DEFAULT_LANGUAGE: AgentLanguage = 'fr';
const TN_WORDS = /\b(aslema|barcha|chnia|chniya|ena|ey|kifech|mazel|mrigla|na3am|n7eb|nta|rou7|sahha|taw|thamnou|thmen|winou|yezzi|9adech|3andi|7aja)\b/i;
const PRICING_WORDS = /\b(prix|tarif|cout|co[uû]t|cost|price|preventivo|devis|quote|somme|total|thaman|thamnou|thmen)\b|سعر|ثمن|عرض سعر/i;
const DETAIL_WORDS = /\b(detail|details|d[eé]tail|d[eé]tails|calcul|breakdown|dettaglio|dettagli|تفاصيل)\b/i;
const DEVIS_WORDS = /\b(devis|quote|preventivo|commander|commande|order|confirm|confirmer|valider|validate)\b|عرض سعر|طلب/i;
const AFFIRMATIVE_WORDS = /^(oui|yes|ok|okay|d'accord|parfait|confirme|confirm|valide|validate|ey|na3am|si|نعم)[.! ]*$/i;
const COLOR_WORDS = /\b(blanc|white|bianco|noir|black|nero|gris|grey|gray|grigio|beige|marron|brown|brun|bronze)\b/i;

const COPY = {
  product: {
    fr: 'Quel produit souhaitez-vous chiffrer ? Indiquez par exemple Colibri, Sidney, Sidney AC, Elba ou Plisse 31.',
    en: 'Which product would you like to price? For example: Colibri, Sidney, Sidney AC, Elba, or Plisse 31.',
    it: 'Quale prodotto desideri preventivare? Ad esempio: Colibri, Sidney, Sidney AC, Elba o Plisse 31.',
    ar: 'ما هو المنتج الذي تريد تسعيره؟ مثال: Colibri أو Sidney أو Sidney AC أو Elba أو Plisse 31.',
    tn: 'Chnia el produit elli t7eb ta3melou devis? Mathalan Colibri, Sidney, Sidney AC, Elba walla Plisse 31.',
  },
  dimensions: {
    fr: (product: string) => `Indiquez les dimensions de ${product} en centimètres, par exemple 120 x 220 cm.`,
    en: (product: string) => `Please provide the ${product} dimensions in centimetres, for example 120 x 220 cm.`,
    it: (product: string) => `Indica le dimensioni di ${product} in centimetri, ad esempio 120 x 220 cm.`,
    ar: (product: string) => `يرجى إرسال مقاسات ${product} بالسنتيمتر، مثال: 120 x 220 سم.`,
    tn: (product: string) => `A3tini dimensions mta3 ${product} bel cm, mathalan 120 x 220 cm.`,
  },
  quantity: {
    fr: 'Quelle quantité souhaitez-vous ?',
    en: 'How many units would you like?',
    it: 'Quante unità desideri?',
    ar: 'ما هي الكمية المطلوبة؟',
    tn: '9adech t7eb men pièce?',
  },
  unavailable: {
    fr: (product: string, limits: string) => `Ces dimensions ne sont pas disponibles pour ${product}. Plage acceptée : ${limits}.`,
    en: (product: string, limits: string) => `Those dimensions are not available for ${product}. Accepted range: ${limits}.`,
    it: (product: string, limits: string) => `Queste dimensioni non sono disponibili per ${product}. Intervallo accettato: ${limits}.`,
    ar: (product: string, limits: string) => `هذه المقاسات غير متوفرة لمنتج ${product}. النطاق المقبول: ${limits}.`,
    tn: (product: string, limits: string) => `Dimensions hedhouma ma yemchiwch m3a ${product}. El plage disponible: ${limits}.`,
  },
  action: {
    fr: 'Parfait. Je vous redirige vers le devis prérempli pour vérifier vos choix.',
    en: 'Perfect. I am taking you to the prefilled quote so you can review your choices.',
    it: 'Perfetto. Ti porto al preventivo precompilato per verificare le tue scelte.',
    ar: 'ممتاز. سأحولك إلى عرض السعر المعبأ مسبقاً لمراجعة اختياراتك.',
    tn: 'Mrigla. Taw nemchi bik lel devis prérempli bech tثبت choix mte3ek.',
  },
  fallback: {
    fr: 'Je rencontre un souci technique. Vous pouvez nous contacter au +216 53 186 611.',
    en: 'I am having a technical issue. You can contact us at +216 53 186 611.',
    it: 'Sto riscontrando un problema tecnico. Puoi contattarci al +216 53 186 611.',
    ar: 'أواجه مشكلة تقنية. يمكنك التواصل معنا على +216 53 186 611.',
    tn: 'Fama mochkla technique. Tnajjem teklemna 3al +216 53 186 611.',
  },
};

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function detectLanguage(text: string, savedLanguage?: string): AgentLanguage {
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (TN_WORDS.test(text)) return 'tn';
  if (savedLanguage && VALID_LANGUAGES.includes(savedLanguage as AgentLanguage)) {
    return savedLanguage as AgentLanguage;
  }
  return DEFAULT_LANGUAGE;
}

function parseLanguage(text: string, fallback: AgentLanguage): AgentLanguage {
  const match = text.match(/\[lang:(fr|en|it|ar|tn)\]/i);
  return match ? (match[1].toLowerCase() as AgentLanguage) : fallback;
}

function parseImage(text: string) {
  const image = text.match(/\[image:([^\]]+)\]/i)?.[1];
  if (image === '/images/elba.webp') return '/images/elba-v2.webp';
  return image && /^\/images\/[\w.-]+$/.test(image) ? image : undefined;
}

function parseAwaitingDimensions(text: string) {
  return /\[awaiting:dimensions\]/i.test(text);
}

function parseAwaitingQuantity(text: string) {
  return /\[awaiting:quantity\]/i.test(text);
}

function stripControlTags(text: string) {
  return text
    .replace(/\n?\[image:[^\]]+\]/gi, '')
    .replace(/\n?\[lang:(?:fr|en|it|ar|tn)\]/gi, '')
    .replace(/\n?\[awaiting:(?:dimensions|quantity)\]/gi, '')
    .replace(/\n?\[action:devis:[^\]]+\]/gi, '')
    .trim();
}

function parseDimensions(text: string): Dimensions | undefined {
  // Standard: NUMxNUM or NUM*NUM or NUM/NUM
  const stdMatch = text.match(/(\d{2,4})\s*[xX×*\/]\s*(\d{2,4})/);
  if (stdMatch) {
    const w = parseInt(stdMatch[1]);
    const h = parseInt(stdMatch[2]);
    if (w >= 20 && w <= 600 && h >= 20 && h <= 600) return { width: w, height: h };
  }

  // Natural FR: largeur 90 hauteur 130
  const frMatch = text.match(/largeur\s*:?\s*(\d{2,4}).*?hauteur\s*:?\s*(\d{2,4})/i);
  if (frMatch) {
    const w = parseInt(frMatch[1]);
    const h = parseInt(frMatch[2]);
    if (w >= 20 && w <= 600 && h >= 20 && h <= 600) return { width: w, height: h };
  }

  // Natural FR: hauteur 130 largeur 90 (reversed)
  const frRevMatch = text.match(/hauteur\s*:?\s*(\d{2,4}).*?largeur\s*:?\s*(\d{2,4})/i);
  if (frRevMatch) {
    const h = parseInt(frRevMatch[1]);
    const w = parseInt(frRevMatch[2]);
    if (w >= 20 && w <= 600 && h >= 20 && h <= 600) return { width: w, height: h };
  }

  // Natural AR/TN: عرض 90 ارتفاع 130
  const arMatch = text.match(/عرض\s*:?\s*(\d{2,4}).*?ارتفاع\s*:?\s*(\d{2,4})/);
  if (arMatch) {
    const w = parseInt(arMatch[1]);
    const h = parseInt(arMatch[2]);
    if (w >= 20 && w <= 600 && h >= 20 && h <= 600) return { width: w, height: h };
  }

  // L90 H130 or W90 H130
  const lMatch = text.match(/[LlWw]\s*(\d{2,4})\s*[HhTt]\s*(\d{2,4})/);
  if (lMatch) {
    const w = parseInt(lMatch[1]);
    const h = parseInt(lMatch[2]);
    if (w >= 20 && w <= 600 && h >= 20 && h <= 600) return { width: w, height: h };
  }

  return undefined;
}

function parseQuantity(text: string, allowBareNumber = false) {
  const normalized = normalizeText(text);
  const match =
    normalized.match(/\b(?:qty|quantite|quantity|qte|pieces?|unites?|units?|pezzi|ka3bet|قطعة|قطع)\s*[:=]?\s*(\d{1,3})\b/i) ??
    normalized.match(/\b(\d{1,3})\s*(?:pieces?|unites?|units?|pezzi|ka3bet|قطعة|قطع)\b/i);

  if (match) return Number(match[1]);

  if (allowBareNumber) {
    const bareNumber = normalized.match(/^\s*(\d{1,3})\s*$/);
    if (bareNumber) return Number(bareNumber[1]);
  }

  return undefined;
}

function findProductInText(text: string, products: QuoteProduct[]) {
  const PRODUCT_ALIASES: Record<string, string> = {
    'kolibri': 'colibri-50',
    'colibri': 'colibri-50',
    'colibrì': 'colibri-50',
    'colibri 50': 'colibri-50',
    'colibri50': 'colibri-50',
    'sidney': 'sidney-50',
    'sidney 50': 'sidney-50',
    'sidney50': 'sidney-50',
    'sidney ac': 'sidney-50-ac',
    'sidney50ac': 'sidney-50-ac',
    'sidney 50 ac': 'sidney-50-ac',
    'elba': 'elba',
    'plisse': 'plisse31',
    'plissé': 'plisse31',
    'plisse 31': 'plisse31',
    'plissé 31': 'plisse31',
    'plisse31': 'plisse31',
  };
  
  // Normalize: lowercase, remove accents, trim
  function normalizeProductName(t: string): string {
    return t.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
  
  const normalized = normalizeProductName(text);
  for (const [alias, slug] of Object.entries(PRODUCT_ALIASES)) {
    if (normalized.includes(normalizeProductName(alias))) {
      const found = products.find(p => p.slug === slug);
      if (found) return found;
    }
  }

  const normalizedOld = normalizeText(text);
  return products
    .slice()
    .sort((a, b) => b.slug.length - a.slug.length)
    .find((product) => {
      const slug = normalizeText(product.slug).replace(/-/g, ' ');
      const name = normalizeText(product.name);
      const aliases: Record<string, string[]> = {
        'colibri-50': ['colibri', 'colibri 50'],
        'sidney-50': ['sidney', 'sidney 50'],
        'sidney-50-ac': ['sidney ac', 'sidney 50 ac'],
        elba: ['elba'],
        plisse31: ['plisse', 'plisse 31'],
      };
      return normalizedOld.includes(slug) || normalizedOld.includes(name) || aliases[product.slug]?.some((alias) => normalizedOld.includes(alias));
    });
}

function findProduct(text: string, history: Message[], products: QuoteProduct[]) {
  return (
    findProductInText(text, products) ??
    history
      .slice()
      .reverse()
      .map((message) => findProductInText(message.content, products))
      .find(Boolean)
  );
}

function findDimensions(text: string, history: Message[]) {
  return (
    parseDimensions(text) ??
    history
      .slice()
      .reverse()
      .map((message) => parseDimensions(message.content))
      .find(Boolean)
  );
}

function findQuantity(text: string, history: Message[], productSlug?: string, dimensions?: Dimensions) {
  const latestAssistant = history.filter((message) => message.role === 'assistant').at(-1);
  const current = parseQuantity(text, Boolean(latestAssistant?.awaitingQuantity));
  if (current) return current;

  // Robust parsing: if we have dimensions in the text, let's extract quantity from remaining numbers
  if (dimensions) {
    let cleanText = text;
    // Strip dimensions from the text
    cleanText = cleanText.replace(new RegExp(`\\b${dimensions.width}\\b`, 'g'), '');
    cleanText = cleanText.replace(new RegExp(`\\b${dimensions.height}\\b`, 'g'), '');
    
    // Strip product name numbers (like 50, 31)
    if (productSlug === 'colibri-50' || productSlug === 'sidney-50' || productSlug === 'sidney-50-ac') {
      cleanText = cleanText.replace(/\b50\b/g, '');
    }
    if (productSlug === 'plisse31') {
      cleanText = cleanText.replace(/\b31\b/g, '');
    }

    const numbers = cleanText.match(/\b\d{1,3}\b/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0]);
    }
  }

  return history
    .slice()
    .reverse()
    .map((message) => parseQuantity(message.content))
    .find(Boolean);
}

function findColor(text: string, history: Message[]) {
  const parsed =
    normalizeText(text).match(COLOR_WORDS)?.[1] ??
    history
      .slice()
      .reverse()
      .map((message) => normalizeText(message.content).match(COLOR_WORDS)?.[1])
      .find(Boolean);

  if (!parsed || ['blanc', 'white', 'bianco'].includes(parsed)) return 'Blanc';
  if (['noir', 'black', 'nero'].includes(parsed)) return 'Noir';
  return parsed;
}

function isPricingConversation(text: string, history: Message[], products: QuoteProduct[]) {
  const latestAssistant = history.filter((message) => message.role === 'assistant').at(-1);
  return (
    PRICING_WORDS.test(text) ||
    DETAIL_WORDS.test(text) ||
    Boolean(findProductInText(text, products)) ||
    Boolean(parseDimensions(text)) ||
    Boolean(latestAssistant?.awaitingDimensions) ||
    Boolean(latestAssistant?.awaitingQuantity) ||
    Boolean(latestAssistant?.content.includes('TTC'))
  );
}

function wantsQuoteAction(text: string, history: Message[]) {
  if (DEVIS_WORDS.test(text)) return true;

  const latestAssistant = history.filter((message) => message.role === 'assistant').at(-1);
  return AFFIRMATIVE_WORDS.test(text.trim()) && Boolean(latestAssistant?.content.match(/\b(devis|quote|preventivo)\b|عرض سعر/i));
}

function formatTnd(valueInMillimes: number) {
  return `${(valueInMillimes / 1000).toFixed(3).replace('.', ',')} TND`;
}

function getProductImage(product: QuoteProduct) {
  return product.slug === 'elba' ? '/images/elba-v2.webp' : product.image_url ?? undefined;
}

function getQuoteProducts(products: SupabaseProduct[]): QuoteProduct[] {
  const activeProducts = products.filter((product) => product.is_active);
  if (activeProducts.length > 0) return activeProducts;

  return localProducts.map((product) => ({
    slug: product.id,
    name: product.name,
    image_url: product.imageUrl,
  }));
}


function calculateQuote(
  product: QuoteProduct,
  dimensions: Dimensions,
  quantity: number,
  color: string,
  settings: BusinessSettings,
): CalculatedQuote | undefined {
  const price = calculatePrice({
    productId: product.slug,
    width: dimensions.width,
    height: dimensions.height,
    color,
  });

  if (!price) return undefined;

  const grossHT = price.unitPrice * quantity;
  const remisePercent = getRemisePercent(quantity);
  const remise = (grossHT * remisePercent) / 100;
  const netHT = grossHT - remise;
  const fodec = (netHT * settings.fodecPercent) / 100;
  const taxableBase = netHT + fodec;
  const tva = (taxableBase * settings.tvaPercent) / 100;
  const timbre = settings.timbreFiscal * 1000;

  return {
    product,
    dimensions,
    quantity,
    color,
    unitPrice: price.unitPrice,
    grossHT,
    remisePercent,
    remise,
    netHT,
    fodec,
    tva,
    timbre,
    totalTTC: taxableBase + tva + timbre,
  };
}

function buildSummary(quote: CalculatedQuote, language: AgentLanguage) {
  const total = formatTnd(quote.totalTTC);
  const dimensions = `${quote.dimensions.width} x ${quote.dimensions.height} cm`;
  const units: Record<AgentLanguage, string> = {
    fr: quote.quantity > 1 ? 'pièces' : 'pièce',
    en: quote.quantity > 1 ? 'units' : 'unit',
    it: 'unità',
    ar: 'قطعة',
    tn: quote.quantity > 1 ? 'ka3bet' : 'ka3ba',
  };
  const common = `${quote.product.name} - ${dimensions} - ${quote.quantity} ${units[language]}`;

  const summaries: Record<AgentLanguage, string> = {
    fr: `${common}\nTotal TTC : ${total}\n\nJe peux vous donner le détail du calcul ou préparer un devis prérempli.`,
    en: `${common}\nTotal incl. tax: ${total}\n\nI can provide the calculation details or prepare a prefilled quote.`,
    it: `${common}\nTotale IVA inclusa: ${total}\n\nPosso mostrarti il dettaglio del calcolo o preparare un preventivo precompilato.`,
    ar: `${common}\nالإجمالي شامل الضريبة: ${total}\n\nيمكنني عرض تفاصيل الحساب أو تجهيز عرض سعر معبأ مسبقاً.`,
    tn: `${common}\nTotal TTC: ${total}\n\nNnajjem na3tik détail mta3 calcul walla n7adherlek devis prérempli.`,
  };

  return summaries[language];
}

function buildDetails(quote: CalculatedQuote, language: AgentLanguage) {
  const labels: Record<AgentLanguage, string[]> = {
    fr: ['Prix unitaire HT', 'Total brut HT', 'Remise', 'Net HT', 'FODEC', 'TVA', 'Timbre fiscal', 'Total TTC'],
    en: ['Unit price excl. tax', 'Gross total excl. tax', 'Discount', 'Net excl. tax', 'FODEC', 'VAT', 'Tax stamp', 'Total incl. tax'],
    it: ['Prezzo unitario IVA esclusa', 'Totale lordo IVA esclusa', 'Sconto', 'Netto IVA esclusa', 'FODEC', 'IVA', 'Bollo fiscale', 'Totale IVA inclusa'],
    ar: ['سعر الوحدة دون الضريبة', 'الإجمالي الخام دون الضريبة', 'الخصم', 'الصافي دون الضريبة', 'FODEC', 'الضريبة على القيمة المضافة', 'الطابع الجبائي', 'الإجمالي شامل الضريبة'],
    tn: ['Thmen unité HT', 'Total brut HT', 'Remise', 'Net HT', 'FODEC', 'TVA', 'Timbre fiscal', 'Total TTC'],
  };
  const [unitPrice, grossHT, remise, netHT, fodec, tva, timbre, totalTTC] = labels[language];
  const lines = [
    `${quote.product.name} - ${quote.dimensions.width} x ${quote.dimensions.height} cm x ${quote.quantity}`,
    `${unitPrice} : ${formatTnd(quote.unitPrice)}`,
    `${grossHT} : ${formatTnd(quote.grossHT)}`,
    `${remise} (${quote.remisePercent} %) : -${formatTnd(quote.remise)}`,
    `${netHT} : ${formatTnd(quote.netHT)}`,
    `${fodec} : ${formatTnd(quote.fodec)}`,
    `${tva} : ${formatTnd(quote.tva)}`,
    `${timbre} : ${formatTnd(quote.timbre)}`,
    `${totalTTC} : ${formatTnd(quote.totalTTC)}`,
  ];

  const introductions: Record<AgentLanguage, string> = {
    fr: 'Voici le détail du calcul :',
    en: 'Here is the calculation breakdown:',
    it: 'Ecco il dettaglio del calcolo:',
    ar: 'إليك تفاصيل الحساب:',
    tn: 'Haw el détail mta3 calcul:',
  };

  return `${introductions[language]}\n${lines.join('\n')}`;
}

function localResponse(
  text: string,
  language: AgentLanguage,
  options: Partial<Pick<AIResponse, 'image' | 'awaitingDimensions' | 'awaitingQuantity' | 'devisAction'>> = {},
): AIResponse {
  return { text, language, ...options };
}

function getClientId() {
  const key = 'alu-ai-client-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const clientId = window.crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, clientId);
  return clientId;
}

async function callEdgeFunction(userText: string, history: Message[], language: AgentLanguage) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'x-client-id': getClientId(),
    },
    body: JSON.stringify({
      messages: [
        ...history.slice(-12).map(({ role, content }) => ({ role, content })),
        { role: 'user', content: userText },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI Edge Function returned ${response.status}`);
  }

  const data = await response.json();
  if (typeof data?.content !== 'string') {
    throw new Error('AI Edge Function returned an invalid response');
  }

  const responseLanguage = parseLanguage(data.content, language);
  return localResponse(stripControlTags(data.content), responseLanguage, {
    image: parseImage(data.content),
    awaitingDimensions: parseAwaitingDimensions(data.content),
    awaitingQuantity: parseAwaitingQuantity(data.content),
  });
}

async function handleDeterministicQuote(
  userText: string,
  history: Message[],
  language: AgentLanguage,
  products: QuoteProduct[],
): Promise<AIResponse | undefined> {
  // Only handle deterministically if user is asking for price
  const PRICE_INTENT = [
    // French
    'prix', 'combien', 'coût', 'tarif', 'devis', 'thaman',
    // Tunisian
    'qaddech', '9addech', '9adech', 'bech', 'calcul',
    'ka3bet', 'ka3ba', 'pièces', 'unités', 'pieces',
    // Numbers alone as quantity after awaiting state
    // (only if last bot message was awaiting quantity)
    // Arabic  
    'سعر', 'كم', 'تمن', 'حساب',
    // English/Italian
    'price', 'cost', 'quote', 'prezzo'
  ];
  
  const lastBotMessage = history
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content ?? '';
  
  const isAwaitingQuantity = 
    lastBotMessage.includes('[await:quantity]') ||
    lastBotMessage.includes('[awaiting:quantity]') ||
    lastBotMessage.includes('Combien') ||
    lastBotMessage.includes('quantité') ||
    lastBotMessage.includes('ka3bet') ||
    lastBotMessage.includes('كمية') ||
    lastBotMessage.includes('Combien d\'unités');
  
  const PRODUCT_KEYWORDS = ['colibri', 'kolibri', 'sidney', 'elba', 'plisse', 'plissée', 'moustiquaire'];
  
  const hasProductInCurrentMsg = PRODUCT_KEYWORDS.some(k => 
    userText.toLowerCase().includes(k.toLowerCase())
  );
  
  const hasPriceIntent = PRICE_INTENT.some(k =>
    userText.toLowerCase().includes(k.toLowerCase())
  );
  
  const isPureNumber = /^\s*\d+\s*$/.test(userText.trim());
  
  // Only intercept if:
  // 1. Current message has price intent, OR
  // 2. Current message has product name + dimensions, OR  
  // 3. Bot was awaiting quantity AND user sent a number
  if (!hasPriceIntent && !hasProductInCurrentMsg && 
      !(isAwaitingQuantity && isPureNumber)) {
    return undefined; // Let AI handle it
  }

  if (!isPricingConversation(userText, history, products)) return undefined;

  const isImageRequested = /image|photo|taswira|chousni|3ayyarli|show me|picture|voir le produit|wriha|chapha/i.test(userText);
  if (isImageRequested) return undefined;

  const product = findProduct(userText, history, products);
  if (!product) return undefined;

  const dimensions = findDimensions(userText, history);
  if (!dimensions) return undefined;

  const limits = getProductDimensionLimits(product.slug, dimensions.height);
  if (
    !limits ||
    dimensions.width < limits.minW ||
    dimensions.width > limits.maxW ||
    dimensions.height < limits.minH ||
    dimensions.height > limits.maxH
  ) {
    return undefined;
  }

  const quantity = findQuantity(userText, history, product.slug, dimensions);
  if (!quantity || quantity < 1) return undefined;

  const color = findColor(userText, history);
  await ensureSettingsLoaded();
  const quote = calculateQuote(product, dimensions, quantity, color, getSettings());
  if (!quote || quote.totalTTC === 0) return undefined;


  if (wantsQuoteAction(userText, history)) {
    return localResponse(COPY.action[language], language, {
      image: isImageRequested ? product.image_url ?? undefined : undefined,
      devisAction: {
        slug: product.slug,
        w: dimensions.width,
        h: dimensions.height,
        qty: quantity,
      },
    });
  }

  return localResponse(DETAIL_WORDS.test(userText) ? buildDetails(quote, language) : buildSummary(quote, language), language, {
    image: isImageRequested ? getProductImage(product) : undefined,
  });
}

export async function sendMessageToAgent(
  userText: string,
  history: Message[],
  preferredLanguage?: string,
): Promise<AIResponse> {
  const language = detectLanguage(userText, preferredLanguage);

  try {
    const products = getQuoteProducts(await getProducts());
    return (await handleDeterministicQuote(userText, history, language, products)) ?? await callEdgeFunction(userText, history, language);
  } catch (error) {
    console.error('AI agent request failed:', error instanceof Error ? error.message : 'Unexpected error');
    return localResponse(COPY.fallback[language], language);
  }
}

export async function processLocalMessage(
  userText: string,
  history: Message[],
  _onChunk: (chunk: string) => void,
  preferredLanguage?: AgentLanguage,
): Promise<AIResponse> {
  const response = await sendMessageToAgent(userText, history, preferredLanguage);
  return {
    ...response,
    detectedLang: response.language,
    productImage: response.image,
    suggestions: [],
  };
}

export function resetSessionCount(language: AgentLanguage = DEFAULT_LANGUAGE) {
  window.localStorage.setItem('alu_chat_lang', language);
}
