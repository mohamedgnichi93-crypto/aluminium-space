import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://boitmxnutzsvxlbsmdcw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaXRteG51dHpzdnhsYnNtZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTQ5MzgsImV4cCI6MjA5NDM3MDkzOH0.GoezdHY1c1n4afgQrWao6C5kU2UZHZ9-InAq2VeDAn8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDetailsColumn() {
  // Try to insert a dummy record with 'details' column
  const { error } = await supabase
    .from('measure_requests')
    .insert({
      client_name: 'Checking Column',
      client_phone: '000',
      status: 'pending',
      details: { test: true }
    })
  
  if (error && error.message.includes('column "details" of relation "measure_requests" does not exist')) {
    console.log('COLUMN_NOT_EXISTS');
  } else if (error) {
    console.log('ERROR:', error.message);
  } else {
    console.log('COLUMN_EXISTS');
  }
}

checkDetailsColumn()
