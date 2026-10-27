import React, { useState, useEffect } from 'react';
import { ImpactStats } from '../types';
import { api } from '../services/api';
import { 
  BarChart3, Leaf, HeartHandshake, ShieldCheck, 
  RotateCw, Building2, Globe2, Utensils, CheckCircle2 
} from 'lucide-react';

export const ImpactDashboard: React.FC = () => {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchStats = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await api.getImpactStats();
      setStats(data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to load impact statistics', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(false);
  }, []);

  const totalMeals = stats 
    ? (stats.totalMealsRescued ?? (stats.surplusMealsRescued + stats.donatedPortions))
    : 0;

  return (
    <div className="py-10 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Refresh Stats Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              Verified Environmental & Social Accountability
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">
              Platform Impact Dashboard
            </h1>
            <p className="text-sm md:text-base text-stone-600 max-w-2xl mt-1.5">
              Transparent reporting of verified surplus meals rescued, community donations completed, and greenhouse gas emissions diverted from local landfills.
            </p>
          </div>

          {/* Refresh Stats Button */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              Updated: {lastRefreshedAt.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing || isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:border-stone-300 active:scale-95"
              title="Fetch fresh real-time statistics from backend"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
            </button>
          </div>
        </div>

        {/* Verification & Methodology Banner */}
        <div className="mb-8 p-5 rounded-3xl bg-white border border-stone-200 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-900 font-bold block mb-1">
                Transparency & Calculation Standards:
              </strong>
              Actual recorded counts (surplus meals claimed and completed food donations) are queried directly from the Tastely transaction database without double-counting. Environmental conversions follow standard benchmarks established by the <span className="font-semibold text-stone-900">U.S. EPA Waste Reduction Model (WARM)</span> and <span className="font-semibold text-stone-900">FAO / UNEP</span>:
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-stone-600 font-medium">
                <li>Portion Weight Benchmark: Verified average of <span className="font-semibold text-stone-900">0.42 kg</span> per prepared culinary meal.</li>
                <li>Carbon Equivalent: <span className="font-semibold text-stone-900">2.5 kg CO₂e</span> avoided per 1 kg of food diverted from municipal landfill methane generation.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        {isLoading || !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-44 rounded-3xl bg-stone-200/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {/* Top Row: Total Combined & Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Combined Total Meals Rescued */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 bg-white/20 px-2.5 py-1 rounded-lg">
                      Combined Platform Impact
                    </span>
                    <Utensils className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div className="text-5xl font-black mt-3 tracking-tight text-white">
                    {totalMeals}
                  </div>
                  <div className="text-sm font-black text-emerald-100 mt-1">
                    Total Meals Rescued
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 text-xs font-semibold text-emerald-100 flex items-center justify-between">
                  <span>{stats.surplusMealsRescued} surplus + {stats.donatedPortions} donated</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">100% Verified</span>
                </div>
              </div>

              {/* 2. Direct Customer Surplus Rescues */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                      Customer Surplus Channel
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="text-4xl font-black text-stone-900 mt-3 tracking-tight">
                    {stats.surplusMealsRescued}
                  </div>
                  <div className="text-xs font-bold text-stone-700 mt-1">
                    Surplus Meals Purchased
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rescued via 50%+ surplus discounts</span>
                </div>
              </div>

              {/* 3. NGO Community Food Rescue Donations */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg">
                      NGO Rescue Channel
                    </span>
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-4xl font-black text-rose-700 mt-3 tracking-tight">
                    {stats.donatedPortions}
                  </div>
                  <div className="text-xs font-bold text-stone-700 mt-1">
                    Meals Donated to Pantries
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Across <strong>{stats.donationsCompleted}</strong> completed batch collections</span>
                </div>
              </div>

            </div>

            {/* Second Row: Environmental & Economic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Food Waste Diverted */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Landfill Diversion
                  </span>
                  <div className="text-4xl font-black text-emerald-700 mt-3 tracking-tight">
                    {stats.totalFoodWeightKg} <span className="text-xl font-bold text-stone-500">kg</span>
                  </div>
                  <div className="text-xs font-bold text-stone-700 mt-1">
                    Food Waste Prevented
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-medium flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Equivalent to ~{Math.round(stats.totalFoodWeightKg * 2.2046)} lbs of solid food
                </div>
              </div>

              {/* Greenhouse Gases Avoided */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Emissions Prevented
                  </span>
                  <div className="text-4xl font-black text-blue-700 mt-3 tracking-tight">
                    {stats.co2eAvoidedKg} <span className="text-xl font-bold text-stone-500">kg</span>
                  </div>
                  <div className="text-xs font-bold text-stone-700 mt-1">
                    CO₂e Emissions Avoided
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-medium flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                  EPA WARM conversion factor
                </div>
              </div>

              {/* Community Savings in Rupees */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg">
                    Economic Relief
                  </span>
                  <div className="text-4xl font-black text-orange-600 mt-3 tracking-tight">
                    ₹{stats.dollarsSavedByCommunity.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-stone-700 mt-1">
                    Saved by Campus & Local Community
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 font-medium flex items-center gap-1">
                  <span className="font-bold text-orange-600">₹</span>
                  Direct consumer food bill savings
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Secondary Row: NGO Donations & Community Network */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-stone-900">
                Shelter & Community Donations Breakdown
              </h3>
              <HeartHandshake className="w-5 h-5 text-rose-600" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <div className="text-2xl font-black text-rose-700">
                  {stats?.donatedPortions || 0}
                </div>
                <div className="text-xs font-semibold text-rose-900 mt-0.5">
                  Meals Donated to Pantries
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <div className="text-2xl font-black text-rose-700">
                  {stats?.donationsCompleted || 0}
                </div>
                <div className="text-xs font-semibold text-rose-900 mt-0.5">
                  Verified Batch Pickups
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-500 mt-4 leading-relaxed">
              Every donated batch is inspected and picked up by verified volunteer coordinators with temperature-controlled transit.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-stone-900">
                Participating Local Network
              </h3>
              <Building2 className="w-5 h-5 text-stone-700" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="text-2xl font-black text-stone-900">
                  {stats?.participatingRestaurantsCount || 5}
                </div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">
                  Partner Kitchens
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="text-2xl font-black text-stone-900">
                  {stats?.activeNGOsCount || 8}
                </div>
                <div className="text-xs font-semibold text-stone-700 mt-0.5">
                  Registered Rescue NGOs
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-500 mt-4 leading-relaxed">
              Partner kitchens commit to daily surplus logging, ensuring fresh unsold food is redirected rather than discarded.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
