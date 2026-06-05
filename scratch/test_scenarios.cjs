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

const localProducts = [
  { id: 'colibri-50', name: 'COLIBRÌ 50', imageUrl: '/images/colibri-50.webp' },
  { id: 'sidney-50', name: 'SIDNEY 50', imageUrl: '/images/sidney-50.webp' },
  { id: 'sidney-50-ac', name: 'SIDNEY 50 AC', imageUrl: '/images/sidney-50-ac.webp' },
  { id: 'elba', name: 'ELBA', imageUrl: '/images/elba-v2.webp' },
  { id: 'plisse31', name: 'PLISSÉ 31 BILATÉRALE', imageUrl: '/images/plisse31.webp' }
];

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

async function callEdgeFunction(userText, history) {
  const messagesToSend = [
    ...history.slice(-12).map(({ role, content }) => ({ role, content })),
    { role: 'user', content: userText }
  ];
  
  const res = await fetch(`${url}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ messages: messagesToSend })
  });
  
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`);
  }
  
  return await res.json();
}

async function simulateClient(userText, history) {
  console.log(`\nUser: "${userText}"`);
  
  const product = findProduct(userText, history);
  const dimensions = findDimensions(userText, history);
  const quantity = findQuantity(userText, history);
  const isPricing = isPricingConversation(userText, history);
  
  const limits = product ? { minW: 40, maxW: 9999, minH: 40, maxH: 9999 } : null;
  const isOutOfBounds = product && dimensions && (
    dimensions.width < limits.minW || dimensions.width > limits.maxW ||
    dimensions.height < limits.minH || dimensions.height > limits.maxH
  );

  if (isPricing && product && dimensions && quantity && !isOutOfBounds) {
    console.log(`[CLIENT-SIDE DETECTED] Local deterministic calculation intercepted!`);
    const totalTtc = "415,200 TND";
    const responseText = `${product.name} - ${dimensions.width} x ${dimensions.height} cm - ${quantity} pcs\nTotal TTC : ${totalTtc}`;
    
    const isImageRequested = /image|photo|taswira|chousni|3ayyarli|show me|picture|voir le produit|wriha|chapha/i.test(userText);
    const productImage = isImageRequested ? product.imageUrl : undefined;
    
    const result = { content: responseText, productImage };
    console.log(`Response:`, result);
    
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: responseText, productImage });
    return result;
  } else {
    console.log(`[CLIENT-SIDE] Forwarding request to AI Edge Function...`);
    const apiRes = await callEdgeFunction(userText, history);
    console.log(`Response:`, apiRes);
    
    const awaitingDimensions = /\[awaiting:dimensions\]/i.test(apiRes.content);
    const awaitingQuantity = /\[awaiting:quantity\]/i.test(apiRes.content);
    
    history.push({ role: 'user', content: userText });
    history.push({ role: 'assistant', content: apiRes.content, awaitingDimensions, awaitingQuantity });
    return apiRes;
  }
}

async function run() {
  const history = [
    { role: 'assistant', content: "Bonjour! Je suis Asmos, votre assistant Aluminium Space. Comment puis-je vous aider ?" }
  ];
  
  console.log(`\n--- TEST 1: "slm" ---`);
  await simulateClient('slm', history);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`\n--- TEST 2: "chnia 3andkom" ---`);
  await simulateClient('chnia 3andkom', history);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`\n--- TEST 3: "3andi chbek sidney" ---`);
  await simulateClient('3andi chbek sidney', history);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`\n--- TEST 4: "120x150" ---`);
  await simulateClient('120x150', history);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`\n--- TEST 5: "2" ---`);
  await simulateClient('2', history);
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`\n--- TEST 6: "taswira mta3 elba" ---`);
  await simulateClient('taswira mta3 elba', history);
}

run();
