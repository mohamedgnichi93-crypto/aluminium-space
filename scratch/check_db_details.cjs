const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(url, apiKey);

async function run() {
  try {
    // 1. Get products list
    const { data: products, error: pError } = await supabase.from('products').select('slug, name');
    console.log('--- PRODUCTS ---');
    if (pError) console.error(pError);
    else console.log(products);

    // 2. Get products columns
    // Since we cannot query information_schema directly through PostgREST unless there is a custom function or RPC,
    // we can check if there are columns by doing a SELECT * LIMIT 1 and checking keys, or executing sql rpc if available.
    // Let's do a SELECT * LIMIT 1 on products
    const { data: pSample, error: pSampleError } = await supabase.from('products').select('*').limit(1);
    console.log('--- PRODUCTS COLUMNS (FROM SAMPLE) ---');
    if (pSampleError) console.error(pSampleError);
    else if (pSample.length > 0) console.log(Object.keys(pSample[0]));
    else console.log('No rows in products');

    // 3. Get business_settings columns
    const { data: sSample, error: sSampleError } = await supabase.from('business_settings').select('*').limit(1);
    console.log('--- BUSINESS_SETTINGS COLUMNS (FROM SAMPLE) ---');
    if (sSampleError) console.error(sSampleError);
    else if (sSample.length > 0) console.log(Object.keys(sSample[0]));
    else console.log('No rows in business_settings');

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
