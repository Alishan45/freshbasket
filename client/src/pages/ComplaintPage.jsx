import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert, Send, CheckCircle2, Search, Clock, Mail, Phone,
  FileText, AlertTriangle, ArrowRight, Copy, Check, MessageSquare,
  HelpCircle, RefreshCw, Sparkles, ShieldCheck, HeartHandshake
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ComplaintPage() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useCart();

  // Extract query parameters if routed from order confirmation / tracking e.g. /complaint?order=FB-88219
  const params = new URLSearchParams(location.search);
  const prefilledOrder = params.get('order') || '';

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'track'
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [orderNumber, setOrderNumber] = useState(prefilledOrder);
  const [category, setCategory] = useState('Produce Freshness & Quality');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Ticket Lookup State
  const [trackTicketInput, setTrackTicketInput] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [trackError, setTrackError] = useState(null);

  // User Recent Orders for easy selection
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone_number || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/orders/my')
        .then(res => {
          if (res.success && res.orders) {
            setRecentOrders(res.orders.slice(0, 5));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const categories = [
    { id: 'Produce Freshness & Quality', label: '🍎 Freshness & Bruised Produce', desc: 'Overripe, damaged, or poor grade fruits & greens' },
    { id: 'Cold-Chain & Delivery Delay', label: '⏱️ Delivery Delay / Cold-Chain', desc: 'Late arrival, ambient temperature, packaging breach' },
    { id: 'Missing or Swapped Items', label: '📦 Missing / Swapped Items', desc: 'Item not in crate or incorrect weight delivered' },
    { id: 'Payment & Cash on Delivery', label: '💳 Payment / COD Discrepancy', desc: 'Overcharge, courier change issue, or receipt error' },
    { id: 'Courier Conduct & Handling', label: '🚚 Courier Conduct & Transit', desc: 'Rider courtesy, rough handling of fresh crate' },
    { id: 'General Feedback & Inquiry', label: '💬 General Inquiry & Feedback', desc: 'Suggestion, account help, or sourcing question' }
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      showToast('Please fill all required fields (Name, Email, Subject, and Details).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/complaints', {
        name,
        email,
        phone,
        order_number: orderNumber,
        category,
        subject,
        message,
        attachment_url: attachmentUrl
      });

      if (res.success) {
        setSubmittedTicket({
          ticket_number: res.ticket_number,
          email,
          subject,
          category,
          order_number: orderNumber,
          message
        });
        showToast(res.message);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookupTicket(e) {
    e.preventDefault();
    if (!trackTicketInput.trim()) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedComplaint(null);

    try {
      const res = await api.get(`/complaints/track/${encodeURIComponent(trackTicketInput.trim())}`);
      if (res.success && res.complaint) {
        setTrackedComplaint(res.complaint);
      }
    } catch (err) {
      setTrackError(err.message || 'Ticket not found. Please verify your reference number.');
    } finally {
      setTrackingLoading(false);
    }
  }

  function handleCopyTicket() {
    if (submittedTicket?.ticket_number) {
      navigator.clipboard.writeText(submittedTicket.ticket_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Ticket number copied to clipboard!');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/30 text-brand-200 border border-brand-400/30">
            <ShieldCheck className="w-4 h-4 text-brand-300" />
            <span>100% Doorstep Freshness & Resolution Guarantee</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
            Customer Dispute & Quality Care Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            If your morning harvest harvest arrived bruised, delayed, or missing, we are here to make it right. Every dispute is reviewed directly by our Quality Assurance Supervisor, with free doorstep replacements or instant refunds dispatched within 2-4 hours.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-brand-200">
            <span className="flex items-center gap-1.5 font-semibold">
              <Mail className="w-4 h-4 text-brand-300" />
              <span>Direct Support: muzammilshabbircs01@gmail.com</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-brand-300" />
              <span>SLA Resolution: 2 to 4 Business Hours</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex bg-stone-100 p-1.5 rounded-2xl text-xs sm:text-sm font-bold max-w-md">
        <button
          onClick={() => { setActiveTab('new'); setSubmittedTicket(null); }}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'new' ? 'bg-white text-brand-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>File Dispute</span>
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'track' ? 'bg-white text-brand-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Track Ticket Status</span>
        </button>
      </div>

      {/* TAB 1: SUBMIT NEW COMPLAINT */}
      {activeTab === 'new' && (
        <>
          {submittedTicket ? (
            /* Success Confirmation View */
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-lg text-center space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ticket Dispatched Successfully</span>
                <h2 className="text-2xl font-heading font-extrabold text-stone-900">
                  Your Dispute Has Been Logged
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                  An official confirmation email has been sent to <strong className="text-stone-900 font-mono">{submittedTicket.email}</strong>. Our quality supervisor is already reviewing your batch details.
                </p>
              </div>

              {/* Ticket Code Card */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg mx-auto">
                <div className="text-left">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Official Ticket Reference</span>
                  <div className="font-mono font-extrabold text-xl sm:text-2xl text-brand-700">
                    #{submittedTicket.ticket_number}
                  </div>
                </div>

                <button
                  onClick={handleCopyTicket}
                  className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Ticket'}</span>
                </button>
              </div>

              {/* Dispute Details Summary */}
              <div className="p-5 bg-stone-50/70 border border-stone-200/80 rounded-2xl text-xs text-left space-y-2">
                <div className="flex justify-between py-1 border-b border-stone-200/50">
                  <span className="text-stone-500 font-medium">Dispute Category:</span>
                  <span className="font-bold text-stone-800">{submittedTicket.category}</span>
                </div>
                {submittedTicket.order_number && (
                  <div className="flex justify-between py-1 border-b border-stone-200/50">
                    <span className="text-stone-500 font-medium">Order Number:</span>
                    <span className="font-mono font-bold text-stone-800">{submittedTicket.order_number}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-stone-200/50">
                  <span className="text-stone-500 font-medium">Initial Status:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Open (Under Review)</span>
                </div>
                <div className="pt-2">
                  <span className="text-stone-500 font-medium block mb-1">Subject:</span>
                  <p className="font-semibold text-stone-900 bg-white p-3 rounded-xl border border-stone-100">
                    "{submittedTicket.subject}"
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSubmittedTicket(null);
                    setSubject('');
                    setMessage('');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
                >
                  Submit Another Inquiry
                </button>

                <button
                  onClick={() => {
                    setTrackTicketInput(submittedTicket.ticket_number);
                    setActiveTab('track');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Track This Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            /* Complaint Submission Form */
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-lg space-y-8">
              
              {/* Category Selector */}
              <div className="space-y-3">
                <div>
                  <label className="block font-heading font-extrabold text-stone-900 text-sm sm:text-base">
                    1. Select Dispute Category <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-stone-500">Pick the category that best matches your concern for prioritized routing</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          isSelected
                            ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20'
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <span className="font-heading font-bold text-xs sm:text-sm text-stone-900 block">{cat.label}</span>
                        <span className="text-[11px] text-stone-500 block mt-0.5 leading-snug">{cat.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Reference & Contact Fields */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Order Number Input */}
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Related Order Number <span className="text-stone-400 font-normal">(Optional if general inquiry)</span>
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. #FB-88219"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:bg-white focus:border-brand-500 outline-none"
                    />

                    {/* Quick Suggestions for recent orders */}
                    {recentOrders.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[10px] text-stone-400 font-semibold">Recent:</span>
                        {recentOrders.map(ro => (
                          <button
                            key={ro.id}
                            type="button"
                            onClick={() => setOrderNumber(ro.order_number)}
                            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-brand-50 hover:text-brand-700 text-stone-600 font-mono text-[10px] transition"
                          >
                            {ro.order_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Full Name */}
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ali Shan"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                    />
                  </div>

                  {/* Customer Email */}
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Email Address <span className="text-red-500">* (Dispute updates sent here)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. customer@example.com"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                    />
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Telephone / WhatsApp <span className="text-stone-400 font-normal">(For immediate supervisor call)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-brand-500 outline-none"
                    />
                  </div>

                </div>
              </div>

              {/* Subject & Detailed Message */}
              <div className="space-y-4 pt-4 border-t border-stone-100 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Dispute Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. 3 Honeycrisp Apples arrived bruised and overripe"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Detailed Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe what happened, batch inspection tags if visible, or any doorstep courier issues. Our team will verify batch records and resolve promptly."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs leading-relaxed focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Photo / Evidence Image URL <span className="text-stone-400 font-normal">(Optional: Unsplash or cloud image of produce)</span>
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-500 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Complaints are logged and dispatched to supervisor inbox instantly.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl font-heading font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email & Logging Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Dispute & Receive Email</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </>
      )}

      {/* TAB 2: TRACK TICKET STATUS */}
      {activeTab === 'track' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-lg space-y-6">
          <div className="max-w-xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-stone-900">
              Lookup Your Complaint Ticket
            </h2>
            <p className="text-xs text-stone-500">
              Enter your ticket reference code (e.g. <strong className="font-mono text-stone-700">#FB-TKT-59493</strong>) to view supervisor notes, inspection status, and resolution outcomes.
            </p>
          </div>

          <form onSubmit={handleLookupTicket} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackTicketInput}
                onChange={(e) => setTrackTicketInput(e.target.value)}
                placeholder="e.g. #FB-TKT-59493"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm font-mono font-bold focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-heading font-bold text-xs shadow-md transition shrink-0"
            >
              {trackingLoading ? 'Checking...' : 'Lookup'}
            </button>
          </form>

          {trackError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2 max-w-xl">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{trackError}</span>
            </div>
          )}

          {trackedComplaint && (
            <div className="border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-6 bg-stone-50/50 animate-fade-in max-w-3xl">
              
              {/* Ticket Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Ticket Reference</span>
                  <h3 className="text-xl font-heading font-extrabold text-stone-900 font-mono">
                    #{trackedComplaint.ticket_number}
                  </h3>
                  <span className="text-xs text-stone-500">Logged on {trackedComplaint.created_at}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    trackedComplaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                    trackedComplaint.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    Status: {trackedComplaint.status}
                  </span>
                </div>
              </div>

              {/* Dispute Info Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Customer</span>
                  <p className="font-bold text-stone-900">{trackedComplaint.customer_name}</p>
                  <p className="text-stone-500">{trackedComplaint.customer_email}</p>
                  {trackedComplaint.customer_phone && <p className="text-stone-500">{trackedComplaint.customer_phone}</p>}
                </div>

                <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Dispute Classification</span>
                  <p className="font-bold text-stone-900">{trackedComplaint.category}</p>
                  {trackedComplaint.order_number && (
                    <p className="text-brand-700 font-mono font-semibold">Order: #{trackedComplaint.order_number}</p>
                  )}
                </div>
              </div>

              {/* Customer's Original Issue */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1 text-xs">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Customer's Claim</span>
                <p className="font-bold text-stone-900 text-sm">{trackedComplaint.subject}</p>
                <p className="text-stone-600 leading-relaxed pt-1">{trackedComplaint.message}</p>
              </div>

              {/* Official Supervisor Resolution */}
              <div className={`p-5 rounded-2xl border text-xs space-y-2 ${
                trackedComplaint.admin_reply
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {trackedComplaint.admin_reply ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Official Supervisor Resolution</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span>Pending Quality Inspection</span>
                    </>
                  )}
                </div>

                <p className="leading-relaxed">
                  {trackedComplaint.admin_reply ||
                    'Our Quality Supervisor is reviewing your harvest batch logs and courier delivery record. You will receive an official resolution via email within 2-4 business hours.'}
                </p>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Trust & Guarantee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
        <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-1">
          <span className="text-lg">🌿</span>
          <h4 className="font-heading font-bold text-stone-900">100% Crisp & Fresh</h4>
          <p className="text-stone-500">Every piece of produce is harvested same-day and quality graded Grade A before packing.</p>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-1">
          <span className="text-lg">⚡</span>
          <h4 className="font-heading font-bold text-stone-900">Swift Doorstep Remedy</h4>
          <p className="text-stone-500">If any item arrives below standard, we dispatch a doorstep replacement or wallet voucher immediately.</p>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-1">
          <span className="text-lg">📫</span>
          <h4 className="font-heading font-bold text-stone-900">Direct Email Notifications</h4>
          <p className="text-stone-500">Live ticket updates and resolutions delivered directly to your inbox via Gmail SMTP.</p>
        </div>
      </div>

    </div>
  );
}
