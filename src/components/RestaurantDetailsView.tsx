import React, { useState, useEffect, useMemo } from 'react';
import { Restaurant, Dish, DishRating, SurplusOffer } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { calculateDishTasteMatch, calculateRestaurantTasteMatch } from '../utils/personalization';
import { api } from '../services/api';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Sparkles, Plus, Minus, Check, 
  ShoppingBag, ArrowRight, Utensils, MessageSquare, Tag, ShieldCheck, 
  Flame, Heart, UserCheck, CheckCircle2, Search, X, CheckSquare, Leaf
} from 'lucide-react';

interface Props {
  restaurant: Restaurant;
  dishes: Dish[];
  onBack: () => void;
  onOrderDish: (dish: Dish) => void;
  onOpenRateModal?: (dish: Dish) => void;
  onOpenReviews?: (dish: Dish) => void;
  surplusOffers?: SurplusOffer[];
  onReserveSurplus?: (offer: SurplusOffer) => void;
}

export const RestaurantDetailsView: React.FC<Props> = ({
  restaurant,
  dishes,
  onBack,
  onOrderDish,
  onOpenRateModal,
  onOpenReviews,
  surplusOffers,
  onReserveSurplus
}) => {
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity, setIsCartOpen } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inMenuSearch, setInMenuSearch] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<DishRating[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Favorites state for this restaurant
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('tastely_fav_restaurants');
      if (!stored) return false;
      const ids: string[] = JSON.parse(stored);
      return ids.includes(restaurant.id);
    } catch {
      return false;
    }
  });

  const toggleFavorite = () => {
    setIsFavorite(prev => {
      const next = !prev;
      try {
        const stored = localStorage.getItem('tastely_fav_restaurants');
        const ids: string[] = stored ? JSON.parse(stored) : [];
        const nextIds = next 
          ? (ids.includes(restaurant.id) ? ids : [...ids, restaurant.id])
          : ids.filter(x => x !== restaurant.id);
        localStorage.setItem('tastely_fav_restaurants', JSON.stringify(nextIds));
      } catch {}
      return next;
    });
  };

  const [liveDishes, setLiveDishes] = useState<Dish[]>(dishes);

  useEffect(() => {
    setLiveDishes(dishes);
  }, [dishes]);

  useEffect(() => {
    let isMounted = true;
    api.getDishes()
      .then(fetched => {
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setLiveDishes(fetched);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [restaurant.id]);

  const restaurantDishes = useMemo(() => {
    return liveDishes.filter(d => 
      d.restaurantId === restaurant.id || 
      (restaurant.stallNumber && d.restaurantId === restaurant.stallNumber) ||
      (d.restaurantName && restaurant.name && d.restaurantName.toLowerCase() === restaurant.name.toLowerCase())
    );
  }, [liveDishes, restaurant.id, restaurant.stallNumber, restaurant.name]);

  const restMatch = calculateRestaurantTasteMatch(restaurant, liveDishes, user?.tasteProfile);
  const matchedSurplus = surplusOffers?.find(o => o.restaurantId === restaurant.id);

  // Normalize dish category for College Fest Stalls so fest specials are never misclassified as Mexican
  const getDishCategory = (d: Dish): string => {
    if (restaurant.businessType === 'College Fest Stall') {
      if (!d.category || d.category === 'Mexican') {
        return d.cuisine || restaurant.cuisine || 'Fest Street Food & Snacks';
      }
    }
    return d.category || restaurant.cuisine || 'Fest Street Food & Snacks';
  };

  // Derive unique categories from this restaurant's dishes
  const categories = useMemo(() => {
    const cats = Array.from(new Set(restaurantDishes.map(d => getDishCategory(d)))).filter(Boolean);
    return ['All', ...cats];
  }, [restaurantDishes, restaurant.businessType, restaurant.cuisine]);

  // Filtered dishes based on category, in-menu search, and veg-only toggle
  const filteredDishes = useMemo(() => {
    return restaurantDishes.filter(d => {
      const dishCategory = getDishCategory(d);
      // Category filter
      if (selectedCategory !== 'All' && dishCategory !== selectedCategory) {
        return false;
      }
      // Veg-only toggle
      if (vegOnly) {
        const isVeg = d.isVegetarian || d.dietary?.includes('Vegetarian') || d.dietary?.includes('Vegan');
        if (!isVeg) return false;
      }
      // In-menu search
      if (inMenuSearch.trim()) {
        const q = inMenuSearch.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchDesc = d.description.toLowerCase().includes(q);
        const matchCat = dishCategory.toLowerCase().includes(q);
        const matchTags = (d.tags || []).some(t => t.toLowerCase().includes(q));
        const matchDietary = (d.dietary || []).some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCat && !matchTags && !matchDietary) {
          return false;
        }
      }
      return true;
    });
  }, [restaurantDishes, selectedCategory, vegOnly, inMenuSearch, restaurant.businessType, restaurant.cuisine]);

  // Group dishes by category for structured Swiggy/Zomato presentation
  const groupedDishes = useMemo(() => {
    const groups: { category: string; dishes: Dish[] }[] = [];
    const cats = selectedCategory === 'All' 
      ? Array.from(new Set(filteredDishes.map(d => getDishCategory(d)))).filter(Boolean)
      : [selectedCategory];

    for (const cat of cats) {
      const items = filteredDishes.filter(d => getDishCategory(d) === cat);
      if (items.length > 0) {
        groups.push({ category: cat, dishes: items });
      }
    }
    return groups;
  }, [filteredDishes, selectedCategory, restaurant.businessType, restaurant.cuisine]);

  // Load reviews for dishes in this restaurant
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true);
        // Aggregate reviews across dishes of this restaurant
        const reviewsPromises = restaurantDishes.slice(0, 5).map(d => 
          api.getDishReviews(d.id).catch(() => ({ reviews: [] as DishRating[], peopleLikeYou: [] as any[] }))
        );
        const results = await Promise.all(reviewsPromises);
        if (isMounted) {
          const allReviews: DishRating[] = [];
          const seen = new Set<string>();
          for (const res of results) {
            for (const r of res.reviews || []) {
              if (!seen.has(r.id)) {
                seen.add(r.id);
                allReviews.push(r);
              }
            }
          }
          setReviews(allReviews);
        }
      } catch (err) {
        console.error('Failed to load restaurant reviews:', err);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };

    if (restaurantDishes.length > 0) {
      fetchReviews();
    }
    return () => { isMounted = false; };
  }, [restaurant.id]);

  // Cart summary for this specific restaurant
  const itemsInCartForThisRest = cartItems.filter(item => item.dish.restaurantId === restaurant.id);
  const totalCartQty = itemsInCartForThisRest.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartSum = itemsInCartForThisRest.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  const handleAdd = (dish: Dish) => {
    onOrderDish(dish);
    setRecentlyAddedId(dish.id);
    setTimeout(() => {
      setRecentlyAddedId(prev => (prev === dish.id ? null : prev));
    }, 1500);
  };

  // Identify Reviews from People Like You (similarity matching)
  const userFlavors = new Set(user?.tasteProfile?.flavorPreferences || []);
  const reviewsFromPeopleLikeYou = reviews.filter(r => {
    if (!r.tasteTags || r.tasteTags.length === 0) return false;
    return r.tasteTags.some(t => userFlavors.has(t.toLowerCase()));
  });

  const otherReviews = reviews.filter(r => !reviewsFromPeopleLikeYou.some(ply => ply.id === r.id));

  const isDemoListing = restaurant.id.startsWith('rest_');

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-24">
      
      {/* Top Breadcrumb & Return Bar */}
      <div className="bg-white border-b border-stone-200/80 sticky top-18 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-[#173829] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Restaurants</span>
          </button>

          <div className="flex items-center gap-3">
            {restMatch.matchPercentage !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#173829]/8 text-[#173829] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#E06A4E]" />
                <span>{restMatch.matchPercentage}% Taste Match</span>
              </span>
            )}

            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/70">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{restaurant.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal">({restaurant.ratingCount})</span>
            </div>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isFavorite
                  ? 'bg-rose-50 text-[#E06A4E] border-rose-200 shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title={isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-[#E06A4E] text-[#E06A4E]' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">{isFavorite ? 'Favourited' : 'Favourite'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Restaurant Header Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
          
          {/* Banner Photo */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-stone-900">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              onError={(e) => {
                const fallback = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80';
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallback;
                }
              }}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Badges on Banner */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/95 text-[#173829] text-xs font-bold shadow-xs backdrop-blur-xs">
                {restaurant.businessType || 'Partner Kitchen'}
              </span>
              {restaurant.stallNumber && (
                <span className="px-3 py-1 rounded-full bg-[#E06A4E] text-white text-xs font-black shadow-xs">
                  {restaurant.stallNumber}
                </span>
              )}
              {isDemoListing && (
                <span className="px-2.5 py-1 rounded-full bg-stone-900/80 text-stone-300 text-[10px] font-medium backdrop-blur-xs border border-white/20">
                  Verified Demo Listing
                </span>
              )}
            </div>

            {/* Title Over Banner */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-3xl sm:text-5xl font-serif text-white tracking-tight drop-shadow-sm">
                {restaurant.name}
              </h1>
              <p className="text-sm text-stone-200 mt-1.5 flex items-center gap-2 font-medium">
                <span>{restaurant.cuisine}</span>
                <span>·</span>
                <span>{restaurant.priceRange}</span>
                {restaurant.city && (
                  <>
                    <span>·</span>
                    <span>{restaurant.city}</span>
                  </>
                )}
                {restaurant.collegeName && (
                  <>
                    <span>·</span>
                    <span className="text-amber-300">{restaurant.collegeName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Details Bar */}
          <div className="p-6 sm:p-7 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600 bg-stone-50/50">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-[#E06A4E] shrink-0" />
                <span>{restaurant.address}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Prep: {restaurant.deliveryTime}</span>
              </span>
              {restaurant.phone && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{restaurant.phone}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(restaurant.tags || []).map((tag, idx) => (
                <span key={idx} className="text-[11px] font-medium text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Description & Taste Match Explanation */}
          <div className="p-6 sm:p-7 space-y-3">
            <p className="text-sm text-stone-700 leading-relaxed font-normal">
              {restaurant.description}
            </p>

            {restMatch.matchPercentage !== null && (
              <div className="p-3.5 rounded-2xl bg-[#173829]/6 border border-[#173829]/15 text-xs text-[#173829] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#E06A4E] shrink-0" />
                <span className="font-medium">{restMatch.explanation}</span>
              </div>
            )}
          </div>

          {/* Optional Surplus Deal Highlight */}
          {matchedSurplus && onReserveSurplus && (
            <div className="mx-6 mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 flex items-center gap-2">
                    <span>Surplus Evening Meal Rescue Available</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-black">
                      -{matchedSurplus.discountPercentage}% OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    "{matchedSurplus.title}" is available for tonight's pickup at ₹{matchedSurplus.discountPrice} (Regular ₹{matchedSurplus.originalPrice}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onReserveSurplus(matchedSurplus)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                Reserve Deal
              </button>
            </div>
          )}

        </div>

        {/* Menu Listings Header & Interactive Controls */}
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-serif text-[#173829] tracking-tight">
                  Menu & Dishes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 text-xs font-bold">
                  {restaurantDishes.length} items
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Browse our curated kitchen categories, customize portion quantities, and order with demo payments.
              </p>
            </div>

            {/* In-Menu Search and Veg-Only Toggle (Swiggy / Zomato style) */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Veg Only Toggle */}
              <button
                type="button"
                onClick={() => setVegOnly(prev => !prev)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  vegOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200'
                }`}
              >
                <div className={`w-4 h-4 border ${vegOnly ? 'border-emerald-600' : 'border-stone-400'} rounded-sm flex items-center justify-center p-0.5 bg-white`}>
                  <div className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                </div>
                <span>Veg Only</span>
                {vegOnly && <Check className="w-3.5 h-3.5 text-emerald-700" />}
              </button>

              {/* In-Menu Search Input */}
              <div className="relative min-w-[220px] sm:min-w-[260px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inMenuSearch}
                  onChange={(e) => setInMenuSearch(e.target.value)}
                  placeholder={`Search ${restaurant.name}...`}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#173829]/20 focus:border-[#173829] transition-all shadow-2xs"
                />
                {inMenuSearch && (
                  <button
                    type="button"
                    onClick={() => setInMenuSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-stone-200/70">
              {categories.map(cat => {
                const count = cat === 'All'
                  ? restaurantDishes.length
                  : restaurantDishes.filter(d => getDishCategory(d) === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-[#173829] text-white shadow-2xs font-bold'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 font-medium'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Dish Listings Grouped by Category */}
          {filteredDishes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
              <Utensils className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No dishes match your selection</h3>
              <p className="text-xs text-stone-500">
                {inMenuSearch ? `No items found matching "${inMenuSearch}".` : 'Try clearing your search query or vegetarian toggle.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {inMenuSearch && (
                  <button
                    type="button"
                    onClick={() => setInMenuSearch('')}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                {vegOnly && (
                  <button
                    type="button"
                    onClick={() => setVegOnly(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                  >
                    Turn Off Veg Only
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setInMenuSearch('');
                    setVegOnly(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#173829] text-white text-xs font-bold cursor-pointer"
                >
                  Show All Items
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {groupedDishes.map(group => (
                <div key={group.category} className="space-y-4">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-serif text-[#173829] font-bold">
                        {group.category}
                      </h3>
                      <span className="text-xs font-semibold text-stone-400">
                        ({group.dishes.length})
                      </span>
                    </div>
                  </div>

                  {/* Dishes in this Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.dishes.map(dish => {
                      const match = calculateDishTasteMatch(dish, user?.tasteProfile);
                      const isSoldOut = dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0);
                      const isVeg = dish.isVegetarian || dish.dietary?.includes('Vegetarian') || dish.dietary?.includes('Vegan');
                      const cartItem = cartItems.find(item => item.dish.id === dish.id);
                      const currentCartQty = cartItem ? cartItem.quantity : 0;
                      const isRecentlyAdded = recentlyAddedId === dish.id;

                      return (
                        <div
                          key={dish.id}
                          className="bg-white rounded-3xl border border-stone-200/90 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                        >
                          <div>
                            {/* Dish Photo */}
                            <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
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

                              {/* Top-Left: Veg/Non-Veg icon and Dietary Pills */}
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
                                  {getDishCategory(dish)}
                                </span>

                                {(dish.dietary || []).map((d, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-bold">
                                    {d}
                                  </span>
                                ))}
                              </div>

                              {/* Spice Indicator */}
                              {dish.spiceLevel > 0 && (
                                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-2xs">
                                  <Flame className="w-3 h-3 fill-white" />
                                  <span>Level {dish.spiceLevel}</span>
                                </div>
                              )}

                              {/* Stock pill */}
                              {isSoldOut ? (
                                <div className="absolute inset-0 bg-black/55 backdrop-blur-2xs flex items-center justify-center">
                                  <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                                    Sold Out
                                  </span>
                                </div>
                              ) : dish.remainingQty !== undefined && dish.remainingQty <= 3 ? (
                                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-black">
                                  {dish.remainingQty} left
                                </span>
                              ) : null}
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-base font-bold text-stone-900 group-hover:text-[#173829] transition-colors leading-snug">
                                  {dish.name}
                                </h4>
                                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 shrink-0">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{(dish.rating ?? 5.0).toFixed(1)}</span>
                                </div>
                              </div>

                              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                                {dish.description}
                              </p>

                              {/* Match badge */}
                              {match.hasSufficientProfile && match.matchPercentage !== null && !match.dietaryConflict && (
                                <div className="p-2 rounded-xl bg-[#173829]/6 text-[10px] text-[#173829] flex items-center justify-between font-medium">
                                  <span className="truncate">{match.explanation}</span>
                                  <span className="font-bold text-[#E06A4E] shrink-0 ml-1.5">
                                    {match.matchPercentage}% Match
                                  </span>
                                </div>
                              )}

                              {/* Flavor Profile Tags */}
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
                                onClick={() => {
                                  if (onOpenRateModal) onOpenRateModal(dish);
                                  else if (onOpenReviews) onOpenReviews(dish);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                title="Rate & Review"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                <span className="hidden sm:inline">Review</span>
                              </button>

                              {/* Inline Quantity Modifier */}
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
                                    onClick={() => handleAdd(dish)}
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
                                  onClick={() => handleAdd(dish)}
                                  disabled={isSoldOut}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                    isSoldOut
                                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                      : isRecentlyAdded
                                      ? 'bg-emerald-700 text-white shadow-xs'
                                      : 'bg-[#173829] hover:bg-[#0e241b] text-white hover:scale-102 active:scale-98'
                                  }`}
                                >
                                  {isRecentlyAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>{isSoldOut ? 'Sold Out' : 'ADD'}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Written Reviews Section */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-2xl font-serif text-[#173829] tracking-tight flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-[#E06A4E]" />
                <span>Customer Reviews & Palate Insights</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Authentic written reviews from verified dinners. Never fabricated or AI-generated.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-serif text-[#173829] font-bold">
                {restaurant.rating.toFixed(1)} ★
              </span>
              <span className="text-xs text-stone-400">
                ({restaurant.ratingCount} ratings recorded)
              </span>
            </div>
          </div>

          {/* Section 1: Reviews from People Like You (Similarity Matched) */}
          {reviewsFromPeopleLikeYou.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-4">
              <div className="flex items-center gap-2 text-[#173829]">
                <UserCheck className="w-4 h-4 text-[#E06A4E]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#173829]">
                  Reviews from People with Similar Tastes
                </h3>
                <span className="text-[10px] text-stone-500 font-normal">
                  (Matched on your shared cravings for {Array.from(userFlavors).slice(0, 2).join(' & ')})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewsFromPeopleLikeYou.map(r => (
                  <div key={r.id} className="p-4 rounded-xl bg-white border border-amber-200/60 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#173829]">{r.userName}</span>
                        <span className="text-[10px] font-semibold text-[#E06A4E] bg-rose-50 px-2 py-0.5 rounded-full">
                          Taste Twin Match
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-700">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{r.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 italic leading-relaxed">
                      "{r.reviewText}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                      <span className="font-medium text-stone-600">{r.dishName}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Other Verified Community Reviews */}
          {otherReviews.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Community Feedback
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherReviews.map(r => (
                  <div key={r.id} className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900">{r.userName}</span>
                      <div className="flex items-center gap-1 font-bold text-amber-700">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{r.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      "{r.reviewText}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                      <span className="font-medium text-stone-600">{r.dishName}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : reviewsFromPeopleLikeYou.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-xs space-y-1">
              <p className="font-medium text-stone-700">No written reviews submitted for this kitchen yet.</p>
              <p>Be the first diner to review a dish and help your Taste Twins discover it!</p>
            </div>
          ) : null}

        </div>

      </div>

      {/* Sticky Bottom Cart Bar */}
      {totalCartQty > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#173829] text-white p-4 shadow-xl border-t border-stone-800 animate-in slide-in-from-bottom-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E06A4E] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{totalCartQty} item{totalCartQty > 1 ? 's' : ''} in cart</span>
                  <span className="text-stone-400">·</span>
                  <span className="text-emerald-400 font-extrabold text-base">₹{totalCartSum}</span>
                </div>
                <div className="text-[11px] text-stone-300">
                  Ready to order from {restaurant.name}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-[#173829] font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#E06A4E]" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
