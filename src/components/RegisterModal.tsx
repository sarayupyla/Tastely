import React, { useState } from 'react';
import { Role, BusinessType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Store, Building, Tent, Shield, KeyRound, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignIn?: () => void;
}

export const RegisterModal: React.FC<Props> = ({ isOpen, onClose, onOpenSignIn }) => {
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [businessType, setBusinessType] = useState<BusinessType>('Restaurant');
  const [organizationName, setOrganizationName] = useState('');
  const [collegeName, setCollegeName] = useState('Metro Institute of Technology');
  const [stallNumber, setStallNumber] = useState('Stall #14');
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(['Burgers', 'Asian & Noodles']);
  const [dietary, setDietary] = useState<string[]>([]);
  const [spiceTolerance, setSpiceTolerance] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const toggleCuisine = (c: string) => {
    setFavoriteCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Full name and email address are required');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password confirmation does not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await api.registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
        businessType: role === 'vendor' ? businessType : undefined,
        organizationName: role === 'vendor' ? organizationName || `${name}'s Kitchen` : undefined,
        collegeName: role === 'vendor' && businessType !== 'Restaurant' ? collegeName : undefined,
        stallNumber: role === 'vendor' && businessType === 'College Fest Stall' ? stallNumber : undefined,
        favoriteCuisines,
        dietaryRestrictions: dietary,
        spiceTolerance
      });

      setSuccessMsg('Account created successfully! Welcome to Tastely.');
      await refreshUser();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700">
              <UserPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 tracking-tight">
                Create Tastely Account
              </h3>
              <p className="text-xs text-stone-500">
                Join our sustainable taste & food rescue community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Backend Persistence Note */}
        <div className="mb-4 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-800">Persistent Storage:</strong> Your account is registered in the backend server database with salted SHA-256 password hashing. Data persists across browser refreshes.
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Patel"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Password and Password Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Password *</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Confirm Password *</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Account Role Selector */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Select Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'customer', label: 'Customer / Foodie', desc: 'Discover & rescue food' },
                { id: 'vendor', label: 'Vendor / Stall Owner', desc: 'Manage food & stock' },
                { id: 'ngo', label: 'NGO / Volunteer', desc: 'Claim food donations' },
                { id: 'admin', label: 'Platform Admin', desc: 'Audit & oversee system' }
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as Role)}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    role === r.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">{r.label}</div>
                  <div className={`text-[10px] ${role === r.id ? 'text-stone-300' : 'text-stone-500'}`}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* If vendor role, show Business Type Selector */}
          {role === 'vendor' && (
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-orange-950 block">
                Select Your Business Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Restaurant', icon: <Store className="w-4 h-4" />, label: 'Restaurant' },
                  { id: 'College Canteen', icon: <Building className="w-4 h-4" />, label: 'Canteen' },
                  { id: 'College Fest Stall', icon: <Tent className="w-4 h-4" />, label: 'Fest Stall' }
                ].map(bt => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setBusinessType(bt.id as BusinessType)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      businessType === bt.id
                        ? 'bg-orange-600 text-white font-bold border-orange-600 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-orange-100/50'
                    }`}
                  >
                    {bt.icon}
                    <span className="text-[11px] font-bold">{bt.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  {businessType === 'College Fest Stall' ? 'Fest Stall Name *' : businessType === 'College Canteen' ? 'Canteen Name *' : 'Restaurant Name *'}
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={businessType === 'College Fest Stall' ? 'e.g. Sizzling Nachos Stall #14' : 'e.g. Campus Central Cafeteria'}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
                />
              </div>

              {businessType !== 'Restaurant' && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">College / Campus Name *</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Metro Institute of Technology"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
                  />
                </div>
              )}

              {businessType === 'College Fest Stall' && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Stall Number / Location</label>
                  <input
                    type="text"
                    value={stallNumber}
                    onChange={(e) => setStallNumber(e.target.value)}
                    placeholder="e.g. Stall #14, Main Fest Ground"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold"
                  />
                </div>
              )}
            </div>
          )}

          {/* Flavor/Cuisine Preferences */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Favorite Cuisines</label>
            <div className="flex flex-wrap gap-1.5">
              {['Burgers', 'Pizza', 'Asian & Noodles', 'Desserts & Sweets', 'Healthy & Bowls', 'Street Food & Snacks'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCuisine(c)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    favoriteCuisines.includes(c)
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Switch to Sign In */}
        {onOpenSignIn && (
          <div className="mt-5 text-center text-xs text-stone-500 pt-3 border-t border-stone-100">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSignIn();
              }}
              className="font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer ml-1"
            >
              Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
