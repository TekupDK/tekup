import { createClient } from '@supabase/supabase-js';
import { loadConfig } from '@tekupvault/vault-core';

const config = loadConfig();

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY
);
