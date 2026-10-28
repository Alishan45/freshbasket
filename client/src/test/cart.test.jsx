import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';

// Test consumer component for CartContext
function CartConsumer() {
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    discount,
    appliedPromo,
    applyCouponDirect
  } = useCart();

  return (
    <div>
      <span data-testid="cart-count">{itemCount}</span>
      <span data-testid="cart-subtotal">{subtotal.toFixed(2)}</span>
      <span data-testid="delivery-fee">{deliveryFee.toFixed(2)}</span>
      <span data-testid="cart-total">{total.toFixed(2)}</span>
      <span data-testid="cart-discount">{discount.toFixed(2)}</span>
      <span data-testid="coupon-code">{appliedPromo?.code || 'none'}</span>

      <button
        onClick={() =>
          addToCart(
            { id: 1, name: 'Royal Multani Chaunsa Mangoes', base_price: 5.0, stock_quantity: 20 },
            2,
            '1 kg'
          )
        }
      >
        Add Mangoes
      </button>

      <button
        onClick={() =>
          addToCart(
            { id: 2, name: 'Organic Cavendish Bananas', base_price: 2.0, stock_quantity: 50 },
            1,
            '1 dozen'
          )
        }
      >
        Add Bananas
      </button>

      <button onClick={() => updateQuantity(cart[0]?.id, 2)}>Add 2 More Mangoes</button>
      <button onClick={() => removeFromCart(cart[0]?.id)}>Remove First Item</button>
      <button onClick={() => applyCouponDirect({ code: 'FRESH20', discount_percent: 20 })}>
        Apply FRESH20
      </button>
    </div>
  );
}

describe('Cart Context & Pricing Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty cart, zero count and zero subtotal', () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count').textContent).toBe('0');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('0.00');
    expect(screen.getByTestId('cart-total').textContent).toBe('0.00');
  });

  it('adds items with correct quantities and calculates subtotal & delivery fee', async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Add 2 kg mangoes at $5.00/kg = $10.00
    await act(async () => {
      screen.getByText('Add Mangoes').click();
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('2');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('10.00');
    // Subtotal under $20 has standard delivery fee ($2.50) -> Total $12.50
    expect(screen.getByTestId('delivery-fee').textContent).toBe('2.50');
    expect(screen.getByTestId('cart-total').textContent).toBe('12.50');
  });

  it('updates quantity and recalculates totals correctly', async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await act(async () => {
      screen.getByText('Add Mangoes').click();
    });

    // Add 2 more to bring total quantity from 2 to 4 -> 4 * $5 = $20 (Eligible for free shipping over $20)
    await act(async () => {
      screen.getByText('Add 2 More Mangoes').click();
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('4');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('20.00');
    expect(screen.getByTestId('delivery-fee').textContent).toBe('0.00');
    expect(screen.getByTestId('cart-total').textContent).toBe('20.00');
  });

  it('applies discount coupon correctly when subtotal satisfies minimum requirement', async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Add 2 kg mangoes ($10) + 1 dozen bananas ($2) = $12
    await act(async () => {
      screen.getByText('Add Mangoes').click();
      screen.getByText('Add Bananas').click();
    });

    expect(screen.getByTestId('cart-subtotal').textContent).toBe('12.00');

    // Apply 20% discount on $12 -> discount = $2.40, subtotal after discount = $9.60 + $2.50 delivery = $12.10
    await act(async () => {
      screen.getByText('Apply FRESH20').click();
    });

    expect(screen.getByTestId('coupon-code').textContent).toBe('FRESH20');
    expect(screen.getByTestId('cart-discount').textContent).toBe('2.40');
    expect(screen.getByTestId('cart-total').textContent).toBe('12.10');
  });

  it('removes item from cart completely', async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await act(async () => {
      screen.getByText('Add Mangoes').click();
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('2');

    await act(async () => {
      screen.getByText('Remove First Item').click();
    });

    expect(screen.getByTestId('cart-count').textContent).toBe('0');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('0.00');
  });
});

describe('ProductCard Component', () => {
  const sampleProduct = {
    id: 101,
    name: 'Crisp Honeycrisp Apples',
    slug: 'crisp-honeycrisp-apples',
    base_price: 3.5,
    unit_type: '1 kg',
    freshness_grade: 'Grade A+ (Picked Today)',
    stock_quantity: 45,
    is_organic: 1,
    is_seasonal: 1,
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    available_units: [
      { name: '1 kg', multiplier: 1.0, is_default: 1 },
      { name: '500g', multiplier: 0.55, is_default: 0 }
    ],
    average_rating: 4.9,
    reviews_count: 12
  };

  it('renders product information, organic tag, and stock status', () => {
    render(
      <BrowserRouter>
        <WishlistProvider>
          <CartProvider>
            <ProductCard product={sampleProduct} />
          </CartProvider>
        </WishlistProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Crisp Honeycrisp Apples')).toBeInTheDocument();
    expect(screen.getByText('Grade A+ (Picked Today)')).toBeInTheDocument();
    expect(screen.getByText(/100% Organic/i)).toBeInTheDocument();
  });
});
