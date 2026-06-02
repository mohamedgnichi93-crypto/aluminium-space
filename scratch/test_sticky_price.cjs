const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('c:/Users/ASUS-PC/Desktop/Alu Space Grifo/aluminium-space/.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const apiKey = env.VITE_SUPABASE_ANON_KEY;

// Mock the client-side decision logic to test handleDeterministicQuote + Edge Function
const localProducts = [
  { id: 'colibri-50', name: 'COLIBRÌ 50', imageUrl: '/images/colibri-50.webp' },
  { id: 'sidney-50', name: 'SIDNEY 50', imageUrl: '/images/sidney-50.webp' },
  { id: 'sidney-50-ac', name: 'SIDNEY 50 AC', imageUrl: '/images/sidney-50-ac.webp' },
  { id: 'elba', name: 'ELBA', imageUrl: '/images/elba-v2.webp' },
  { id: 'plisse31', name: 'PLISSÉ 31 BILATÉRALE', imageUrl: '/images/plisse31.webp' }
];

function normalizeText(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findProductInText(text) {
  const normalized = normalizeText(text);
  return localProducts.find(product => {
    const slug = product.id.replace(/-/g, ' ');
    const name = normalizeText(product.name);
    const aliases = {
      'colibri-50': ['colibri', 'colibri 50'],
      'sidney-50': ['sidney', 'sidney 50'],
      'sidney-50-ac': ['sidney ac', 'sidney 50 ac'],
      elba: ['elba'],
      plisse31: ['plisse', 'plisse 31']
    };
    return normalized.includes(slug) || normalized.includes(name) || aliases[product.id]?.some(alias => normalized.includes(alias));
  });
}

function findProduct(text, history) {
  return findProductInText(text) || history.slice().reverse().map(m => findProductInText(m.content)).find(Boolean);
}

function parseDimensions(text) {
  const match = text.match(/(\d{2,4})\s*(?:x|×|\*)\s*(\d{2,4})/i);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : undefined;
}

function findDimensions(text, history) {
  return parseDimensions(text) || history.slice().reverse().map(m => parseDimensions(m.content)).find(Boolean);
}

function parseQuantity(text, allowBareNumber) {
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

function findQuantity(text, history) {
  const latestAssistant = history.filter(m => m.role === 'assistant').at(-1);
  const current = parseQuantity(text, Boolean(latestAssistant?.awaitingQuantity));
  if (current) return current;
  return history.slice().reverse().map(m => parseQuantity(m.content)).find(Boolean);
}

function isPricingConversation(text, history) {
  const PRICING_WORDS = /\b(prix|tarif|cout|co[uû]t|cost|price|preventivo|devis|quote|somme|total|thaman|thamnou|thmen)\b|سعر|ثمن|عرض سعر/i;
  const latestAssistant = history.filter(m => m.role === 'assistant').at(-1);
  return (
    PRICING_WORDS.test(text) ||
    Boolean(findProductInText(text)) ||
    Boolean(parseDimensions(text)) ||
    Boolean(latestAssistant?.awaitingDimensions) ||
    Boolean(latestAssistant?.awaitingQuantity)
  );
}

function handleDeterministicQuoteLocal(userText, history) {
  const PRICE_INTENT = [
    'prix', 'combien', 'coût', 'tarif', 'devis', 'thaman',
    'qaddech', '9addech', '9adech', 'bech', 'calcul',
    'ka3bet', 'ka3ba', 'pièces', 'unités', 'pieces',
    'سعر', 'كم', 'تمن', 'حساب',
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

  const PRODUCT_KEYWORDS = ['colibri', 'sidney', 'elba', 'plisse', 'plissée', 'moustiquaire'];

  const hasProductInCurrentMsg = PRODUCT_KEYWORDS.some(k => 
    userText.toLowerCase().includes(k.toLowerCase())
  );

  const hasPriceIntent = PRICE_INTENT.some(k =>
    userText.toLowerCase().includes(k.toLowerCase())
  );

  const isPureNumber = /^\s*\d+\s*$/.test(userText.trim());

  if (!hasPriceIntent && !hasProductInCurrentMsg && 
      !(isAwaitingQuantity && isPureNumber)) {
    return undefined; // Let AI handle it
  }

  if (!isPricingConversation(userText, history)) return undefined;

  const product = findProduct(userText, history);
  if (!product) return undefined;

  const dimensions = findDimensions(userText, history);
  if (!dimensions) return undefined;

  const quantity = findQuantity(userText, history);
  if (!quantity || quantity < 1) return undefined;

  // Intercept locally and compute mock price response
  const unitPrice = 357; 
  const totalTtc = unitPrice * quantity;
  return `[LOCAL INTERCEPTED PRICE] ${product.name} - ${dimensions.width} x ${dimensions.height} cm - ${quantity} pièces. Total TTC: ${totalTtc} DT.`;
}

async function callEdgeFunction(userText, history) {
  const messages = [...history.map(({ role, content }) => ({ role, content })), { role: 'user', content: userText }];
  const res = await fetch(`${url}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ messages })
  });
  const data = await res.json();
  return data.content;
}

async function chat(userText, history) {
  console.log(`\nUser: "${userText}"`);
  
  const localRes = handleDeterministicQuoteLocal(userText, history);
  let assistantResponse = '';
  if (localRes !== undefined) {
    console.log(`(Resolved locally)`);
    assistantResponse = localRes;
  } else {
    console.log(`(Forwarded to AI)`);
    assistantResponse = await callEdgeFunction(userText, history);
  }
  
  console.log(`Bot: "${assistantResponse}"`);
  history.push({ role: 'user', content: userText });
  history.push({ role: 'assistant', content: assistantResponse });
  return assistantResponse;
}

async function run() {
  const history = [];

  // Step 1: User says "COLIBRÌ 50, 120x150, 3 pièces"
  await chat('COLIBRÌ 50, 120x150, 3 pièces', history);
  await new Promise(r => setTimeout(r, 2000));

  // Step 2: User says "2" (meaning something else, no price/quote context, not after awaiting qty)
  await chat('2', history);
  await new Promise(r => setTimeout(r, 2000));

  // Step 3: User says "kifech na3mel commande?"
  await chat('kifech na3mel commande?', history);
  await new Promise(r => setTimeout(r, 2000));

  // Step 4: User says "chnia 3andkom?"
  await chat('chnia 3andkom?', history);
}

run();
