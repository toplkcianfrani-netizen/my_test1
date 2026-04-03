import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.https://efvtxoqypdmccqpcjlnb.supabase.co || '';
const supabaseAnonKey = (import.meta as any).env.sb_publishable_FNfI3_paSf1z5IQqdseLOw_pu28cokc|| '';

// Only initialize if we have the required credentials
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('Supabase credentials missing. App will use default data.');
}
