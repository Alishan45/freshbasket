import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Truck, Banknote } from 'lucide-react';

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does Cash on Delivery (COD) and doorstep inspection work?',
      a: 'With FreshBasket, you never pay before seeing your produce. When our insulated delivery van arrives, our rider presents your fruits and vegetables in cushioned crates. You can physically verify the crispness, color, and aroma. Only after you are 100% satisfied do you tender payment in cash or card.'
    },
    {
      q: 'How does FreshBasket maintain 0-day warehouse storage?',
      a: 'We eliminate central distribution warehouses. Produce is harvested by partner orchards at 5:00 AM, inspected at our regional farm consolidation hubs by 7:00 AM, and dispatched in express temperature-controlled slots to your doorstep on the exact same day.'
    },
    {
      q: 'Can I purchase custom fractional units like 250g or 500g?',
      a: 'Yes! Unlike standard grocery apps that force you to buy full kilograms, our dynamic measurement unit selector supports fractional weights (250g, 500g, dozens, bundles, pieces) with transparent proportional pricing.'
    },
    {
      q: 'What happens if an item does not meet my quality expectations?',
      a: 'Our doorstep guarantee gives you immediate refusal rights. If any fruit or vegetable does not meet Grade A+ crispness upon inspection, our rider deducts that item immediately from your COD bill.'
    },
    {
      q: 'How are local farmers supported by FreshBasket?',
      a: 'By eliminating intermediate wholesale mandi brokers and secondary middlemen, over 85% of each rupee/dollar goes directly to the growers within 24 hours of harvest.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Help & Answers</span>
        <h1 className="text-3xl font-heading font-extrabold text-stone-900">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-stone-500">Everything you need to know about farm-direct produce ordering</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs transition"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full p-5 text-left flex items-center justify-between font-heading font-bold text-sm text-stone-900 hover:text-brand-700"
            >
              <span>{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${openIdx === idx ? 'rotate-180 text-brand-600' : ''}`} />
            </button>
            {openIdx === idx && (
              <div className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
