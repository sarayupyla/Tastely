import React, { useState } from 'react';
import { Restaurant, Dish, SurplusOffer } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { calculateDishTasteMatch, calculateRestaurantTasteMatch } from '../utils/personalization';
import { 
  X, Star, MapPin, Clock, Phone, Sparkles, 
  Plus, Check, MessageSquare, Utensils, ShoppingBag, 
  ArrowRight, Tag, ShieldCheck, Info
} from 'lucide-react';

interface Props {
  restaurant: Restaurant | null;
  dishes: Dish[];
  onClose: () => void;
  onOrderDish: (dish: Dish) => void;
  onOpenReviews: (dish: Dish) => void;
  surplusOffers?: SurplusOffer[];
  onReserveSurplus?: (offer: SurplusOffer) => void;
}

export const RestaurantDetailModal: React.FC<Props> = ({
  restaurant,
  dishes,
  onClose,
  onOrderDish,
  onOpenReviews,
  surplusOffers,
  onReserveSurplus
}) => {
  const { user } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  if (!restaurant) return null;

  const restaurantDishes = dishes.filter(d => d.restaurantId === restaurant.id);
  const restMatch = calculateRestaurantTasteMatch(restaurant, dishes, user?.tasteProfile);
  const matchedSurplus = surplusOffers?.find(o => o.restaurantId === restaurant.id);

  // Cart summary for this specific restaurant
  const itemsInCartForThisRest = cartItems.filter(item => item.dish.restaurantId === restaurant.id);
  const totalCartQty = itemsInCartForThisRest.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartSum = itemsInCartForThisRest.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  const handleAddWithFeedback = (dish: Dish) => {
    onOrderDish(dish);
    setRecentlyAddedId(dish.id);
    setTimeout(() => {
      setRecentlyAddedId(prev => (prev === dish.id ? null : prev));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Image & Top Header */}
        <div className="relative h-64 sm:h-72 w-full bg-stone-900 shrink-0">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            onError={(e) => {
              const fallback = 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallback;
              }
            }}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all cursor-pointer z-10"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Business Type Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold shadow-xs">
              {restaurant.businessType || 'Partner Kitchen'}
            </span>
            {restaurant.stallNumber && (
              <span className="px-3 py-1 rounded-xl bg-orange-600 text-white text-xs font-black shadow-xs">
                {restaurant.stallNumber}
              </span>
            )}
            {restaurant.collegeName && (
              <span className="px-3 py-1 rounded-xl bg-amber-500/90 text-stone-950 text-xs font-bold shadow-xs backdrop-blur-xs">
                {restaurant.collegeName}
              </span>
            )}
          </div>

          {/* Restaurant Title Info on Hero */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
                  {restaurant.name}
                </h2>
                <p className="text-sm text-stone-200 mt-1 flex items-center gap-2">
                  <span>{restaurant.cuisine}</span>
                  <span>•</span>
                  <span>{restaurant.priceRange}</span>
                  {restaurant.city && (
                    <>
                      <span>•</span>
                      <span>{restaurant.city}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {restMatch.matchPercentage !== null && (
                  <div className="px-3 py-1.5 rounded-2xl bg-orange-500/95 backdrop-blur-md text-white shadow-lg text-xs font-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{restMatch.matchPercentage}% Taste Match</span>
                  </div>
                )}

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/95 text-stone-900 backdrop-blur-md font-black text-xs shadow-md">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                  <span className="text-stone-500 font-normal">({restaurant.ratingCount})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Details Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              {restaurant.address}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              Prep: {restaurant.deliveryTime}
            </span>
            {restaurant.phone && (
              <span className="flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                {restaurant.phone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(restaurant.tags || []).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700 font-semibold text-[11px]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description & Match Reason */}
        <div className="px-6 py-3.5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
            {restaurant.description}
          </p>
          {restMatch.matchPercentage !== null && (
            <div className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200 shrink-0">
              💡 {restMatch.explanation}
            </div>
          )}
        </div>

        {/* Optional Surplus Deal Highlight (Distinguishing regular food ordering from surplus food rescue) */}
        {matchedSurplus && onReserveSurplus && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500 text-stone-950 shrink-0">
                <Tag className="w-4 h-4 fill-stone-950" />
              </div>
              <div>
                <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>Surplus Food Deal Available</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                    -{matchedSurplus.discountPercentage}% OFF
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  "{matchedSurplus.title}" is unsold from today's batch. Reserve for evening pickup at ₹{matchedSurplus.discountPrice} (Regular ₹{matchedSurplus.originalPrice}).
                </p>
              </div>
            </div>
            <button
              onClick={() => onReserveSurplus(matchedSurplus)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-2xs"
            >
              Reserve Deal
            </button>
          </div>
        )}

        {/* Regular Menu Listings */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-600" />
                Regular Dine-in & Delivery Menu ({restaurantDishes.length} Items)
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Freshly prepared to order. Add items to cart to place a regular order with demo payment.
              </p>
            </div>
          </div>

          {restaurantDishes.length === 0 ? (
            <div className="text-center py-14 bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">No Regular Menu Items Listed Yet</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                This kitchen has not published regular dishes yet. Tastely only displays items directly provided by verified participating restaurants and college fest stalls. Check back soon for fresh listings!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurantDishes.map(dish => {
                const match = calculateDishTasteMatch(dish, user?.tasteProfile);
                const isSoldOut = dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0);
                const isRecentlyAdded = recentlyAddedId === dish.id;

                return (
                  <div
                    key={dish.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start gap-3.5 mb-2">
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
                          className={`w-20 h-20 rounded-xl object-cover shrink-0 ring-1 ring-stone-200 ${
                            isSoldOut ? 'grayscale contrast-75' : ''
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-500 uppercase">
                              {dish.category}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                              <Star className="w-3 h-3 fill-amber-500" />
                              <span>{(dish.rating ?? 5.0).toFixed(1)}</span>
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-stone-900 truncate mt-0.5 group-hover:text-orange-600 transition-colors">
                            {dish.name}
                          </h4>

                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {dish.description}
                          </p>

                          {/* Remaining stock indicator */}
                          {dish.remainingQty !== undefined && !isSoldOut && (
                            <div className="mt-1 text-[10px] font-semibold text-stone-500">
                              {dish.remainingQty <= 3 ? (
                                <span className="text-amber-600 font-black">Only {dish.remainingQty} portions left!</span>
                              ) : (
                                <span>{dish.remainingQty} available today</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Match explanation pill */}
                      {match.hasSufficientProfile && match.matchPercentage !== null && !match.dietaryConflict && (
                        <div className="mb-2 px-2.5 py-1 rounded-xl bg-orange-50/80 border border-orange-200 text-[10px] font-medium text-orange-900 flex items-center justify-between">
                          <span className="truncate">{match.explanation}</span>
                          <span className="font-extrabold text-orange-600 shrink-0 ml-1">
                            {match.matchPercentage}% Match
                          </span>
                        </div>
                      )}

                      {/* Flavors & Texture tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(dish.flavorProfile || []).map((f, fIdx) => (
                          <span key={`f-${fIdx}`} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            #{f}
                          </span>
                        ))}
                        {(dish.textureProfile || []).map((t, tIdx) => (
                          <span key={`t-${tIdx}`} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                            ~{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-base font-black text-stone-900">
                        ₹{dish.price}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenReviews(dish)}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Read reviews for this dish"
                        >
                          <MessageSquare className="w-3 h-3 text-stone-500" />
                          Reviews
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddWithFeedback(dish)}
                          disabled={isSoldOut}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            isSoldOut
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : isRecentlyAdded
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-stone-900 hover:bg-black text-white hover:scale-105 active:scale-95 cursor-pointer shadow-xs'
                          }`}
                        >
                          {isRecentlyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Added!
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Cart Summary Bar at Modal Footer */}
        {totalCartQty > 0 && (
          <div className="p-4 bg-stone-900 text-white flex items-center justify-between border-t border-stone-800 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{totalCartQty} item{totalCartQty > 1 ? 's' : ''} in cart</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-emerald-400 font-extrabold">₹{totalCartSum}</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Ready for order review & demo payment
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                setIsCartOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
