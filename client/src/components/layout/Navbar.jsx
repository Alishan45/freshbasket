import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Apple, Search, ShoppingCart, Heart, User, MapPin,
  ShieldCheck, Truck, ChevronDown, LogOut, LayoutDashboard,
  Store, Menu, X, Check, Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { detectCurrentLocation, getSavedLocation } from '../../services/geoapify';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isSupplier, isLogistics, logout, loginDemo } = useAuth();
  const { itemCount, setIsDrawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState('Lahore Central Hub');
  const [hubDropdown, setHubDropdown] = useState(false);
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      const label = saved.suburb ? `${saved.suburb}, ${saved.city}` : saved.city || saved.formatted;
      setSelectedHub(label);
    }
  }, []);

  async function handleDetectGeoLocation() {
    setIsDetectingLoc(true);
    try {
      const loc = await detectCurrentLocation();
      const label = loc.suburb ? `${loc.suburb}, ${loc.city}` : loc.city || loc.formatted;
      setSelectedHub(label);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDetectingLoc(false);
      setHubDropdown(false);
    }
  }

  const hubs = ['Lahore Central Hub', 'DHA & Cantt Hub', 'Gulberg Fresh Center', 'Johar Town Hub'];

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <>
      {/* Top Announcement Bar & Demo Switcher */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-emerald-900 text-white text-xs py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/30 text-brand-100 border border-brand-400/30 animate-pulse">
              🌱 Morning Harvest
            </span>
            <span className="font-medium hidden sm:inline">
              Farm-Direct Produce • 100% Quality Inspected • Cash on Delivery (COD) Available
            </span>
          </div>

          {/* Quick 1-Click Demo Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg text-[11px]">
              <span className="text-stone-300 font-semibold px-1">Role:</span>
              <button
                onClick={() => loginDemo('customer')}
                className={`px-2 py-0.5 rounded font-bold transition ${user?.role === 'customer' ? 'bg-white text-brand-800 shadow-xs' : 'text-stone-300 hover:text-white'}`}
              >
                Customer
              </button>
              <button
                onClick={() => loginDemo('admin')}
                className={`px-2 py-0.5 rounded font-bold transition ${isAdmin ? 'bg-brand-500 text-white shadow-xs' : 'text-stone-300 hover:text-white'}`}
              >
                Admin
              </button>
              <button
                onClick={() => loginDemo('supplier')}
                className={`px-2 py-0.5 rounded font-bold transition ${isSupplier ? 'bg-amber-500 text-stone-900 shadow-xs' : 'text-stone-300 hover:text-white'}`}
              >
                Supplier
              </button>
              <button
                onClick={() => loginDemo('logistics')}
                className={`px-2 py-0.5 rounded font-bold transition ${isLogistics ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'}`}
              >
                Logistics
              </button>
            </div>

            {(isLogistics || isAdmin) && (
              <Link to="/logistics" className="hover:text-blue-200 text-blue-100 flex items-center gap-1.5 font-bold transition bg-blue-600/40 px-2 py-0.5 rounded-md border border-blue-400/40">
                <Truck className="w-3.5 h-3.5 text-blue-300" />
                <span>Logistics Hub</span>
              </Link>
            )}

            <Link to="/track-order" className="hover:text-brand-200 underline flex items-center gap-1 font-semibold transition">
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-brand-600/25 group-hover:scale-105 transition-transform">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-2xl tracking-tight text-stone-900">
                    Fresh<span className="text-brand-600">Basket</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded-md">
                    Farm Fresh
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium hidden sm:block">Pure • Organic • Same-Day Picked</p>
              </div>
            </Link>

            {/* Delivery Hub Selector */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setHubDropdown(!hubDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200/70 rounded-xl border border-stone-200 text-xs transition"
              >
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <div className="text-left">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Delivering To</span>
                  <span className="font-semibold text-stone-800">{selectedHub}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {hubDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 p-2 z-50 animate-fade-in">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-stone-400">Delivery Hub Location</div>
                  
                  {/* Geoapify Live Location Detection */}
                  <button
                    onClick={handleDetectGeoLocation}
                    disabled={isDetectingLoc}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100/80 rounded-xl mb-2 flex items-center gap-2 transition border border-brand-200/60"
                  >
                    <Navigation className={`w-3.5 h-3.5 shrink-0 ${isDetectingLoc ? 'animate-spin text-brand-600' : 'text-brand-600'}`} />
                    <span className="truncate">{isDetectingLoc ? 'Detecting via Geoapify GPS...' : 'Detect My Location (Geoapify)'}</span>
                  </button>

                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-stone-400 border-t pt-1.5">Or Choose Hub</div>
                  {hubs.map(hub => (
                    <button
                      key={hub}
                      onClick={() => { setSelectedHub(hub); setHubDropdown(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 hover:text-brand-600 rounded-lg flex items-center justify-between"
                    >
                      <span>{hub}</span>
                      {selectedHub === hub && <Check className="w-3.5 h-3.5 text-brand-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg mx-2 relative">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fresh mangoes, baby spinach, organic apples, carrots..."
                  className="w-full pl-10 pr-20 py-2.5 bg-stone-100 border border-stone-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15 rounded-xl text-xs sm:text-sm transition outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Actions: Wishlist, Cart, User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Wishlist Trigger */}
              <Link
                to="/account?tab=wishlist"
                className="relative p-2.5 rounded-xl text-stone-600 hover:text-brand-600 hover:bg-stone-100 transition hidden sm:flex items-center justify-center"
                title="View Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Trigger */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="relative p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md shadow-brand-600/25 transition flex items-center gap-2 group"
              >
                <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="hidden md:inline text-xs font-bold font-heading">Cart</span>
                <span className="bg-amber-500 text-stone-900 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {itemCount}
                </span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-stone-200 hover:border-brand-300 hover:bg-stone-50 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="block text-xs font-bold text-stone-800 leading-tight">
                      {user ? user.full_name.split(' ')[0] : 'Sign In'}
                    </span>
                    <span className="block text-[10px] text-brand-600 font-medium capitalize">
                      {user?.role || 'Guest'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdown && (
                  <div
                    onClick={() => setUserDropdown(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 animate-fade-in text-xs font-medium"
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="font-bold text-stone-900">{user.full_name}</p>
                          <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                        </div>

                        <Link to="/account" className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-brand-600">
                          <User className="w-4 h-4 text-stone-400" /> My Profile & Info
                        </Link>
                        <Link to="/account?tab=orders" className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-brand-600">
                          <Truck className="w-4 h-4 text-stone-400" /> Order History
                        </Link>
                        <Link to="/account?tab=addresses" className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-brand-600">
                          <MapPin className="w-4 h-4 text-stone-400" /> Saved Addresses
                        </Link>
                        <Link to="/complaint" className="flex items-center gap-2.5 px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-brand-600">
                          <ShieldCheck className="w-4 h-4 text-stone-400" /> Quality Disputes & Support
                        </Link>

                        {isAdmin && (
                          <>
                            <div className="border-t border-stone-100 my-1" />
                            <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-brand-700 bg-brand-50 font-bold">
                              <LayoutDashboard className="w-4 h-4 text-brand-600" /> Admin Control Center
                            </Link>
                          </>
                        )}

                        {isSupplier && (
                          <>
                            <div className="border-t border-stone-100 my-1" />
                            <Link to="/supplier" className="flex items-center gap-2.5 px-4 py-2 text-amber-800 bg-amber-50 font-bold">
                              <Store className="w-4 h-4 text-amber-600" /> Farmer Supplier Portal
                            </Link>
                          </>
                        )}

                        {(isLogistics || isAdmin) && (
                          <>
                            <div className="border-t border-stone-100 my-1" />
                            <Link to="/logistics" className="flex items-center gap-2.5 px-4 py-2 text-blue-800 bg-blue-50 font-bold hover:bg-blue-100">
                              <Truck className="w-4 h-4 text-blue-600" /> Logistics Supervisor Hub
                            </Link>
                          </>
                        )}

                        <div className="border-t border-stone-100 my-1" />
                        <button
                          onClick={logout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 text-red-500" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="font-bold text-stone-900">Welcome to FreshBasket</p>
                          <p className="text-[11px] text-stone-500">Sign in to manage orders</p>
                        </div>
                        <Link to="/login" className="flex items-center gap-2.5 px-4 py-2 text-brand-700 font-bold hover:bg-brand-50">
                          Sign In / Register
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Category Strip */}
        <div className="border-t border-stone-100 bg-stone-50/70 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs font-semibold">
            <Link to="/shop" className="px-3 py-1.5 rounded-full hover:bg-white text-stone-700 hover:text-brand-600 transition">
              All Produce (14)
            </Link>
            <Link to="/shop?category=fruits" className="px-3 py-1.5 rounded-full hover:bg-white text-stone-700 hover:text-brand-600 transition">
              🍎 Fresh Fruits
            </Link>
            <Link to="/shop?category=vegetables" className="px-3 py-1.5 rounded-full hover:bg-white text-stone-700 hover:text-brand-600 transition">
              🥕 Farm Vegetables
            </Link>
            <Link to="/shop?category=leafy-greens" className="px-3 py-1.5 rounded-full hover:bg-white text-stone-700 hover:text-brand-600 transition">
              🥬 Leafy Greens
            </Link>
            <Link to="/shop?category=organic" className="px-3 py-1.5 rounded-full hover:bg-white text-stone-700 hover:text-brand-600 transition">
              🌿 100% Organic Certified
            </Link>
            <Link to="/shop?category=seasonal" className="px-3 py-1.5 rounded-full hover:bg-white text-stone-700 hover:text-brand-600 transition">
              ☀️ Seasonal Harvest
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Slideout Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <span className="font-heading font-extrabold text-xl text-stone-900">
                  Fresh<span className="text-brand-600">Basket</span>
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2 text-sm font-semibold">
                {/* Geoapify Live Location on Mobile */}
                <button
                  type="button"
                  onClick={handleDetectGeoLocation}
                  disabled={isDetectingLoc}
                  className="w-full text-left p-2.5 rounded-xl bg-brand-50 text-brand-800 font-bold text-xs flex items-center gap-2 border border-brand-200 transition"
                >
                  <Navigation className={`w-4 h-4 text-brand-600 shrink-0 ${isDetectingLoc ? 'animate-spin' : ''}`} />
                  <span className="truncate">{isDetectingLoc ? 'Detecting GPS...' : `📍 ${selectedHub} (Geoapify)`}</span>
                </button>

                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100">Home</Link>
                <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100">Shop Marketplace</Link>
                <Link to="/track-order" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100">Track Order</Link>
                <Link to="/complaint" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100 text-brand-700 font-bold">
                  🛡️ Quality Dispute & Complaints
                </Link>
                {(isLogistics || isAdmin) && (
                  <Link to="/logistics" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl bg-blue-50 text-blue-800 font-bold">
                    🚚 Logistics Hub
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
                    ⚙️ Admin Control Center
                  </Link>
                )}
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100">My Account</Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100">About Our Farms</Link>
                <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded-xl hover:bg-stone-100">Help & FAQs</Link>
              </div>
            </div>

            <div className="pt-4 border-t text-xs text-stone-500 space-y-2">
              <p>🌱 Virtual University Final Project</p>
              <p>Supervisor: Muhammad Hassaan</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
