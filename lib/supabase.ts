import { createClient } from '@supabase/supabase-js';

// ⚠️  IMPORTANT: Replace these fallback values with your real Supabase credentials.
// The anon key MUST be a JWT string starting with "eyJ..." — get it from:
// Supabase Dashboard → Your Project → Settings → API → "anon public" key
//
// Best practice: set these as environment variables in your .env file:
//   VITE_SUPABASE_URL=https://your-project-id.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//
// ❌ 'sb_publishable_...' is NOT a valid anon key — it will cause all DB/storage calls to fail.
const fallbackUrl = 'https://eygrdlenadhojrkejsmo.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Z3JkbGVuYWRob2pya2Vqc21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzQxNTcsImV4cCI6MjA5MDkxMDE1N30.dTkOqaWQP0PnCKMlav7BlY9a9zJX_9qhq9O90UcFags';

// Safely access environment variables with optional chaining
// This prevents crashes if import.meta.env is undefined
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? fallbackUrl;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
