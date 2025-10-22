import { createClient } from "@supabase/supabase-js";

export const supabaseZoomcar = createClient(
 import.meta.env.VITE_MAIN_SUPABASE_URL,
 import.meta.env.VITE_MAIN_SUPABASE_KEY
);
