import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Truck, Printer, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import api from '../services/api';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback to URL hash or query params if orderNumber param was empty or in hash
  const rawCode = orderNumber || (typeof window !== 'undefined' ? window.location.hash.replace(/^#+/, '') : '') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('order') : '');
  const safeOrderCode = String(rawCode || '').replace(/^#+/, '').trim();

  useEffect(() => {
    async function loadOrder() {
      if (!safeOrderCode) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/orders/${safeOrderCode}`);
        if (res.success) setOrder(res.order);
      } catch (err) {
        console.error('Failed to load confirmed order:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [safeOrderCode]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4 animate-pulse">
        <div className="w-16 h-16 bg-stone-200 rounded-full mx-auto" />
        <div className="h-6 w-48 bg-stone-200 rounded-xl mx-auto" />
        <div className="h-32 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-heading font-bold text-stone-900">Order Information Unavailable</h2>
        <Link to="/shop" className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>
        
        <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-bold">
          🎉 Order Successfully Confirmed!
        </span>

        <h1 className="text-3xl font-heading font-extrabold text-stone-900">
          Thank You For Choosing FreshBasket
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
          Your order has entered our packing and quality inspection queue. You can track real-time fulfillment using your order code.
        </p>
      </div>

      {/* Printable Receipt Card */}
      <div id="printable-receipt" className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6 text-xs">
        
        {/* Top Meta */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Order Reference</span>
            <span className="font-mono font-bold text-stone-900 text-base">{order.order_number}</span>
          </div>
          <div className="text-right">
            <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Payment Method</span>
            <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
              Cash on Delivery (COD)
            </span>
          </div>
        </div>

        {/* Customer & Destination Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
          <div>
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Delivering To</span>
            <p className="font-bold text-stone-900 text-sm mt-0.5">{order.customer_name}</p>
            <p className="text-stone-600 leading-snug">{order.address_text}</p>
            <p className="text-stone-400 mt-1">📞 {order.customer_phone}</p>
          </div>

          <div>
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Express Delivery Slot</span>
            <p className="font-bold text-stone-900 text-sm mt-0.5">{order.delivery_slot}</p>
            {order.special_instructions && (
              <div className="mt-2 p-2 bg-stone-50 rounded-xl border border-stone-100 text-[11px] text-stone-600 italic">
                "{order.special_instructions}"
              </div>
            )}
          </div>
        </div>

        {/* Ordered Produce Line Items */}
        <div className="space-y-2.5 pb-4 border-b border-stone-100">
          <span className="text-stone-400 block text-[10px] uppercase font-bold">Harvest Items Ordered</span>
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <span className="font-medium text-stone-800">
                {item.quantity}x {item.product_name} ({item.unit_name})
              </span>
              <span className="font-mono text-stone-900 font-bold">
                ${item.subtotal?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1.5 pt-1 text-stone-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold text-stone-900">${order.subtotal?.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-brand-700 font-semibold">
              <span>Promotional Discount:</span>
              <span>-${order.discount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Charge:</span>
            <span className="font-semibold text-stone-900">
              {order.delivery_fee === 0 ? 'FREE' : `$${order.delivery_fee?.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-heading font-extrabold text-base text-stone-900 pt-3 border-t border-stone-200">
            <span>Payable at Doorstep (COD):</span>
            <span className="text-brand-700 text-xl font-mono">${order.total_amount?.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to={`/track-order/${order.order_number.replace(/^#+/, '')}`}
          className="w-full sm:flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>Track Live Fulfillment</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-200 transition flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>

        <Link
          to="/shop"
          className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl border border-stone-200 transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

    </div>
  );
}
