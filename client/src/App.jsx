import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AccountPage from './pages/AccountPage';
import AuthPage from './pages/AuthPage';
import FaqPage from './pages/FaqPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ComplaintPage from './pages/ComplaintPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SupplierPortalPage from './pages/supplier/SupplierPortalPage';
import LogisticsPortalPage from './pages/logistics/LogisticsPortalPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center text-3xl font-extrabold mb-6 shadow-sm">
        404
      </div>
      <h1 className="text-3xl font-bold font-heading text-neutral-900 mb-2">Produce Not Found</h1>
      <p className="text-sm text-neutral-600 max-w-md mb-8">
        The aisle or harvest record you are looking for does not exist or may have been rotated out of season.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
      >
        Back to FreshBasket Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800 font-sans selection:bg-brand-500 selection:text-white">
            <ScrollToTop />
            <Navbar />
            <CartDrawer />

            <main className="flex-1">
              <Routes>
                {/* Storefront & Discovery */}
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:identifier" element={<ProductDetailPage />} />

                {/* Checkout & Order Cycle */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/cart" element={<ShopPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                <Route path="/track-order" element={<OrderTrackingPage />} />
                <Route path="/track-order/:orderNumber" element={<OrderTrackingPage />} />

                {/* Authentication & Profile */}
                <Route path="/account" element={<AccountPage />} />
                <Route path="/login" element={<AuthPage initialMode="login" />} />
                <Route path="/register" element={<AuthPage initialMode="register" />} />

                {/* Administrative & Operational Roles */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/supplier" element={<SupplierPortalPage />} />
                <Route path="/logistics" element={<LogisticsPortalPage />} />

                {/* Information & Support */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/complaint" element={<ComplaintPage />} />
                <Route path="/complaints" element={<ComplaintPage />} />

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
