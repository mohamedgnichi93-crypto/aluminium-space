import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://boitmxnutzsvxlbsmdcw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaXRteG51dHpzdnhsYnNtZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTQ5MzgsImV4cCI6MjA5NDM3MDkzOH0.GoezdHY1c1n4afgQrWao6C5kU2UZHZ9-InAq2VeDAn8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const { data, error } = await supabase
    .from('measure_requests')
    .insert({
      id: crypto.randomUUID(),
      product_id: 'test',
      product_name: 'test',
      client_name: 'test',
      client_phone: '123',
      client_email: 'test@test.com',
      client_address: 'test address',
      notes: 'test notes',
      status: 'pending',
      width: 100,
      height: 200,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.log('Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log('Success:', data)
  }
}

testInsert()
