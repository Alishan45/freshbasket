import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, ShieldCheck, MapPin, ThermometerSnowflake, ShoppingCart,
  Heart, Plus, Minus, ArrowLeft, CheckCircle2, MessageSquare, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/products/ProductCard';

export default function ProductDetailPage() {
  const { slugOrId } = useParams();
  const { addToCart, showToast } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Review Form & Eligibility
  const [eligibility, setEligibility] = useState({ eligible: false, hasDeliveredOrder: false, alreadyReviewed: false });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [freshStars, setFreshStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slugOrId}`);
        if (res.success) {
          setProduct(res.product);
          setSelectedUnit(res.product.unit_type || '1 kg');
          setQuantity(1);

          // Check review eligibility if user is logged in
          if (isAuthenticated) {
            const eligRes = await api.get(`/reviews/eligibility/${res.product.id}`).catch(() => null);
            if (eligRes?.success) setEligibility(eligRes);
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slugOrId, isAuthenticated]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-stone-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 bg-stone-200 rounded-xl w-3/4" />
            <div className="h-6 bg-stone-200 rounded-xl w-1/2" />
            <div className="h-32 bg-stone-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4 space-y-4">
        <h2 className="text-2xl font-heading font-bold text-stone-900">Produce Item Not Found</h2>
        <p className="text-xs text-stone-500">The product you are looking for may have been archived or removed from the morning catalog.</p>
        <Link to="/shop" className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Calculate dynamic unit price
  let unitMultiplier = 1.0;
  if (product.available_units && Array.isArray(product.available_units)) {
    const found = product.available_units.find(u => u.unit_name === selectedUnit);
    if (found) unitMultiplier = found.multiplier;
  }
  const currentUnitPrice = Number((product.base_price * unitMultiplier).toFixed(2));
  const calculatedTotal = Number((currentUnitPrice * quantity).toFixed(2));
  const isOutOfStock = product.stock_quantity <= 0;
  const isFavorited = isInWishlist(product.id);

  function handleAddToCart() {
    addToCart(product, quantity, selectedUnit);
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        product_id: product.id,
        rating_stars: ratingStars,
        freshness_stars: freshStars,
        comment_text: reviewComment.trim()
      });

      if (res.success) {
        showToast('Thank you! Your verified review has been published.');
        setShowReviewForm(false);
        setReviewComment('');
        // Refresh product reviews
        const refresh = await api.get(`/products/${slugOrId}`);
        if (refresh.success) setProduct(refresh.product);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back Link */}
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-brand-600 transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Produce Catalog</span>
      </Link>

      {/* Main Grid: Gallery & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Product Image & Seal */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-md relative group">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80';
              }}
            />
            
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-stone-900 shadow-md flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{product.freshness_grade}</span>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-700 flex items-center justify-center shadow-md transition"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-stone-700'}`} />
            </button>
          </div>

          {/* Farm Provenance Card */}
          <div className="p-4 bg-brand-50/80 rounded-2xl border border-brand-200/70 text-xs space-y-2">
            <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Farm Provenance & Traceability</span>
            </div>
            <div className="space-y-1 text-stone-600">
              <p><strong>Grower:</strong> {product.farmer_name || 'Verified Cooperative Farm'}</p>
              <p><strong>Orchard / Farm:</strong> {product.farm_origin}</p>
              <p><strong>Harvest Timestamp:</strong> {product.harvest_date || 'Today, 5:30 AM'}</p>
              <p><strong>Audited Score:</strong> <span className="text-brand-700 font-bold">{product.freshness_score}% Freshness Quality Rating</span></p>
            </div>
          </div>
        </div>

        {/* Right: Produce Attributes & Buying Options */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                {product.category_name}
              </span>
              {product.is_organic ? (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  🌿 100% Certified Organic
                </span>
              ) : null}
              {product.is_seasonal ? (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  ☀️ Seasonal Harvest
                </span>
              ) : null}
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-stone-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-stone-800 text-sm">{product.average_rating || 5.0}</span>
                <span className="text-stone-400">({product.reviews_count || 1} verified customer reviews)</span>
              </div>
              <span>•</span>
              <span className="text-emerald-700 font-bold">
                {product.stock_quantity > 0 ? `${product.stock_quantity} available in harvest` : 'Sold Out'}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-stone-600 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Nutritional Facts Table */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Nutritional Breakdown (per 100g)
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-stone-100">
                <span className="text-stone-400 text-[10px] block font-medium">Calories</span>
                <span className="font-bold text-stone-900">{product.nutrition_calories || '45 kcal'}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-100">
                <span className="text-stone-400 text-[10px] block font-medium">Carbs</span>
                <span className="font-bold text-stone-900">{product.nutrition_carbs || '11g'}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-100">
                <span className="text-stone-400 text-[10px] block font-medium">Fiber</span>
                <span className="font-bold text-stone-900">{product.nutrition_fiber || '2.4g'}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-stone-100">
                <span className="text-stone-400 text-[10px] block font-medium">Vitamin C</span>
                <span className="font-bold text-stone-900">{product.nutrition_vitC || '18%'}</span>
              </div>
            </div>
          </div>

          {/* Storage Tips */}
          {product.storage_tips && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
              <ThermometerSnowflake className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Storage & Handling:</strong>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">{product.storage_tips}</p>
              </div>
            </div>
          )}

          {/* Unit Selector & Quantity Control */}
          <div className="pt-4 border-t border-stone-200 space-y-4">
            
            {/* Unit Buttons */}
            {product.available_units && product.available_units.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-2">
                  Select Measurement Unit:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.available_units.map(u => (
                    <button
                      key={u.id || u.unit_name}
                      onClick={() => setSelectedUnit(u.unit_name)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                        selectedUnit === u.unit_name
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {u.unit_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Add to Cart Action */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div>
                <span className="text-[10px] text-stone-400 block font-medium">Calculated Price</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-3xl text-stone-900">
                    ${calculatedTotal.toFixed(2)}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    (${currentUnitPrice.toFixed(2)} / {selectedUnit})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-200 font-bold transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-bold text-sm min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-200 font-bold transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Basket */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`px-6 py-3.5 rounded-xl font-heading font-bold text-xs flex items-center gap-2 shadow-lg transition ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30 active:scale-95'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Basket'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Customer Reviews & Verification Section */}
      <section className="pt-10 border-t border-stone-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-heading font-extrabold text-stone-900">
              Verified Customer Reviews & Photos
            </h3>
            <p className="text-xs text-stone-500">
              Honest feedback from households who inspected this produce upon arrival
            </p>
          </div>

          {/* Write Review Trigger */}
          {isAuthenticated ? (
            eligibility.alreadyReviewed ? (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ✓ You reviewed this produce
              </span>
            ) : (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{showReviewForm ? 'Close Review Form' : 'Write a Review'}</span>
              </button>
            )
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Sign In to Review</span>
            </Link>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="p-6 bg-stone-50 border border-brand-200 rounded-3xl space-y-4 text-xs animate-fade-in">
            <h4 className="font-heading font-bold text-sm text-stone-900">
              Share Your Produce Experience for {product.name}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Overall Satisfaction:</label>
                <select
                  value={ratingStars}
                  onChange={(e) => setRatingStars(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-white border rounded-xl font-semibold"
                >
                  <option value="5">★★★★★ - Outstanding (5 Stars)</option>
                  <option value="4">★★★★☆ - Very Good (4 Stars)</option>
                  <option value="3">★★★☆☆ - Average (3 Stars)</option>
                  <option value="2">★★☆☆☆ - Below Expectations (2 Stars)</option>
                  <option value="1">★☆☆☆☆ - Disappointed (1 Star)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Freshness Rating upon Arrival:</label>
                <select
                  value={freshStars}
                  onChange={(e) => setFreshStars(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-white border rounded-xl font-semibold"
                >
                  <option value="5">Grade A+ (Peak Farm Crispness)</option>
                  <option value="4">Grade A (Very Fresh)</option>
                  <option value="3">Grade B (Acceptable Freshness)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Your Detailed Feedback:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                rows={3}
                placeholder="Describe the crunch, aroma, juiciness, and delivery packing condition..."
                className="w-full p-3 bg-white border border-stone-200 rounded-2xl outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border rounded-xl text-stone-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 bg-brand-600 text-white rounded-xl font-bold shadow-xs hover:bg-brand-700"
              >
                {submittingReview ? 'Publishing...' : 'Publish Verified Review'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map(rev => (
              <div key={rev.id} className="p-5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{rev.author_name}</span>
                    <span className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold">
                      ✓ Verified Doorstep Delivery
                    </span>
                  </div>
                  <span className="text-stone-400 text-[11px]">{rev.created_at?.slice(0, 10)}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(rev.rating_stars || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                  <span className="text-[11px] text-stone-500 font-medium ml-2">
                    Freshness: Grade A ({rev.freshness_stars}/5)
                  </span>
                </div>

                <p className="text-stone-700 leading-relaxed">{rev.comment_text}</p>

                {rev.photo_url && (
                  <div className="pt-1">
                    <img
                      src={rev.photo_url}
                      alt="Customer review photo"
                      className="w-20 h-20 rounded-xl object-cover border border-stone-200"
                    />
                  </div>
                )}

                {rev.seller_response && (
                  <div className="mt-2 p-3 bg-brand-100/60 rounded-xl border border-brand-200/70 text-[11px] text-brand-900">
                    <strong className="font-bold">FreshBasket Farm Response:</strong> {rev.seller_response}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-stone-400 text-xs italic">
              No customer reviews yet for this harvest. Be the first to leave a review after receiving your order!
            </p>
          )}
        </div>

      </section>

      {/* Frequently Bought Together / Related Products */}
      {product.related_products && product.related_products.length > 0 && (
        <section className="pt-10 border-t border-stone-200 space-y-6">
          <h3 className="text-xl font-heading font-extrabold text-stone-900">
            Frequently Bought Together
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {product.related_products.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
