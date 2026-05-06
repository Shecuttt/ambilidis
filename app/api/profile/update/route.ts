import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, address, agreedAt, resetAgreement = false } = body;

    // Data yang akan diupdate
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (agreedAt !== undefined) updates.agreed_at = agreedAt;

    // Reset agreement if requested
    if (resetAgreement) {
      updates.agreed_at = null;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile Update Error:", error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      reagreementRequired: updates.agreed_at === null 
    });
  } catch (err: any) {
    console.error("PATCH Profile Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
