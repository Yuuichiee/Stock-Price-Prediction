import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || 'https://yusvcrhejsbslifscdaw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mMvFvOvTzpalp4zbGg0Ecg_qaF3H6lj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
