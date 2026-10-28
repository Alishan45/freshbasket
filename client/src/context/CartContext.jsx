import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('freshbasket_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedPromo, setAppliedPromo] = useState(() => {
    try {
      const saved = localStorage.getItem('freshbasket_promo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem('freshbasket_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedPromo) {
      localStorage.setItem('freshbasket_promo', JSON.stringify(appliedPromo));
    } else {
      localStorage.removeItem('freshbasket_promo');
    }
  }, [appliedPromo]);

  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function addToCart(product, quantityOrUnit = 1, maybeUnitOrQty = null) {
    let quantity = 1;
    let chosenUnit = product.unit_type || '1 kg';

    if (typeof quantityOrUnit === 'number') {
      quantity = quantityOrUnit;
      if (typeof maybeUnitOrQty === 'string') {
        chosenUnit = maybeUnitOrQty;
      } else if (maybeUnitOrQty && typeof maybeUnitOrQty === 'object') {
        chosenUnit = maybeUnitOrQty.unit_name || maybeUnitOrQty.name || chosenUnit;
      }
    } else if (typeof quantityOrUnit === 'string') {
      chosenUnit = quantityOrUnit;
      if (typeof maybeUnitOrQty === 'number') quantity = maybeUnitOrQty;
    } else if (quantityOrUnit && typeof quantityOrUnit === 'object') {
      chosenUnit = quantityOrUnit.unit_name || quantityOrUnit.name || chosenUnit;
      if (typeof maybeUnitOrQty === 'number') quantity = maybeUnitOrQty;
    }

    if (!chosenUnit || typeof chosenUnit !== 'string') {
      chosenUnit = '1 kg';
    }

    // Find multiplier
    let multiplier = 1.0;
    if (product.available_units && Array.isArray(product.available_units)) {
      const u = product.available_units.find(x => x.unit_name === chosenUnit || x.name === chosenUnit);
      if (u) multiplier = u.multiplier;
    } else {
      if (chosenUnit.includes('500g') || chosenUnit.includes('Half')) multiplier = 0.55;
      if (chosenUnit.includes('250g')) multiplier = 0.3;
      if (chosenUnit.includes('2 kg') || chosenUnit.includes('2 dozen')) multiplier = 1.9;
      if (chosenUnit.includes('3 kg') || chosenUnit.includes('Pack of 3')) multiplier = 2.7;
      if (chosenUnit.includes('5 kg')) multiplier = 4.5;
    }

    const unitPrice = Number((product.base_price * multiplier).toFixed(2));

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id && item.unit === chosenUnit);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        if (newQty > product.stock_quantity) {
          showToast(`Cannot add more. Only ${product.stock_quantity} available in harvest stock.`);
          return prev;
        }
        updated[existingIdx].quantity = newQty;
        showToast(`Updated ${product.name} quantity to ${newQty}`);
        return updated;
      } else {
        if (quantity > product.stock_quantity) {
          showToast(`Cannot add: Only ${product.stock_quantity} available in harvest stock.`);
          return prev;
        }
        showToast(`Added ${quantity} ${chosenUnit} ${product.name} to basket`);
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            image: product.image_url,
            unit: chosenUnit,
            unit_price: unitPrice,
            quantity: quantity,
            stock_quantity: product.stock_quantity
          }
        ];
      }
    });
  }

  function updateQuantity(productId, unitNameOrDelta, deltaMaybe = 1) {
    let unitName = typeof unitNameOrDelta === 'string' ? unitNameOrDelta : null;
    let delta = typeof unitNameOrDelta === 'number' ? unitNameOrDelta : deltaMaybe;

    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId && (!unitName || item.unit === unitName)) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock_quantity) {
            showToast(`Maximum stock limit reached (${item.stock_quantity} available)`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  }

  function removeFromCart(productId, unitName = null) {
    setCart(prev => prev.filter(item => !(item.id === productId && (!unitName || item.unit === unitName))));
    showToast('Item removed from basket');
  }

  function clearCart() {
    setCart([]);
    setAppliedPromo(null);
  }

  function applyCouponDirect(coupon) {
    if (coupon) {
      setAppliedPromo({
        code: coupon.code,
        percent: coupon.discount_percent || coupon.percent || 10,
        discountAmount: Number(((subtotal * (coupon.discount_percent || 10)) / 100).toFixed(2))
      });
    }
  }

  async function applyPromoCode(code) {
    try {
      const res = await api.post('/coupons/validate', {
        code: code.trim().toUpperCase(),
        subtotal
      });
      if (res.success) {
        setAppliedPromo({
          code: res.code,
          percent: res.discount_percent,
          discountAmount: res.discount_amount
        });
        showToast(res.message);
        return { success: true };
      }
    } catch (err) {
      showToast(err.message || 'Invalid coupon code');
      return { success: false, message: err.message };
    }
  }

  function removePromoCode() {
    setAppliedPromo(null);
    showToast('Promotional code removed');
  }

  // Financial calculations
  const subtotal = Number(cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0).toFixed(2));
  const discount = appliedPromo ? Number(((subtotal * appliedPromo.percent) / 100).toFixed(2)) : 0.00;
  const deliveryFee = subtotal >= 20 || subtotal === 0 ? 0.00 : 2.50;
  const total = Number(Math.max(0, subtotal - discount + deliveryFee).toFixed(2));
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cart,
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount,
    appliedPromo,
    isDrawerOpen,
    setIsDrawerOpen,
    toastMessage,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    applyCouponDirect,
    removePromoCode,
    showToast
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
