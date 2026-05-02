import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookieOptions: {
        maxAge: 172800, // 48 jam dalam detik
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }
    }
  );
