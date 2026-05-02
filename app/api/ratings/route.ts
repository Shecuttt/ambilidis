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

    const { orderId, rating, complaints } = await request.json();

    if (!orderId || !rating) {
      return NextResponse.json({ error: 'orderId and rating are required' }, { status: 400 });
    }

    // 1. Fetch order to verify buyer_id and get store_id
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, store_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Upsert rating
    const { data: ratingData, error: upsertError } = await supabaseAdmin
      .from('ratings')
      .upsert({
        order_id: orderId,
        store_id: order.store_id,
        buyer_id: user.id,
        rating,
        complaints: Array.isArray(complaints) ? complaints : (complaints ? [complaints] : [])
      }, {
        onConflict: 'order_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Rating upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
    }

    return NextResponse.json({ success: true, rating: ratingData });
  } catch (err: any) {
    console.error("POST Ratings Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
