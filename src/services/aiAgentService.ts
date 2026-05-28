// ═══════════════════════════════════════════════════════════════
//  ALU SPACE — AI Agent Service v5 (Full OpenAI + Supabase)
//  ALL responses powered by OpenAI with dynamic Supabase data.
//  Price calculation is handled by OpenAI using price_tables.
// ═══════════════════════════════════════════════════════════════

import { getSettings, ensureSettingsLoaded, type BusinessSettings } from '../store/settingsStore';
import { getProducts, type SupabaseProduct } from '../store/productsStore';
import { getFaq, type FaqEntry } from '../store/faqStore';

export type Lang = 'fr' | 'ar' | 'tn' | 'en' | 'it';

export interface ConvMemory {
  clientName: string | null;
  lastProduct: string | null;
  lastWidth: number | null;
  lastHeight: number | null;
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
  rating?: 'up' | 'down' | null;
  awaitingDimensions?: boolean;
}

export interface AgentAction {
  type:
  | 'navigate_to_page'
  | 'scroll_to_section';
  params?: Record<string, string | number>;
  closeAfter?: boolean;
}

export interface AIResponse {
  text: string;
  action?: AgentAction;
  actionLabel?: string;
  suggestions?: string[];
  productImage?: string;
  detectedLang?: Lang;
  awaitingDimensions?: boolean;
}


// ─── SESSION STATE ───────────────────────────────────────────────
function updateSessionLang(l: Lang) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('alu_chat_lang', l);
  }
}
let sessionCount = 0;

export function resetSessionCount(lang?: Lang) { sessionCount = 0; updateSessionLang(lang || 'fr'); }

const detectLanguage = (text: string): Lang => {
  // Arabic script → ar
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  
  // Use saved language from localStorage
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('alu_chat_lang') as Lang;
    if (saved && ['fr', 'ar', 'en', 'it'].includes(saved)) return saved;
  }
  
  return 'fr';
};

function parseLangFromResponse(text: string): Lang | null {
  const match = text.match(/^\[lang:(fr|ar|en|it)\]/);
  return match ? (match[1] as Lang) : null;
}

function stripLangTag(text: string): string {
  return text.replace(/^\[lang:(fr|ar|en|it)\]\n?/, '').trim();
}

// ─── PARSE PRODUCT IMAGE FROM OPENAI RESPONSE ───────────────────
function parseImageFromResponse(text: string): string | null {
  const match = text.match(/\[image:(colibri-50|sidney-50|sidney-50-ac|elba|plisse31)\]/);
  return match ? match[1] : null;
}

function stripImageTag(text: string): string {
  return text.replace(/\n?\[image:(colibri-50|sidney-50|sidney-50-ac|elba|plisse31)\]/g, '').trim();
}

// ─── PARSE AWAITING DIMENSIONS FROM OPENAI RESPONSE ─────────────
function parseAwaitingFromResponse(text: string): boolean {
  return /\[await:dimensions\]/.test(text);
}

function stripAwaitingTag(text: string): string {
  return text.replace(/\n?\[await:dimensions\]/g, '').trim();
}


// ─── NEEDS PRICING DATA ─────────────────────────────────────────
function needsPricingData(userText: string, history: Message[]): boolean {
  const t = userText.toLowerCase();

  // 1. Current message has dimensions
  if (/\d{2,4}\s*[x×X*/]\s*\d{2,4}/.test(userText)) return true;

  // 2. Current message has price keywords
  if (/(prix|tarif|coût|combien|how much|سعر|ثمن|كم|devis|9adech|chhal|cost|price)/.test(t)) return true;

  // 3. Current message mentions a product name
  if (/(colibri|sidney|elba|pliss|moustiquaire|mosquito|zanzariera)/.test(t)) return true;

  // 4. LOOK BACK through last 6 messages for active pricing session
  const recentHistory = history.slice(-6);

  for (const msg of recentHistory) {
    const content = msg.content.toLowerCase();

    // A user message in recent history had dimensions → still in session
    if (msg.role === 'user' && /\d{2,4}\s*[x×X*/]\s*\d{2,4}/.test(msg.content)) {
      return true;
    }

    // Any recent message mentioned a product → pricing context active
    if (/(colibri|sidney|elba|pliss)/.test(content)) return true;

    // Assistant asked about color/dimensions/quantity → active quote flow
    if (
      msg.role === 'assistant' &&
      /(couleur|color|colore|dimension|largeur|hauteur|quantit|قياس|أبعاد|لون)/.test(content)
    ) {
      return true;
    }

    // Assistant gave a price calculation → stay in pricing mode
    if (
      msg.role === 'assistant' &&
      /(prix ht|net ht|total ttc|fodec|remise|tva)/.test(content)
    ) {
      return true;
    }
  }

  return false;
}

// ─── FORMAT PRICE TABLES FOR OPENAI ─────────────────────────────
function formatPriceTables(product: SupabaseProduct): string {
  try {
    const pt = product.price_tables as any;
    if (!pt) return '';

    let result = '';

    // height170 tier
    if (pt.height170?.widths && pt.height170?.prices) {
      result += `Hauteur ≤ 170 cm:\n`;
      result += `Largeur (cm) | Prix HT (DT)\n`;
      pt.height170.widths.forEach((w: number, i: number) => {
        const price = Math.round(pt.height170.prices[i] / 1000);
        result += `${w} cm → ${price} DT\n`;
      });
    }

    // height250 tier
    if (pt.height250?.widths && pt.height250?.prices) {
      result += `\nHauteur 171–250 cm:\n`;
      result += `Largeur (cm) | Prix HT (DT)\n`;
      pt.height250.widths.forEach((w: number, i: number) => {
        const price = Math.round(pt.height250.prices[i] / 1000);
        result += `${w} cm → ${price} DT\n`;
      });
    }

    // width160 tier (Sidney 50)
    if (pt.width160?.heights && pt.width160?.prices) {
      result += `Largeur ≤ 160 cm:\n`;
      result += `Hauteur (cm) | Prix HT (DT)\n`;
      pt.width160.heights.forEach((h: number, i: number) => {
        const price = Math.round(pt.width160.prices[i] / 1000);
        result += `${h} cm → ${price} DT\n`;
      });
    }

    // width200 tier (Sidney 50)
    if (pt.width200?.heights && pt.width200?.prices) {
      result += `\nLargeur 161–200 cm:\n`;
      result += `Hauteur (cm) | Prix HT (DT)\n`;
      pt.width200.heights.forEach((h: number, i: number) => {
        const price = Math.round(pt.width200.prices[i] / 1000);
        result += `${h} cm → ${price} DT\n`;
      });
    }

    // width320 tier (Sidney 50 AC)
    if (pt.width320?.heights && pt.width320?.prices) {
      result += `Largeur ≤ 320 cm:\n`;
      result += `Hauteur (cm) | Prix HT (DT)\n`;
      pt.width320.heights.forEach((h: number, i: number) => {
        const price = Math.round(pt.width320.prices[i] / 1000);
        result += `${h} cm → ${price} DT\n`;
      });
    }

    // width400 tier (Sidney 50 AC)
    if (pt.width400?.heights && pt.width400?.prices) {
      result += `\nLargeur 321–400 cm:\n`;
      result += `Hauteur (cm) | Prix HT (DT)\n`;
      pt.width400.heights.forEach((h: number, i: number) => {
        const price = Math.round(pt.width400.prices[i] / 1000);
        result += `${h} cm → ${price} DT\n`;
      });
    }

    // special rules
    if (pt.rules?.if_height_gt_170_max_width) {
      result += `\nRègle: si hauteur > 170 cm → largeur max = ${pt.rules.if_height_gt_170_max_width} cm\n`;
    }

    return result;
  } catch {
    return '';
  }
}

// ─── BUILD DYNAMIC SYSTEM PROMPT ─────────────────────────────────
function buildDynamicSystemPrompt(
  products: SupabaseProduct[],
  settings: BusinessSettings,
  faq: FaqEntry[],
  lang: Lang,
  includePricing: boolean = false,
): string {

  // Build product sections — include full price tables only when needed
  const productsSection = products.map(p => {
    const desc = lang === 'ar' ? p.description_ar :
      lang === 'tn' ? p.description_tn :
        lang === 'en' ? p.description_en :
          lang === 'it' ? p.description_it : p.description_fr;

    const pricingBlock = includePricing
      ? `\nTables de prix HT (Blanc):\n${formatPriceTables(p)}\nNoir: +10% | Couleurs: +15%`
      : `\nPrix à partir de ${p.base_price} DT (demander dimensions pour prix exact)`;

    return `━━━ PRODUIT ${p.sort_order}: ${p.name} (slug: ${p.slug}) ━━━
Type: ${p.type} | Prix de base: ${p.base_price} DT ${p.price_per_m2 ? '/m²' : ''}
Dimensions: ${p.min_width}–${p.max_width}cm (L) × ${p.min_height}–${p.max_height}cm (H)
Description: ${desc || p.description_fr || ''}${pricingBlock}`;
  }).join('\n\n');

  // Build FAQ section
  const faqSection = faq.map(f => {
    const q = lang === 'ar' ? f.question_ar :
      lang === 'tn' ? f.question_tn :
        lang === 'en' ? f.question_en :
          lang === 'it' ? f.question_it : f.question_fr;
    const a = lang === 'ar' ? f.answer_ar :
      lang === 'tn' ? f.answer_tn :
        lang === 'en' ? f.answer_en :
          lang === 'it' ? f.answer_it : f.answer_fr;
    return `Q: ${q || f.question_fr}\nR: ${a || f.answer_fr}`;
  }).join('\n\n');

  const remise = settings.remisePercent ?? 0;
  const tva = settings.tvaPercent ?? 19;
  const fodec = settings.fodecPercent ?? 1;
  const timbre = settings.timbreFiscal ?? 1;

  return `━━━ LANGUAGE DETECTION — MANDATORY ━━━
At the VERY START of EVERY response, write the detected 
language code on its own line in this exact format:
[lang:fr] or [lang:ar] or [lang:en] or [lang:it]

Detection rules:
- Arabic script (ا ب ت...) → [lang:ar]
- French or Maghrebi Latin text → [lang:fr]
- English text → [lang:en]
- Italian text → [lang:it]

EXAMPLES:
User: 'bonjour' → start with [lang:fr]
User: 'مرحبا' → start with [lang:ar]  
User: 'hello' → start with [lang:en]
User: 'ciao' → start with [lang:it]
User: 'slm' or 'ahla' or 'labes' → start with [lang:fr]

CRITICAL: The [lang:xx] tag must be the FIRST thing in 
your response, on its own line. Never skip it.

Tu es Asmos, assistant commercial expert d'Aluminium Space, spécialiste menuiserie aluminium et partenaire Grifo Flex (Italie) à Mghira, Tunis, Tunisie.
TON OBJECTIF: Convertir chaque visiteur en client.

━━━ IDENTITÉ ━━━
Prénom: Asmos | Ton: Chaleureux, expert, direct
━━━ RÈGLE LANGUE ━━━
Détecte automatiquement la langue du dernier message de 
l'utilisateur et réponds DANS LA MÊME LANGUE.
- Message en darija tunisienne → réponds en darija tunisienne
- Message en français → réponds en français  
- Message en arabe classique → réponds en arabe classique
- Message en anglais → réponds en anglais
- Message en italien → réponds en italien
NOMS DE PRODUITS: toujours en latin (Colibrì 50, Sidney 50, 
Sidney 50 AC, Elba, Plissé 31, Grifo Flex, Aluminium Space).
Tout le reste dans la langue détectée.

Si l'utilisateur fait du small talk (salutation, humeur,
expressions comme 'cv', 'glegt', 'labes', 'bhi', 'top'):
→ Réponds brièvement et chaleureusement
→ Puis redirige naturellement vers les produits
→ NE DIS JAMAIS 'Je suis spécialisé uniquement'

Exemple 'glegt': 
'Haha glegt 3leh! Kifech naaounek fi moustikarat? 😄'

Exemple 'chnya el ajwe2':
'Skhona barsha! W moustiquaires mte3na yprotégiwek 
men el bou3oud s7a7. Chkoun el produit eli t7eb? 😊'

Seulement si question VRAIMENT hors-sujet 
(politique, sport, cuisine, médecine...) 
→ refuser poliment UNE seule fois puis proposer de l'aide.


━━━ TOUS LES PRODUITS AVEC TABLES DE PRIX ━━━

${productsSection}

━━━ PARAMÈTRES COMMERCIAUX ACTUELS ━━━
Remise: ${remise}%
TVA: ${tva}%
FODEC: ${fodec}%
Timbre fiscal: ${timbre} DT

━━━ CALCUL PRIX — RÈGLES OBLIGATOIRES ━━━
Pour calculer le prix exact:
1. Identifier le tier de hauteur ou largeur:
   - COLIBRÌ 50: Hauteur ≤ 170 cm → table 'Hauteur ≤ 170 cm'
                 Hauteur 171–250 cm → table 'Hauteur 171–250 cm'
   - SIDNEY 50:  Largeur ≤ 160 cm → table 'Largeur ≤ 160 cm'
                 Largeur 161–200 cm → table 'Largeur 161–200 cm'
   - SIDNEY 50 AC: Largeur ≤ 320 cm → table 'Largeur ≤ 320 cm'
                   Largeur 321–400 cm → table 'Largeur 321–400 cm'
   - ELBA: prix = (L/100) × (H/100) × prix_base_m2
   - PLISSÉ 31: trouver largeur et plage de hauteur dans la table
2. Arrondir la dimension au multiple de 10 SUPÉRIEUR
   (ex: 125 cm → 130 cm, 120 cm reste 120 cm)
3. Lire le prix HT correspondant DIRECTEMENT dans la table
   (les prix sont déjà en DT, pas de conversion nécessaire)
4. Appliquer couleur: Blanc = prix de base,
   Noir = ×1.10, Couleurs = ×1.15
5. Formule TTC:
   • Prix HT = prix lu dans la table (× quantité si plusieurs)
   • Remise (${remise}%) = Prix HT × ${remise}/100
   • Net HT = Prix HT - Remise
   • FODEC (${fodec}%) = Net HT × ${fodec}/100
   • Base TVA = Net HT + FODEC
   • TVA (${tva}%) = Base TVA × ${tva}/100
   • Timbre fiscal = ${timbre},000 DT
   • Total TTC = Base TVA + TVA + Timbre
6. TOUJOURS afficher le détail COMPLET en format:
   Pour un **NOM_PRODUIT** en LxH cm :
   ─────────────────────────────
   • Prix HT :        X,XXX DT
   • Remise (${remise}%) :    -X,XXX DT
   • Net HT :         X,XXX DT
   • FODEC (${fodec}%) :      X,XXX DT
   • Base TVA :       X,XXX DT
   • TVA (${tva}%) :       X,XXX DT
   • Timbre fiscal :  ${timbre},000 DT
   ─────────────────────────────
   • Total TTC :      X,XXX DT
7. Terminer par "Voulez-vous passer au devis ?"

IMPORTANT:
- Ne JAMAIS utiliser le 'prix de base' quand les dimensions sont connues
  → toujours lire la table de prix
- Arrondir la dimension au multiple de 10 supérieur pour trouver le prix
- Si les dimensions dépassent les limites → informer l'utilisateur des limites max
- Sans dimensions → DEMANDER les dimensions obligatoirement
- Les prix sont en format X,XXX DT (3 décimales, virgule)

━━━ CONTACT & INFOS ━━━
Tél: ${settings.phone1} / ${settings.phone2}
WhatsApp: ${settings.whatsapp} → https://wa.me/${(settings.whatsapp || '').replace(/\D/g, '')}
Email: ${settings.email}
Adresse: ${settings.address}, ${settings.city}
Horaires: Lun–Ven ${settings.hoursWeekday} | Sam ${settings.hoursSaturday} | Dim ${settings.sundayHours}

━━━ FAQ ━━━
${faqSection}

━━━ CONNAISSANCE APPROFONDIE ━━━

ALUMINIUM SPACE:
- PME tunisienne, fondée à Mghira, Ben Arous, Tunis
- Revendeur exclusif et installateur agréé Grifo Flex® en Tunisie
- Équipe de techniciens spécialisés en installation à domicile
- Service: Tunis et Grand Tunis (Manouba, Ben Arous, Ariana, etc.)
- Showroom: 125 lot Laaroussi, Mghira — visite sur RDV et sans RDV

GRIFO FLEX®:
- Marque italienne premium fondée en 1974
- Leader européen des moustiquaires sur mesure
- Certifications: ISO 9001, produits testés CE
- Fabrication: Italie (Vérone)
- Distribution: 30+ pays en Europe et Méditerranée
- Toutes les moustiquaires sont 100% sur mesure

MATÉRIAUX ET QUALITÉ:
- Structure: profilés aluminium extrudé anodisé
- Couleurs: Blanc RAL 9010, Noir mat RAL 9005
- Maille: fibre de verre tissée, recouverte PVC
- Maille noire de série (meilleure visibilité extérieure)
- Résistance UV, intempéries, corrosion marine
- Joints: doubles joints-brosses pour étanchéité parfaite
- Mécanisme: ressort à rappel automatique (silencieux)

INSTALLATION:
- Pose par vissage mural (cheville + vis inox fournis)
- Temps d'installation: 30-60 min par fenêtre/porte
- Aucune modification du cadre existant
- Compatible: PVC, aluminium, bois, béton
- Notre équipe se déplace à domicile (inclus dans le prix)
- Garantie installation: 1 an main d'œuvre + 3 ans produit

CLIENTÈLE:
- Particuliers (appartements, villas, maisons)
- Promoteurs immobiliers (chantiers en gros)
- Hôtels et résidences touristiques
- Bureaux et locaux commerciaux

AVANTAGES MOUSTIQUAIRES ALUMINIUM VS PLASTIQUE:
- Durée de vie: 15-20 ans vs 3-5 ans plastique
- Esthétique: profilés fins, design discret
- Sur mesure: s'adapte à toute ouverture
- Garantie: 3 ans vs souvent aucune garantie plastique
- SAV: techniciens disponibles après installation

SAISON ET CONSEILS:
- Haute saison: mars à octobre (moustiques actifs)
- Recommandation: installer avant l'été (délai 3-7j)
- Entretien annuel: nettoyage maille + lubrification coulisses
- Pièces de rechange: disponibles (maille, ressorts, joints)

━━━ NAVIGATION ━━━
Tu peux guider l'utilisateur vers les pages du site :
- Voir les produits → page /produits
- Devis → page /produits
- Contact → page /contact
- À propos → page /about

━━━ STRATÉGIE DE CONVERSION ━━━
- Hésite → "La Colibrì est notre bestseller. Vos dimensions ?"
- Veut devis → "Cliquez sur 'Faire un Devis' pour un prix en 2 minutes !"
- Veut appeler → "WhatsApp : ${settings.whatsapp}, on répond rapidement 😊"
- "Je réfléchis" → "L'été arrive vite et l'installation prend 3–7 jours. On calcule le prix maintenant ?"
- Toujours terminer par une question ou un appel à l'action.

━━━ FORMAT ━━━
- Max 3 phrases sauf pour les tableaux de prix
- Jamais de listes à puces dans la réponse (sauf prix)
- Toujours terminer par une question ou CTA

━━━ PRODUCT IMAGE TAG ━━━
When your response is specifically about ONE product
(explaining features, giving price, comparing details),
add this tag on a NEW LINE at the very END of your response:
[image:SLUG]

Where SLUG is one of:
- colibri-50
- sidney-50
- sidney-50-ac
- elba
- plisse31

ONLY add [image:SLUG] when:
✅ User asked specifically about that product
✅ You gave a price calculation for that product
✅ User asked to see or describe that product

NEVER add [image:SLUG] when:
❌ Greeting or small talk
❌ General overview of all products
❌ FAQ questions (payment, guarantee, hours)
❌ Company info questions

━━━ AWAITING DIMENSIONS TAG ━━━
When you are asking the user to provide dimensions 
(width × height in cm) to calculate a price,
add this tag at the END of your response on a new line:
[await:dimensions]

ONLY add [await:dimensions] when:
✅ You explicitly asked the user to send dimensions
✅ Your message ends with a question about measurements

NEVER add it for other questions.

RAPPEL FINAL: Réponds dans la même langue que le dernier message de l'utilisateur. Zéro mélange de langues autorisé.`;
}

// ─── CALL OPENAI VIA EDGE FUNCTION ───────────────────────────────
async function callOpenAI(
  userText: string,
  history: Message[],
  systemPrompt: string,
  lang: Lang,
  onChunk: (chunk: string) => void,
  base64Image?: string | null,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000); // 30 seconds

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
          { type: 'text', text: `${userText}\nAnalyze this image. If it shows a window or door opening, suggest the most appropriate Grifo Flex mosquito screen model and explain why.` },
          { type: 'image_url', image_url: { url: base64Image } }
        ] : userText
      },
    ];

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ messages, systemPrompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI call failed: ${response.status}`);
    }

    const data = await response.json();

    if (data?.error) {
      const errorMessages: Record<string, string> = {
        fr: "Désolé, une erreur s'est produite. Réessayez.",
        ar: "عذراً، حدث خطأ. يرجى المحاولة مجدداً.",
        en: "Sorry, an error occurred. Please try again.",
        it: "Spiacente, si è verificato un errore. Riprova.",
      };
      const msg = errorMessages[lang] || errorMessages['fr'];
      onChunk(msg);
      return msg;
    }

    if (data.content) {
      onChunk(data.content);
    }

    return data.content || 'Désolé, je n\'ai pas pu répondre. Essayez de reformuler.';
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error?.name === 'AbortError') {
      const timeoutMessages: Record<string, string> = {
        fr: "La réponse prend trop de temps. Veuillez réessayer.",
        ar: "انتهت مهلة الانتظار. يرجى المحاولة مجدداً.",
        en: "Request timed out. Please try again.",
        it: "Timeout della richiesta. Riprova.",
      };
      const msg = timeoutMessages[lang] || timeoutMessages['fr'];
      onChunk(msg);
      return msg;
    }

    console.error('AI Error:', error);
    return {
      fr: 'Désolé, une erreur est survenue. Réessayez ou contactez-nous au (+216) 53 186 611.',
      tn: 'Msamha, sar mochkla. 3awed jreb walla atslna 3al (+216) 53 186 611.',
      ar: 'عذراً، حدث خطأ. أعد المحاولة أو اتصل بنا على (+216) 53 186 611.',
      en: 'Sorry, an error occurred. Please try again or call us at (+216) 53 186 611.',
      it: 'Scusa, si è verificato un errore. Riprova o chiamaci al (+216) 53 186 611.',
    }[lang] || 'Désolé, une erreur est survenue.';
  }
}

// ─── MAIN PROCESS FUNCTION (FIX 5: ALL via OpenAI) ───────────────
export async function processLocalMessage(
  userText: string,
  history: Message[],
  onChunk: (chunk: string) => void,
  preferredLang?: Lang,
  base64Image?: string | null,
): Promise<AIResponse> {
  // Ensure business settings are loaded from Supabase before anything
  await ensureSettingsLoaded();

  // Seed session language from site language on first message
  if (preferredLang && sessionCount === 0) updateSessionLang(preferredLang);
  sessionCount++;

  const lang = detectLanguage(userText) || preferredLang || 'fr';

  // Fetch context from Supabase (all cached with 5-min TTL)
  const [products, faq] = await Promise.all([
    getProducts(),
    getFaq(),
  ]);
  const settings = getSettings();

  // Build dynamic system prompt — only include full price tables when needed
  const includePricing = needsPricingData(userText, history);
  const systemPrompt = buildDynamicSystemPrompt(products, settings, faq, lang, includePricing);

  // Call OpenAI — it handles EVERYTHING (text, prices, FAQ, etc.)
  const aiText = await callOpenAI(
    userText, history, systemPrompt, lang, onChunk, base64Image
  );


  // ── Post-process: parse OpenAI response tags ──────────

  // Parse product image from OpenAI response
  const imageSlug = parseImageFromResponse(aiText);
  let productImage: string | undefined;

  if (imageSlug) {
    const matchedProduct = products.find(p => p.slug === imageSlug);
    productImage = matchedProduct?.image_url || undefined;
  }

  // Parse awaiting dimensions from OpenAI response
  const isAwaitingDimensions = parseAwaitingFromResponse(aiText);

  // Parse language from OpenAI response
  const detectedLang = parseLangFromResponse(aiText) || lang;

  // Save detected language to localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('alu_chat_lang', detectedLang);
  }

  // Strip all tags from displayed text
  const cleanText = stripAwaitingTag(stripImageTag(stripLangTag(aiText)));

  return {
    text: cleanText,
    detectedLang,
    suggestions: [],
    productImage,
    awaitingDimensions: isAwaitingDimensions,
  };
}
