const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://uwbybesqencvbwgjpzwa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3YnliZXNxZW5jdmJ3Z2pwendhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTg1NDUsImV4cCI6MjA2MTA3NDU0NX0.4i5EmgvTvj1biz_8cWBs-tN_juBq08iLo5oiNxkSDy8';

// Create .env.local file
const envContent = `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created successfully!');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  console.log('\nPlease create a .env.local file manually with the following content:');
  console.log(envContent);
} 