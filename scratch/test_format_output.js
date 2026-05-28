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

const supabase = createClient(supabaseUrl, supabaseKey);

// Copy formatPriceTables logic exactly as defined in aiAgentService.ts
function formatPriceTables(product) {
  try {
    const pt = product.price_tables;
    if (!pt) return '';

    let result = '';

    // CASE 1: ELBA (base_per_m2)
    if (pt.base_per_m2) {
      const pricePerM2 = Math.round(pt.base_per_m2 / 1000);
      result += `Prix au m²: ${pricePerM2} DT HT\n`;
      result += `Formule: Largeur (m) × Hauteur (m) × ${pricePerM2} DT\n`;
      result += `Exemple: 1.20m × 1.50m × ${pricePerM2} = ${Math.round(1.2 * 1.5 * pricePerM2)} DT HT\n`;
      return result;
    }

    // CASE 2: PLISSÉ 31 (nested width→heightRange→price)
    // Detect Plissé 31 structure: keys are numeric strings like "125","180"...
    const widthKeys = Object.keys(pt).filter(k => /^\d+$/.test(k));
    if (widthKeys.length > 0) {
      result += `Tableau des prix (DT HT):\n`;
      result += `Largeur max (cm) | Plage hauteur | Prix HT\n`;
      
      widthKeys.forEach(widthKey => {
        const heightRanges = pt[widthKey];
        if (typeof heightRanges === 'object') {
          Object.entries(heightRanges).forEach(([heightRange, price]) => {
            const priceNum = Math.round(price / 1000);
            result += `Largeur ≤ ${widthKey} cm, Hauteur ${heightRange} cm → ${priceNum} DT\n`;
          });
        }
      });
      return result;
    }

    // CASE 3: Sidney-style: width tiers with heights array
    const widthTierKeys = Object.keys(pt).filter(k => k.startsWith('width'));
    if (widthTierKeys.length > 0) {
      widthTierKeys.forEach(tierKey => {
        const maxWidth = tierKey.replace('width', '');
        const tier = pt[tierKey];
        if (tier?.heights && tier?.prices) {
          result += `Largeur ≤ ${maxWidth} cm:\n`;
          tier.heights.forEach((h, i) => {
            const price = Math.round(tier.prices[i] / 1000);
            result += `  Hauteur ${h} cm → ${price} DT\n`;
          });
          result += '\n';
        }
      });
      return result;
    }

    // height170 tier
    if (pt.height170?.widths && pt.height170?.prices) {
      result += `Hauteur ≤ 170 cm:\n`;
      result += `Largeur (cm) | Prix HT (DT)\n`;
      pt.height170.widths.forEach((w, i) => {
        const price = Math.round(pt.height170.prices[i] / 1000);
        result += `${w} cm → ${price} DT\n`;
      });
    }

    // height250 tier
    if (pt.height250?.widths && pt.height250?.prices) {
      result += `\nHauteur 171–250 cm:\n`;
      result += `Largeur (cm) | Prix HT (DT)\n`;
      pt.height250.widths.forEach((w, i) => {
        const price = Math.round(pt.height250.prices[i] / 1000);
        result += `${w} cm → ${price} DT\n`;
      });
    }

    // special rules
    if (pt.rules?.if_height_gt_170_max_width) {
      result += `\nRègle: si hauteur > 170 cm → largeur max = ${pt.rules.if_height_gt_170_max_width} cm\n`;
    }

    return result;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function test() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order');

  for (const p of products) {
    console.log(`\n==================================================`);
    console.log(`SLUG: ${p.slug} (${p.name})`);
    console.log(`==================================================`);
    console.log(formatPriceTables(p));
  }
}

test();
