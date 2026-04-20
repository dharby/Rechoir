import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iuppnzkqkosrzmeauysc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cHBuemtxa29zcnptZWF1eXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTQwNDUsImV4cCI6MjA5MTY3MDA0NX0.zkX9UmW8-ChlPwz8O1uQcQEXeRLG_VAsWeKgvWK2Igk';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;