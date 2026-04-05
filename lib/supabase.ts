import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://ashgerssdvbzgaewucel.supabase.co';
const fallbackKey = 'sb_publishable_OMLw9mnX84z4iywFpvdNHQ__9Z7WUO7';

// Safely access environment variables with optional chaining
// This prevents crashes if import.meta.env is undefined
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? fallbackUrl;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
