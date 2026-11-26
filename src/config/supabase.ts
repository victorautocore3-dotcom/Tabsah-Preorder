import { createClient } from '@supabase/supabase-js';

/**
 * Public-safe Supabase project configuration for Pre Order With Tabsah.
 * Uses the publishable key only (never any secret or service_role key).
 */
export const SUPABASE_URL = 'https://nmjymbjypqmiphktdkus.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_umi3TDViAC0K5gdI3Oj0tw_tPnrp2ff';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
