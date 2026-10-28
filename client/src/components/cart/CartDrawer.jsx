import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Trash2, ArrowRight, Tag, Check, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart, subtotal, discount, deliveryFee, total,
    isDrawerOpen, setIsDrawerOpen, updateQuantity,
    removeFromCart, appliedPromo, applyPromoCode, removePromoCode
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  if (!isDrawerOpen) return null;

  async function handleApplyPromo(e) {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    await applyPromoCode(promoInput.trim());
    setPromoLoading(false);
  }

  function handleProceedCheckout() {
    setIsDrawerOpen(false);
    navigate('/checkout');
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-stone-900">Your Fresh Basket</h3>
                <p className="text-xs text-stone-500">{cart.length} unique produce lines</p>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-heading font-bold text-base text-stone-800">Your Basket is Empty</h4>
                <p className="text-xs text-stone-500 max-w-xs mt-1 mb-6">
                  Fill your basket with crisp farm-fresh fruits, organic vegetables, and dewy leafy greens!
                </p>
                <button
                  onClick={() => { setIsDrawerOpen(false); navigate('/shop'); }}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Start Shopping Today's Harvest
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.id}-${item.unit}`}
                  className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{item.name}</h4>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {item.unit} • ${item.unit_price.toFixed(2)} each
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.unit, -1)}
                          className="px-2.5 py-0.5 hover:bg-stone-100 font-bold text-stone-600"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold min-w-[1.5rem] text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.unit, 1)}
                          className="px-2.5 py-0.5 hover:bg-stone-100 font-bold text-stone-600"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.unit)}
                        className="text-stone-400 hover:text-red-500 p-1 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-heading font-extrabold text-sm text-stone-900">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer (Calculations & Checkout CTA) */}
          {cart.length > 0 && (
            <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
              
              {/* Promo Code Input */}
              {appliedPromo ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Coupon {appliedPromo.code} Applied ({appliedPromo.percent}% Off)</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-stone-400 hover:text-red-600 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo Code (e.g. FRESH20)"
                      className="w-full pl-9 pr-3 py-2 bg-white text-xs uppercase font-mono border border-stone-200 rounded-xl outline-none focus:border-brand-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoLoading}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-brand-700 font-semibold">
                    <span>Discount ({appliedPromo.percent}%):</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span>Delivery Fee:</span>
                    <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded font-bold">
                      Free over $20
                    </span>
                  </span>
                  <span className="font-semibold text-stone-900">
                    {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-stone-900">
                  <span className="font-heading font-bold text-sm">Total Due on Arrival (COD):</span>
                  <span className="font-heading font-extrabold text-xl text-brand-700">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedCheckout}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-sm rounded-xl shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-stone-400">
                💵 Pay cash or card to courier upon doorstep freshness inspection
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
