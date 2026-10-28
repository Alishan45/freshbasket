import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Truck, Heart, MessageSquare, Plus,
  Trash2, Check, Star, ShieldCheck, LogOut
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/products/ProductCard';

export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { showToast } = useCart();
  const { wishlist } = useWishlist();

  const activeTab = searchParams.get('tab') || 'profile';

  // State
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // New Address State
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('Lahore');
  const [newPhone, setNewPhone] = useState(user?.phone_number || '');

  // New Complaint State
  const [compSubject, setCompSubject] = useState('');
  const [compMessage, setCompMessage] = useState('');
  const [compOrderRef, setCompOrderRef] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
    }
  }, [user]);

  // Load Tab-specific data
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      if (activeTab === 'addresses') {
        const res = await api.get('/auth/addresses').catch(() => null);
        if (res?.success) setAddresses(res.addresses);
      } else if (activeTab === 'orders') {
        const res = await api.get('/orders/my').catch(() => null);
        if (res?.success) setOrders(res.orders);
      } else if (activeTab === 'complaints') {
        const res = await api.get('/complaints').catch(() => null);
        if (res?.success) setComplaints(res.complaints);
      }
    }
    loadData();
  }, [activeTab, isAuthenticated]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: fullName, phone_number: phone });
      showToast('Profile information successfully saved!');
    } catch (err) {
      showToast(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddAddress(e) {
    e.preventDefault();
    if (!newStreet || !newPhone) return;

    try {
      const res = await api.post('/auth/addresses', {
        label: newLabel,
        street_address: newStreet,
        area: newArea,
        city: newCity,
        phone: newPhone,
        is_default: addresses.length === 0
      });
      if (res.success) {
        setAddresses(prev => [...prev, res.address]);
        setShowAddAddr(false);
        setNewStreet('');
        setNewArea('');
        showToast('Address added to your address book!');
      }
    } catch (err) {
      showToast(err.message || 'Failed to add address');
    }
  }

  async function handleDeleteAddress(id) {
    try {
      const res = await api.delete(`/auth/addresses/${id}`);
      if (res.success) {
        setAddresses(prev => prev.filter(a => a.id !== id));
        showToast('Address removed.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete address');
    }
  }

  async function handleSetDefaultAddress(id) {
    try {
      const res = await api.put(`/auth/addresses/${id}/default`);
      if (res.success) {
        setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id ? 1 : 0 })));
        showToast('Default delivery address updated.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to set default address');
    }
  }

  async function handleSubmitComplaint(e) {
    e.preventDefault();
    if (!compSubject || !compMessage) return;

    try {
      const res = await api.post('/complaints', {
        subject: compSubject,
        message: compMessage
      });
      if (res.success) {
        showToast(res.message);
        setCompSubject('');
        setCompMessage('');
        const refresh = await api.get('/complaints');
        if (refresh.success) setComplaints(refresh.complaints);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit complaint');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-600 text-white font-heading font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-stone-900">{user?.full_name}</h1>
            <p className="text-xs text-stone-500">{user?.email} • Role: <strong className="capitalize text-brand-700">{user?.role}</strong></p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Navigation Toolbar (Horizontally Swipeable on Mobile) */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-stone-200 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold whitespace-nowrap min-w-max">
          {[
            { key: 'profile', label: 'Personal Profile', icon: User },
            { key: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { key: 'orders', label: 'Order History', icon: Truck },
            { key: 'wishlist', label: `My Wishlist (${wishlist.length})`, icon: Heart },
            { key: 'complaints', label: 'Support & Inquiries', icon: MessageSquare }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSearchParams({ tab: tab.key })}
                className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition flex items-center gap-2 font-heading font-semibold text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4 text-xs">
          <h2 className="font-heading font-bold text-base text-stone-900 pb-2 border-b">
            Personal Details
          </h2>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-2.5 border rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2.5 border rounded-xl bg-stone-100 text-stone-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Email address cannot be modified</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Primary Telephone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full p-2.5 border rounded-xl bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold text-stone-900">
              Your Delivery Locations
            </h2>
            <button
              onClick={() => setShowAddAddr(!showAddAddr)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddAddr ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {showAddAddr && (
            <form onSubmit={handleAddAddress} className="max-w-xl bg-white p-6 rounded-3xl border border-brand-200 shadow-md space-y-3 text-xs animate-fade-in">
              <h3 className="font-heading font-bold text-sm text-stone-900">New Address Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Label (e.g. Home, Office)</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Contact Phone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-stone-600 mb-1 font-semibold">Street & House Number</label>
                  <input
                    type="text"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    required
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">Area / Sector</label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddAddr(false)} className="px-3 py-1.5 text-stone-500 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-600 text-white rounded-xl font-bold shadow-xs">Save to Address Book</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map(addr => (
              <div key={addr.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3 flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-heading font-bold text-stone-900 text-sm">{addr.label}</span>
                    {addr.is_default ? (
                      <span className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold">Default</span>
                    ) : null}
                  </div>
                  <p className="text-stone-600 leading-snug">{addr.street_address}</p>
                  {addr.area && <p className="text-stone-400 text-[11px]">{addr.area}, {addr.city}</p>}
                  <p className="text-stone-500 mt-2">📞 {addr.phone}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  {!addr.is_default ? (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-brand-700 font-bold hover:underline text-[11px]"
                    >
                      Set as Default
                    </button>
                  ) : <span className="text-[11px] text-emerald-700 font-bold">✓ Active Default</span>}

                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-stone-400 hover:text-red-500 p-1"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Order History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-stone-900">
            Past Orders & Doorstep Invoices
          </h2>

          {orders.length === 0 ? (
            <p className="text-stone-400 text-xs italic">No orders found.</p>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-brand-800">{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.order_status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.order_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                    <p className="text-stone-500">{order.created_at} • Destination: {order.address_text}</p>
                    <p className="font-bold text-stone-900 font-mono text-sm">${order.total_amount?.toFixed(2)} (Cash on Delivery)</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/track-order/${order.order_number.replace(/^#+/, '')}`}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Shipment</span>
                    </Link>

                    <Link
                      to={`/order-confirmation/${order.order_number.replace(/^#+/, '')}`}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition"
                    >
                      Invoice
                    </Link>

                    {order.order_status === 'Delivered' && (
                      <Link
                        to="/shop"
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition flex items-center gap-1 border border-emerald-200"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Add Review</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold text-stone-900">
            My Saved Produce Wishlist
          </h2>

          {wishlist.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 space-y-2">
              <p className="text-xs text-stone-500">Your wishlist is currently empty. Tap the heart on any produce to save it for later!</p>
              <Link to="/shop" className="inline-block text-xs text-brand-600 font-bold hover:underline">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlist.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Complaints */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold text-stone-900">
            Support Queries & Produce Complaints
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmitComplaint} className="max-w-xl bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-heading font-bold text-sm text-stone-900">Submit New Support Request</h3>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Subject</label>
              <input
                type="text"
                value={compSubject}
                onChange={(e) => setCompSubject(e.target.value)}
                required
                placeholder="e.g. Issue with mango ripeness or delivery delay"
                className="w-full p-2.5 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 mb-1">Detailed Message</label>
              <textarea
                value={compMessage}
                onChange={(e) => setCompMessage(e.target.value)}
                required
                rows={3}
                placeholder="Describe your concern in detail..."
                className="w-full p-2.5 border rounded-xl"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs transition"
            >
              Submit Ticket
            </button>
          </form>

          {/* Complaints List */}
          <div className="space-y-3 max-w-xl">
            {complaints.map(comp => (
              <div key={comp.id} className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{comp.subject}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {comp.status}
                  </span>
                </div>
                <p className="text-stone-600">{comp.message}</p>
                {comp.admin_reply && (
                  <div className="mt-2 p-2.5 bg-brand-50 rounded-xl border border-brand-200 text-brand-900 text-[11px]">
                    <strong>Support Team Response:</strong> {comp.admin_reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
