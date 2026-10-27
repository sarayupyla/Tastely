import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  UtensilsCrossed, Sparkles, Tag, Users, BarChart3, 
  Store, HeartHandshake, Ticket, Search, SlidersHorizontal,
  ChevronDown, LogOut, LogIn, UserPlus, Tent, Shield, 
  Clock, PackageCheck, ShoppingBag, Compass
} from 'lucide-react';

export type ActiveTab = 
  | 'home' 
  | 'restaurants'
  | 'taste-profile'
  | 'surplus' 
  | 'recommendations' 
  | 'taste-twins' 
  | 'vendor' 
  | 'stall-hub' 
  | 'ngo' 
  | 'ngo-available' 
  | 'ngo-pickups' 
  | 'ngo-history' 
  | 'impact' 
  | 'admin';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenVouchers: () => void;
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  onOpenRestaurantOnboarding?: () => void;
  onOpenOrders?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenVouchers,
  onOpenSignIn,
  onOpenRegister,
  onOpenRestaurantOnboarding,
  onOpenOrders,
  searchQuery,
  setSearchQuery
}) => {
  const { user, reservationsCount, logout } = useAuth();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Derived effective role for navigation
  const effectiveRole = user?.role || (user ? 'customer' : 'public');

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => {
              if (effectiveRole === 'vendor') setActiveTab('vendor');
              else if (effectiveRole === 'ngo') setActiveTab('ngo-available');
              else if (effectiveRole === 'admin') setActiveTab('admin');
              else setActiveTab('home');
            }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#173829] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-all">
              <UtensilsCrossed className="w-5 h-5 text-[#FAF7F2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-serif font-bold tracking-tight text-[#173829]">
                  Tastely
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  effectiveRole === 'admin' 
                    ? 'bg-indigo-500' 
                    : effectiveRole === 'vendor' 
                    ? 'bg-[#E06A4E]' 
                    : effectiveRole === 'ngo' 
                    ? 'bg-rose-500' 
                    : 'bg-[#173829]'
                }`} />
              </div>
              <p className="text-[11px] text-stone-500 font-sans -mt-0.5 hidden sm:block">
                {effectiveRole === 'admin' 
                  ? 'System Administration Portal' 
                  : effectiveRole === 'vendor' 
                  ? 'Restaurant & Stall Portal' 
                  : effectiveRole === 'ngo' 
                  ? 'Food Rescue Network' 
                  : 'Curated Food & Taste Discovery'}
              </p>
            </div>
          </div>

          {/* Role-Based Navigation Tabs - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            
            {/* 1. CUSTOMER & PUBLIC NAVIGATION */}
            {(effectiveRole === 'customer' || effectiveRole === 'public') && (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  Home
                </button>

                <button
                  onClick={() => setActiveTab('restaurants')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'restaurants'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-[#E06A4E]" />
                  Find Restaurants
                </button>

                <button
                  onClick={() => setActiveTab('taste-profile')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'taste-profile'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Food Personality
                </button>

                <button
                  onClick={() => setActiveTab('stall-hub')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'stall-hub'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Tent className="w-3.5 h-3.5 text-[#173829]" />
                  Fest Stalls
                </button>

                <button
                  onClick={() => setActiveTab('surplus')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'surplus'
                      ? 'bg-[#E06A4E] text-white shadow-xs'
                      : 'text-[#E06A4E] hover:bg-orange-50 font-medium'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Surplus Deals
                </button>

                <button
                  onClick={() => setActiveTab('taste-twins')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'taste-twins'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                  title="Discover users with matching taste affinities"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Taste Twins
                </button>
              </>
            )}

            {/* 2. VENDOR NAVIGATION */}
            {effectiveRole === 'vendor' && (
              <>
                <button
                  onClick={() => setActiveTab('vendor')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'vendor'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-[#173829] hover:bg-emerald-50'
                  }`}
                >
                  <Store className="w-4 h-4 text-[#E06A4E]" />
                  Vendor Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('stall-hub')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'stall-hub'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Tent className="w-3.5 h-3.5 text-amber-600" />
                  Stall Hub
                </button>

                <button
                  onClick={() => setActiveTab('restaurants')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'restaurants'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Browse Restaurants
                </button>

                <button
                  onClick={() => setActiveTab('impact')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'impact'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                  Impact
                </button>
              </>
            )}

            {/* 3. NGO / VOLUNTEER NAVIGATION */}
            {effectiveRole === 'ngo' && (
              <>
                <button
                  onClick={() => setActiveTab('ngo-available')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ngo-available' || activeTab === 'ngo'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  Available Food
                </button>

                <button
                  onClick={() => setActiveTab('ngo-pickups')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ngo-pickups'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Active Pickups
                </button>

                <button
                  onClick={() => setActiveTab('ngo-history')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ngo-history'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Rescue History
                </button>
              </>
            )}

            {/* 4. ADMIN NAVIGATION */}
            {effectiveRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'text-indigo-900 hover:bg-indigo-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Admin Console
                </button>

                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'home'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Public Discovery
                </button>

                <button
                  onClick={() => setActiveTab('stall-hub')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'stall-hub'
                      ? 'bg-[#173829] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Tent className="w-3.5 h-3.5 text-amber-600" />
                  Stall Hub
                </button>
              </>
            )}

          </nav>

          {/* Quick search (desktop only) */}
          {(effectiveRole === 'customer' || effectiveRole === 'public') && (
            <div className="relative flex-1 max-w-xs hidden 2xl:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, restaurants..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#173829] focus:border-transparent transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Right Action Menu: Register Restaurant, Cart, Auth & Profile */}
          <div className="flex items-center gap-2">
            
            {/* Restaurant Registration button (Vendors & Admins only) */}
            {onOpenRestaurantOnboarding && (effectiveRole === 'vendor' || effectiveRole === 'admin') && (
              <button
                type="button"
                onClick={onOpenRestaurantOnboarding}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#173829] hover:text-[#173829] border border-[#173829]/25 hover:border-[#173829]/60 rounded-xl bg-white/70 hover:bg-white transition-all cursor-pointer shadow-2xs"
                title="Register a restaurant or college fest stall"
              >
                <Store className="w-3.5 h-3.5 text-[#E06A4E]" />
                <span>Register Restaurant</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            {(effectiveRole === 'customer' || effectiveRole === 'public') && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-[#173829] hover:border-stone-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                title="View Food Cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#173829]" />
                <span className="text-xs font-semibold hidden md:inline">Cart</span>
                {totalItemsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#E06A4E] text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-75">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            )}

            {/* When user is NOT signed in: display clear Sign In & Sign Up */}
            {!user ? (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Sign in with your email and password"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-600" />
                  <span>Login</span>
                </button>

                <button
                  onClick={onOpenRegister}
                  className="px-3.5 py-2 rounded-xl bg-[#173829] hover:bg-[#10271d] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Create a new account"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#E06A4E]" />
                  <span>Sign Up</span>
                </button>
              </>
            ) : (
              <>
                {/* Orders Button */}
                {effectiveRole === 'customer' && onOpenOrders && (
                  <button
                    type="button"
                    onClick={onOpenOrders}
                    className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="My Orders & Receipts"
                  >
                    <Clock className="w-4 h-4 text-stone-600" />
                    <span className="text-xs font-medium hidden md:inline">Orders</span>
                  </button>
                )}

                {/* Vouchers Button */}
                {(effectiveRole === 'customer' || reservationsCount > 0) && (
                  <button
                    onClick={onOpenVouchers}
                    className="relative p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="My Surplus Reservations"
                  >
                    <Ticket className="w-4 h-4 text-[#E06A4E]" />
                    <span className="text-xs font-medium hidden md:inline">Vouchers</span>
                    {reservationsCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#E06A4E] text-white text-[10px] font-bold flex items-center justify-center">
                        {reservationsCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Profile Avatar & Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(prev => !prev)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-200/60 transition-all cursor-pointer"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#173829]/20"
                    />
                    <div className="text-left hidden 2xl:block">
                      <div className="text-xs font-semibold text-stone-900 leading-tight">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-stone-500 capitalize">
                        {user.tasteProfile?.tasteTwinAlias || user.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onMouseLeave={() => setShowProfileMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-bold text-stone-900">{user.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                        <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          user.role === 'admin' 
                            ? 'bg-indigo-50 text-indigo-800' 
                            : user.role === 'vendor' 
                            ? 'bg-orange-50 text-[#E06A4E]' 
                            : user.role === 'ngo' 
                            ? 'bg-rose-50 text-rose-800' 
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          Role: {user.role.toUpperCase()}
                        </div>
                      </div>

                      <div className="py-1">
                        
                        {/* Customer-specific dropdown links */}
                        {user.role === 'customer' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveTab('taste-profile');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4 text-[#E06A4E]" />
                              Food Personality & Palate
                            </button>
                            <button
                              onClick={() => {
                                if (onOpenOrders) onOpenOrders();
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <ShoppingBag className="w-4 h-4 text-[#173829]" />
                              My Orders & Receipts
                            </button>
                            <button
                              onClick={() => {
                                onOpenVouchers();
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Ticket className="w-4 h-4 text-amber-600" />
                              Claimed Surplus Vouchers
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('taste-twins');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Users className="w-4 h-4 text-emerald-600" />
                              Taste Twin Matches
                            </button>
                          </>
                        )}

                        {/* Vendor-specific dropdown links */}
                        {user.role === 'vendor' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveTab('vendor');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-[#173829] hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Store className="w-4 h-4 text-[#E06A4E]" />
                              Vendor Management Dashboard
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('stall-hub');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Tent className="w-4 h-4 text-amber-600" />
                              Campus Stall Hub
                            </button>
                          </>
                        )}

                        {/* NGO-specific dropdown links */}
                        {user.role === 'ngo' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveTab('ngo-available');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <HeartHandshake className="w-4 h-4 text-rose-600" />
                              Available Food Donations
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('ngo-pickups');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Clock className="w-4 h-4 text-amber-600" />
                              Active Pickups
                            </button>
                          </>
                        )}

                        {/* Admin-specific dropdown links */}
                        {user.role === 'admin' && (
                          <>
                            <button
                              onClick={() => {
                                setActiveTab('admin');
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Shield className="w-4 h-4 text-indigo-600" />
                              System Admin Console
                            </button>
                          </>
                        )}

                        <div className="border-t border-stone-100 my-1" />

                        <button
                          onClick={async () => {
                            await logout();
                            setShowProfileMenu(false);
                            setActiveTab('home');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 border-t border-stone-200/60 no-scrollbar">
          
          {/* Customer / Public Mobile Navigation */}
          {(effectiveRole === 'customer' || effectiveRole === 'public') && (
            <>
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'home' ? 'bg-[#173829] text-white' : 'text-stone-600 bg-white/70'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('restaurants')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'restaurants' ? 'bg-[#173829] text-white' : 'text-stone-600 bg-white/70'
                }`}
              >
                Find Restaurants
              </button>
              <button
                onClick={() => setActiveTab('taste-profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'taste-profile' ? 'bg-[#173829] text-white' : 'text-stone-600 bg-white/70'
                }`}
              >
                Food Personality
              </button>
              <button
                onClick={() => setActiveTab('surplus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'surplus' ? 'bg-[#E06A4E] text-white' : 'text-[#E06A4E] bg-orange-50'
                }`}
              >
                Surplus Deals
              </button>
              <button
                onClick={() => setActiveTab('stall-hub')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'stall-hub' ? 'bg-[#173829] text-white' : 'text-stone-600 bg-white/70'
                }`}
              >
                Fest Stalls
              </button>
              <button
                onClick={() => setActiveTab('taste-twins')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'taste-twins' ? 'bg-[#173829] text-white font-semibold' : 'text-stone-700 bg-white/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Taste Twins</span>
              </button>
            </>
          )}

          {/* Vendor Mobile Navigation */}
          {effectiveRole === 'vendor' && (
            <>
              <button
                onClick={() => setActiveTab('vendor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'vendor' ? 'bg-[#173829] text-white' : 'text-[#173829] bg-white'
                }`}
              >
                Vendor Dashboard
              </button>
              <button
                onClick={() => setActiveTab('stall-hub')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'stall-hub' ? 'bg-[#173829] text-white' : 'text-stone-700 bg-white'
                }`}
              >
                Stall Hub
              </button>
              <button
                onClick={() => setActiveTab('restaurants')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'restaurants' ? 'bg-[#173829] text-white' : 'text-stone-600 bg-white'
                }`}
              >
                Browse
              </button>
              {onOpenRestaurantOnboarding && (
                <button
                  onClick={onOpenRestaurantOnboarding}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-[#173829] border border-[#173829]/30 bg-white"
                >
                  Register Restaurant
                </button>
              )}
            </>
          )}

          {/* NGO Mobile Navigation */}
          {effectiveRole === 'ngo' && (
            <>
              <button
                onClick={() => setActiveTab('ngo-available')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'ngo-available' ? 'bg-[#173829] text-white' : 'text-rose-700 bg-white'
                }`}
              >
                Available Food
              </button>
              <button
                onClick={() => setActiveTab('ngo-pickups')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  activeTab === 'ngo-pickups' ? 'bg-[#173829] text-white' : 'text-stone-700 bg-white'
                }`}
              >
                Active Pickups
              </button>
            </>
          )}

        </div>

      </div>
    </header>
  );
};
