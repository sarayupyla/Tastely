import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_FLAVORS, AVAILABLE_TEXTURES } from '../utils/personalization';
import { 
  Sparkles, Check, Flame, Sliders, ArrowLeft, ArrowRight, 
  ShieldCheck, Heart, ChefHat 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onBackToDiscovery?: () => void;
  onSavedRedirect?: () => void;
  onNavigateToTasteTwins?: () => void;
}

const CUISINE_OPTIONS = [
  'Italian & Pizza',
  'Asian & Noodles',
  'Burgers & American',
  'Healthy & Bowls',
  'Street Food & Tacos',
  'Indian & Curry',
  'Mediterranean',
  'Desserts & Sweets'
];

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Dairy-Free',
  'Nut-Free'
];

const SPICE_LEVELS: { id: 'mild' | 'medium' | 'hot' | 'extra-hot'; label: string; flames: number }[] = [
  { id: 'mild', label: 'Mild (Low Heat)', flames: 1 },
  { id: 'medium', label: 'Medium (Balanced Heat)', flames: 2 },
  { id: 'hot', label: 'Hot (Authentic Kick)', flames: 3 },
  { id: 'extra-hot', label: 'Extra Hot (Fiery)', flames: 4 }
];

const EXPLORE_OPTIONS = [
  'Cold Stone Sundaes',
  'Artisan Sourdough Pizza',
  'Rich Tonkotsu Broth',
  'Truffle Smash Burgers',
  'Hyderabadi Dum Biryani',
  'Fresh Fruit Gelato',
  'Pan-Seared Dim Sum',
  'Vietnamese Cold Brew',
  'Cheesy Fest Tacos',
  'Authentic Butter Chicken'
];

export const FoodPersonalityView: React.FC<Props> = ({ 
  onBackToDiscovery, 
  onSavedRedirect
}) => {
  const { user, updateTasteProfile } = useAuth();

  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(
    user?.tasteProfile?.favoriteCuisines || ['Italian & Pizza', 'Asian & Noodles']
  );
  const [flavorPreferences, setFlavorPreferences] = useState<string[]>(
    user?.tasteProfile?.flavorPreferences || ['savory', 'umami', 'crispy']
  );
  const [texturePreferences, setTexturePreferences] = useState<string[]>(
    user?.tasteProfile?.texturePreferences || ['crispy', 'chewy']
  );
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    user?.tasteProfile?.dietaryRestrictions || []
  );
  const [foodsToExplore, setFoodsToExplore] = useState<string[]>(
    user?.tasteProfile?.foodsToExplore || ['Cold Stone Sundaes', 'Artisan Sourdough Pizza']
  );
  const [spiceTolerance, setSpiceTolerance] = useState<'mild' | 'medium' | 'hot' | 'extra-hot'>(
    user?.tasteProfile?.spiceTolerance || 'medium'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.tasteProfile) {
      if (user.tasteProfile.favoriteCuisines) setFavoriteCuisines(user.tasteProfile.favoriteCuisines);
      if (user.tasteProfile.flavorPreferences) setFlavorPreferences(user.tasteProfile.flavorPreferences);
      if (user.tasteProfile.texturePreferences) setTexturePreferences(user.tasteProfile.texturePreferences);
      if (user.tasteProfile.dietaryRestrictions) setDietaryRestrictions(user.tasteProfile.dietaryRestrictions);
      if (user.tasteProfile.foodsToExplore) setFoodsToExplore(user.tasteProfile.foodsToExplore);
      if (user.tasteProfile.spiceTolerance) setSpiceTolerance(user.tasteProfile.spiceTolerance);
    }
  }, [user]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateTasteProfile({
        favoriteCuisines,
        flavorPreferences,
        texturePreferences,
        dietaryRestrictions,
        foodsToExplore,
        spiceTolerance
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSavedRedirect) onSavedRedirect();
      }, 900);
    } catch (err) {
      console.error('Failed to update taste profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation */}
        {onBackToDiscovery && (
          <button
            type="button"
            onClick={onBackToDiscovery}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#173829] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Restaurant Discovery</span>
          </button>
        )}

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-stone-200 text-[#173829] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#E06A4E]" />
            <span>Food Personality & Palate Onboarding</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif text-[#173829] tracking-tight leading-tight">
            Curate Your Culinary Palate
          </h1>

          <p className="text-sm sm:text-base text-stone-600 font-normal leading-relaxed">
            Tell us what you truly crave. Tastely calculates authentic match percentages across every kitchen and dish without generating artificial scores.
          </p>
        </div>

        {/* Onboarding Form Cards */}
        <div className="space-y-6">

          {/* 1. Cuisines */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E06A4E]">Step 1</span>
                <h3 className="text-lg font-serif text-[#173829] mt-0.5">Favorite Cuisines</h3>
                <p className="text-xs text-stone-500 mt-0.5">Select the culinary traditions you enjoy most.</p>
              </div>
              <span className="text-xs text-stone-400 font-medium">{favoriteCuisines.length} selected</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CUISINE_OPTIONS.map(cuisine => {
                const isSelected = favoriteCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleItem(favoriteCuisines, setFavoriteCuisines, cuisine)}
                    className={`p-3 rounded-2xl text-xs font-medium text-left transition-all border cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#173829] text-white border-[#173829] shadow-xs'
                        : 'bg-stone-50/70 hover:bg-stone-100/70 text-stone-700 border-stone-200/70'
                    }`}
                  >
                    <span>{cuisine}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Flavor Profiles */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E06A4E]">Step 2</span>
                <h3 className="text-lg font-serif text-[#173829] mt-0.5">Flavor Cravings</h3>
                <p className="text-xs text-stone-500 mt-0.5">Which flavor notes make your tastebuds happiest?</p>
              </div>
              <span className="text-xs text-stone-400 font-medium">{flavorPreferences.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FLAVORS.map(flavor => {
                const isSelected = flavorPreferences.includes(flavor);
                return (
                  <button
                    key={flavor}
                    type="button"
                    onClick={() => toggleItem(flavorPreferences, setFlavorPreferences, flavor)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#173829] text-white border-[#173829] shadow-xs font-semibold'
                        : 'bg-stone-50/70 hover:bg-stone-100/70 text-stone-700 border-stone-200/70'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{flavor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Texture Preferences */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E06A4E]">Step 3</span>
                <h3 className="text-lg font-serif text-[#173829] mt-0.5">Texture Sensations</h3>
                <p className="text-xs text-stone-500 mt-0.5">Mouthfeel is key to genuine food enjoyment.</p>
              </div>
              <span className="text-xs text-stone-400 font-medium">{texturePreferences.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TEXTURES.map(texture => {
                const isSelected = texturePreferences.includes(texture);
                return (
                  <button
                    key={texture}
                    type="button"
                    onClick={() => toggleItem(texturePreferences, setTexturePreferences, texture)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#E06A4E] text-white border-[#E06A4E] shadow-xs font-semibold'
                        : 'bg-stone-50/70 hover:bg-stone-100/70 text-stone-700 border-stone-200/70'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{texture}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Spice Tolerance */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E06A4E]">Step 4</span>
              <h3 className="text-lg font-serif text-[#173829] mt-0.5">Spice Tolerance</h3>
              <p className="text-xs text-stone-500 mt-0.5">How much chili heat do you prefer?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {SPICE_LEVELS.map(level => {
                const isSelected = spiceTolerance === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSpiceTolerance(level.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#173829] text-white border-[#173829] shadow-xs'
                        : 'bg-stone-50/70 hover:bg-stone-100 text-stone-700 border-stone-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: level.flames }).map((_, i) => (
                        <Flame key={i} className={`w-3.5 h-3.5 ${isSelected ? 'fill-amber-400 text-amber-400' : 'fill-orange-500 text-orange-500'}`} />
                      ))}
                    </div>
                    <div className="text-xs font-semibold">{level.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Dietary Restrictions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E06A4E]">Step 5</span>
                <h3 className="text-lg font-serif text-[#173829] mt-0.5">Dietary Restrictions</h3>
                <p className="text-xs text-stone-500 mt-0.5">Non-matching dishes will be clearly flagged with warnings.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(diet => {
                const isSelected = dietaryRestrictions.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleItem(dietaryRestrictions, setDietaryRestrictions, diet)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs font-semibold'
                        : 'bg-stone-50/70 hover:bg-stone-100 text-stone-700 border-stone-200/70'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{diet}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Foods You Want to Explore */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E06A4E]">Step 6</span>
                <h3 className="text-lg font-serif text-[#173829] mt-0.5">Foods You Want to Explore</h3>
                <p className="text-xs text-stone-500 mt-0.5">Dishes featuring these items will be highlighted and recommended on your feed.</p>
              </div>
              <span className="text-xs text-stone-400 font-medium">{foodsToExplore.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {EXPLORE_OPTIONS.map(food => {
                const isSelected = foodsToExplore.includes(food);
                return (
                  <button
                    key={food}
                    type="button"
                    onClick={() => toggleItem(foodsToExplore, setFoodsToExplore, food)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#173829] text-white border-[#173829] shadow-xs font-semibold'
                        : 'bg-stone-50/70 hover:bg-stone-100 text-stone-700 border-stone-200/70'
                    }`}
                  >
                    {isSelected ? '★ ' : '+ '}{food}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Save Bar */}
        <div className="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            Changes save persistently to your account in real-time.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onBackToDiscovery && (
              <button
                type="button"
                onClick={onBackToDiscovery}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#173829] hover:bg-[#0e241b] text-white text-xs font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Palate Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E06A4E]" />
                  <span>{isSaving ? 'Saving Preferences...' : 'Save & Calculate Matches'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
