import React from 'react';
import { Search, MapPin, Sparkles, Sliders, ArrowRight, UtensilsCrossed, Star } from 'lucide-react';
import { TasteProfile } from '../types';

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCity?: string;
  setSelectedCity?: (c: string) => void;
  onExploreClick?: () => void;
  onOpenTasteProfile?: () => void;
  onOpenTastePalate?: () => void;
  onSearchSubmit?: (query: string) => void;
  onSelectCuisine?: (cuisine: string) => void;
  userTasteProfile?: TasteProfile;
  activeFilter?: string;
  setActiveFilter?: (f: string) => void;
}

const POPULAR_CUISINES = [
  'All',
  'Italian & Pizza',
  'Asian & Noodles',
  'Artisanal Burgers',
  'Healthy & Bowls',
  'Street Food & Tacos',
  'Desserts & Sweets'
];

export const RestaurantHero: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  selectedCity = 'All',
  setSelectedCity,
  onExploreClick,
  onOpenTasteProfile,
  onOpenTastePalate,
  onSearchSubmit,
  onSelectCuisine,
  userTasteProfile,
  activeFilter = 'All',
  setActiveFilter
}) => {
  const hasProfile = Boolean(
    userTasteProfile && (
      (userTasteProfile.favoriteCuisines?.length || 0) > 0 ||
      (userTasteProfile.flavorPreferences?.length || 0) > 0 ||
      (userTasteProfile.texturePreferences?.length || 0) > 0
    )
  );

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-stone-200/80 pt-10 pb-12 sm:pt-14 sm:pb-16">
      {/* Subtle organic background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#173829]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-[#E06A4E]/5 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-[#173829] text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E06A4E]" />
            <span className="tracking-wide">Personalized Culinary Discovery</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500 font-normal">Beyond Star Ratings</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#173829] tracking-tight leading-[1.12]">
            Find food you'll truly love.
          </h1>

          <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            Discover dishes and kitchens matched to your personal flavor cravings, texture preferences, and honest taste-twin reviews.
          </p>
        </div>

        {/* Polished Restaurant Search Bar */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 flex items-center pl-3">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, smash burgers, ramen..."
                className="w-full pl-3 pr-3 py-2.5 text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 mr-1 text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Location Selector Divider */}
            <div className="hidden sm:block w-px h-8 bg-stone-200" />

            {/* Location Selector */}
            <div className="flex items-center gap-2 px-3 py-1 text-xs text-stone-600 shrink-0">
              <MapPin className="w-4 h-4 text-[#E06A4E] shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => {
                  if (setSelectedCity) setSelectedCity(e.target.value);
                }}
                className="bg-transparent font-medium text-stone-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="All">All Locations</option>
                <option value="Campus Hub">Campus Hub</option>
                <option value="University Avenue">University Avenue</option>
                <option value="Arts Quarter">Arts Quarter</option>
              </select>
            </div>

            {/* Search Action Button */}
            <button
              type="button"
              onClick={() => {
                if (onExploreClick) onExploreClick();
                if (onSearchSubmit) onSearchSubmit(searchQuery);
              }}
              className="px-6 py-3 rounded-xl sm:rounded-2xl bg-[#173829] hover:bg-[#0e241b] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <span>Explore Menus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Cuisine Filter Tabs */}
        <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
          {POPULAR_CUISINES.map(cuisine => {
            const isSelected = activeFilter === cuisine;
            return (
              <button
                key={cuisine}
                type="button"
                onClick={() => {
                  if (setActiveFilter) setActiveFilter(cuisine);
                  if (onSelectCuisine) onSelectCuisine(cuisine);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#173829] text-white shadow-2xs font-semibold'
                    : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200/70 hover:border-stone-300'
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>

        {/* Personalization Callout Banner */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#173829]/8 text-[#173829] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#E06A4E]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#173829] flex items-center gap-2">
                  <span>Your Taste Personality Profile</span>
                  {hasProfile ? (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Active Palate Match
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#E06A4E] bg-rose-50 px-2 py-0.5 rounded-md">
                      Incomplete
                    </span>
                  )}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  {hasProfile ? (
                    <span>
                      Scoring menus based on your cravings for <strong>{userTasteProfile?.flavorPreferences?.slice(0, 3).join(', ')}</strong> flavors and <strong>{userTasteProfile?.texturePreferences?.slice(0, 2).join(', ')}</strong> textures.
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
              onClick={() => {
                if (onOpenTasteProfile) onOpenTasteProfile();
                else if (onOpenTastePalate) onOpenTastePalate();
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#173829]/30 hover:border-[#173829] text-[#173829] hover:bg-[#173829]/5 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#E06A4E]" />
              <span>{hasProfile ? 'Adjust Palate' : 'Set Taste Profile'}</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
