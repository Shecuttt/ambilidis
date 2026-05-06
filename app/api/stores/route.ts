import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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
    const { name, slug, description, address, location } = body;

    // Validate required fields
    if (!name?.trim() || !slug?.trim() || !location) {
      return NextResponse.json({ error: 'Name, slug, and location are required' }, { status: 400 });
    }

    // Check if slug already exists
    const { data: existingStore, error: slugCheckError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error("Slug check error:", slugCheckError);
      return NextResponse.json({ error: 'Failed to validate slug' }, { status: 500 });
    }

    if (existingStore) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    // Create store using admin client (bypass RLS for creation)
    const { data: store, error: createError } = await supabaseAdmin
      .from('stores')
      .insert([{
        owner_id: user.id,
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        location: location,
        is_open: false, // New store is closed by default
      }])
      .select()
      .single();

    if (createError) {
      console.error("Store creation error:", createError);
      return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }

    // Update user role to include 'seller' and 'buyer'
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const currentRoles = Array.isArray(profile?.role) ? profile.role : [];
    const rolesToAdd = ['seller', 'buyer'];
    const missingRoles = rolesToAdd.filter(r => !currentRoles.includes(r));

    if (missingRoles.length > 0) {
      const newRoles = [...currentRoles, ...missingRoles];
      await supabaseAdmin
        .from('profiles')
        .update({ 
          role: newRoles,
          agreed_at: null // Force re-agreement when becoming a seller
        })
        .eq('id', user.id);
    }

    return NextResponse.json({ success: true, store });
  } catch (err: any) {
    console.error("POST Stores Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
