import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Gunakan Service Role Key untuk bypass RLS di webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const {
      order_id,
      transaction_status,
      fraud_status,
      signature_key,
      status_code,
      gross_amount
    } = payload;

    // 1. Verifikasi Signature Key untuk keamanan
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hashStr = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(hashStr).digest('hex');

    if (signature_key !== expectedSignature) {
      console.error('Invalid signature key from Midtrans');
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 401 });
    }

    // 2. Tentukan status pembayaran
    let paymentStatus = 'unpaid';
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'challenge';
      } else if (fraud_status === 'accept') {
        paymentStatus = 'paid';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid';
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
    }

    // 3. Update Order di Database
    const { data: orderData, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', order_id)
      .select('*, stores(owner_id), profiles!orders_buyer_id_fkey(phone, full_name)')
      .single();

    if (updateError) {
      console.error('Failed to update order status:', updateError);
      throw updateError;
    }

    // 4. Integrasi Fonnte: Notifikasi ke Seller jika sudah PAID
    if (paymentStatus === 'paid') {
      // Get seller phone
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
          const message = `Halo Seller! Ada pesanan baru yang sudah DIBAYAR (Order ID: ${order_id.split('-')[0]}). Silakan cek dashboard Anda untuk menyiapkan pesanan.`;

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: sellerProfile.phone, message })
          }).catch(err => console.error('Fonnte trigger error:', err));
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Midtrans Webhook Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
