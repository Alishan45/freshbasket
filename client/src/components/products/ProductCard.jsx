import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Plus, Heart, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const defaultUnit = product.unit_type || '1 kg';
  const [selectedUnit, setSelectedUnit] = useState(defaultUnit);

  // Compute price based on selected unit
  let unitMultiplier = 1.0;
  if (product.available_units && Array.isArray(product.available_units)) {
    const found = product.available_units.find(u => u.unit_name === selectedUnit);
    if (found) unitMultiplier = found.multiplier;
  }
  const currentPrice = Number((product.base_price * unitMultiplier).toFixed(2));

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, selectedUnit);
  }

  function handleToggleHeart(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      
      {/* Image & Badges */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <Link to={`/product/${product.slug || product.id}`}>
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-stone-900 shadow-xs flex items-center gap-1 backdrop-blur-xs">
            <span className={`w-2 h-2 rounded-full ${product.freshness_score >= 98 ? 'bg-emerald-500 animate-pulse' : 'bg-brand-500'}`} />
            {product.freshness_grade}
          </span>

          {product.is_organic ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600/90 text-white shadow-xs backdrop-blur-xs">
              🌿 100% Organic
            </span>
          ) : null}

          {product.is_seasonal ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-white shadow-xs backdrop-blur-xs">
              ☀️ Seasonal
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleHeart}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-600 flex items-center justify-center shadow-md transition"
          title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
        </button>

        {/* Stock Status Pill */}
        <div className="absolute bottom-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-red-600 text-white shadow-xs">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
              Only {product.stock_quantity} left!
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-stone-900/70 text-white backdrop-blur-xs">
              {product.stock_quantity} available
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Farm Origin & Category */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium mb-1">
            <span className="text-brand-700 font-bold uppercase tracking-wider">
              {product.category_name || 'Produce'}
            </span>
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="truncate">{product.farm_origin}</span>
            </span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug || product.id}`}>
            <h3 className="font-heading font-bold text-base text-stone-900 group-hover:text-brand-600 transition line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Rating & Harvest timestamp */}
          <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-bold text-stone-800">{product.average_rating || 5.0}</span>
              <span className="text-stone-400 text-[10px]">({product.reviews_count || 1})</span>
            </div>
            <span className="text-[11px] text-stone-400 truncate max-w-[130px]">
              {product.harvest_date || 'Today'}
            </span>
          </div>
        </div>

        {/* Pricing, Unit Picker & Action */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          
          <div>
            {product.available_units && product.available_units.length > 1 ? (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 py-1 px-1.5 rounded-lg outline-none cursor-pointer mb-0.5 border border-stone-200"
              >
                {product.available_units.map((u, idx) => (
                  <option key={u.id || u.unit_name || u.name || idx} value={u.unit_name || u.name}>
                    {u.unit_name || u.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] text-stone-400 block font-medium">Per {selectedUnit}</span>
            )}
            
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-extrabold text-lg sm:text-xl text-stone-900">
                ${currentPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20 active:scale-95'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
          </button>

        </div>

      </div>

    </div>
  );
}
