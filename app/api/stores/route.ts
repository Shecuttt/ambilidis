import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
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
    const { storeId, ...updates } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // 1. Verify store ownership
    const { data: store, error: fetchError } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (fetchError || !store || store.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this store' }, { status: 403 });
    }

    // 2. Perform the update using Admin Client
    const { data: updatedStore, error: updateError } = await supabaseAdmin
      .from('stores')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error("Store Update Error:", updateError);
      return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, store: updatedStore });
  } catch (err: any) {
    console.error("PATCH Stores Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
