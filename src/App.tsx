import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Dish, Restaurant, SurplusOffer, Reservation, Role, Order } from './types';
import { api } from './services/api';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { Navbar, ActiveTab } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { RestaurantHero } from './components/RestaurantHero';
import { RestaurantDetailsView } from './components/RestaurantDetailsView';
import { FoodPersonalityView } from './components/FoodPersonalityView';
import { RestaurantOnboardingModal } from './components/RestaurantOnboardingModal';
import { SurplusDealsSection } from './components/SurplusDealsSection';
import { DiscoverySection } from './components/DiscoverySection';
import { RecommendationsView } from './components/RecommendationsView';
import { TasteTwinsView } from './components/TasteTwinsView';
import { VendorDashboard } from './components/VendorDashboard';
import { NGODashboard } from './components/NGODashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ImpactDashboard } from './components/ImpactDashboard';
import { ReservationModal } from './components/ReservationModal';
import { RateDishModal } from './components/RateDishModal';
import { VouchersDrawer } from './components/VouchersDrawer';
import { RegisterModal } from './components/RegisterModal';
import { SignInModal } from './components/SignInModal';
import { StallHubView } from './components/StallHubView';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerOrdersDrawer } from './components/CustomerOrdersDrawer';
import { DishReviewsModal } from './components/DishReviewsModal';
import { UtensilsCrossed, CheckCircle2, ShieldCheck, Lock, Sparkles, Store } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoleGuardProps {
  requiredRole: 'vendor' | 'ngo' | 'admin';
  userRole?: string;
  onSignIn: () => void;
  onSwitchRole: (role: Role) => void;
  onReturnHome: () => void;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  requiredRole, 
  userRole, 
  onSignIn, 
  onSwitchRole, 
  onReturnHome 
}) => {
  const configs = {
    vendor: {
      title: 'Vendor Dashboard & Inventory Portal',
      desc: 'This portal is restricted to registered restaurants, college canteens, and fest stalls. Vendors manage item details, prices in ₹, remaining stock, surplus discounts, and donation marks.',
      badge: 'Vendor Role Authorization Required'
    },
    ngo: {
      title: 'NGO Food Rescue Network',
      desc: 'This portal is restricted to certified non-profit teams and authorized student food rescue volunteers coordinating surplus pickups and shelter distribution.',
      badge: 'NGO Volunteer Authorization Required'
    },
    admin: {
      title: 'Platform System Administration',
      desc: 'This control center is strictly restricted to authorized system administrators. Administrative privileges are not exposed to ordinary customers, vendors, or NGOs.',
      badge: 'System Administrator Access Only'
    }
  };

  const config = configs[requiredRole];

  return (
    <div className="py-16 px-4 max-w-2xl mx-auto text-center">
      <div className="p-8 md:p-12 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shadow-xs">
          <Lock className="w-8 h-8 text-amber-700" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-800 mb-2">
            {config.badge}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight font-serif">
            Role Authorization Required
          </h2>
          <p className="text-sm text-stone-600 mt-2 max-w-lg mx-auto leading-relaxed">
            {config.desc}
          </p>
          <p className="text-xs text-stone-400 mt-3 font-medium">
            Current session status:{' '}
            <span className="font-bold text-stone-800 uppercase">
              {userRole ? `Role: ${userRole}` : 'Unauthenticated Visitor'}
            </span>
          </p>
        </div>

        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onSwitchRole(requiredRole as Role)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#173829] hover:bg-[#10271d] text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
          >
            Switch to {requiredRole.toUpperCase()} in Demo Switcher
          </button>

          <button
            onClick={onSignIn}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-all cursor-pointer"
          >
            Sign In with Different Account
          </button>

          <button
            onClick={onReturnHome}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-medium transition-all cursor-pointer"
          >
            Return to Discovery
          </button>
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  
  // Data states
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [surplusOffers, setSurplusOffers] = useState<SurplusOffer[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals & Dedicated Views
  const [selectedSurplusOffer, setSelectedSurplusOffer] = useState<SurplusOffer | null>(null);
  const [selectedDishForRating, setSelectedDishForRating] = useState<Dish | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedDishForReviews, setSelectedDishForReviews] = useState<Dish | null>(null);
  const [isVouchersOpen, setIsVouchersOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [customerOrdersTab, setCustomerOrdersTab] = useState<'orders' | 'reservations'>('orders');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isRestaurantOnboardingOpen, setIsRestaurantOnboardingOpen] = useState(false);
  const [orderedDishToast, setOrderedDishToast] = useState<Dish | null>(null);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [dishList, restList, offersList] = await Promise.all([
        api.getDishes(),
        api.getRestaurants(),
        api.getSurplusOffers()
      ]);
      setDishes(dishList);
      setRestaurants(restList);
      setSurplusOffers(offersList);
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Customer order handler: adds item to shopping cart with stock check
  const handleOrderDish = (dish: Dish) => {
    if (dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0)) {
      alert(`"${dish.name}" is currently Sold Out!`);
      return;
    }
    const res = addToCart(dish);
    if (res.success) {
      setOrderedDishToast(dish);
      setTimeout(() => setOrderedDishToast(null), 3000);
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { y: 0.85 }
      });
    }
  };

  const handleOrderSuccess = (_order: Order) => {
    loadData(); // Re-fetch dishes and live stock immediately from backend
  };

  const handleSurplusReserved = (_reservation: Reservation) => {
    api.getSurplusOffers().then(setSurplusOffers).catch(console.error);
  };

  // Helper to handle role switch from demo bar or guard
  const handleRoleSwitched = (targetRole: Role) => {
    if (targetRole === 'vendor') setActiveTab('vendor');
    else if (targetRole === 'ngo') setActiveTab('ngo-available');
    else if (targetRole === 'admin') setActiveTab('admin');
    else setActiveTab('home');
  };

  // Check role authorization permissions
  const isVendorAuthorized = user && (user.role === 'vendor' || user.role === 'admin');
  const isNGOAuthorized = user && (user.role === 'ngo' || user.role === 'admin');
  const isAdminAuthorized = user && user.role === 'admin';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-[#E06A4E] selection:text-white">
      
      {/* 1. Global Role Switcher Banner */}
      <RoleSwitcherBar 
        onOpenRegisterModal={() => setIsRegisterOpen(true)} 
        onRoleSwitched={handleRoleSwitched}
      />

      {/* 2. Main Navigation Bar with Refined Forest & Ivory Palette */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedRestaurant(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenVouchers={() => {
          setCustomerOrdersTab('reservations');
          setIsCustomerOrdersOpen(true);
        }}
        onOpenOrders={() => {
          setCustomerOrdersTab('orders');
          setIsCustomerOrdersOpen(true);
        }}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenRestaurantOnboarding={() => setIsRestaurantOnboardingOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 3. Main Views Content */}
      <main className="flex-1">
        
        {/* Customer / Public Food Discovery */}
        {activeTab === 'home' && (
          <>
            {selectedRestaurant ? (
              <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <RestaurantDetailsView
                  restaurant={selectedRestaurant}
                  dishes={dishes}
                  onBack={() => {
                    setSelectedRestaurant(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOrderDish={handleOrderDish}
                  onOpenReviews={(dish: Dish) => setSelectedDishForReviews(dish)}
                  onOpenRateModal={(dish: Dish) => setSelectedDishForRating(dish)}
                  surplusOffers={surplusOffers}
                  onReserveSurplus={(offer) => {
                    setSelectedRestaurant(null);
                    setSelectedSurplusOffer(offer);
                  }}
                />
              </div>
            ) : (
              <>
                {/* Original 3D Food Carousel Hero Section Animation */}
                <HeroCarousel
                  onDiscoverClick={() => {
                    const el = document.getElementById('discovery-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onSurplusClick={() => {
                    const el = document.getElementById('surplus-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                {/* Surplus Food Deals Section (50%-70% OFF) */}
                <div id="surplus-section">
                  <SurplusDealsSection
                    offers={surplusOffers}
                    restaurants={restaurants}
                    onReserve={(offer) => setSelectedSurplusOffer(offer)}
                    onSelectRestaurant={(rest) => {
                      setSelectedRestaurant(rest);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    isLoading={isLoadingData}
                  />
                </div>

                {/* Customer Discovery: Responsive Restaurant Cards & Dish Cards */}
                <div id="discovery-section">
                  <DiscoverySection
                    dishes={dishes}
                    restaurants={restaurants}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedLocation={selectedLocation}
                    onClearLocation={() => setSelectedLocation('All')}
                    onOpenRateModal={(dish) => setSelectedDishForRating(dish)}
                    onOrderDish={handleOrderDish}
                    onOpenTasteProfile={() => {
                      setActiveTab('taste-profile');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onSelectRestaurant={(rest) => {
                      setSelectedRestaurant(rest);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onOpenReviews={(dish) => setSelectedDishForReviews(dish)}
                    isLoading={isLoadingData}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Dedicated 'Find Restaurants' Tab */}
        {activeTab === 'restaurants' && (
          <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {selectedRestaurant ? (
              <RestaurantDetailsView
                restaurant={selectedRestaurant}
                dishes={dishes}
                onBack={() => {
                  setSelectedRestaurant(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOrderDish={handleOrderDish}
                onOpenReviews={(dish: Dish) => setSelectedDishForReviews(dish)}
                onOpenRateModal={(dish: Dish) => setSelectedDishForRating(dish)}
                surplusOffers={surplusOffers}
                onReserveSurplus={(offer) => {
                  setSelectedRestaurant(null);
                  setSelectedSurplusOffer(offer);
                }}
              />
            ) : (
              <>
                <RestaurantHero
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCity={selectedLocation}
                  setSelectedCity={setSelectedLocation}
                  userTasteProfile={user?.tasteProfile}
                  onSearchSubmit={(query: string) => {
                    setSearchQuery(query);
                  }}
                  onSelectCuisine={(cuisine: string) => {
                    setSearchQuery(cuisine);
                  }}
                  onOpenTasteProfile={() => {
                    setActiveTab('taste-profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenTastePalate={() => {
                    setActiveTab('taste-profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                <DiscoverySection
                  dishes={dishes}
                  restaurants={restaurants}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedLocation={selectedLocation}
                  onClearLocation={() => setSelectedLocation('All')}
                  onOpenRateModal={(dish) => setSelectedDishForRating(dish)}
                  onOrderDish={handleOrderDish}
                  onOpenTasteProfile={() => {
                    setActiveTab('taste-profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectRestaurant={(rest) => {
                    setSelectedRestaurant(rest);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenReviews={(dish) => setSelectedDishForReviews(dish)}
                  isLoading={isLoadingData}
                />
              </>
            )}
          </div>
        )}

        {/* Dedicated Food Personality Onboarding Tab */}
        {activeTab === 'taste-profile' && (
          <FoodPersonalityView
            onBackToDiscovery={() => {
              setActiveTab('restaurants');
              setSelectedRestaurant(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSavedRedirect={() => {
              setActiveTab('restaurants');
              setSelectedRestaurant(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTasteTwins={() => {
              setActiveTab('taste-twins');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Surplus Flash Deals Tab */}
        {activeTab === 'surplus' && (
          <div className="py-6">
            <SurplusDealsSection
              offers={surplusOffers}
              restaurants={restaurants}
              onReserve={(offer) => setSelectedSurplusOffer(offer)}
              onSelectRestaurant={(rest) => {
                setSelectedRestaurant(rest);
                setActiveTab('restaurants');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isLoading={isLoadingData}
            />
          </div>
        )}

        {/* Personalized Recommendations */}
        {activeTab === 'recommendations' && (
          <RecommendationsView
            onOpenRateModal={(dish) => setSelectedDishForRating(dish)}
            onOrderDish={handleOrderDish}
            restaurants={restaurants}
            onSelectRestaurant={(rest) => {
              setSelectedRestaurant(rest);
              setActiveTab('restaurants');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Taste Twins Social Matching */}
        {activeTab === 'taste-twins' && (
          <TasteTwinsView
            onDiscoverDish={(dishName) => {
              setSearchQuery(dishName);
              setActiveTab('home');
              setSelectedRestaurant(null);
              setTimeout(() => {
                const el = document.getElementById('discovery-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            onOpenTasteProfile={() => {
              setActiveTab('taste-profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* College Fest Stall Hub */}
        {activeTab === 'stall-hub' && (
          <StallHubView 
            onOrderDish={handleOrderDish}
            onNavigateToVendor={() => setActiveTab('vendor')}
            onDishAdded={loadData}
          />
        )}

        {/* Vendor Dashboard - Protected by Role Authorization */}
        {activeTab === 'vendor' && (
          isVendorAuthorized ? (
            <VendorDashboard />
          ) : (
            <RoleGuard
              requiredRole="vendor"
              userRole={user?.role}
              onSignIn={() => setIsSignInOpen(true)}
              onSwitchRole={async (r) => {
                await switchRole(r);
                handleRoleSwitched(r);
              }}
              onReturnHome={() => setActiveTab('home')}
            />
          )
        )}

        {/* NGO Rescue Network - Protected by Role Authorization */}
        {(activeTab === 'ngo' || activeTab === 'ngo-available') && (
          isNGOAuthorized ? (
            <NGODashboard initialFilter="available" />
          ) : (
            <RoleGuard
              requiredRole="ngo"
              userRole={user?.role}
              onSignIn={() => setIsSignInOpen(true)}
              onSwitchRole={async (r) => {
                await switchRole(r);
                handleRoleSwitched(r);
              }}
              onReturnHome={() => setActiveTab('home')}
            />
          )
        )}

        {/* NGO Pickups & Transit View */}
        {activeTab === 'ngo-pickups' && (
          isNGOAuthorized ? (
            <NGODashboard initialFilter="claimed" />
          ) : (
            <RoleGuard
              requiredRole="ngo"
              userRole={user?.role}
              onSignIn={() => setIsSignInOpen(true)}
              onSwitchRole={async (r) => {
                await switchRole(r);
                handleRoleSwitched(r);
              }}
              onReturnHome={() => setActiveTab('home')}
            />
          )
        )}

        {/* NGO Completed Rescue History View */}
        {activeTab === 'ngo-history' && (
          isNGOAuthorized ? (
            <NGODashboard initialFilter="completed" />
          ) : (
            <RoleGuard
              requiredRole="ngo"
              userRole={user?.role}
              onSignIn={() => setIsSignInOpen(true)}
              onSwitchRole={async (r) => {
                await switchRole(r);
                handleRoleSwitched(r);
              }}
              onReturnHome={() => setActiveTab('home')}
            />
          )
        )}

        {/* Admin Dashboard - Protected for Authorized Administrators Only */}
        {activeTab === 'admin' && (
          isAdminAuthorized ? (
            <AdminDashboard />
          ) : (
            <RoleGuard
              requiredRole="admin"
              userRole={user?.role}
              onSignIn={() => setIsSignInOpen(true)}
              onSwitchRole={async (r) => {
                await switchRole(r);
                handleRoleSwitched(r);
              }}
              onReturnHome={() => setActiveTab('home')}
            />
          )
        )}

        {/* Impact Statistics */}
        {activeTab === 'impact' && <ImpactDashboard />}

      </main>

      {/* 4. Global Refined Footer */}
      <footer className="bg-[#12281D] text-stone-300 py-14 border-t border-[#173829]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-800/80">
            
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E06A4E] text-white flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <span className="text-2xl font-serif font-bold text-white tracking-tight">
                  Tastely
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed font-sans">
                Curated restaurant discovery and flavor profile intelligence uniting personalized dining with daily surplus food rescue.
              </p>
              {isVendorAuthorized && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRestaurantOnboardingOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-medium border border-white/10 transition-all cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-[#E06A4E]" />
                    <span>Register a Restaurant</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Discovery & Taste
              </h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => { setActiveTab('restaurants'); setSelectedRestaurant(null); }} className="hover:text-white cursor-pointer text-stone-400">Find Restaurants</button></li>
                <li><button onClick={() => { setActiveTab('taste-profile'); setSelectedRestaurant(null); }} className="hover:text-white cursor-pointer text-stone-400">Food Personality Quiz</button></li>
                <li><button onClick={() => { setActiveTab('surplus'); setSelectedRestaurant(null); }} className="hover:text-white cursor-pointer text-[#E06A4E]">Surplus Deals (-50%)</button></li>
                <li><button onClick={() => { setActiveTab('taste-twins'); setSelectedRestaurant(null); }} className="hover:text-white cursor-pointer text-stone-400">Taste Twins Social Match</button></li>
                <li><button onClick={() => { setActiveTab('stall-hub'); setSelectedRestaurant(null); }} className="hover:text-white cursor-pointer text-stone-400">Campus Fest Stall Hub</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Portals & Management
              </h4>
              <ul className="space-y-2 text-xs">
                {isVendorAuthorized && (
                  <li><button onClick={() => setActiveTab('vendor')} className="hover:text-white cursor-pointer text-stone-400">Vendor Management Dashboard</button></li>
                )}
                {isNGOAuthorized && (
                  <li><button onClick={() => setActiveTab('ngo-available')} className="hover:text-white cursor-pointer text-stone-400">NGO Rescue Network</button></li>
                )}
                {isAdminAuthorized && (
                  <li><button onClick={() => setActiveTab('admin')} className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer">System Admin Console</button></li>
                )}
                <li><button onClick={() => setActiveTab('impact')} className="hover:text-white cursor-pointer text-stone-400">Environmental Impact Audit</button></li>
                <li><button onClick={() => setIsRegisterOpen(true)} className="hover:text-white cursor-pointer text-stone-400">Create New Account</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Culinary Integrity
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed mb-3">
                Every rating, match percentage, and menu price is computed from verifiable user ratings and active vendor inventory. Seeded listings are clearly labelled.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Genuine Reviews & Transparent Menus</span>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
            <div>© {new Date().getFullYear()} Tastely. Handcrafted with warm tones, serif typography, and real flavor intelligence.</div>
            <div className="flex items-center gap-4">
              <span>Authentic Listings</span>
              <span>•</span>
              <span>Direct Cart Ordering</span>
              <span>•</span>
              <span>Zero Slop</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Drawers */}
      {selectedSurplusOffer && (
        <ReservationModal
          key={selectedSurplusOffer.id}
          offer={selectedSurplusOffer}
          onClose={() => setSelectedSurplusOffer(null)}
          onSuccess={handleSurplusReserved}
          onViewReservations={() => {
            setSelectedSurplusOffer(null);
            setCustomerOrdersTab('reservations');
            setIsCustomerOrdersOpen(true);
          }}
        />
      )}

      <RateDishModal
        dish={selectedDishForRating}
        onClose={() => setSelectedDishForRating(null)}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Dish Reviews & Taste-Match Feedback Modal */}
      {selectedDishForReviews && (
        <DishReviewsModal
          dish={selectedDishForReviews}
          onClose={() => setSelectedDishForReviews(null)}
        />
      )}

      <VouchersDrawer
        isOpen={isVouchersOpen}
        onClose={() => setIsVouchersOpen(false)}
      />

      {/* Customer Shopping Cart Drawer */}
      <CartDrawer />

      {/* Customer Checkout & Order Creation Modal */}
      <CheckoutModal onOrderSuccess={handleOrderSuccess} />

      {/* Customer Orders & Receipts Tracking Drawer */}
      <CustomerOrdersDrawer
        isOpen={isCustomerOrdersOpen}
        onClose={() => setIsCustomerOrdersOpen(false)}
        onOrderCancelled={loadData}
        initialTab={customerOrdersTab}
      />

      {/* Restaurant Owner Registration Modal */}
      <RestaurantOnboardingModal
        isOpen={isRestaurantOnboardingOpen}
        onClose={() => setIsRestaurantOnboardingOpen(false)}
        onRestaurantCreated={(newRestaurant: Restaurant) => {
          setRestaurants(prev => [newRestaurant, ...prev]);
          loadData();
          setSelectedRestaurant(newRestaurant);
          setActiveTab('restaurants');
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOpenSignIn={() => {
          setIsRegisterOpen(false);
          setIsSignInOpen(true);
        }}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onOpenRegister={() => {
          setIsSignInOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      {/* Quick Order Toast */}
      {orderedDishToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#173829] text-white shadow-2xl border border-[#173829]/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-2 rounded-xl bg-[#E06A4E] text-white">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Item added to your cart</div>
            <div className="text-[11px] text-stone-300">{orderedDishToast.name} (₹{orderedDishToast.price})</div>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
