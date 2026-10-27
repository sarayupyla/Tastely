import React, { useState, useEffect } from 'react';
import { Recommendation, Dish } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Star, Flame, Check, Info, Sliders, 
  ArrowRight, Heart, RefreshCw, ChefHat, CheckCircle2 
} from 'lucide-react';

import { Restaurant } from '../types';

interface Props {
  onOpenRateModal: (dish: Dish) => void;
  onOrderDish: (dish: Dish) => void;
  restaurants?: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

export const RecommendationsView: React.FC<Props> = ({ 
  onOpenRateModal, 
  onOrderDish,
  restaurants,
  onSelectRestaurant
}) => {
  const { user, updateTasteProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Editable Profile States
  const [spiceTolerance, setSpiceTolerance] = useState(user?.tasteProfile?.spiceTolerance || 'medium');
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(user?.tasteProfile?.favoriteCuisines || []);
  const [flavorPreferences, setFlavorPreferences] = useState<string[]>(user?.tasteProfile?.flavorPreferences || []);
  const [texturePreferences, setTexturePreferences] = useState<string[]>(user?.tasteProfile?.texturePreferences || []);
  const [dietary, setDietary] = useState<string[]>(user?.tasteProfile?.dietaryRestrictions || []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tasteProfile) {
      setSpiceTolerance(user.tasteProfile.spiceTolerance || 'medium');
      setFavoriteCuisines(user.tasteProfile.favoriteCuisines || []);
      setFlavorPreferences(user.tasteProfile.flavorPreferences || []);
      setTexturePreferences(user.tasteProfile.texturePreferences || []);
      setDietary(user.tasteProfile.dietaryRestrictions || []);
    }
    loadRecommendations();
  }, [user]);

  const handleSavePreferences = async () => {
    try {
      setIsSavingProfile(true);
      await updateTasteProfile({
        spiceTolerance,
        favoriteCuisines,
        flavorPreferences,
        texturePreferences,
        dietaryRestrictions: dietary
      });
      await loadRecommendations();
      setShowPreferences(false);
    } catch (err) {
      console.error('Failed to update preferences', err);
    } finally {
      setIsSavingProfile(false);
    }
  };


  const toggleCuisine = (cuisine: string) => {
    setFavoriteCuisines(prev => 
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
  };

  const toggleDietary = (item: string) => {
    setDietary(prev => 
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  return (
    <div className="py-10 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Transparent Taste Intelligence
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">
              Personalized Recommendations
            </h1>
            <p className="text-sm md:text-base text-stone-600 max-w-2xl mt-1.5">
              Learns from dishes you love, your reviews, and flavor preferences. Every dish includes an honest, transparent reason why it was selected for you.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreferences(prev => !prev)}
              className="px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-stone-800 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-orange-600" />
              <span>Customize Taste Profile</span>
            </button>
            <button
              onClick={loadRecommendations}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
              title="Refresh recommendations"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Algorithm Transparency Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-stone-200/90 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900 font-bold block mb-1">
                How our Transparent Recommendation Scoring works:
              </strong>
              We calculate dish affinity using: <span className="font-semibold text-stone-900">Favorite Cuisines (35 pts)</span> + <span className="font-semibold text-stone-900">Ratings from similar dishes you rated 4★+ (25 pts)</span> + <span className="font-semibold text-stone-900">Flavor profile overlap (20 pts)</span> + <span className="font-semibold text-stone-900">Spice tolerance alignment (15 pts)</span> + <span className="font-semibold text-stone-900">Strict Dietary Compliance Filter</span>. No hidden black-box algorithms.
            </div>
          </div>
        </div>

        {/* Preferences Drawer / Modal */}
        {showPreferences && (
          <div className="mb-10 p-6 rounded-3xl bg-white border-2 border-orange-200 shadow-xl transition-all">
            <h3 className="text-lg font-black text-stone-900 mb-1">
              Tune Your Flavor Preferences
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Update what you crave right now. The engine instantly recalculates your personalized menu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Spice Tolerance */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Spice Tolerance
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['mild', 'medium', 'hot', 'extra-hot'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setSpiceTolerance(level)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer flex items-center justify-between ${
                        spiceTolerance === level
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{level}</span>
                      {spiceTolerance === level && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Cuisines */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Favorite Cuisines
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Asian & Noodles', 'Burgers', 'Italian & Pizza', 'Desserts & Sweets', 'Healthy & Bowls'].map(c => {
                    const isSelected = favoriteCuisines.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCuisine(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white font-bold'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Dietary Restrictions (Voluntary)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'].map(d => {
                    const isSelected = dietary.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDietary(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Texture & Flavor Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-stone-100">
              {/* Textures */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Texture Preferences
                </label>
                <p className="text-[11px] text-stone-400 mb-2">
                  What mouthfeels do you enjoy most?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['crispy', 'crunchy', 'creamy', 'chewy', 'tender', 'silky', 'fluffy'].map(t => {
                    const isSelected = texturePreferences.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => setTexturePreferences(prev => prev.includes(t) ? prev.filter(i => i !== t) : [...prev, t])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
                          isSelected
                            ? 'bg-stone-900 text-white font-bold'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flavors */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                  Flavor Craving Notes
                </label>
                <p className="text-[11px] text-stone-400 mb-2">
                  Which flavor profiles do you crave?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['savory', 'umami', 'crispy', 'spicy', 'sweet', 'tangy', 'cheesy', 'herbal'].map(f => {
                    const isSelected = flavorPreferences.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => setFlavorPreferences(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
                          isSelected
                            ? 'bg-orange-600 text-white font-bold'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{f}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>


            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSavingProfile ? 'Saving...' : 'Apply & Recalculate'}
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Recommendations List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-96 rounded-3xl bg-stone-200/50 animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
            <ChefHat className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-800">No dishes match your dietary filter</h3>
            <p className="text-xs text-stone-500 mt-1">Try adjusting your dietary restrictions in your taste profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => {
              const { dish, score, matchReasons, explanation } = rec;

              return (
                <div
                  key={dish.id}
                  className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image & Match Score */}
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Rank badge */}
                    <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-md text-white text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      #{index + 1} Best Match
                    </div>

                    {/* Score badge */}
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                      {score} Pts
                    </div>

                    {/* Spice indicator */}
                    {dish.spiceLevel > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600/90 text-white text-[10px] font-bold backdrop-blur-xs">
                        <Flame className="w-3 h-3 fill-white" />
                        <span>Spice Level {dish.spiceLevel}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Restaurant & Rating */}
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
                        {restaurants && onSelectRestaurant ? (
                          <button
                            type="button"
                            onClick={() => {
                              const rest = restaurants.find(r => r.id === dish.restaurantId || r.name.toLowerCase() === dish.restaurantName.toLowerCase());
                              if (rest) onSelectRestaurant(rest);
                            }}
                            className="font-bold text-stone-700 hover:text-orange-600 hover:underline cursor-pointer truncate text-left"
                            title="Click to view restaurant details & full menu"
                          >
                            {dish.restaurantName}
                          </button>
                        ) : (
                          <span className="font-bold text-stone-700">{dish.restaurantName}</span>
                        )}
                        <div className="flex items-center gap-1 font-bold text-amber-600 shrink-0 ml-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{(dish.rating ?? 5.0).toFixed(1)}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black text-stone-900 leading-snug">
                        {dish.name}
                      </h3>

                      <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                        {dish.description}
                      </p>

                      {/* Transparent Explanation Box */}
                      <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/70">
                        <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                          Why this is recommended:
                        </div>
                        <p className="text-xs text-stone-700 italic leading-snug">
                          "{explanation}"
                        </p>
                      </div>

                      {/* Match factor tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {matchReasons.slice(0, 2).map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="text-xl font-black text-stone-900">
                        ₹{dish.price}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenRateModal(dish)}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          Rate
                        </button>

                        <button
                          onClick={() => onOrderDish(dish)}
                          disabled={dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                            dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0)
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-75'
                              : 'bg-stone-900 hover:bg-black text-white hover:scale-105 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0) ? 'Sold Out' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
