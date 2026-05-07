import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { formatRp } from "@/lib/utils";
import { PrintButton } from "@/components/orders/PrintButton";

export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(`/seller/login?redirect=/seller/orders/${id}/print`);
  }

  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        products (
          name,
          unit
        )
      ),
      stores (
        id,
        name,
        address,
        owner_id
      )
    `)
    .eq('id', id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // Security Check: Only Store Owner can view/print resi
  const isOwner = order.stores?.owner_id === user.id;
  if (!isOwner) {
    redirect('/seller/dashboard');
  }

  return (
    <div className="bg-gray-100 min-h-screen p-0 sm:p-8 flex justify-center items-start print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A6;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="w-full max-w-[400px] bg-white border border-gray-200 p-4 sm:p-6 shadow-sm print:shadow-none print:border-none text-black font-sans">
        {/* Header - Compact */}
        <div className="border-b-2 border-black pb-3 mb-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Ambilidis</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest leading-none">{order.stores?.name}</p>
        </div>

        {/* Order Info Bar */}
        <div className="flex justify-between items-center bg-black text-white px-2 py-1 mb-4">
          <span className="text-[10px] font-bold">NO. PESANAN</span>
          <span className="text-xs font-mono font-black">#{order.id.split('-')[0].toUpperCase()}</span>
        </div>

        {/* Recipient Section - Highlighted for courier */}
        <div className="mb-4 border-2 border-black p-3 rounded-sm">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">PENERIMA:</h3>
          <p className="text-lg font-black leading-tight mb-0.5">{order.buyer_name || 'Pembeli'}</p>
          <p className="text-sm font-black mb-2">{order.buyer_phone || '-'}</p>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-[11px] leading-tight font-bold">
              {order.shipping_address || 'Alamat tidak tersedia'}
            </p>
          </div>
        </div>

        {/* Note - If exists */}
        {order.buyer_note && (
          <div className="mb-4 p-2 bg-gray-100 border-l-4 border-black">
            <p className="text-[8px] font-black uppercase mb-0.5">Catatan Pembeli:</p>
            <p className="text-[10px] italic leading-tight font-medium">&quot;{order.buyer_note}&quot;</p>
          </div>
        )}

        {/* Shipping Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-2 text-[10px] font-bold">
          <div>
            <span className="text-gray-400 block text-[8px] uppercase">Metode</span>
            <span>{order.payment_method === 'cod' ? 'COD (Bayar di Tempat)' : 'Transfer'}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 block text-[8px] uppercase">Pembayaran</span>
            <span className={order.payment_status === 'paid' ? 'text-green-700' : 'text-red-600'}>
              {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
            </span>
          </div>
        </div>

        {/* Items List - Compact Table */}
        <div className="mb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black text-[8px] font-black uppercase">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.order_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2 pr-2">
                    <p className="text-[10px] font-bold leading-tight">{item.products?.name}</p>
                  </td>
                  <td className="py-2 text-center text-[10px] font-medium">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right text-[10px] font-bold tabular-nums">
                    {formatRp(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="border-t-2 border-black pt-3 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-medium text-gray-500">
            <span>Ongkir</span>
            <span>{formatRp(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase">Total Akhir</span>
            <span className="text-lg font-black tabular-nums">{formatRp(order.total_price)}</span>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-6 pt-3 border-t border-dashed border-gray-300 text-center">
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Terima kasih telah berbelanja di {order.stores?.name}</p>
        </div>

        {/* Print Button Wrapper */}
        <div className="mt-8 no-print">
          <PrintButton />
          <p className="text-[9px] text-gray-400 mt-4 italic text-center">
            *Ukuran dioptimalkan untuk kertas A6 (105x148mm) atau Thermal Label (100x150mm).
          </p>
        </div>
      </div>
    </div>
  );
}
