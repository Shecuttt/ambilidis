import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import midtransClient from 'midtrans-client';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, grossAmount, customerDetails } = body;

    if (!orderId || !grossAmount) {
      return NextResponse.json({ error: 'orderId and grossAmount are required' }, { status: 400 });
    }

    // Initialize Snap API client
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
    });

    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      customer_details: customerDetails || {
        first_name: user.email?.split('@')[0] || 'Customer',
        email: user.email,
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // Save payment_token to database
    await supabase.from('orders')
      .update({ payment_token: transaction.token })
      .eq('id', orderId);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

  } catch (error: any) {
    console.error("Payment Route Error:", error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
