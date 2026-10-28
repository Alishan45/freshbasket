import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Check, Package, ShieldCheck, Bike, Home, AlertCircle,
  Search, RefreshCw, User, Phone, MapPin, Clock, ArrowRight,
  Radio, CheckCircle2, ChevronRight, Filter, Thermometer, ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function LogisticsPortalPage() {
  const { user, isAdmin, isLogistics } = useAuth();
  const { showToast } = useCart();

  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'Confirmed', 'Packing', 'Quality Check', 'Out for Delivery', 'Delivered', 'Cancelled', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Modal / Inputs state for courier assignment
  const [editingCourierId, setEditingCourierId] = useState(null);
  const [courierForm, setCourierForm] = useState({
    driver_name: 'Hamza Tariq',
    driver_phone: '+92 300 1234567',
    vehicle_number: 'EV-VAN-04',
    temperature_note: 'Cold-Chain 3.8°C Verified'
  });

  const stages = [
    { key: 'Confirmed', label: '1. Confirmed', icon: Check, color: 'text-blue-600 bg-blue-50 border-blue-200', action: 'Move to Packing' },
    { key: 'Packing', label: '2. Packing', icon: Package, color: 'text-amber-600 bg-amber-50 border-amber-200', action: 'Send to Quality Check' },
    { key: 'Quality Check', label: '3. Quality Check', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-200', action: 'Certify & Dispatch' },
    { key: 'Out for Delivery', label: '4. Out for Delivery', icon: Bike, color: 'text-orange-600 bg-orange-50 border-orange-200', action: 'Confirm Doorstep Handover' },
    { key: 'Delivered', label: '5. Delivered', icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', action: 'Completed' }
  ];

  const fleetDrivers = [
    { name: 'Hamza Tariq', phone: '+92 300 1234567', vehicle: 'EV-VAN-04 (Insulated Electric)', area: 'Central & Gulberg' },
    { name: 'Zubair Khan', phone: '+92 321 8877665', vehicle: 'COLD-TRUCK-02 (Refrigerated 4°C)', area: 'DHA Phase 1-6 & Cantt' },
    { name: 'Bilal Aslam', phone: '+92 333 4455667', vehicle: 'HYBRID-VAN-01 (Multi-Zone)', area: 'Johar Town & Wapda Town' },
    { name: 'Farhan Ahmed', phone: '+92 314 9900112', vehicle: 'GREEN-EBIKE-09 (Rapid Produce)', area: 'Model Town & Garden Town' }
  ];

  async function fetchOrders() {
    try {
      const res = await api.get('/logistics/orders', {
        status: activeTab,
        search: searchQuery
      });
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Fetch logistics orders failed:', err);
    }
  }

  async function fetchMetrics() {
    try {
      const res = await api.get('/logistics/metrics');
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Fetch metrics failed:', err);
    }
  }

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchMetrics()]);
      setLoading(false);
    }
    loadInitial();
  }, [activeTab]);

  // Connect to Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/fulfillment/stream');

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'order_status_updated' || payload.type === 'order_created' || payload.type === 'courier_assigned' || payload.type === 'order_cancelled') {
            // Update orders list dynamically
            fetchOrders();
            fetchMetrics();
            if (payload.order_number) {
              showToast(`⚡ Real-Time Update: ${payload.order_number} is now "${payload.new_status || payload.type}"`);
            }
          }
        } catch (e) {
          // ignore non-json pings
        }
      };

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch (err) {
      console.warn('SSE initialization failed:', err);
    }

    // 5-second polling fallback
    const interval = setInterval(() => {
      fetchOrders();
      fetchMetrics();
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [activeTab]);

  // 1-Click Fast Advance to Next Stage
  async function handleAdvanceStage(order) {
    const currentIndex = stages.findIndex(s => s.key === order.order_status);
    if (currentIndex < 0 || currentIndex >= stages.length - 1) return;

    const nextStage = stages[currentIndex + 1].key;
    await updateStage(order.id, nextStage);
  }

  // Update Status API call
  async function updateStage(orderId, targetStatus, customNote = null) {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/logistics/orders/${orderId}/status`, {
        status: targetStatus,
        note: customNote,
        driver_name: courierForm.driver_name,
        driver_phone: courierForm.driver_phone,
        vehicle_number: courierForm.vehicle_number,
        temperature_note: courierForm.temperature_note
      });

      if (res.success) {
        showToast(res.message);
        // Optimistically update order in state
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...res.order } : o));
        fetchMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Status transition failed.');
    } finally {
      setUpdatingId(null);
    }
  }

  // Save Courier and Van Assignment
  async function handleSaveCourier(orderId) {
    setUpdatingId(orderId);
    try {
      const res = await api.post(`/logistics/orders/${orderId}/courier`, courierForm);
      if (res.success) {
        showToast(res.message);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...res.order } : o));
        setEditingCourierId(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign courier.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchOrders();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner: Logistics Command Hub & Live Pulse */}
      <div className="bg-gradient-to-r from-stone-900 via-blue-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Truck className="w-3 h-3" /> Logistics Supervisor Center
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                isRealtimeConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{isRealtimeConnected ? 'Real-Time SSE Stream Active' : 'Connecting to Live Stream...'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
              Cold-Chain Fulfillment & Dispatch Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Supervise all 5 fulfillment stages in real time: <span className="text-white font-semibold">Confirmed</span> ➔ <span className="text-white font-semibold">Packing</span> ➔ <span className="text-white font-semibold">Quality Check</span> ➔ <span className="text-white font-semibold">Out for Delivery</span> ➔ <span className="text-white font-semibold">Delivered</span>. Every status transition instantly updates customer tracking, store admin panels, and supervisor boards simultaneously.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-xs">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Duty Supervisor</span>
              <span className="font-bold text-white block">{user?.full_name || 'Tariq Mehmood'}</span>
              <span className="text-[11px] text-blue-300">Central Urban Dispatch Hub</span>
            </div>
            <button
              onClick={() => { fetchOrders(); fetchMetrics(); }}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 transition"
              title="Manual Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Radar</span>
            </button>
          </div>
        </div>

        {/* Live Stage Counts Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[10px] text-stone-400 uppercase font-bold block">Active Shipments</span>
            <span className="text-2xl font-extrabold text-white font-mono">{metrics?.active_total || 0}</span>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-3 border border-blue-500/20">
            <span className="text-[10px] text-blue-300 uppercase font-bold block">1. Confirmed</span>
            <span className="text-2xl font-extrabold text-blue-200 font-mono">{metrics?.confirmed || 0}</span>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
            <span className="text-[10px] text-amber-300 uppercase font-bold block">2. In Packing</span>
            <span className="text-2xl font-extrabold text-amber-200 font-mono">{metrics?.packing || 0}</span>
          </div>
          <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20">
            <span className="text-[10px] text-purple-300 uppercase font-bold block">3. Quality QA</span>
            <span className="text-2xl font-extrabold text-purple-200 font-mono">{metrics?.quality_check || 0}</span>
          </div>
          <div className="bg-orange-500/10 rounded-2xl p-3 border border-orange-500/20">
            <span className="text-[10px] text-orange-300 uppercase font-bold block">4. In Transit Van</span>
            <span className="text-2xl font-extrabold text-orange-200 font-mono">{metrics?.out_for_delivery || 0}</span>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">5. Delivered Today</span>
            <span className="text-2xl font-extrabold text-emerald-200 font-mono">{metrics?.delivered || 0}</span>
          </div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Stage Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-2 rounded-xl transition shrink-0 ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            All Active ({metrics?.active_total || 0})
          </button>
          {stages.map(stg => (
            <button
              key={stg.key}
              onClick={() => setActiveTab(stg.key)}
              className={`px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
                activeTab === stg.key ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>{stg.key}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-xl transition shrink-0 ${activeTab === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            All Orders
          </button>
        </div>

        {/* Fast Order Reference Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search #FB-88219 or customer..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none"
          />
        </form>

      </div>

      {/* Orders List / Pipeline Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-700">Loading fulfillment pipeline...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <Package className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No shipments found in this stage</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            All produce orders for this fulfillment filter have been processed or moved to the next transit queue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const currentStageIndex = stages.findIndex(s => s.key === order.order_status);
            const isCompleted = order.order_status === 'Delivered';
            const isCancelled = order.order_status === 'Cancelled';
            const nextStageObj = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-md p-6 space-y-6 hover:border-blue-300 transition duration-200"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-sm border border-blue-200 shadow-xs">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-stone-900 text-lg font-mono tracking-tight">
                          {order.order_number}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          order.order_status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.order_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800 animate-pulse'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        Received on {order.created_at} • Delivery Slot: <strong className="text-stone-700">{order.delivery_slot}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Cash on Delivery</span>
                      <span className="font-mono font-extrabold text-base text-stone-900">${order.total_amount?.toFixed(2)}</span>
                    </div>

                    {/* Quick 1-Click Advance Button */}
                    {!isCompleted && !isCancelled && nextStageObj && (
                      <button
                        onClick={() => handleAdvanceStage(order)}
                        disabled={updatingId === order.id}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2"
                      >
                        {updatingId === order.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>{nextStageObj.action}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 5-Stage Visual Progress Bar */}
                {!isCancelled ? (
                  <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/80">
                    <div className="relative flex items-center justify-between">
                      {/* Line */}
                      <div className="absolute left-4 right-4 top-4 h-1 bg-stone-200 -z-0">
                        <div
                          className="h-full bg-blue-600 transition-all duration-500 ease-out"
                          style={{
                            width: `${currentStageIndex >= 0 ? (currentStageIndex / (stages.length - 1)) * 100 : 0}%`
                          }}
                        />
                      </div>

                      {/* 5 Stage Nodes */}
                      {stages.map((stg, sIdx) => {
                        const isDone = sIdx <= currentStageIndex;
                        const isCurrent = sIdx === currentStageIndex;
                        const IconComp = stg.icon;

                        return (
                          <div key={stg.key} className="relative z-10 flex flex-col items-center text-center">
                            <button
                              onClick={() => updateStage(order.id, stg.key)}
                              title={`Jump status to ${stg.key}`}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border-2 border-white transition-transform ${
                                isDone ? 'bg-blue-600 text-white scale-105' : 'bg-stone-200 text-stone-400 hover:bg-stone-300'
                              } ${isCurrent && !isCompleted ? 'ring-4 ring-blue-500/20 animate-pulse' : ''}`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-[10px] mt-1 font-bold ${isCurrent ? 'text-blue-700' : 'text-stone-600'} hidden sm:block`}>
                              {stg.key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Order Cancelled — Reserved produce restored to warehouse inventory.</span>
                  </div>
                )}

                {/* Details Grid: Customer & Delivery, Produce Items, Courier Assignment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  
                  {/* Destination & Customer */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Customer Destination</span>
                    <p className="font-bold text-stone-900 text-sm">{order.customer_name}</p>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                    </a>
                    <p className="text-stone-600 leading-snug flex items-start gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span>{order.address_text}</span>
                    </p>
                    {order.special_instructions && (
                      <p className="text-[11px] text-stone-500 bg-white p-2 rounded-xl border border-stone-100 italic">
                        "{order.special_instructions}"
                      </p>
                    )}
                  </div>

                  {/* Produce Items in Crate */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Inspected Produce Items</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {order.items?.map(it => (
                        <div key={it.id} className="flex items-center justify-between py-0.5 border-b border-stone-200/60 last:border-0">
                          <span className="font-medium text-stone-800">
                            {it.quantity}x {it.product_name} <span className="text-stone-400 font-normal">({it.unit_name})</span>
                          </span>
                          <span className="font-mono font-bold text-stone-700">${it.subtotal?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Courier & Van Assignment */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Assigned Dispatch</span>
                      <button
                        onClick={() => {
                          setEditingCourierId(editingCourierId === order.id ? null : order.id);
                          setCourierForm({
                            driver_name: order.driver_name || 'Hamza Tariq',
                            driver_phone: order.driver_phone || '+92 300 1234567',
                            vehicle_number: order.vehicle_number || 'EV-VAN-04',
                            temperature_note: order.temperature_note || 'Cold-Chain 3.8°C Verified'
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline"
                      >
                        {editingCourierId === order.id ? 'Cancel' : 'Change Driver'}
                      </button>
                    </div>

                    {editingCourierId === order.id ? (
                      <div className="space-y-2 pt-1">
                        <select
                          value={courierForm.driver_name}
                          onChange={(e) => {
                            const found = fleetDrivers.find(d => d.name === e.target.value);
                            setCourierForm(prev => ({
                              ...prev,
                              driver_name: e.target.value,
                              driver_phone: found ? found.phone : prev.driver_phone,
                              vehicle_number: found ? found.vehicle : prev.vehicle_number
                            }));
                          }}
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold"
                        >
                          {fleetDrivers.map(d => (
                            <option key={d.name} value={d.name}>{d.name} — {d.area}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={courierForm.vehicle_number}
                          onChange={(e) => setCourierForm(prev => ({ ...prev, vehicle_number: e.target.value }))}
                          placeholder="Vehicle ID (e.g. EV-VAN-04)"
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                        />

                        <input
                          type="text"
                          value={courierForm.temperature_note}
                          onChange={(e) => setCourierForm(prev => ({ ...prev, temperature_note: e.target.value }))}
                          placeholder="Temperature / QA note"
                          className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs"
                        />

                        <button
                          onClick={() => handleSaveCourier(order.id)}
                          className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs transition"
                        >
                          Save Assignment & Broadcast
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <p className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span>{order.driver_name || 'Hamza Tariq'}</span>
                        </p>
                        <p className="text-stone-500 font-mono text-[11px] flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{order.driver_phone || '+92 300 1234567'}</span>
                        </p>
                        <p className="text-stone-600 font-medium text-[11px] flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-stone-400" />
                          <span>Vehicle: {order.vehicle_number || 'EV-VAN-04'}</span>
                        </p>
                        <p className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-200/60 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          <span>{order.temperature_note || 'Cold-Chain 3.8°C Verified'}</span>
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Supervisor Stage Advancement Dropdown & Manual Controls */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-semibold">Supervisor Action:</span>
                    <select
                      value={order.order_status}
                      onChange={(e) => updateStage(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl font-bold text-stone-800 outline-none"
                    >
                      {stages.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Fulfillment History Log Accordion summary */}
                  <div className="text-[11px] text-stone-400">
                    Latest Event: <strong className="text-stone-700">{order.history?.[0]?.note || 'Order placed successfully'}</strong> ({order.history?.[0]?.created_at || 'just now'})
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
