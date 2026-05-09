import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const productId = params.id;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Fetch product to get store_id
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('store_id')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .eq('id', product.store_id)
      .single();

    if (storeError || !store || store.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update(body)
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      console.error("Update product error:", updateError);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    console.error("PATCH Products Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const productId = params.id;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch product to get store_id and photo_url
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('store_id, photo_url')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .eq('id', product.store_id)
      .single();

    if (storeError || !store || store.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete photo if exists
    if (product.photo_url) {
      try {
        const urlParts = product.photo_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${product.store_id}/${fileName}`;
        
        await supabaseAdmin.storage
          .from('products')
          .remove([filePath]);
      } catch (err) {
        console.error("Failed to delete product photo:", err);
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      if (deleteError.code === '23503') {
        return NextResponse.json({ 
          error: 'Produk tidak bisa dihapus karena sudah pernah dipesan. Silakan nonaktifkan produk (ubah stok ke "Habis") agar tidak muncul di toko.' 
        }, { status: 400 });
      }
      console.error("Delete product error:", deleteError);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Products Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
