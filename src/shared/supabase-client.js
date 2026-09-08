import { createClient } from "@supabase/supabase-js";

// Satu project Supabase yang sama dipakai bareng oleh spending & calorie.
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
