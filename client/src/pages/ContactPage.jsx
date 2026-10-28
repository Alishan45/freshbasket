import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Headphones
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
    order_id: '',
    category: 'General Inquiry',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (user) {
        await api.post('/complaints', {
          order_id: form.order_id ? parseInt(form.order_id) : null,
          subject: `[${form.category}] ${form.subject || 'Customer Inquiry'}`,
          description: `Contact: ${form.name} (${form.phone}, ${form.email})\n\n${form.message}`
        });
      }

      setSuccessMsg('Thank you! Your inquiry has been dispatched to our fulfillment care desk. A fresh produce specialist will reach out within 2 hours.');
      setForm({
        name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone_number || '',
        order_id: '',
        category: 'General Inquiry',
        subject: '',
        message: ''
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch ticket. Please contact our direct line.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">
      {/* Header */}
      <div className="bg-emerald-950 text-white py-14 border-b border-emerald-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
            <Headphones className="w-3.5 h-3.5" />
            24/7 Quality & Logistics Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white mb-3">
            How Can FreshBasket Assist You?
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl mx-auto">
            Have questions regarding morning delivery slots, organic farm certifications, or an existing order? Our team is at your service.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
              <h2 className="text-base font-bold font-heading text-neutral-900 border-b border-neutral-100 pb-3">
                Direct Contact Points
              </h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Customer Hotline</p>
                  <a href="tel:+923008472910" className="text-sm font-bold text-neutral-900 hover:text-emerald-600 transition-colors">
                    +92 300 8472910
                  </a>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Mon–Sun: 6:00 AM – 11:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email Support</p>
                  <a href="mailto:support@freshbasket.com" className="text-sm font-bold text-neutral-900 hover:text-emerald-600 transition-colors">
                    support@freshbasket.com
                  </a>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Average response under 60 mins</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Central Cold-Chain Hub</p>
                  <p className="text-sm font-bold text-neutral-900">
                    FreshBasket Fulfillment Hub 01
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Sector Y, Phase 3, DHA / Bedian Agri Corridor, Lahore
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Delivery Windows</p>
                  <p className="text-xs text-neutral-700 font-medium">Slot 1: 07:00 AM - 10:00 AM</p>
                  <p className="text-xs text-neutral-700 font-medium">Slot 2: 11:00 AM - 02:00 PM</p>
                  <p className="text-xs text-neutral-700 font-medium">Slot 3: 05:00 PM - 08:30 PM</p>
                </div>
              </div>
            </div>

            {/* Quick FAQ card */}
            <div className="bg-emerald-900 text-white rounded-3xl p-6 border border-emerald-800">
              <div className="flex items-center gap-2 mb-2 text-emerald-300">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Need Fast Answers?</h3>
              </div>
              <p className="text-xs text-emerald-200/80 mb-4 leading-relaxed">
                Check our detailed knowledge base for delivery areas, cold storage methods, and return guarantees.
              </p>
              <Link
                to="/faq"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Visit Help & FAQ Section
              </Link>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm">
            <h2 className="text-xl font-bold font-heading text-neutral-900 mb-1">Send Us a Direct Message</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6">
              Fill out the form below. If your message is regarding an existing delivery, please supply your order number.
            </p>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Message Dispatched</p>
                  <p className="mt-0.5">{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Submission Notice</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Ali Shan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="you@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.order_id}
                    onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="FB-10482"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Inquiry Topic
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Produce Freshness">Produce Quality / Freshness</option>
                    <option value="Delivery Delay">Delivery Logistics / Timing</option>
                    <option value="Supplier Partnership">Grower / Farmer Partnership</option>
                    <option value="Refund Request">Refund / Replacement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Summary of your inquiry or feedback"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Detailed Message *
                </label>
                <textarea
                  rows="4"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Please describe how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Transmitting Ticket...' : 'Dispatch Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
