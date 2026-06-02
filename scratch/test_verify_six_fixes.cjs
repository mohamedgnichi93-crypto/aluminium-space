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

async function testMessage(userText, history = []) {
  console.log(`\nUser: "${userText}"`);
  try {
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
    
    console.log(`Status Code: ${res.status}`);
    const data = await res.json();
    console.log(`Response: "${data.content}"`);
    return data.content;
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  // Test 1: chnia lazem na3ti?
  console.log('--- TEST 1: chnia lazem na3ti? ---');
  await testMessage('chnia lazem na3ti?');
  await new Promise(r => setTimeout(r, 2000));

  // Test 2: 120x150, 2
  console.log('\n--- TEST 2: 120x150, 2 ---');
  await testMessage('120x150, 2');
  await new Promise(r => setTimeout(r, 2000));

  // Test 3: tnamlou 3al 9yess?
  console.log('\n--- TEST 3: tnamlou 3al 9yess? ---');
  await testMessage('tnamlou 3al 9yess?');
  await new Promise(r => setTimeout(r, 2000));

  // Test 4: remise kifech?
  console.log('\n--- TEST 4: remise kifech? ---');
  await testMessage('remise kifech?');
  await new Promise(r => setTimeout(r, 2000));

  // Test 5: kifech na3mel commande?
  console.log('\n--- TEST 5: kifech na3mel commande? ---');
  await testMessage('kifech na3mel commande?');
  await new Promise(r => setTimeout(r, 2000));

  // Test 6: 120x150, 2, Elba (Full Calculation)
  console.log('\n--- TEST 6: 120x150, 2, Elba ---');
  await testMessage('120x150, 2, Elba');
  await new Promise(r => setTimeout(r, 2000));

  // Test 7: 120x150, 2 pièces, Elba
  console.log('\n--- TEST 7: 120x150, 2 pièces, Elba ---');
  await testMessage('120x150, 2 pièces, Elba');
}

run();

