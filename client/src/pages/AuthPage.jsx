import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Apple, ShieldCheck, UserCheck, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginDemo } = useAuth();
  const { showToast } = useCart();

  const isRegisterPage = location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(isRegisterPage);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          full_name: fullName,
          email,
          password,
          phone_number: phone,
          role
        });
        showToast('Registration successful! Welcome to FreshBasket.');
      } else {
        await login(email, password);
        showToast('Logged in successfully!');
      }
      navigate(-1); // return to previous page
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoRole) {
    setLoading(true);
    try {
      await loginDemo(demoRole);
      showToast(`Logged in as demo ${demoRole}!`);
      if (demoRole === 'admin') navigate('/admin');
      else if (demoRole === 'supplier') navigate('/supplier');
      else if (demoRole === 'logistics') navigate('/logistics');
      else navigate('/shop');
    } catch (err) {
      showToast(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-700 flex items-center justify-center text-white shadow-md">
            <Apple className="w-7 h-7 text-white" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-stone-900">
            Fresh<span className="text-brand-600">Basket</span>
          </span>
        </Link>
        <h1 className="text-xl font-heading font-bold text-stone-800">
          {isRegister ? 'Create Your Customer Account' : 'Welcome Back to FreshBasket'}
        </h1>
        <p className="text-xs text-stone-500">
          Access your morning harvest orders, multiple addresses & live tracking
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => { setIsRegister(false); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl transition ${!isRegister ? 'bg-white text-brand-700 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setIsRegister(true); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl transition ${isRegister ? 'bg-white text-brand-700 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}
        >
          Register
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xl space-y-4 text-xs">
        
        {isRegister && (
          <div>
            <label className="block font-bold text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="e.g. Ali Shan"
              className="w-full p-2.5 border rounded-xl bg-stone-50 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>
        )}

        <div>
          <label className="block font-bold text-stone-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full p-2.5 border rounded-xl bg-stone-50 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Minimum 6 characters"
            className="w-full p-2.5 border rounded-xl bg-stone-50 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        {isRegister && (
          <div>
            <label className="block font-bold text-stone-700 mb-1">Telephone Contact</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full p-2.5 border rounded-xl bg-stone-50 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-heading font-bold text-xs shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Sign In to FreshBasket'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>

      {/* 1-Click Demo Accounts Box for Evaluators */}
      <div className="bg-stone-50 border border-stone-200/80 rounded-3xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-stone-900 font-bold">
          <UserCheck className="w-4 h-4 text-brand-600" />
          <span>One-Click Academic & Evaluation Demo Roles</span>
        </div>
        <p className="text-[11px] text-stone-500">
          Instantly authenticate with pre-configured verified credentials without manual typing:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleDemoLogin('customer')}
            className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl hover:bg-emerald-100/80 transition text-center font-bold text-emerald-950 shadow-xs active:scale-95"
          >
            <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Customer</span>
            <span className="text-xs sm:text-sm">Ali Shan</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl hover:bg-purple-100/80 transition text-center font-bold text-purple-950 shadow-xs active:scale-95"
          >
            <span className="block text-[10px] text-purple-600 font-bold uppercase tracking-wider">Admin</span>
            <span className="text-xs sm:text-sm">Ali Hassan</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('supplier')}
            className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl hover:bg-amber-100/80 transition text-center font-bold text-amber-950 shadow-xs active:scale-95"
          >
            <span className="block text-[10px] text-amber-600 font-bold uppercase tracking-wider">Grower</span>
            <span className="text-xs sm:text-sm">Makhdoom</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('logistics')}
            className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl hover:bg-blue-100/80 transition text-center font-bold text-blue-950 shadow-xs active:scale-95"
          >
            <span className="block text-[10px] text-blue-600 font-bold uppercase tracking-wider">Logistics Lead</span>
            <span className="text-xs sm:text-sm">Tariq M.</span>
          </button>
        </div>
      </div>

    </div>
  );
}
