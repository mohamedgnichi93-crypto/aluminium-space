import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
}).then(res => res.json()).then(spec => {
  const settingsDef = spec.definitions?.business_settings;
  if (settingsDef) {
    console.log('business_settings properties:', Object.keys(settingsDef.properties));
  } else {
    console.log('business_settings table not found in OpenAPI spec');
  }
}).catch(err => console.error(err));
