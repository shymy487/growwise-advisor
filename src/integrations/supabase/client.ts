
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ndkdfsfezzgwmgjsfgxk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ka2Rmc2Zlenpnd21nanNmZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNzkyMjMsImV4cCI6MjA1Nzg1NTIyM30._DXQNIVTXLTY_k8tTBW3sMCW_OKjilDCdOFvbtDUSDc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
