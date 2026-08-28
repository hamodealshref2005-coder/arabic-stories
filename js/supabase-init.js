import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://kkmnncumzhcifagiqiua.supabase.co';
const supabaseKey = 'sb_publishable_VFMfrWj6UhfoI-C5GnLyaA_iTly29Zb';

export const supabase = createClient(supabaseUrl, supabaseKey);
