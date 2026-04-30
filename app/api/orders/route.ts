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

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (paymentStatus) updates.payment_status = paymentStatus;
    if (rejectionReason) updates.rejection_reason = rejectionReason;

    // Update order in Supabase
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*, profiles!orders_buyer_id_fkey(phone, full_name), stores(owner_id)')
      .single();

    if (error) {
      console.error('Update order error:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Trigger WA Notification via Fonnte ONLY if status changed
    if (status && updatedOrder) {
      const shortOrderId = orderId.split('-')[0].toUpperCase();
      let message = '';
      let targetPhone = '';

      if (status === 'canceled' && updatedOrder.stores?.owner_id) {
        // Canceled by buyer -> Notify Seller
        // Fetch seller profile
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
        }
      }

      if (message && targetPhone) {
        // We can call Fonnte directly here to save HTTP calls
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

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Get order and store owner phone
    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .select('store_id')
      .eq('id', orderId)
      .single();

    if (orderData) {
      const { data: storeData } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', orderData.store_id)
        .single();
        
      if (storeData) {
        const { data: sellerProfile } = await supabaseAdmin
          .from('profiles')
          .select('phone')
          .eq('id', storeData.owner_id)
          .single();

        if (sellerProfile?.phone) {
          const shortOrderId = orderId.split('-')[0].toUpperCase();
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST Orders Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
