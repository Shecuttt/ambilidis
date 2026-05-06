import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Logout error:", error);
      return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Logout API Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
