import React from 'react';
import { Link } from 'react-router-dom';
import { Apple, ShieldCheck, Truck, Sparkles, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 mt-auto border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800 text-xs">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-extrabold text-2xl text-white">
                Fresh<span className="text-brand-400">Basket</span>
              </span>
            </Link>
            
            <p className="text-stone-400 max-w-sm leading-relaxed">
              The premier digital agricultural marketplace bridging organic local orchards directly to households. Delivering maximum freshness, zero middleman delay, and reliable Cash on Delivery (COD).
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="font-mono text-[11px] bg-stone-800 text-brand-300 px-3 py-1 rounded-full border border-stone-700">
                🌱 FreshBasket React Architecture
              </span>
            </div>
          </div>

          {/* Quick Marketplace Links */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white font-heading">Marketplace</h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link to="/shop" className="hover:text-white transition">All Fresh Produce</Link></li>
              <li><Link to="/shop?category=fruits" className="hover:text-white transition">Orchard Fruits</Link></li>
              <li><Link to="/shop?category=vegetables" className="hover:text-white transition">Crisp Vegetables</Link></li>
              <li><Link to="/shop?category=leafy-greens" className="hover:text-white transition">Leafy Greens</Link></li>
              <li><Link to="/shop?category=organic" className="hover:text-white transition">100% Bio-Organic</Link></li>
            </ul>
          </div>

          {/* System & Features */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white font-heading">Platform Features</h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link to="/track-order" className="hover:text-white transition">5-Stage Live Fulfillment Radar</Link></li>
              <li><Link to="/complaint" className="text-emerald-400 hover:text-emerald-300 font-bold transition">File Quality Dispute / Complaint</Link></li>
              <li><Link to="/shop" className="hover:text-white transition">Fractional Unit Pricing</Link></li>
              <li><Link to="/account?tab=addresses" className="hover:text-white transition">Multi-Address Book</Link></li>
              <li><Link to="/admin" className="hover:text-white transition">Admin Quality Inspection Hub</Link></li>
              <li><Link to="/supplier" className="hover:text-white transition">Farmer Supplier Portal</Link></li>
            </ul>
          </div>

          {/* Academic Supervision */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-white font-heading">Academic Project</h4>
            <div className="p-3 bg-stone-800/90 rounded-2xl border border-stone-700/80 space-y-1.5 text-[11px]">
              <p><strong className="text-white">Institution:</strong> Virtual University</p>
              <p><strong className="text-white">Supervisor:</strong> Muhammad Hassaan</p>
              <p><strong className="text-white">Email:</strong> m.hassaan@vu.edu.pk</p>
              <p><strong className="text-white">Deliverable:</strong> React Full-Stack</p>
            </div>
          </div>

        </div>

        {/* Trust Badges & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 FreshBasket. Built with React, Vite, Tailwind CSS, Express & SQLite.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 100% Quality Inspected
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <Truck className="w-4 h-4" /> Cash on Delivery (COD)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <HeartHandshake className="w-4 h-4" /> Fair-Trade Local Sourcing
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
