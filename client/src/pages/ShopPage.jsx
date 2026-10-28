import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal, Search, X, ShieldCheck, DollarSign,
  Grid, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/products/ProductCard';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters from query params
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState(10);
  const [freshOnly, setFreshOnly] = useState(false);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [seasonalOnly, setSeasonalOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Sync category & search when URL parameters change
  useEffect(() => {
    const qCat = searchParams.get('category') || 'all';
    const qSearch = searchParams.get('search') || '';
    setCategory(qCat);
    setSearch(qSearch);
  }, [searchParams]);

  // Load Categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        if (res.success) setCategories(res.categories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch filtered products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = {
          category: category !== 'all' ? category : undefined,
          search: search.trim() ? search.trim() : undefined,
          maxPrice: maxPrice < 10 ? maxPrice : undefined,
          organic: organicOnly ? true : undefined,
          seasonal: seasonalOnly ? true : undefined,
          inStock: inStockOnly ? true : undefined,
          freshness: freshOnly ? 'Today' : undefined,
          sort: sortBy
        };

        const res = await api.get('/products', params);
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Failed to fetch filtered products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, search, maxPrice, organicOnly, seasonalOnly, inStockOnly, freshOnly, sortBy]);

  function handleResetFilters() {
    setCategory('all');
    setSearch('');
    setMaxPrice(10);
    setFreshOnly(false);
    setOrganicOnly(false);
    setSeasonalOnly(false);
    setInStockOnly(true);
    setSortBy('featured');
    setSearchParams({});
  }

  function handleCategoryClick(catSlug) {
    setCategory(catSlug);
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      if (catSlug === 'all') updated.delete('category');
      else updated.set('category', catSlug);
      return updated;
    });
  }

  const hasActiveFilters = category !== 'all' || search !== '' || maxPrice < 10 || organicOnly || seasonalOnly || freshOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900">
            Farm-Fresh Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Showing <strong className="text-brand-700 font-bold">{products.length}</strong> items sorted by freshness & customer demand
          </p>
        </div>

        {/* Controls: Search, Sort, Mobile Filter */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search produce..."
              className="pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:border-brand-500 focus:outline-none w-48 sm:w-56"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs shadow-xs">
            <span className="text-stone-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-stone-800 outline-none cursor-pointer"
            >
              <option value="featured">Featured & Freshness</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-stone-100 rounded-xl text-xs font-bold text-stone-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>

          {/* Reset All Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-stone-500 hover:text-brand-600 underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 pt-6 items-start">
        
        {/* Sidebar Filters */}
        <aside className={`${showMobileFilter ? 'block' : 'hidden'} md:block md:col-span-1 space-y-6`}>
          
          {/* Category Filter Card */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-brand-600" />
              <span>Category</span>
            </h3>

            <div className="space-y-1 text-xs font-medium">
              <label
                onClick={() => handleCategoryClick('all')}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${category === 'all' ? 'bg-brand-50 text-brand-800 font-bold' : 'hover:bg-stone-50 text-stone-700'}`}
              >
                <span>All Produce</span>
                <span className="text-[10px] text-stone-400 font-mono">14</span>
              </label>

              {categories.map(cat => (
                <label
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${category === cat.slug ? 'bg-brand-50 text-brand-800 font-bold' : 'hover:bg-stone-50 text-stone-700'}`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-stone-400 font-mono">{cat.product_count || ''}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Freshness & Badges Filter */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Quality & Certifications</span>
            </h3>

            <div className="space-y-2 font-medium">
              <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freshOnly}
                  onChange={(e) => setFreshOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Grade A+ (Picked Today)
                </span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={organicOnly}
                  onChange={(e) => setOrganicOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  100% Certified Organic
                </span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seasonalOnly}
                  onChange={(e) => setSeasonalOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Seasonal Harvest
                </span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-stone-700">In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-600" />
                <span>Max Price</span>
              </h3>
              <span className="text-xs font-bold text-brand-700 font-mono">
                ${maxPrice.toFixed(2)}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>$1.00</span>
              <span>$5.00</span>
              <span>$10.00</span>
            </div>
          </div>

        </aside>

        {/* Product Cards Grid */}
        <section className="col-span-1 md:col-span-3 lg:col-span-4">
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-stone-200 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-lg text-stone-900">
                No Farm Produce Matches Your Filters
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                Try loosening your price filter, search terms, or category selections.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </section>

      </div>

    </div>
  );
}
