import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Leaf,
  Scale,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
            <Sprout className="w-3.5 h-3.5" />
            Our Mission & Agricultural Heritage
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight text-white mb-6">
            Purity You Can Taste, <br className="hidden sm:inline" />
            <span className="text-emerald-400">Direct From Soil To Spoon.</span>
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            FreshBasket revolutionizes grocery shopping by replacing prolonged wholesale storage with an agile 24-hour harvest-to-table cold chain. No chemical ripening, no shelf wilting — just pure orchard vitality.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-neutral-900 mb-2">24-Hour Express Inbound</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Produce is picked at dawn from regional organic partners and sorted in temperature-stabilized hubs within hours of sunrise.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-neutral-900 mb-2">Double QA Inspection</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Every batch undergoes strict grading checks for natural Brix sugar density, skin firmness, and freedom from synthetic wax coating.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-neutral-900 mb-2">Direct Farmer Prosperity</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              We eliminate predatory middleman commissions, ensuring growers receive fair market rates while customers pay lower everyday prices.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 block">
              Behind The Basket
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-neutral-900 mb-6">
              Why We Disrupted The Traditional Grocery Mandi System
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              <p>
                In standard supply chains, fruits and vegetables spend 4 to 7 days traveling through middlemen auctions, open-air wholesale mandis, and ambient roadside stalls. During this journey, produce loses up to 45% of its natural vitamins, flavor compounds, and moisture.
              </p>
              <p>
                FreshBasket connects progressive farmers directly with urban households through a modern web marketplace. By integrating inventory forecasting with scheduled farm dispatches, our produce arrives crisp, vibrant, and packed with full nutritional vitality.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {[
                'Zero chemical calcium-carbide forced ripening',
                'Transparent origin tags showing exact farm region and grower',
                'Eco-friendly biodegradable and recyclable kraft packaging',
                'Unconditional freshness guarantee with instant refund policy'
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all"
              >
                Explore Today's Harvest
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80"
                alt="Fresh farm produce harvest"
                className="w-full h-[400px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-neutral-100 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  99%
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Purity Rating</p>
                  <p className="text-[11px] text-neutral-500">Based on 2,500+ verified customer orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Project Accreditation */}
        <div className="bg-gradient-to-r from-neutral-900 to-emerald-950 rounded-3xl p-8 sm:p-10 text-white border border-neutral-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-3">
                Academic Capstone Architecture
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white mb-2">
                FreshBasket: Online Grocery & Agricultural Logistics Platform
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
                Engineered as a comprehensive full-stack enterprise project adhering strictly to the Virtual University of Pakistan Software Requirements Specification.
              </p>
            </div>

            <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-5 shrink-0 text-xs space-y-2">
              <p className="text-neutral-400">Project Metadata:</p>
              <p className="font-semibold text-white">Group ID: <span className="font-mono text-emerald-400">F26PROJECT56E94</span></p>
              <p className="font-semibold text-white">Student ID: <span className="font-mono text-emerald-400">BC250206138</span></p>
              <p className="font-semibold text-white">Supervisor: <span className="text-emerald-300">Muhammad Hassaan</span></p>
              <p className="text-[11px] text-neutral-400 font-mono">m.hassaan@vu.edu.pk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
