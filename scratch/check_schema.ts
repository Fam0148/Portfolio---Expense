
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rbilbwbkrzbuqxklpcex.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaWxid2JrcnpidXF4a2xwY2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzkyMjgsImV4cCI6MjA5MDYxNTIyOH0.jA2wjlPlJh8mFFtFN6mxdKs2A6Xu_JN54xl_eGX5KzA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  console.log('Fetching columns...')
  const { data, error } = await supabase.from('budgets').select('*').limit(1)
  if (error) {
    console.error('Error fetching data:', error)
  } else {
    console.log('Data sample:', data)
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]))
    } else {
      console.log('Table is empty.')
    }
  }
}

checkSchema()
