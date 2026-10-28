import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Banknote, Clock, Scale,
  Sparkles, Award, HeartHandshake, CheckCircle2, Star,
  MessageSquare, X, Check, ThumbsUp, MapPin, Navigation, Truck
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/products/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  detectCurrentLocation,
  getSavedLocation,
  getNearestHub,
  calculateDistanceKm,
  FRESHBASKET_HUBS,
  getStaticMapUrl
} from '../services/geoapify';

export default function HomePage() {
  const { user, isAuthenticated, loginDemo } = useAuth();
  const { showToast } = useCart();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProdId, setReviewProdId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFreshness, setReviewFreshness] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState([]);

  // Geoapify Live Geolocation State
  const [userLocation, setUserLocation] = useState(() => getSavedLocation() || {
    city: 'Lahore',
    suburb: 'Gulberg III',
    formatted: 'Gulberg III, Lahore, Punjab',
    lat: 31.5204,
    lon: 74.3587,
    nearestHub: getNearestHub(31.5204, 74.3587)
  });
  const [isDetecting, setIsDetecting] = useState(false);

  async function handleDetectLocation() {
    setIsDetecting(true);
    try {
      const loc = await detectCurrentLocation();
      setUserLocation(loc);
      showToast(`📍 Located via Geoapify: ${loc.suburb || loc.city}, nearest hub: ${loc.nearestHub?.name}`);
    } catch (err) {
      showToast('Location detection complete');
    } finally {
      setIsDetecting(false);
    }
  }

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products', { limit: 8 }),
          api.get('/categories')
        ]);

        if (prodRes.success) {
          setAllProducts(prodRes.products);
          if (prodRes.products.length > 0) {
            setReviewProdId(prodRes.products[0].id);
          }
          setFeaturedProducts(prodRes.products.slice(0, 6));
          setSeasonalProducts(prodRes.products.filter(p => p.is_seasonal).slice(0, 4));
        }
        if (catRes.success) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  async function handleHomeSubmitReview(e) {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast('Please enter your review feedback.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const selectedProd = allProducts.find(p => String(p.id) === String(reviewProdId)) || allProducts[0];
      const authorName = user?.full_name || reviewAuthor.trim() || 'Verified Customer';

      if (isAuthenticated) {
        await api.post('/reviews', {
          product_id: parseInt(reviewProdId || selectedProd?.id || 1),
          rating_stars: reviewRating,
          freshness_stars: reviewFreshness,
          comment_text: reviewComment.trim()
        });
      }

      const newRev = {
        id: Date.now(),
        author: authorName,
        rating: reviewRating,
        produceName: selectedProd?.name || 'Fresh Produce',
        comment: reviewComment.trim(),
        location: 'Verified Household',
        isNew: true
      };

      setUserReviews(prev => [newRev, ...prev]);
      setShowReviewModal(false);
      setReviewComment('');
      showToast('Thank you! Your verified doorstep review has been published.');
    } catch (err) {
      showToast(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand-50/80 via-white to-stone-50 border-b border-stone-200 overflow-hidden pt-8 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-100/90 border border-brand-200 text-brand-900 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
                  <span>Morning Harvest Dispatched • 100% Quality Inspected</span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-brand-300 text-brand-800 rounded-full text-xs font-bold transition shadow-xs"
                  title="Detect live delivery hub via Geoapify GPS"
                >
                  <Navigation className={`w-3.5 h-3.5 text-brand-600 ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>📍 Delivering to: <strong>{userLocation.suburb || userLocation.city}</strong> (~{userLocation.nearestHub?.estimatedMins || 20}m)</span>
                </button>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-stone-900 tracking-tight leading-[1.1]">
                Farm-Fresh Produce, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-600">
                  Straight to Your Doorstep.
                </span>
              </h1>

              <p className="text-stone-600 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                Eliminate middleman storage and multiday market delay. Experience crisp, nutrient-dense fruits and vegetables picked directly from verified local orchards with <strong className="text-stone-900 font-semibold">Cash on Delivery</strong> and a 100% freshness guarantee.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/shop"
                  className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold rounded-2xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2 group"
                >
                  <span>Shop Today's Harvest</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/track-order"
                  className="px-5 py-3.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-heading font-bold rounded-2xl shadow-xs transition flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Live Order Tracker</span>
                </Link>

                <Link
                  to="/admin"
                  className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Admin Quality Hub</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200/70">
                <div className="flex items-center gap-2.5 text-xs font-medium text-stone-700">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">Grade A+ Fresh</p>
                    <p className="text-[10px] text-stone-500">Inspected daily</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-medium text-stone-700">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">Cash on Delivery</p>
                    <p className="text-[10px] text-stone-500">Inspect before paying</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-medium text-stone-700">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">2-Hour Express</p>
                    <p className="text-[10px] text-stone-500">Slot booking</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-medium text-stone-700">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold">Custom Units</p>
                    <p className="text-[10px] text-stone-500">kg, grams, dozen</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-2 bg-gradient-to-tr from-brand-300 via-emerald-200 to-amber-200 rounded-3xl filter blur-xl opacity-70 animate-pulse" />
                
                <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-stone-200/90">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100">
                    <img
                      src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
                      alt="Farm Fresh Produce Basket"
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-900 shadow-md flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      100% Quality Inspected
                    </div>
                    <div className="absolute bottom-3 right-3 bg-stone-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Swat • Multan • Sindh Farms</span>
                    </div>
                  </div>

                  <div className="mt-4 bg-brand-50/80 border border-brand-200/60 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        🌱
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">Today's Certified Batch</h4>
                        <p className="text-[11px] text-stone-500">142 orders delivered • 99.4% freshness score</p>
                      </div>
                    </div>
                    <Link
                      to="/track-order"
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      Track Demo
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900">
              Browse Produce Categories
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Harvested daily from local orchards and peri-urban hydroponic greenhouses
            </p>
          </div>
          <Link to="/shop" className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="bg-white rounded-3xl border border-stone-200 p-4 hover:border-brand-500 hover:shadow-lg transition group text-center flex flex-col items-center justify-between"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden mb-3 bg-stone-100">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="font-heading font-bold text-sm text-stone-900 group-hover:text-brand-600 transition">
                {cat.name}
              </h3>
              <span className="text-[11px] text-stone-400 font-medium mt-0.5">
                {cat.product_count || 0} produce items
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Farm Produce */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Morning Pick</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900">
              Featured Farm Harvest
            </h2>
          </div>
          <Link
            to="/shop"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Explore All 14 Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-stone-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Farm-to-Fork Quality Assurance Infographic */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <span className="px-3 py-1 bg-white/10 text-brand-300 rounded-full text-xs font-bold uppercase tracking-wider">
                The FreshBasket Assurance
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white leading-tight">
                How We Guarantee 100% Farm Freshness
              </h2>
              <p className="text-brand-100/80 text-sm sm:text-base leading-relaxed max-w-xl">
                Unlike traditional grocery store supply chains where fruits sit in wholesale refrigeration for over a week, FreshBasket operates on a same-day harvest-to-doorstep protocol.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">5:00 AM Dawn Harvest:</strong>
                    <span className="text-brand-200">Produce picked at peak sugar and moisture levels directly in orchards.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Quality & Sugar Brix Inspection:</strong>
                    <span className="text-brand-200">Certified by on-site agricultural inspectors; only Grade A+ items accepted.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Doorstep Inspection Before Payment:</strong>
                    <span className="text-brand-200">Inspect texture, crunch, and aroma before tendering Cash on Delivery.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center space-y-1">
                <span className="text-3xl font-heading font-black text-amber-400">99.4%</span>
                <p className="text-xs font-bold text-white">Average Freshness</p>
                <p className="text-[10px] text-brand-200">Across 14 harvest lines</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center space-y-1">
                <span className="text-3xl font-heading font-black text-brand-300">0 Days</span>
                <p className="text-xs font-bold text-white">Warehouse Storage</p>
                <p className="text-[10px] text-brand-200">Harvest to door same day</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center space-y-1">
                <span className="text-3xl font-heading font-black text-emerald-300">85%+</span>
                <p className="text-xs font-bold text-white">Farmer Share</p>
                <p className="text-[10px] text-brand-200">Direct fair trade payout</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center space-y-1">
                <span className="text-3xl font-heading font-black text-white">4.9 ★</span>
                <p className="text-xs font-bold text-white">Customer Rating</p>
                <p className="text-[10px] text-brand-200">Over 380+ reviews</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Geoapify Live Produce Radar & Hub Coverage Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden space-y-8">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-2 max-w-2xl">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-400/30 inline-flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Geoapify Fleet Radar Intelligence
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                Live Regional Hubs & Doorstep Delivery Radius
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                FreshBasket operates 5 active cold-chain terminals to ensure morning harvest produce reaches your kitchen within 30 to 45 minutes of dispatch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2"
              >
                <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Calculating GPS...' : '📍 Auto-Detect My Distance'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: 5 Hubs List */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
                Active Cold-Chain Terminals (3.8°C Regulated)
              </span>

              <div className="space-y-2.5">
                {FRESHBASKET_HUBS.map(hub => {
                  const isClosest = hub.id === userLocation.nearestHub?.id;
                  const dist = calculateDistanceKm(userLocation.lat || 31.5204, userLocation.lon || 74.3587, hub.lat, hub.lon);

                  return (
                    <div
                      key={hub.id}
                      className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isClosest
                          ? 'bg-brand-950/80 border-brand-500/80 ring-2 ring-brand-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-white">{hub.name}</span>
                          {isClosest && (
                            <span className="bg-brand-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              Nearest Hub
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400">{hub.address}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sm text-brand-300 block">{dist} km</span>
                        <span className="text-[10px] text-stone-400">~{Math.round(10 + dist * 3)}m transit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Geoapify Live Static Map Preview */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block">
                Doorstep Coverage Map Preview
              </span>

              <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-stone-800 aspect-[16/10] shadow-2xl">
                <img
                  src={getStaticMapUrl({
                    lat: userLocation.lat || 31.5204,
                    lon: userLocation.lon || 74.3587,
                    width: 700,
                    height: 450,
                    zoom: 13
                  })}
                  alt="Geoapify Radar Map"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />

                <div className="absolute bottom-3 left-3 right-3 bg-stone-950/85 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <strong className="text-white block text-xs">GPS Geotag: {userLocation.suburb || userLocation.city}</strong>
                      <span className="text-[10px] text-stone-400">Serving from {userLocation.nearestHub?.name}</span>
                    </div>
                  </div>
                  <span className="text-brand-300 font-mono text-[11px] font-bold">Geoapify Verified</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Verified Customer Feedback */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Verified Doorstep Reviews</span>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900">
              Loved by Health-Conscious Households
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Real reviews from customers who inspected our produce upon arrival
            </p>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="self-start sm:self-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>+ Add Your Doorstep Review</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Submitted Reviews */}
          {userReviews.map((rev) => (
            <div key={rev.id} className="bg-white p-6 rounded-3xl border-2 border-brand-300 shadow-md space-y-3 animate-fade-in relative">
              <span className="absolute -top-2.5 right-4 bg-brand-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                New Customer Review
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
                <span className="text-xs text-stone-400 font-bold ml-1">{rev.rating}.0</span>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                "{rev.comment}"
              </p>
              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <div>
                  <strong className="text-stone-900 block font-bold">{rev.author}</strong>
                  <span className="text-stone-400 text-[10px]">{rev.produceName} • {rev.location}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              </div>
            </div>
          ))}

          {/* Featured Community Reviews */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
              <span className="text-xs text-stone-400 font-bold ml-1">5.0</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "The crispness of the Swat Honeycrisp apples is out of this world! You can immediately tell they were harvested just this morning. Delivery guy let me check everything before paying COD."
            </p>
            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <div>
                <strong className="text-stone-900 block font-bold">Ayesha Khan</strong>
                <span className="text-stone-400 text-[10px]">DHA Phase 3, Lahore</span>
              </div>
              <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
              <span className="text-xs text-stone-400 font-bold ml-1">5.0</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "Real Multani Chaunsa without any chemical carbide aftertaste. Rich aromatic fragrance filled the kitchen. Knowing 85% of payment goes to the grower makes it even better."
            </p>
            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <div>
                <strong className="text-stone-900 block font-bold">Khurram Shehzad</strong>
                <span className="text-stone-400 text-[10px]">Gulberg III, Lahore</span>
              </div>
              <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500" />
              ))}
              <span className="text-xs text-stone-400 font-bold ml-1">5.0</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              "The hydroponic baby spinach was still dewy. Being able to choose 500g instead of being forced into 1kg packs saved us from waste. Truly a 10/10 platform."
            </p>
            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <div>
                <strong className="text-stone-900 block font-bold">Dr. Fatima Mir</strong>
                <span className="text-stone-400 text-[10px]">Model Town, Lahore</span>
              </div>
              <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-heading font-bold text-lg text-stone-900">Add Doorstep Customer Review</h3>
                <p className="text-xs text-stone-500">Share your freshness inspection feedback</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHomeSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Produce Harvest Item</label>
                <select
                  value={reviewProdId}
                  onChange={(e) => setReviewProdId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border rounded-xl font-medium outline-none focus:border-brand-500"
                >
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.farm_origin})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Overall Star Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border rounded-xl font-bold text-amber-600 outline-none focus:border-brand-500"
                  >
                    <option value="5">★★★★★ 5.0 (Outstanding)</option>
                    <option value="4">★★★★☆ 4.0 (Very Good)</option>
                    <option value="3">★★★☆☆ 3.0 (Average)</option>
                    <option value="2">★★☆☆☆ 2.0 (Fair)</option>
                    <option value="1">★☆☆☆☆ 1.0 (Poor)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Freshness Inspection Grade</label>
                  <select
                    value={reviewFreshness}
                    onChange={(e) => setReviewFreshness(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border rounded-xl font-semibold outline-none focus:border-brand-500"
                  >
                    <option value="5">Grade A+ (Dawn Picked)</option>
                    <option value="4">Grade A (Very Fresh)</option>
                    <option value="3">Grade B (Standard)</option>
                  </select>
                </div>
              </div>

              {!isAuthenticated && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    required
                    placeholder="e.g. Ali Shan"
                    className="w-full p-2.5 bg-stone-50 border rounded-xl outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">Your Doorstep Inspection Comments</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  placeholder="Describe produce aroma, taste, firmness, and rider handling on delivery..."
                  className="w-full p-2.5 bg-stone-50 border rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-stone-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-600/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingReview ? 'Publishing...' : 'Publish Doorstep Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
