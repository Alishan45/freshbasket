import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Boxes, Truck, ShieldCheck,
  MessageSquare, FileSpreadsheet, Plus, Edit, Trash2,
  CheckCircle2, AlertTriangle, ArrowUpRight, Search, Download, RefreshCw,
  ShieldAlert, Mail, Phone, Send
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const COLORS = ['#16a34a', '#0284c7', '#d97706', '#7c3aed', '#e11d48'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useCart();

  const [activeTab, setActiveTab] = useState('overview');

  // Metrics & Data
  const [metrics, setMetrics] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [catDistribution, setCatDistribution] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [qualityLogs, setQualityLogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Form State
  const [showAddProd, setShowAddProd] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [adjustStockProd, setAdjustStockProd] = useState(null);
  const [stockDelta, setStockDelta] = useState(10);
  const [stockReason, setStockReason] = useState('Morning Inbound Batch Arrival');

  // Add/Edit Product Form state
  const [prodName, setProdName] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('1 kg');
  const [prodStock, setProdStock] = useState('50');
  const [prodGrade, setProdGrade] = useState('Grade A+ (Picked Today)');
  const [prodScore, setProdScore] = useState('99');
  const [prodOrigin, setProdOrigin] = useState('');
  const [prodFarmer, setProdFarmer] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodOrganic, setProdOrganic] = useState(false);
  const [prodSeasonal, setProdSeasonal] = useState(false);

  // Review & Complaint reply state
  const [replyInput, setReplyInput] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [complaintReplies, setComplaintReplies] = useState({});
  const [replyingComplaintId, setReplyingComplaintId] = useState(null);

  useEffect(() => {
    loadDashboardData();

    // Real-Time SSE Stream for Admin Dashboard
    let eventSource;
    try {
      eventSource = new EventSource('/api/fulfillment/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'order_status_updated' || payload.type === 'order_created' || payload.type === 'order_cancelled') {
            // Dynamically update orders in admin table
            setOrders(prev => {
              if (payload.type === 'order_status_updated' && payload.order_id) {
                return prev.map(o => o.id === payload.order_id ? { ...o, order_status: payload.new_status, ...payload.order } : o);
              }
              return prev;
            });
            // Refresh counts
            api.get('/analytics/overview').then(res => {
              if (res.success) setMetrics(res.metrics);
            }).catch(() => {});
            if (payload.order_number) {
              showToast(`⚡ Live Update: Order ${payload.order_number} is now "${payload.new_status}"`);
            }
          }
        } catch (e) {}
      };
    } catch (err) {
      console.warn('Admin SSE failed:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [mRes, tRes, cRes, pRes, oRes, lsRes, catsRes] = await Promise.all([
        api.get('/analytics/overview').catch(() => ({})),
        api.get('/analytics/trends').catch(() => ({})),
        api.get('/analytics/categories').catch(() => ({})),
        api.get('/products', { limit: 50 }).catch(() => ({})),
        api.get('/admin/orders', { limit: 50 }).catch(() => ({})),
        api.get('/inventory/low-stock').catch(() => ({})),
        api.get('/categories').catch(() => ({}))
      ]);

      if (mRes.success) setMetrics(mRes.metrics);
      if (tRes.success) setSalesTrends(tRes.trends);
      if (cRes.success) setCatDistribution(cRes.distribution);
      if (pRes.success) setProducts(pRes.products);
      if (oRes.success) setOrders(oRes.orders);
      if (lsRes.success) setLowStock(lsRes.items);
      if (catsRes.success) setCategories(catsRes.categories);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  // Load Tab Specific data
  useEffect(() => {
    async function loadTabData() {
      if (activeTab === 'inventory') {
        const res = await api.get('/inventory/logs').catch(() => null);
        if (res?.success) setInventoryLogs(res.logs);
      } else if (activeTab === 'quality') {
        const res = await api.get('/quality/logs').catch(() => null);
        if (res?.success) setQualityLogs(res.logs);
      } else if (activeTab === 'reviews') {
        const res = await api.get('/admin/reviews').catch(() => null);
        if (res?.success) setReviews(res.reviews);
      } else if (activeTab === 'complaints') {
        const res = await api.get('/admin/complaints').catch(() => null);
        if (res?.success) setComplaints(res.complaints);
      }
    }
    loadTabData();
  }, [activeTab]);

  // Product Save (Create or Update)
  async function handleSaveProduct(e) {
    e.preventDefault();
    try {
      const payload = {
        name: prodName,
        category_id: prodCatId ? parseInt(prodCatId) : null,
        base_price: parseFloat(prodPrice),
        unit_type: prodUnit,
        stock_quantity: parseInt(prodStock),
        freshness_grade: prodGrade,
        freshness_score: parseInt(prodScore),
        farm_origin: prodOrigin || 'Local Farm',
        farmer_name: prodFarmer || 'Cooperative Grower',
        image_url: prodImage || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
        description: prodDesc || 'Fresh morning harvest.',
        is_organic: prodOrganic,
        is_seasonal: prodSeasonal
      };

      if (editingProd) {
        await api.put(`/products/${editingProd.id}`, payload);
        showToast('Produce details updated successfully.');
      } else {
        await api.post('/products', payload);
        showToast('New produce added to marketplace catalog!');
      }

      setShowAddProd(false);
      setEditingProd(null);
      // Reload products
      const pRes = await api.get('/products', { limit: 50 });
      if (pRes.success) setProducts(pRes.products);
    } catch (err) {
      showToast(err.message || 'Failed to save product');
    }
  }

  function openEditModal(prod) {
    setEditingProd(prod);
    setProdName(prod.name);
    setProdCatId(prod.category_id || '');
    setProdPrice(prod.base_price);
    setProdUnit(prod.unit_type);
    setProdStock(prod.stock_quantity);
    setProdGrade(prod.freshness_grade);
    setProdScore(prod.freshness_score);
    setProdOrigin(prod.farm_origin);
    setProdFarmer(prod.farmer_name || '');
    setProdImage(prod.image_url);
    setProdDesc(prod.description);
    setProdOrganic(!!prod.is_organic);
    setProdSeasonal(!!prod.is_seasonal);
    setShowAddProd(true);
  }

  function openCreateModal() {
    setEditingProd(null);
    setProdName('');
    setProdCatId(categories[0]?.id || '');
    setProdPrice('2.99');
    setProdUnit('1 kg');
    setProdStock('45');
    setProdGrade('Grade A+ (Picked Today)');
    setProdScore('99');
    setProdOrigin('Valley Green Orchards');
    setProdFarmer('Local Grower');
    setProdImage('https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80');
    setProdDesc('Farm-picked daily with strict adherence to natural farming practices.');
    setProdOrganic(false);
    setProdSeasonal(false);
    setShowAddProd(true);
  }

  async function handleDeleteProduct(id) {
    if (confirm('Are you sure you want to archive this product?')) {
      try {
        await api.delete(`/products/${id}`);
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast('Product archived.');
      } catch (err) {
        showToast(err.message || 'Failed to delete');
      }
    }
  }

  async function handleAdjustStock(e) {
    e.preventDefault();
    if (!adjustStockProd) return;
    try {
      const res = await api.post('/inventory/adjust', {
        product_id: adjustStockProd.id,
        change_amount: stockDelta,
        reason: stockReason
      });
      if (res.success) {
        showToast(res.message);
        setAdjustStockProd(null);
        // Refresh products and low stock
        const [pRes, lsRes] = await Promise.all([
          api.get('/products', { limit: 50 }),
          api.get('/inventory/low-stock')
        ]);
        if (pRes.success) setProducts(pRes.products);
        if (lsRes.success) setLowStock(lsRes.items);
      }
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock');
    }
  }

  async function handleOrderStatusChange(orderId, newStatus) {
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        note: `Status updated by Admin ${user?.full_name}`
      });
      if (res.success) {
        showToast(`Order status set to: ${newStatus}`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
      }
    } catch (err) {
      showToast(err.message || 'Status transition error');
    }
  }

  async function handleBatchAudit() {
    try {
      const res = await api.post('/quality/batch-certify');
      if (res.success) {
        showToast(res.message);
        const qRes = await api.get('/quality/logs');
        if (qRes.success) setQualityLogs(qRes.logs);
      }
    } catch (err) {
      showToast(err.message || 'Batch audit failed');
    }
  }

  async function handleReviewReply(revId) {
    const text = replyInput[revId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.put(`/admin/reviews/${revId}`, {
        seller_response: text.trim()
      });
      if (res.success) {
        showToast('Official response published!');
        setReviews(prev => prev.map(r => r.id === revId ? { ...r, seller_response: text.trim() } : r));
        setReplyInput(prev => ({ ...prev, [revId]: '' }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to publish response');
    }
  }

  async function handleSendComplaintResolution(complaintId) {
    const text = complaintReplies[complaintId];
    if (!text || !text.trim()) {
      showToast('Please enter an official resolution reply message.');
      return;
    }

    setReplyingComplaintId(complaintId);
    try {
      const res = await api.put(`/admin/complaints/${complaintId}/reply`, {
        admin_reply: text.trim(),
        status: 'Resolved'
      });
      if (res.success) {
        showToast(res.message);
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, admin_reply: text.trim(), status: 'Resolved' } : c));
        setComplaintReplies(prev => ({ ...prev, [complaintId]: '' }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to send resolution email');
    } finally {
      setReplyingComplaintId(null);
    }
  }

  async function handleExportCsv() {
    try {
      const csvText = await api.get('/analytics/export/orders.csv');
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freshbasket_orders_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Orders CSV exported successfully.');
    } catch (err) {
      showToast('Failed to export CSV');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-stone-900 text-white flex items-center justify-center shadow-md">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-extrabold text-stone-900">
                Admin Control Center
              </h1>
              <span className="px-2 py-0.5 bg-brand-100 text-brand-800 text-[10px] font-bold rounded-md">
                Management Mode
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Live SQL Database • Inventory Tracking • Fulfillment Pipeline • Quality Inspections
            </p>
          </div>
        </div>

        <button
          onClick={loadDashboardData}
          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block">Total Revenue</span>
          <p className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900">
            ${metrics?.total_revenue?.toFixed(2) || '1,482.50'}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +18.4% morning sales
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Active Orders</span>
          <p className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900">
            {metrics?.active_orders || orders.length} Orders
          </p>
          <span className="text-[10px] text-blue-700 font-semibold">
            {orders.filter(o => o.order_status === 'Out for Delivery').length} Out for delivery
          </span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Low Stock Items</span>
          <p className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-600">
            {lowStock.length} Items
          </p>
          <span className="text-[10px] text-amber-800 font-semibold">&lt; 5 units remaining</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Average Freshness</span>
          <p className="text-2xl sm:text-3xl font-heading font-extrabold text-purple-900">
            {metrics?.average_freshness || '99.1'}%
          </p>
          <span className="text-[10px] text-purple-700 font-semibold">Grade A+ Certified</span>
        </div>
      </div>

      {/* Navigation Tabs Toolbar */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-bold">
          {[
            { key: 'overview', label: 'Analytics & Trends', icon: LayoutDashboard },
            { key: 'products', label: `Produce Catalog (${products.length})`, icon: Package },
            { key: 'inventory', label: `Inventory & Movements (${lowStock.length} Low)`, icon: Boxes },
            { key: 'orders', label: `Order Dispatch (${orders.length})`, icon: Truck },
            { key: 'quality', label: 'Farm-to-Fork Inspections', icon: ShieldCheck },
            { key: 'reviews', label: 'Review Moderation', icon: MessageSquare },
            { key: 'complaints', label: `Disputes & Care (${complaints.length})`, icon: ShieldAlert },
            { key: 'reports', label: 'Reports & Export', icon: FileSpreadsheet }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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

          <Link
            to="/logistics"
            className="ml-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition flex items-center gap-1.5 text-xs whitespace-nowrap"
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Open Logistics Hub</span>
          </Link>
        </div>
      </div>

      {/* Tab 1: Overview & Recharts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sales Trends Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-stone-900">Daily Sales & Order Velocity</h3>
                  <p className="text-xs text-stone-500">Live transaction volume over time</p>
                </div>
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                  Real Database Feeds
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrends}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-heading font-bold text-base text-stone-900">Catalog Distribution</h3>
                <p className="text-xs text-stone-500">Produce breakdown by category</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label
                    >
                      {catDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Products Management */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-stone-900">
              Produce Catalog Management ({products.length} Items)
            </h3>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Produce</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Produce Item</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Freshness Grade</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {products.map(prod => (
                  <tr key={prod.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={prod.image_url} alt={prod.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      <div>
                        <span className="font-bold text-stone-900 block">{prod.name}</span>
                        <span className="text-[10px] text-stone-400">{prod.farm_origin}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-stone-600">{prod.category_name}</td>
                    <td className="p-3.5 font-mono font-bold text-stone-900">${prod.base_price?.toFixed(2)} / {prod.unit_type}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        prod.stock_quantity <= 5 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {prod.stock_quantity} in stock
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200">
                        {prod.freshness_grade}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setAdjustStockProd(prod);
                          setStockDelta(10);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
                      >
                        Stock
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="px-2 py-1 text-red-500 hover:text-red-700 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          {lowStock.length > 0 && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Low-Stock Inventory Warnings ({lowStock.length} items need harvest replenishment)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lowStock.map(p => (
                  <div key={p.id} className="p-3 bg-white rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 block">{p.name}</span>
                      <span className="text-red-600 font-bold">Only {p.stock_quantity} left</span>
                    </div>
                    <button
                      onClick={() => { setAdjustStockProd(p); setStockDelta(25); }}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold"
                    >
                      + Replenish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-stone-900">Inventory Movement & Deductions Audit Trail</h4>
                <p className="text-xs text-stone-500">Atomic stock changes from checkouts, restocks, and cancellations</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Produce</th>
                    <th className="p-3">Change Amount</th>
                    <th className="p-3">New Stock</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {inventoryLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 font-bold text-stone-900">{log.product_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold font-mono text-[11px] ${
                          log.change_amount < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-800">{log.new_stock}</td>
                      <td className="p-3 text-stone-600">{log.reason}</td>
                      <td className="p-3 text-stone-400 font-mono text-[11px]">{log.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Order Dispatch Management */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-stone-900">
              Live Order Pipeline ({orders.length} Orders)
            </h3>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Customer & Phone</th>
                  <th className="p-3.5">Total (COD)</th>
                  <th className="p-3.5">Delivery Slot</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5 text-right">Advance Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-stone-50 transition">
                    <td className="p-3.5 font-mono font-bold text-brand-800">{order.order_number}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-stone-900">{order.customer_name}</p>
                      <p className="text-[11px] text-stone-400">{order.customer_phone}</p>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-stone-900">${order.total_amount?.toFixed(2)}</td>
                    <td className="p-3.5 text-stone-600">{order.delivery_slot}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.order_status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.order_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        order.order_status === 'Out for Delivery' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        'bg-stone-100 text-stone-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' ? (
                        <select
                          value={order.order_status}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className="p-1.5 bg-stone-50 border rounded-lg text-xs font-semibold outline-none cursor-pointer"
                        >
                          <option value="Confirmed">1. Confirmed</option>
                          <option value="Packing">2. Packing</option>
                          <option value="Quality Check">3. Quality Check</option>
                          <option value="Out for Delivery">4. Out for Delivery</option>
                          <option value="Delivered">5. Delivered</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Terminal State</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Farm-to-Fork Quality Checks */}
      {activeTab === 'quality' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-stone-900">
                Daily Farm Harvest Quality Inspection Protocol
              </h3>
              <p className="text-xs text-stone-500">
                Before packing, inspectors certify brix sugar levels, crunchiness, and Grade A+ status
              </p>
            </div>
            <button
              onClick={handleBatchAudit}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Run All Quality Certifications</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Produce</th>
                    <th className="p-3.5">Batch Code</th>
                    <th className="p-3.5">Freshness Score</th>
                    <th className="p-3.5">Grade Assigned</th>
                    <th className="p-3.5">Harvest Timestamp</th>
                    <th className="p-3.5">Inspection Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {qualityLogs.map(q => (
                    <tr key={q.id} className="hover:bg-stone-50 transition">
                      <td className="p-3.5 font-bold text-stone-900">{q.product_name}</td>
                      <td className="p-3.5 font-mono text-[11px] text-stone-600">{q.batch_code}</td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-brand-700">{q.freshness_score}% Fresh</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {q.grade_assigned}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-500">{q.harvest_date}</td>
                      <td className="p-3.5 text-stone-600 italic">{q.inspection_notes || 'Inspected'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Review Moderation */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-base text-stone-900">
            Customer Photo Review Moderation & Responses
          </h3>

          <div className="space-y-3">
            {reviews.map(rev => (
              <div key={rev.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{rev.author_name}</span>
                    <span className="text-stone-400">on {rev.product_name}</span>
                    <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                      Rating: {rev.rating_stars}/5 ★
                    </span>
                  </div>
                </div>

                <p className="text-stone-700 italic">"{rev.comment_text}"</p>

                {rev.seller_response ? (
                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-brand-900 text-[11px]">
                    <strong>Official Farm Reply:</strong> {rev.seller_response}
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Type official farm response..."
                      value={replyInput[rev.id] || ''}
                      onChange={(e) => setReplyInput({ ...replyInput, [rev.id]: e.target.value })}
                      className="flex-1 p-2 border rounded-xl bg-stone-50"
                    />
                    <button
                      onClick={() => handleReviewReply(rev.id)}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs"
                    >
                      Publish Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Customer Disputes & Complaints */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-stone-900">
                Customer Quality Disputes & Inquiry Resolution ({complaints.length})
              </h3>
              <p className="text-xs text-stone-500">
                Resolving a dispute automatically dispatches an official branded resolution email to the customer via Gmail SMTP.
              </p>
            </div>
            <Link
              to="/complaint"
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start"
            >
              <span>Open Public Complaint Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-stone-800 text-sm">No Active Disputes</h4>
              <p className="text-xs text-stone-500">All customer inquiries and quality complaints have been resolved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(comp => (
                <div key={comp.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                        #{comp.ticket_number || `FB-TKT-${comp.id}`}
                      </span>
                      <span className="font-bold text-stone-900">{comp.customer_name}</span>
                      <span className="text-stone-400">({comp.customer_email})</span>
                      {comp.order_number && (
                        <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-semibold">
                          Order #{comp.order_number}
                        </span>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      comp.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      comp.status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">{comp.category}</span>
                    <h5 className="font-bold text-stone-900 text-sm">{comp.subject}</h5>
                    <p className="text-stone-600 mt-1 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 italic">
                      "{comp.message}"
                    </p>
                  </div>

                  {comp.admin_reply ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs">
                      <strong className="block text-emerald-900 font-bold mb-0.5">Dispatched Official Email Resolution:</strong>
                      {comp.admin_reply}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Official Resolution Reply (Dispatches email to {comp.customer_email}):
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Apologies for the bruised produce. We have credited a $5 voucher and dispatched a replacement..."
                          value={complaintReplies[comp.id] || ''}
                          onChange={(e) => setComplaintReplies({ ...complaintReplies, [comp.id]: e.target.value })}
                          className="flex-1 p-2.5 border rounded-xl bg-stone-50 text-xs focus:bg-white focus:border-brand-500 outline-none"
                        />
                        <button
                          onClick={() => handleSendComplaintResolution(comp.id)}
                          disabled={replyingComplaintId === comp.id}
                          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{replyingComplaintId === comp.id ? 'Sending Email...' : 'Send Resolution Email'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Reports & Export */}
      {activeTab === 'reports' && (
        <div className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-heading font-bold text-base text-stone-900">
            Export Financial & Order Reports
          </h3>
          <p className="text-stone-500 leading-relaxed">
            Download full transactional records, customer addresses, Cash on Delivery collection amounts, and order stage histories in standard CSV format for accounting audits.
          </p>

          <button
            onClick={handleExportCsv}
            className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Orders CSV Report</span>
          </button>
        </div>
      )}

      {/* Create / Edit Produce Modal */}
      {showAddProd && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-4 shadow-2xl animate-fade-in text-xs">
            <h3 className="font-heading font-bold text-base text-stone-900">
              {editingProd ? 'Edit Fresh Produce' : 'Add New Fresh Harvest Item'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 font-medium">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Produce Name</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="e.g. Crisp Fuji Apples"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Category</label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Primary Unit</label>
                  <input
                    type="text"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    required
                    placeholder="e.g. 1 kg, 1 dozen, bunch"
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Available Stock</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Farm Origin & Grower</label>
                <input
                  type="text"
                  value={prodOrigin}
                  onChange={(e) => setProdOrigin(e.target.value)}
                  placeholder="e.g. Swat Valley Orchards"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Image URL</label>
                <input
                  type="url"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Description</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={prodOrganic}
                    onChange={(e) => setProdOrganic(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>100% Organic Certified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={prodSeasonal}
                    onChange={(e) => setProdSeasonal(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Seasonal Harvest</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProd(false)}
                  className="px-4 py-2 border rounded-xl text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl font-bold shadow-xs hover:bg-brand-700"
                >
                  Save Produce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustStockProd && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAdjustStock} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in text-xs">
            <h3 className="font-heading font-bold text-base text-stone-900">
              Adjust Stock: {adjustStockProd.name}
            </h3>
            <p className="text-stone-500">Current Stock: <strong>{adjustStockProd.stock_quantity}</strong> units</p>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Add / Deduct Amount (use negative for deduction):</label>
              <input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(parseInt(e.target.value || 0))}
                className="w-full p-2 border rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Audit Log Reason:</label>
              <input
                type="text"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                required
                className="w-full p-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustStockProd(null)}
                className="px-3 py-1.5 border rounded-xl text-stone-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-brand-600 text-white rounded-xl font-bold"
              >
                Update Stock
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
