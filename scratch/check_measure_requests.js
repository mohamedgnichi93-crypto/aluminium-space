import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
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

async function checkSchema() {
  // Fetch from OpenAPI spec to see exact structure
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const spec = await res.json();
    const tableDef = spec.definitions?.measure_requests;
    if (tableDef) {
      console.log('measure_requests definition properties:');
      console.log(JSON.stringify(tableDef.properties, null, 2));
    } else {
      console.log('measure_requests table not found in OpenAPI spec');
    }
  } catch (err) {
    console.error('Error fetching spec:', err);
  }

  // Also query a single row to see what columns exist and what they hold
  try {
    const { data, error } = await supabase.from('measure_requests').select('*').limit(1);
    if (error) {
      console.error('Error querying table:', error);
    } else {
      console.log('Sample row from measure_requests:', JSON.stringify(data[0] || null, null, 2));
    }
  } catch (err) {
    console.error('Query error:', err);
  }
}

checkSchema();
