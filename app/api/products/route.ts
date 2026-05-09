import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      store_id, 
      name, 
      price, 
      unit, 
      description,
      is_available,
      photo_url
    } = body;

    if (!store_id || !name || !price || !unit) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .single();

    if (storeError || !store || store.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: product, error: insertError } = await supabaseAdmin
      .from("products")
      .insert({
        store_id,
        name,
        price,
        unit,
        description,
        is_available: is_available ?? true,
        photo_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create product error:", insertError);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error("POST Products Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
