import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
);

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status, paymentStatus, rejectionReason } = await request.json();

    if (!orderId || (!status && !paymentStatus)) {
      return NextResponse.json({ error: 'orderId and either status or paymentStatus are required' }, { status: 400 });
    }

    // 1. Fetch the order to check permissions
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, stores(owner_id)')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Security Check: Only Seller (store owner) or Buyer can update
    const isOwner = order.stores?.owner_id === user.id;
    const isBuyer = order.buyer_id === user.id;

    if (!isOwner && !isBuyer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Logic Check: What can each role update?
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (status) {
      // Buyer can only set to 'completed' or 'canceled'
      if (isBuyer && !isOwner && !['completed', 'canceled'].includes(status)) {
        return NextResponse.json({ error: 'Buyer can only complete or cancel orders' }, { status: 403 });
      }
      updates.status = status;

      // Auto-set payment_status to paid when completed
      if (status === 'completed') {
        updates.payment_status = 'paid';
      }
    }

    if (paymentStatus && !updates.payment_status) {
      // Only Seller can manually update payment status (unless auto-set above)
      if (!isOwner) {
        return NextResponse.json({ error: 'Only sellers can update payment status manually' }, { status: 403 });
      }
      updates.payment_status = paymentStatus;
    }

    if (rejectionReason) {
      if (!isOwner) {
        return NextResponse.json({ error: 'Only sellers can provide rejection reason' }, { status: 403 });
      }
      updates.rejection_reason = rejectionReason;
    }

    // 4. Perform Update using Admin client to ensure it bypasses RLS hurdles 
    // but we've already done our manual security checks above.
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*, profiles!orders_buyer_id_fkey(phone, full_name), stores(owner_id)')
      .single();

    if (updateError) {
      console.error('Update order error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // 5. Trigger WA Notification via Fonnte ONLY if status changed
    if (status && updatedOrder) {
      const shortOrderId = orderId.split('-')[0].toUpperCase();
      let message = '';
      let targetPhone = '';

      if (status === 'canceled' && updatedOrder.stores?.owner_id) {
        // Canceled by buyer -> Notify Seller
        const { data: sellerProfile } = await supabaseAdmin
          .from('profiles')
          .select('phone')
          .eq('id', updatedOrder.stores.owner_id)
          .single();
        
        if (sellerProfile?.phone) {
          targetPhone = sellerProfile.phone;
          message = `Halo Seller! Pesanan dengan ID ${shortOrderId} telah DIBATALKAN oleh pembeli.`;
        }
      } else if (updatedOrder.profiles?.phone) {
        // Notify Buyer
        targetPhone = updatedOrder.profiles.phone;
        const buyerName = updatedOrder.profiles.full_name || 'Pembeli';

        if (status === 'accepted') {
          message = `Halo ${buyerName}, pesanan Anda dengan ID ${shortOrderId} telah DITERIMA oleh toko dan sedang disiapkan.`;
        } else if (status === 'in_delivery') {
          message = `Halo ${buyerName}, pesanan Anda dengan ID ${shortOrderId} sedang DALAM PENGIRIMAN oleh kurir.`;
        } else if (status === 'rejected') {
          const reasonNote = rejectionReason ? ` Alasan: ${rejectionReason}.` : '';
          message = `Halo ${buyerName}, mohon maaf, pesanan Anda dengan ID ${shortOrderId} telah DITOLAK oleh toko.${reasonNote}`;
        } else if (status === 'expired') {
          message = `Halo ${buyerName}, mohon maaf, pesanan Anda dengan ID ${shortOrderId} dibatalkan otomatis karena toko sedang sibuk / tidak merespon.`;
        } else if (status === 'completed') {
          message = `Halo ${buyerName}, pesanan Anda dengan ID ${shortOrderId} telah SELESAI. Terima kasih telah berbelanja di Ambilidis!`;
        }
      }

      if (message && targetPhone) {
        const fonnteToken = process.env.FONNTE_TOKEN || process.env.NEXT_PUBLIC_FONNTE_TOKEN;
        if (fonnteToken) {
          await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: fonnteToken },
            body: new URLSearchParams({ target: targetPhone, message })
          }).catch(err => console.error("Fonnte order update error:", err));
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("PATCH Orders Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
      storeId, 
      items, 
      totalPrice, 
      deliveryFee, 
      paymentMethod, 
      buyerNote 
    } = body;

    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    // 1. Create order using supabaseAdmin
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        store_id: storeId,
        buyer_id: user.id,
        total_price: totalPrice,
        delivery_fee: deliveryFee,
        payment_method: paymentMethod,
        buyer_note: buyerNote?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Create order error:", orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 2. Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Create order items error:", itemsError);
      // We should probably delete the order if items fail, but for now we'll just log it
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // 3. Trigger WA Notification to Seller if COD
    if (paymentMethod === 'cod') {
      const { data: storeData } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();
        
      if (storeData) {
        const { data: sellerProfile } = await supabaseAdmin
          .from('profiles')
          .select('phone')
          .eq('id', storeData.owner_id)
          .single();

        if (sellerProfile?.phone) {
          const shortOrderId = order.id.split('-')[0].toUpperCase();
          const message = `Halo Seller! Ada pesanan baru berjenis COD (Bayar di Tempat) dengan Order ID: ${shortOrderId}. Silakan cek dashboard Anda untuk mengkonfirmasi pesanan.`;
          
          const fonnteToken = process.env.FONNTE_TOKEN || process.env.NEXT_PUBLIC_FONNTE_TOKEN;
          if (fonnteToken) {
            await fetch("https://api.fonnte.com/send", {
              method: "POST",
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: fonnteToken },
              body: new URLSearchParams({ target: sellerProfile.phone, message })
            }).catch(err => console.error('Fonnte COD trigger error:', err));
          }
        }
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("POST Orders Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
