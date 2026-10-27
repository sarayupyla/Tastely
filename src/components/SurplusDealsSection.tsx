import React, { useState } from 'react';
import { SurplusOffer, Restaurant } from '../types';
import { Clock, Tag, Store, ShieldAlert, Sparkles, ArrowRight, CheckCircle2, Utensils } from 'lucide-react';

interface Props {
  offers: SurplusOffer[];
  restaurants?: Restaurant[];
  onReserve: (offer: SurplusOffer) => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  isLoading?: boolean;
}

export const SurplusDealsSection: React.FC<Props> = ({ 
  offers, 
  restaurants, 
  onReserve, 
  onSelectRestaurant, 
  isLoading 
}) => {
  const [filterDietary, setFilterDietary] = useState<string>('All');

  const filteredOffers = offers.filter(offer => {
    if (filterDietary === 'All') return true;
    return offer.dietary?.includes(filterDietary);
  });

  return (
    <section id="surplus-section" className="py-12 bg-amber-50/40 border-y border-amber-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-black tracking-wider uppercase mb-2">
              <Tag className="w-3.5 h-3.5 fill-amber-900" />
              Food Waste Reduction In Action
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
              Surplus Food Deals <span className="text-amber-600 font-black">50%–70% OFF</span>
            </h2>
            <p className="text-sm md:text-base text-stone-600 max-w-xl mt-1">
              Top local kitchens prepare excess batches fresh each evening. Reserve unsold gourmet meals before closing, save money, and keep food out of landfills.
            </p>
          </div>

          {/* Quick Dietary Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Vegetarian', 'Halal', 'Gluten-Free'].map(tag => (
              <button
                key={tag}
                onClick={() => setFilterDietary(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterDietary === tag
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-amber-100/60 border border-amber-200/60'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Ordering Distinction Banner */}
        <div className="mb-8 p-3.5 rounded-2xl bg-white/80 border border-amber-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Surplus Rescue Reservations:</strong> Discounted take-away vouchers reserved for evening pickup.
            </span>
          </div>
          <span className="text-stone-500 font-medium">
            Looking for regular dine-in or fresh delivery? Tap <strong className="text-amber-700">"Full Menu"</strong> on any card or explore Partner Kitchens below.
          </span>
        </div>

        {/* Offers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-80 rounded-3xl bg-amber-100/40 animate-pulse border border-amber-200/40" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-3xl border border-dashed border-amber-200 p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-900">No surplus deals available right now. Check back later.</h3>
            <p className="text-xs text-stone-500 mt-1">
              Top local kitchens release fresh surplus portions when batches are ready. Regular full-price menus remain available below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredOffers.map(offer => {
              const isLowStock = offer.availableQuantity <= 3;
              const matchedRest = restaurants?.find(r => r.id === offer.restaurantId || r.name.toLowerCase() === offer.restaurantName.toLowerCase());

              return (
                <div
                  key={offer.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-stone-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top Image & Badges */}
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Discount Badge */}
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                      -{offer.discountPercentage}% OFF
                    </div>

                    {/* Stock pill */}
                    <div className={`absolute top-3 right-3 text-xs font-extrabold px-2.5 py-1 rounded-xl shadow-md backdrop-blur-md ${
                      isLowStock 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-stone-900/80 text-white'
                    }`}>
                      {offer.availableQuantity} Left
                    </div>

                    {/* Dietary tags */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                      {offer.dietary?.map((diet, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-white/95 text-stone-800 px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                          {diet}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Restaurant info - clickable to open restaurant detail modal */}
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
                        <button
                          type="button"
                          onClick={() => matchedRest && onSelectRestaurant?.(matchedRest)}
                          disabled={!matchedRest || !onSelectRestaurant}
                          className={`flex items-center gap-1.5 text-left truncate transition-colors ${
                            matchedRest && onSelectRestaurant
                              ? 'text-stone-700 hover:text-amber-700 hover:underline cursor-pointer'
                              : 'text-stone-500 cursor-default'
                          }`}
                          title={matchedRest ? `View ${matchedRest.name} profile and full menu` : undefined}
                        >
                          <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate font-bold">{offer.restaurantName}</span>
                        </button>

                        {matchedRest && onSelectRestaurant && (
                          <button
                            type="button"
                            onClick={() => onSelectRestaurant(matchedRest)}
                            className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer shrink-0 ml-1.5"
                          >
                            Menu →
                          </button>
                        )}
                      </div>

                      <h3 className="text-base font-black text-stone-900 leading-snug group-hover:text-amber-600 transition-colors">
                        {offer.title}
                      </h3>

                      <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {offer.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100">
                      {/* Expiry time & pickup */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium mb-3">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Expires: {offer.expiryTime || offer.pickupEnd}</span>
                      </div>

                      {/* Pricing and Action */}
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs text-stone-400 line-through font-semibold">
                            ₹{offer.originalPrice}
                          </div>
                          <div className="text-xl font-black text-emerald-700 leading-none">
                            ₹{offer.discountPrice}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {matchedRest && onSelectRestaurant && (
                            <button
                              type="button"
                              onClick={() => onSelectRestaurant(matchedRest)}
                              className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-all cursor-pointer"
                              title="Browse regular dine-in/delivery menu"
                            >
                              Menu
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onReserve(offer)}
                            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm cursor-pointer flex items-center gap-1"
                            title="Reserve discounted surplus meal voucher"
                          >
                            Reserve
                            <ArrowRight className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
