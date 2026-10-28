import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Package,
  Sprout,
  TrendingUp,
  Clock,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  Leaf,
  ChevronRight,
  ShieldCheck,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function SupplierPortalPage() {
  const { user, loginAsDemo } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'harvest' | 'orders'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    category_id: '',
    base_price: '',
    unit_type: '1 kg',
    stock_quantity: 50,
    farm_origin: 'Makhdoom Agro Orchards, Punjab',
    farmer_name: 'Makhdoom Agro Farms',
    is_organic: true,
    is_seasonal: true,
    description: 'Fresh morning harvest sourced directly from local organic farmland.'
  });

  // Harvest batch state
  const [harvestForm, setHarvestForm] = useState({
    product_id: '',
    harvest_time: 'Today, 6:00 AM',
    quantity_harvested: 25,
    notes: 'Hand-picked at peak ripeness under dew conditions.',
    batch_code: `BATCH-MRN-${Date.now().toString().slice(-4)}`
  });

  useEffect(() => {
    fetchSupplierData();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.categories) setCategories(res.categories);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [statsRes, prodsRes, ordersRes] = await Promise.all([
        api.get('/supplier/stats'),
        api.get('/supplier/products'),
        api.get('/supplier/orders')
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (prodsRes.success) {
        setProducts(prodsRes.products);
        if (prodsRes.products.length > 0 && !harvestForm.product_id) {
          setHarvestForm(prev => ({ ...prev, product_id: prodsRes.products[0].id }));
        }
      }
      if (ordersRes.success) setOrders(ordersRes.orders);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load supplier dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setLoading(true);
      await api.put(`/products/${editingProduct.id}`, {
        base_price: parseFloat(editingProduct.base_price),
        stock_quantity: parseInt(editingProduct.stock_quantity),
        freshness_grade: editingProduct.freshness_grade
      });
      setSuccessMsg(`Produce "${editingProduct.name}" updated successfully.`);
      setShowEditModal(false);
      setEditingProduct(null);
      await fetchSupplierData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update produce listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/products', {
        ...addForm,
        base_price: parseFloat(addForm.base_price),
        stock_quantity: parseInt(addForm.stock_quantity)
      });
      setSuccessMsg(`New produce listing "${addForm.name}" created and published.`);
      setShowAddModal(false);
      setAddForm({
        name: '',
        category_id: categories[0]?.id || '',
        base_price: '',
        unit_type: '1 kg',
        stock_quantity: 50,
        farm_origin: 'Makhdoom Agro Orchards, Punjab',
        farmer_name: 'Makhdoom Agro Farms',
        is_organic: true,
        is_seasonal: true,
        description: 'Fresh morning harvest sourced directly from local organic farmland.'
      });
      await fetchSupplierData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add produce listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogHarvest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/supplier/harvest-batch', {
        product_id: parseInt(harvestForm.product_id),
        harvest_time: harvestForm.harvest_time,
        quantity_harvested: parseInt(harvestForm.quantity_harvested),
        notes: harvestForm.notes,
        batch_code: harvestForm.batch_code
      });
      setSuccessMsg(res.message || 'Harvest batch logged and stock updated.');
      setHarvestForm(prev => ({
        ...prev,
        batch_code: `BATCH-MRN-${Date.now().toString().slice(-4)}`
      }));
      await fetchSupplierData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record harvest batch.');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated or not supplier/admin
  if (user && user.role !== 'supplier' && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Tractor className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-neutral-900 mb-2">Grower Portal Access Restricted</h1>
        <p className="text-neutral-600 mb-6 max-w-md mx-auto text-sm">
          You are currently signed in as <strong>{user.full_name}</strong> ({user.role}). This workspace is reserved for verified agricultural suppliers, farm collectives, and store administrators.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => loginAsDemo('supplier')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Switch to Demo Supplier Account
          </button>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 pb-20">
      {/* Supplier Top Navigation / Hero */}
      <div className="bg-emerald-950 text-white border-b border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg border border-emerald-400/20 text-white shrink-0">
                <Tractor className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Verified Grower Partner
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    GAP Certified
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                  {stats?.farmName || 'Makhdoom Agro Farms'} Portal
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Origin: {stats?.originRegion || 'Bedian Road & Sindh Agri Basin'} • Direct Daily Cold-Chain Inbound
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSupplierData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Sync Produce
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                List Harvest Item
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-300 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Active Produce</span>
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-white">{stats?.totalListings || products.length}</p>
              <p className="text-[11px] text-emerald-300/70 mt-1">Managed catalog varieties</p>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-300 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Field Inventory</span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-white">{stats?.totalStock || 0} units</p>
              <p className="text-[11px] text-emerald-300/70 mt-1">Ready for packing hub</p>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-300 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Stock Alerts</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold font-heading text-white">{stats?.lowStockCount || 0}</p>
              <p className="text-[11px] text-emerald-300/70 mt-1">Items below 10 threshold</p>
            </div>

            <div className="bg-emerald-900/40 border border-emerald-800/60 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-300 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Dispatches</span>
                <TrendingUp className="w-4 h-4 text-teal-300" />
              </div>
              <p className="text-2xl font-bold font-heading text-white">{stats?.totalOrdersFulfilled || orders.length}</p>
              <p className="text-[11px] text-emerald-300/70 mt-1">Successfully fulfilled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Flash notifications */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </span>
            <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 mb-8 bg-white rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Package className="w-4 h-4" />
            Produce Catalog & Proposed Pricing ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('harvest')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'harvest'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Sprout className="w-4 h-4" />
            Morning Harvest Batch Submission
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Produce Dispatch Requests ({orders.length})
          </button>
        </div>

        {/* Tab 1: Catalog & Pricing */}
        {activeTab === 'catalog' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-neutral-900">Your Agricultural Listings</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update wholesale prices and field stock. Changes sync immediately to the consumer storefront.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Produce Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-neutral-600">
                <thead className="bg-neutral-50/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-100">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Produce Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Freshness / Harvest</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-neutral-100 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm">{item.name}</p>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                              {item.is_organic ? (
                                <span className="inline-flex items-center text-emerald-600 font-medium text-[11px]">
                                  <Leaf className="w-3 h-3 mr-0.5" /> 100% Organic
                                </span>
                              ) : (
                                <span>Standard Fresh</span>
                              )}
                              • {item.unit_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-neutral-700 font-medium">
                        {item.category_name || 'Groceries'}
                      </td>
                      <td className="py-4 px-4 font-bold text-neutral-900">
                        ${Number(item.base_price).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.stock_quantity <= 10
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.stock_quantity} {item.unit_type.includes('dozen') ? 'doz' : 'units'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block text-[11px] font-medium text-emerald-800 bg-emerald-50/70 border border-emerald-200/50 px-2 py-0.5 rounded-md mb-1">
                          {item.freshness_grade}
                        </span>
                        <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.harvest_date || 'Today morning'}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingProduct(item);
                            setShowEditModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Harvest Batch Logging */}
        {activeTab === 'harvest' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading text-neutral-900">Record Field Harvest Inbound</h2>
                  <p className="text-xs text-neutral-500">
                    Certify morning harvest timing. Auto-bumps freshness score to 99 and updates inventory atomically.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogHarvest} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Select Produce Variety *
                  </label>
                  <select
                    value={harvestForm.product_id}
                    onChange={(e) => setHarvestForm({ ...harvestForm, product_id: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit_type}) — Current Stock: {p.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Harvest Timestamp *
                    </label>
                    <input
                      type="text"
                      value={harvestForm.harvest_time}
                      onChange={(e) => setHarvestForm({ ...harvestForm, harvest_time: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Today, 5:30 AM"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Units Harvested Inbound *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={harvestForm.quantity_harvested}
                      onChange={(e) => setHarvestForm({ ...harvestForm, quantity_harvested: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Batch Traceability Code
                    </label>
                    <input
                      type="text"
                      value={harvestForm.batch_code}
                      onChange={(e) => setHarvestForm({ ...harvestForm, batch_code: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                      Field Quality Note
                    </label>
                    <input
                      type="text"
                      value={harvestForm.notes}
                      onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Crisp firmness, sugar brix checked"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Harvest Verification & Update Stock
                </button>
              </form>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-3xl border border-emerald-100 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold font-heading text-emerald-950 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  FreshBasket Quality Protocol
                </h3>
                <p className="text-xs text-emerald-800/80 leading-relaxed mb-4">
                  Every batch logged through this portal generates an immutable audit record in the central inventory table with the grower's authentication signature.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Harvest timestamps are shown directly to customers on product detail cards.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Inventory stock is atomically incremented without downtime or overselling risks.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>QA inspection teams verify physical Brix sugar and moisture parameters upon arrival.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-emerald-200/60 text-xs text-emerald-700">
                Logged in as <strong>{user?.full_name}</strong> • Makhdoom Agro Cooperative
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dispatch Requests */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-lg font-bold font-heading text-neutral-900">Storefront Produce Dispatch Requests</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Live delivery demand generated by customer checkout orders.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-neutral-600">
                <thead className="bg-neutral-50/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-100">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Order Reference</th>
                    <th className="py-3 px-4">Date Placed</th>
                    <th className="py-3 px-4">Fulfillment Slot</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Produce Value</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-neutral-400">
                        No customer orders currently awaiting supply dispatch.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-neutral-900">
                          {o.order_number}
                        </td>
                        <td className="py-4 px-4 text-neutral-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 font-medium text-neutral-700">
                          {o.delivery_slot}
                        </td>
                        <td className="py-4 px-4 text-neutral-600">
                          {o.items_count} items
                        </td>
                        <td className="py-4 px-4 font-bold text-neutral-900">
                          ${Number(o.supply_value).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              o.order_status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : o.order_status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {o.order_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-base font-bold font-heading text-neutral-900">Update Listing</h3>
                <p className="text-xs text-neutral-500">{editingProduct.name}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Base Price ($ per {editingProduct.unit_type})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={editingProduct.base_price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, base_price: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Available Field Stock (units)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.stock_quantity}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Freshness Grade Certification
                </label>
                <input
                  type="text"
                  value={editingProduct.freshness_grade}
                  onChange={(e) => setEditingProduct({ ...editingProduct, freshness_grade: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g., Grade A+ (Picked Today)"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Produce Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-base font-bold font-heading text-neutral-900">List New Produce Variety</h3>
                <p className="text-xs text-neutral-500">Makhdoom Agro Farms Produce Catalogue</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Crop / Variety Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Crisp Sweet Sugar Snap Peas"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    value={addForm.category_id}
                    onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Base Sales Unit *</label>
                  <input
                    type="text"
                    value={addForm.unit_type}
                    onChange={(e) => setAddForm({ ...addForm, unit_type: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 1 kg, 500g, 1 bunch"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={addForm.base_price}
                    onChange={(e) => setAddForm({ ...addForm, base_price: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="2.50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Initial Stock (units) *</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.stock_quantity}
                    onChange={(e) => setAddForm({ ...addForm, stock_quantity: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Farm Origin & Location *</label>
                <input
                  type="text"
                  value={addForm.farm_origin}
                  onChange={(e) => setAddForm({ ...addForm, farm_origin: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-6 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={addForm.is_organic}
                    onChange={(e) => setAddForm({ ...addForm, is_organic: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  100% Certified Organic
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={addForm.is_seasonal}
                    onChange={(e) => setAddForm({ ...addForm, is_seasonal: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Peak Season Harvest
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Publish Produce Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
