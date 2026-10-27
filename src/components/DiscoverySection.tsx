import React, { useState } from 'react';
import { Dish, Restaurant, TasteProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  calculateDishTasteMatch, 
  calculateRestaurantTasteMatch, 
  AVAILABLE_FLAVORS, 
  AVAILABLE_TEXTURES 
} from '../utils/personalization';
import { 
  Search, Star, SlidersHorizontal, Flame, Heart, 
  MapPin, Clock, Sparkles, Plus, Minus, Check, MessageSquare, 
  Sliders, ArrowRight, UserCheck, X, ChefHat, Info, Store, 
  UtensilsCrossed, Building, Tent, Filter 
} from 'lucide-react';

interface Props {
  dishes: Dish[];
  restaurants: Restaurant[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedLocation?: string;
  onClearLocation?: () => void;
  onOpenRateModal: (dish: Dish) => void;
  onOrderDish: (dish: Dish) => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  onOpenReviews?: (dish: Dish) => void;
  onOpenTasteProfile?: () => void;
  isLoading?: boolean;
}

export function matchRestaurantLocation(rest: Restaurant, location?: string): boolean {
  if (!location || location === 'All') return true;
  const loc = location.trim().toLowerCase();

  if (loc === 'campus hub') {
    // Campus Hub shows all listings belonging to the campus, including its sub-areas
    const city = (rest.city || '').toLowerCase();
    const address = (rest.address || '').toLowerCase();
    return city.includes('campus hub') || address.includes('campus');
  }

  if (loc === 'university avenue') {
    // Show listings whose address identifies University Avenue
    const address = (rest.address || '').toLowerCase();
    const city = (rest.city || '').toLowerCase();
    return address.includes('university avenue') || city.includes('university avenue');
  }

  if (loc === 'arts quarter') {
    // Show listings whose address identifies Arts Quarter
    const address = (rest.address || '').toLowerCase();
    const city = (rest.city || '').toLowerCase();
    return address.includes('arts quarter') || city.includes('arts quarter');
  }

  const city = (rest.city || '').toLowerCase();
  const address = (rest.address || '').toLowerCase();
  return city.includes(loc) || address.includes(loc);
}

export const CUISINE_FILTERS = [
  'All',
  'Favourites',
  'Pizza',
  'Burgers',
  'Desserts & Ice Cream',
  'Indian & Biryani',
  'Asian & Chinese',
  'Cafés & Bakery',
  'Healthy & Bowls',
  'College Fest Stalls'
];

export function matchCuisineCategory(
  filter: string,
  cuisineText: string,
  tags: string[] = [],
  category: string = '',
  businessType: string = ''
): boolean {
  if (filter === 'All') return true;
  const f = filter.toLowerCase();
  const c = (cuisineText || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  const allTags = (tags || []).map(t => t.toLowerCase());
  const bType = (businessType || '').toLowerCase();

  if (filter === 'Pizza') {
    return c.includes('pizza') || c.includes('italian') || cat.includes('pizza') || allTags.some(t => t.includes('pizza') || t.includes('italian'));
  }
  if (filter === 'Burgers') {
    return c.includes('burger') || c.includes('american') || cat.includes('burger') || allTags.some(t => t.includes('burger'));
  }
  if (filter === 'Desserts & Ice Cream') {
    return c.includes('dessert') || c.includes('ice cream') || c.includes('sweet') ||
      cat.includes('dessert') || cat.includes('ice cream') || cat.includes('sundae') || cat.includes('waffle') || cat.includes('chocolate') || cat.includes('scoop') || cat.includes('cake') ||
      allTags.some(t => t.includes('ice cream') || t.includes('dessert') || t.includes('sundae') || t.includes('waffle') || t.includes('sweet'));
  }
  if (filter === 'Indian & Biryani') {
    return c.includes('indian') || c.includes('biryani') || c.includes('mughlai') ||
      cat.includes('biryani') || cat.includes('curry') || cat.includes('thali') || cat.includes('tandoori') || cat.includes('roti') || cat.includes('bread') ||
      allTags.some(t => t.includes('biryani') || t.includes('indian') || t.includes('tandoori') || t.includes('curry'));
  }
  if (filter === 'Asian & Chinese') {
    return c.includes('asian') || c.includes('chinese') || c.includes('noodle') || c.includes('ramen') ||
      cat.includes('asian') || cat.includes('chinese') || cat.includes('noodle') || cat.includes('ramen') || cat.includes('dumpling') ||
      allTags.some(t => t.includes('asian') || t.includes('chinese') || t.includes('noodle') || t.includes('ramen'));
  }
  if (filter === 'Cafés & Bakery') {
    return c.includes('café') || c.includes('cafe') || c.includes('bakery') || c.includes('coffee') ||
      cat.includes('café') || cat.includes('cafe') || cat.includes('coffee') || cat.includes('bakery') || cat.includes('beverage') || cat.includes('brew') || cat.includes('croissant') ||
      allTags.some(t => t.includes('coffee') || t.includes('cafe') || t.includes('bakery') || t.includes('croissant') || t.includes('brew'));
  }
  if (filter === 'Healthy & Bowls') {
    return c.includes('healthy') || c.includes('bowl') || c.includes('salad') ||
      cat.includes('healthy') || cat.includes('bowl') ||
      allTags.some(t => t.includes('healthy') || t.includes('bowl') || t.includes('salad'));
  }
  if (filter === 'College Fest Stalls') {
    return bType.includes('stall') || bType.includes('canteen') || allTags.some(t => t.includes('fest') || t.includes('stall') || t.includes('canteen'));
  }

  return c.includes(f) || cat.includes(f) || allTags.some(t => t.includes(f));
}

export const DiscoverySection: React.FC<Props> = ({
  dishes,
  restaurants,
  searchQuery,
  setSearchQuery,
  selectedLocation = 'All',
  onClearLocation,
  onOpenRateModal,
  onOrderDish,
  onSelectRestaurant,
  onOpenReviews,
  onOpenTasteProfile,
  isLoading
}) => {
  const { user } = useAuth();
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'priceAsc' | 'priceDesc'>('match');
  const [viewMode, setViewMode] = useState<'restaurants' | 'dishes'>('restaurants');

  // Favorites state persisted in localStorage
  const [favoriteRestIds, setFavoriteRestIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tastely_fav_restaurants');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [favoriteDishIds, setFavoriteDishIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tastely_fav_dishes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavoriteRestaurant = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteRestIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('tastely_fav_restaurants', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleFavoriteDish = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoriteDishIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('tastely_fav_dishes', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const hasSufficientProfile = Boolean(
    user?.tasteProfile && (
      (user.tasteProfile.favoriteCuisines?.length || 0) > 0 ||
      (user.tasteProfile.flavorPreferences?.length || 0) > 0 ||
      (user.tasteProfile.texturePreferences?.length || 0) > 0
    )
  );

  const { cartItems, updateQuantity } = useCart();

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(rest => {
    // Location filter
    if (selectedLocation && selectedLocation !== 'All') {
      if (!matchRestaurantLocation(rest, selectedLocation)) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rest.name.toLowerCase().includes(q);
      const matchCuisine = rest.cuisine.toLowerCase().includes(q);
      const matchDesc = rest.description?.toLowerCase().includes(q) || false;
      const matchCity = rest.city?.toLowerCase().includes(q) || false;
      const matchTag = (rest.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchCuisine && !matchDesc && !matchCity && !matchTag) {
        return false;
      }
    }

    // Cuisine / Favourites filter
    if (selectedCuisine !== 'All') {
      if (selectedCuisine === 'Favourites') {
        if (!favoriteRestIds.includes(rest.id)) return false;
      } else {
        if (!matchCuisineCategory(selectedCuisine, rest.cuisine, rest.tags || [], '', rest.businessType || '')) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort restaurants
  filteredRestaurants.sort((a, b) => {
    if (sortBy === 'match') {
      const matchA = calculateRestaurantTasteMatch(a, dishes, user?.tasteProfile).matchPercentage || 0;
      const matchB = calculateRestaurantTasteMatch(b, dishes, user?.tasteProfile).matchPercentage || 0;
      if (matchB !== matchA) return matchB - matchA;
      return b.rating - a.rating;
    }
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Filter dishes
  const filteredDishes = dishes.filter(dish => {
    // Location filter: dish must belong to a restaurant matching the location filter
    if (selectedLocation && selectedLocation !== 'All') {
      const rest = restaurants.find(r => r.id === dish.restaurantId);
      if (!rest || !matchRestaurantLocation(rest, selectedLocation)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = dish.name.toLowerCase().includes(q);
      const matchDesc = dish.description.toLowerCase().includes(q);
      const matchRest = dish.restaurantName.toLowerCase().includes(q);
      const matchCuisine = dish.cuisine.toLowerCase().includes(q);
      const matchCategory = (dish.category || '').toLowerCase().includes(q);
      const matchTags = (dish.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchRest && !matchCuisine && !matchCategory && !matchTags) {
        return false;
      }
    }

    if (selectedCuisine !== 'All') {
      if (selectedCuisine === 'Favourites') {
        if (!favoriteDishIds.includes(dish.id)) return false;
      } else {
        const rest = restaurants.find(r => r.id === dish.restaurantId);
        const matchesDish = matchCuisineCategory(
          selectedCuisine,
          dish.cuisine,
          dish.tags || [],
          dish.category,
          rest?.businessType || ''
        );
        const matchesRest = rest ? matchCuisineCategory(
          selectedCuisine,
          rest.cuisine,
          rest.tags || [],
          '',
          rest.businessType || ''
        ) : false;

        if (!matchesDish && !matchesRest) {
          return false;
        }
      }
    }

    if (selectedDietary !== 'All' && !(dish.dietary || []).includes(selectedDietary as any)) {
      return false;
    }

    return true;
  });

  // Sort dishes
  filteredDishes.sort((a, b) => {
    if (sortBy === 'match') {
      const matchA = calculateDishTasteMatch(a, user?.tasteProfile).matchPercentage || 0;
      const matchB = calculateDishTasteMatch(b, user?.tasteProfile).matchPercentage || 0;
      if (matchB !== matchA) return matchB - matchA;
      return b.rating - a.rating;
    }
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    return 0;
  });

  return (
    <section id="discovery-section" className="py-10 sm:py-14 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading & View Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E06A4E] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E06A4E]" />
              <span>Transparent Restaurant Discovery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#173829] tracking-tight">
              Featured Kitchens & Menus
            </h2>
            <p className="text-sm text-stone-600 max-w-2xl mt-1 leading-relaxed">
              Every restaurant and dish includes genuine customer ratings and authentic taste-match percentages computed from your personal cravings.
            </p>
          </div>

          {/* Mode Switcher: Restaurants vs Dishes */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('restaurants')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'restaurants'
                  ? 'bg-white text-[#173829] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Restaurants ({filteredRestaurants.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dishes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dishes'
                  ? 'bg-white text-[#173829] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Artisan Dishes ({filteredDishes.length})
            </button>
          </div>
        </div>

        {/* Taste Personality Profile Bar with Working Button */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#173829]/15 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#173829]/8 text-[#173829] shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#E06A4E]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#173829] flex items-center gap-2">
                <span>Your Taste Personality Profile</span>
                {hasSufficientProfile ? (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    Active Palate Match
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#E06A4E] bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200/60">
                    Incomplete
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {hasSufficientProfile ? (
                  <span>
                    Calculating authentic match scores using your cravings for{' '}
                    <strong>{user?.tasteProfile?.flavorPreferences?.slice(0, 3).join(', ')}</strong> flavors and{' '}
                    <strong>{user?.tasteProfile?.texturePreferences?.slice(0, 2).join(', ')}</strong> textures.
                  </span>
                ) : (
                  <span>
                    Select your favorite textures, flavors, and cuisines to see genuine match percentages on every dish and kitchen.
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenTasteProfile && onOpenTasteProfile()}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#173829]/30 hover:border-[#173829] text-[#173829] hover:bg-[#173829]/5 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E06A4E]" />
            <span>{hasSufficientProfile ? 'Adjust Palate' : 'Set Taste Profile'}</span>
          </button>
        </div>

        {/* Active Location Filter Indicator */}
        {selectedLocation && selectedLocation !== 'All' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#173829] text-xs font-semibold shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#E06A4E]" />
              <span>Location filter: <strong>{selectedLocation}</strong></span>
              {onClearLocation && (
                <button
                  type="button"
                  onClick={onClearLocation}
                  className="ml-1 text-stone-400 hover:text-stone-700 font-bold p-0.5 cursor-pointer"
                  title="Clear location filter"
                  aria-label="Clear location filter"
                >
                  ✕
                </button>
              )}
            </span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-stone-200/90 shadow-2xs mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Cuisine Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {CUISINE_FILTERS.map(cuisine => (
              <button
                key={cuisine}
                type="button"
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedCuisine === cuisine
                    ? 'bg-[#173829] text-white font-semibold shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>

          {/* Sort & Dietary Selectors */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
            {viewMode === 'dishes' && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="font-semibold uppercase text-[10px]">Dietary:</span>
                <select
                  value={selectedDietary}
                  onChange={(e) => setSelectedDietary(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Diets</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                  <option value="Halal">Halal</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="font-semibold uppercase text-[10px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="match">Personalized Match (%)</option>
                <option value="rating">Top Rated (★)</option>
                {viewMode === 'dishes' && (
                  <>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                  </>
                )}
              </select>
            </div>
          </div>

        </div>

        {/* 1. RESTAURANTS VIEW MODE */}
        {viewMode === 'restaurants' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-80 rounded-3xl bg-white/60 animate-pulse border border-stone-200/60" />
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-8">
                <Store className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-stone-800">No restaurants found</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {selectedLocation && selectedLocation !== 'All'
                    ? `No kitchens or food stalls found in ${selectedLocation}. Try selecting 'All Locations' or another area.`
                    : 'Try switching cuisine filters or clearing your search term.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCuisine('All');
                    setSearchQuery('');
                    if (onClearLocation) onClearLocation();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#173829] text-white text-xs font-bold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map(rest => {
                  const restMatch = calculateRestaurantTasteMatch(rest, dishes, user?.tasteProfile);
                  const isStall = rest.businessType === 'College Fest Stall' || rest.businessType === 'College Canteen';
                  const isDemoListing = rest.id.startsWith('rest_');

                  return (
                    <div
                      key={rest.id}
                      onClick={() => onSelectRestaurant && onSelectRestaurant(rest)}
                      className="bg-white rounded-3xl border border-stone-200/90 hover:border-stone-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        {/* Restaurant Photo */}
                        <div className="relative h-52 w-full overflow-hidden bg-stone-100">
                          <img
                            src={rest.image}
                            alt={rest.name}
                            onError={(e) => {
                              const fallback = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallback;
                              }
                            }}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />

                          {/* Business type badge & stall number */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                              {rest.businessType || 'Restaurant'}
                            </span>
                            {rest.stallNumber && (
                              <span className="px-2 py-0.5 rounded-md bg-[#E06A4E] text-white text-[10px] font-black">
                                {rest.stallNumber}
                              </span>
                            )}
                          </div>

                          {/* Top-Right: Demo Label + Favourites Heart */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {isDemoListing ? (
                              <span className="px-2 py-0.5 rounded-md bg-stone-900/70 text-stone-200 text-[9px] font-medium backdrop-blur-xs border border-white/20">
                                Verified Demo Listing
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-800/80 text-white text-[9px] font-bold backdrop-blur-xs">
                                Community Partner
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => toggleFavoriteRestaurant(e, rest.id)}
                              className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md transition-all flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
                              title={favoriteRestIds.includes(rest.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                              aria-label="Toggle favourite restaurant"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 transition-colors ${
                                  favoriteRestIds.includes(rest.id)
                                    ? 'fill-[#E06A4E] text-[#E06A4E]'
                                    : 'text-stone-500 hover:text-[#E06A4E]'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-2.5">
                          {/* Metadata row: cuisine, price, city */}
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                            <span>{rest.cuisine}</span>
                            <span aria-hidden="true">·</span>
                            <span>{rest.priceRange}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{rest.city || 'Campus Hub'}</span>
                          </div>

                          {/* Restaurant Name */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xl font-serif text-[#173829] group-hover:text-[#0e241b] transition-colors leading-snug">
                              {rest.name}
                            </h3>

                            {/* Rating */}
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{rest.rating.toFixed(1)}</span>
                              <span className="text-stone-400 font-normal">({rest.ratingCount})</span>
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                            {rest.description}
                          </p>

                          {/* Personalized match badge */}
                          {hasSufficientProfile && restMatch.matchPercentage !== null ? (
                            <div className="p-2 rounded-xl bg-[#173829]/6 text-xs text-[#173829] flex items-center justify-between font-medium">
                              <div className="flex items-center gap-1.5 truncate">
                                <Sparkles className="w-3.5 h-3.5 text-[#E06A4E] shrink-0" />
                                <span className="truncate text-[11px]">{restMatch.explanation}</span>
                              </div>
                              <span className="font-bold text-[#E06A4E] shrink-0 ml-1.5 text-xs">
                                {restMatch.matchPercentage}% Match
                              </span>
                            </div>
                          ) : !hasSufficientProfile ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenTasteProfile) onOpenTasteProfile();
                              }}
                              className="text-[11px] font-semibold text-[#E06A4E] hover:underline flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Set palate to see personal match %</span>
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Card Footer Action */}
                      <div className="p-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500 flex items-center gap-1 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{rest.deliveryTime}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 font-bold text-[#173829] group-hover:text-[#0e241b] group-hover:translate-x-0.5 transition-all">
                          <span>View Menu & Reviews</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#E06A4E]" />
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. DISHES VIEW MODE */}
        {viewMode === 'dishes' && (
          <div>
            {filteredDishes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
                <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">No dishes match your filter</h3>
                <p className="text-xs text-stone-500">
                  {selectedLocation && selectedLocation !== 'All'
                    ? `No dishes available matching "${selectedLocation}". Try selecting 'All Locations' or clearing filters.`
                    : 'Try clearing dietary filters or searching for another keyword.'}
                </p>
                {selectedLocation && selectedLocation !== 'All' && onClearLocation && (
                  <button
                    type="button"
                    onClick={onClearLocation}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-[#173829] text-white text-xs font-bold cursor-pointer"
                  >
                    Clear Location Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDishes.map(dish => {
                  const match = calculateDishTasteMatch(dish, user?.tasteProfile);
                  const isSoldOut = dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0);
                  const isVeg = dish.isVegetarian || dish.dietary?.includes('Vegetarian') || dish.dietary?.includes('Vegan');
                  const rest = restaurants.find(r => r.id === dish.restaurantId);
                  const cartItem = cartItems.find(item => item.dish.id === dish.id);
                  const currentCartQty = cartItem ? cartItem.quantity : 0;

                  return (
                    <div
                      key={dish.id}
                      className="bg-white rounded-3xl border border-stone-200/90 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image */}
                        <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            onError={(e) => {
                              const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallback;
                              }
                            }}
                            className={`w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ${
                              isSoldOut ? 'grayscale contrast-75' : ''
                            }`}
                          />

                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            {/* Swiggy/Zomato Veg vs Non-Veg badge */}
                            <div
                              className={`w-5 h-5 rounded-sm border bg-white/95 flex items-center justify-center p-0.5 shadow-xs ${
                                isVeg ? 'border-emerald-600' : 'border-rose-700'
                              }`}
                              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-700'}`} />
                            </div>

                            <span className="px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                              {dish.category}
                            </span>
                            {(dish.dietary || []).map((d, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-bold">
                                {d}
                              </span>
                            ))}
                          </div>

                          {/* Top-Right: Dish Favourites Heart */}
                          <button
                            type="button"
                            onClick={(e) => toggleFavoriteDish(e, dish.id)}
                            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md transition-all flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
                            title={favoriteDishIds.includes(dish.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                            aria-label="Toggle favourite dish"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-colors ${
                                favoriteDishIds.includes(dish.id)
                                  ? 'fill-[#E06A4E] text-[#E06A4E]'
                                  : 'text-stone-500 hover:text-[#E06A4E]'
                              }`}
                            />
                          </button>

                          {dish.spiceLevel > 0 && (
                            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                              <Flame className="w-3 h-3 fill-white" />
                              <span>Level {dish.spiceLevel}</span>
                            </div>
                          )}

                          {isSoldOut ? (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
                              <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider">
                                Sold Out
                              </span>
                            </div>
                          ) : dish.remainingQty !== undefined && dish.remainingQty <= 3 ? (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-black">
                              {dish.remainingQty} left
                            </span>
                          ) : null}
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-2">
                          {/* Restaurant Name */}
                          <div className="flex items-center justify-between text-xs text-stone-500">
                            <button
                              type="button"
                              onClick={() => rest && onSelectRestaurant && onSelectRestaurant(rest)}
                              className="font-bold text-[#173829] hover:text-[#0e241b] hover:underline flex items-center gap-1 cursor-pointer truncate"
                            >
                              <Store className="w-3.5 h-3.5 text-stone-400" />
                              <span className="truncate">{dish.restaurantName}</span>
                            </button>

                            <div className="flex items-center gap-1 font-bold text-amber-700">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{(dish.rating ?? 5.0).toFixed(1)}</span>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-stone-900 group-hover:text-[#173829] transition-colors leading-snug">
                            {dish.name}
                          </h3>

                          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>

                          {/* Match info */}
                          {match.hasSufficientProfile && match.matchPercentage !== null && !match.dietaryConflict && (
                            <div className="p-2 rounded-xl bg-[#173829]/6 text-[10px] text-[#173829] flex items-center justify-between font-medium">
                              <span className="truncate">{match.explanation}</span>
                              <span className="font-bold text-[#E06A4E] shrink-0 ml-1.5">
                                {match.matchPercentage}% Match
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1 pt-1">
                            {(dish.flavorProfile || []).map((f, idx) => (
                              <span key={idx} className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-medium">
                                #{f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions with Swiggy/Zomato inline quantity stepper */}
                      <div className="p-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <div className="text-lg font-bold text-[#173829]">
                          ₹{dish.price}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenRateModal(dish)}
                            className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span>Review</span>
                          </button>

                          {currentCartQty > 0 ? (
                            <div className="flex items-center rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(dish.id, currentCartQty - 1)}
                                className="px-2.5 py-2 hover:bg-emerald-800 transition-colors cursor-pointer active:scale-95"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 font-black min-w-5 text-center text-xs">
                                {currentCartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => onOrderDish(dish)}
                                disabled={dish.remainingQty !== undefined && currentCartQty >= dish.remainingQty}
                                className="px-2.5 py-2 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer active:scale-95"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOrderDish(dish)}
                              disabled={isSoldOut}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isSoldOut
                                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                  : 'bg-[#173829] hover:bg-[#0e241b] text-white hover:scale-102 active:scale-98'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isSoldOut ? 'Sold Out' : 'ADD'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
