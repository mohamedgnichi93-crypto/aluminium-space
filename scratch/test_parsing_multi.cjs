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

// Import or copy the logic to verify local calculations
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

function parseDimensions(text) {
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

function findProductInText(text) {
  const PRODUCT_ALIASES = {
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
  
  function normalizeProductName(t) {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
  
  const normalized = normalizeProductName(text);
  for (const [alias, slug] of Object.entries(PRODUCT_ALIASES)) {
    if (normalized.includes(normalizeProductName(alias))) {
      const found = localProducts.find(p => p.id === slug);
      if (found) return found;
    }
  }
  return undefined;
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

  const PRODUCT_KEYWORDS = ['colibri', 'kolibri', 'sidney', 'elba', 'plisse', 'plissée', 'moustiquaire'];

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

  const product = findProductInText(userText);
  if (!product) return undefined;

  const dimensions = parseDimensions(userText);
  if (!dimensions) return undefined;

  // Since it's standard direct prompt, we allow bare number from userText
  // Wait, let's extract quantity
  // Let's do simple search for number in text that isn't width or height
  let cleanText = userText;
  cleanText = cleanText.replace(new RegExp(`\\b${dimensions.width}\\b`, 'g'), '');
  cleanText = cleanText.replace(new RegExp(`\\b${dimensions.height}\\b`, 'g'), '');
  
  if (product.id === 'colibri-50') {
    cleanText = cleanText.replace(/\b50\b/g, '');
  }
  if (product.id === 'plisse31') {
    cleanText = cleanText.replace(/\b31\b/g, '');
  }

  const numbers = cleanText.match(/\b\d{1,3}\b/g);
  let qty = undefined;
  if (numbers && numbers.length > 0) {
    qty = parseInt(numbers[0]);
  }

  if (!qty) return undefined;

  return `[LOCAL INTERCEPTED PRICE] ${product.name} - ${dimensions.width} x ${dimensions.height} cm - ${qty} pièces.`;
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
  // Test 1: "kolibri 50 120*150 3"
  console.log('\n--- TEST 1: "kolibri 50 120*150 3" ---');
  await chat('kolibri 50 120*150 3', []);
  await new Promise(r => setTimeout(r, 2000));

  // Test 2: "plisse 31 80/210 1"
  console.log('\n--- TEST 2: "plisse 31 80/210 1" ---');
  await chat('plisse 31 80/210 1', []);
  await new Promise(r => setTimeout(r, 2000));

  // Test 3: "largeur 90 hauteur 130 elba 4"
  console.log('\n--- TEST 3: "largeur 90 hauteur 130 elba 4" ---');
  await chat('largeur 90 hauteur 130 elba 4', []);
  await new Promise(r => setTimeout(r, 2000));

  // Test 4: Multi-question
  console.log('\n--- TEST 4: Multi-question ---');
  await chat('chnia 3andkom? w chnia thaman colibri 120x150 3? w kifech na3mel commande?', []);
  await new Promise(r => setTimeout(r, 2000));

  // Test 5: Multi-question without price (AI answers both)
  console.log('\n--- TEST 5: Multi-question without price ---');
  await chat('chnia 3andkom? w kifech na3mel commande?', []);
}

run();
