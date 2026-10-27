import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Store, Building, Tent, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Phone, MapPin, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onRestaurantCreated?: (newRestaurant: any) => void;
  onOpenSignIn?: () => void;
}

const PRESET_BANNERS = [
  { label: 'Artisan Bistro', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' },
  { label: 'Italian Trattoria', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { label: 'Noodle Bar', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' },
  { label: 'Gourmet Burgers', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Campus Fest Stall', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80' }
];

export const RestaurantOnboardingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenSignIn
}) => {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Owner Details (if not already logged in)
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [ownerEmail, setOwnerEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  // Step 2: Restaurant Profile
  const [restaurantName, setRestaurantName] = useState('');
  const [businessType, setBusinessType] = useState<'Restaurant' | 'College Fest Stall'>('Restaurant');
  const [cuisine, setCuisine] = useState('Italian & Wood-Fired Pizza');
  const [address, setAddress] = useState('42 Market Lane, Campus District');
  const [city, setCity] = useState('Campus Hub');
  const [phone, setPhone] = useState('+91 98765 00000');
  const [deliveryTime, setDeliveryTime] = useState('20-30 min');
  const [priceRange, setPriceRange] = useState<'₹' | '₹₹' | '₹₹₹'>('₹₹');
  const [description, setDescription] = useState('Handcrafted dishes prepared fresh daily with locally sourced ingredients.');
  const [bannerImage, setBannerImage] = useState(PRESET_BANNERS[0].url);
  const [stallNumber, setStallNumber] = useState('Stall #1');
  const [collegeName, setCollegeName] = useState('Metro Institute of Technology');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!restaurantName.trim()) {
      setErrorMsg('Please enter your restaurant or stall name');
      return;
    }

    if (!user) {
      if (!ownerName.trim() || !ownerEmail.trim()) {
        setErrorMsg('Please enter your owner full name and email');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Please enter a secure password with at least 6 characters');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (!user) {
        // Register new vendor user with attached restaurant
        await api.registerUser({
          name: ownerName.trim(),
          email: ownerEmail.trim(),
          password,
          confirmPassword: password,
          role: 'vendor',
          organizationName: restaurantName.trim(),
          businessType,
          collegeName: businessType === 'College Fest Stall' ? collegeName : undefined,
          stallNumber: businessType === 'College Fest Stall' ? stallNumber : undefined,
          favoriteCuisines: [cuisine]
        });
      } else {
        // Logged-in user onboarding/updating their restaurant profile
        await api.updateVendorProfile({
          name: restaurantName.trim(),
          cuisine: cuisine.trim(),
          address: address.trim(),
          city: city.trim(),
          phone: phone.trim(),
          deliveryTime,
          priceRange,
          description: description.trim(),
          image: bannerImage,
          businessType,
          stallNumber: businessType === 'College Fest Stall' ? stallNumber : undefined,
          collegeName: businessType === 'College Fest Stall' ? collegeName : undefined
        });
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });

      await refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Restaurant onboarding error:', err);
      setErrorMsg(err.message || 'Failed to complete registration. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#173829] text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-[#173829] tracking-tight">
                Partner Onboarding & Restaurant Registration
              </h2>
              <p className="text-xs text-stone-500">
                List your kitchen on Tastely to reach diners craving your specific culinary palate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">

          {/* Business Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Business Model
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBusinessType('Restaurant')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                  businessType === 'Restaurant'
                    ? 'bg-[#173829] text-white border-[#173829] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <Building className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Standard Restaurant</div>
                  <div className="text-[10px] opacity-80">Brick & mortar dining, cafe, or cloud kitchen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBusinessType('College Fest Stall')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                  businessType === 'College Fest Stall'
                    ? 'bg-[#173829] text-white border-[#173829] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <Tent className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">College Fest Stall</div>
                  <div className="text-[10px] opacity-80">Campus fest popup stall or college canteen</div>
                </div>
              </button>
            </div>
          </div>

          {/* Owner Account Details (only if not logged in) */}
          {!user && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Owner Account Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Chef Marco Valenti"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Owner Email</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Restaurant Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {businessType === 'College Fest Stall' ? 'Stall / Brand Name' : 'Restaurant Name'}
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder={businessType === 'College Fest Stall' ? 'e.g. Sizzling Nachos Stall' : 'e.g. Trattoria Rustica'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-[#173829] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Primary Cuisine</label>
                <input
                  type="text"
                  required
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. Italian & Artisan Pizza"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-[#173829] focus:outline-none"
                />
              </div>
            </div>

            {businessType === 'College Fest Stall' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Stall Number</label>
                  <input
                    type="text"
                    value={stallNumber}
                    onChange={(e) => setStallNumber(e.target.value)}
                    placeholder="e.g. Stall #14"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">College / University</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Metro Institute of Technology"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 42 Market Lane"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Location / Zone</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Campus Hub"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Prep / Delivery Time</label>
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="20-30 min"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Price Tier</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-[#173829] focus:outline-none bg-white cursor-pointer"
                >
                  <option value="₹">₹ (Budget / Under ₹150)</option>
                  <option value="₹₹">₹₹ (Moderate / ₹150–₹350)</option>
                  <option value="₹₹₹">₹₹₹ (Gourmet / Above ₹350)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Description / Kitchen Story</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share your culinary philosophy, signature spices, or specialty dough..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-[#173829] focus:outline-none leading-relaxed"
              />
            </div>

            {/* Banner Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Cover Banner Photography</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PRESET_BANNERS.map(b => (
                  <button
                    key={b.url}
                    type="button"
                    onClick={() => setBannerImage(b.url)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer h-16 ${
                      bannerImage === b.url ? 'border-[#173829] ring-2 ring-[#173829]/20' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={b.url} alt={b.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white bg-black/60 px-1 py-0.5 rounded truncate text-center">
                      {b.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Verification Transparency Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Transparent Partner Policy:</strong> New kitchens onboard with active menu and order management immediately. Pre-loaded showcase restaurants in our system remain explicitly tagged as <em>Verified Demo Listings</em> until direct live verification is established.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
            {!user && onOpenSignIn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignIn();
                }}
                className="text-xs text-stone-600 hover:text-[#173829] font-semibold cursor-pointer"
              >
                Already have an account? Sign in
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#173829] hover:bg-[#0e241b] text-white text-xs font-bold tracking-wide transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Onboarding Kitchen...' : 'Launch Kitchen & Manage Menu'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
