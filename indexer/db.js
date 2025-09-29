const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

let supabase = null;
let dbEnabled = false;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[indexer] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Running in memory mode.');
} else {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    dbEnabled = true;
  } catch (e) {
    console.warn('[indexer] Failed to init Supabase client, falling back to memory mode:', e?.message || e);
    supabase = null;
    dbEnabled = false;
  }
}

module.exports = { supabase, dbEnabled };
