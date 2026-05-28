import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpPriceTables() {
  const { data, error } = await supabase
    .from('products')
    .select('slug, name, type, price_tables, base_price, price_per_m2')
    .order('sort_order');
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const p of data) {
    console.log('\n' + '═'.repeat(70));
    console.log(`PRODUCT: ${p.name} (slug: ${p.slug})`);
    console.log(`Type: ${p.type} | base_price: ${p.base_price} | price_per_m2: ${p.price_per_m2}`);
    console.log('═'.repeat(70));
    
    const pt = p.price_tables;
    if (!pt) {
      console.log('  price_tables: NULL');
      continue;
    }

    const topKeys = Object.keys(pt);
    console.log(`  Top-level keys: [${topKeys.join(', ')}]`);
    
    for (const key of topKeys) {
      const val = pt[key];
      console.log(`\n  --- ${key} ---`);
      
      if (typeof val !== 'object' || val === null) {
        console.log(`    Value: ${JSON.stringify(val)}`);
        continue;
      }
      
      const subKeys = Object.keys(val);
      console.log(`    Sub-keys: [${subKeys.join(', ')}]`);
      
      if (val.widths) {
        console.log(`    widths (${val.widths.length}): [${val.widths.join(', ')}]`);
      }
      if (val.heights) {
        console.log(`    heights (${val.heights.length}): [${val.heights.join(', ')}]`);
      }
      if (val.prices) {
        console.log(`    prices (${val.prices.length}): [${val.prices.join(', ')}]`);
        // Show first & last to determine if millimes or DT
        console.log(`    prices[0]=${val.prices[0]}, prices[last]=${val.prices[val.prices.length-1]}`);
        if (val.prices[0] > 1000) {
          console.log(`    → Likely MILLIMES (÷1000 for DT)`);
        } else {
          console.log(`    → Likely DT directly`);
        }
      }
      
      // Check for nested arrays (plissé structure)
      if (Array.isArray(val)) {
        console.log(`    Array with ${val.length} items:`);
        val.forEach((item, i) => console.log(`      [${i}]: ${JSON.stringify(item)}`));
      }
      
      // Dump any other sub-structures
      for (const sk of subKeys) {
        if (!['widths', 'heights', 'prices'].includes(sk)) {
          console.log(`    ${sk}: ${JSON.stringify(val[sk])}`);
        }
      }
    }
    
    // Also dump raw JSON for full reference
    console.log(`\n  RAW JSON:`);
    console.log('  ' + JSON.stringify(pt, null, 2).split('\n').join('\n  '));
  }
}

dumpPriceTables();
