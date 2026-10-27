import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Flame, Clock, Heart, ArrowDown } from 'lucide-react';

interface FoodCharacter {
  id: string;
  name: string;
  category: string;
  backgroundWord: string;
  headline: string;
  tagline: string;
  flavorNotes: string[];
  calories: string;
  highlightTag: string;
  accentColor: string;
  accentBg: string;
  glowColor: string;
  image: string;
  modelType: 'burger' | 'pizza' | 'strawberry' | 'noodles';
}

const FOOD_CHARACTERS: FoodCharacter[] = [
  {
    id: 'char_burger',
    name: 'Craft Smash Burger',
    category: 'Gourmet Artisanal',
    backgroundWord: 'BURGER',
    headline: 'DOUBLE WAGYU & TRUFFLE CHEDDAR',
    tagline: 'Lacy crisp edges, molten aged cheddar, fermented garlic aioli on glossy toasted brioche.',
    flavorNotes: ['Savory Umami', 'Melted Cheddar', 'Crisp Lacey Edges'],
    calories: '680 kcal',
    highlightTag: 'Most Craved Today',
    accentColor: '#EA580C',
    accentBg: 'from-amber-500/20 via-orange-500/10 to-transparent',
    glowColor: 'rgba(234, 88, 12, 0.35)',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    modelType: 'burger'
  },
  {
    id: 'char_pizza',
    name: 'Neapolitan Sourdough Pizza',
    category: 'Wood-Fired Italian',
    backgroundWord: 'PIZZA',
    headline: 'BLISTERED CRUST & HOT HONEY',
    tagline: '48-hour fermented mother yeast dough, sweet San Marzano tomatoes, and melting Fior di Latte.',
    flavorNotes: ['Stretchy Mozzarella', 'Wood Smoke', 'Calabrian Chili'],
    calories: '720 kcal',
    highlightTag: 'Chef Special',
    accentColor: '#DC2626',
    accentBg: 'from-rose-500/20 via-red-500/10 to-transparent',
    glowColor: 'rgba(220, 38, 38, 0.35)',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    modelType: 'pizza'
  },
  {
    id: 'char_strawberry',
    name: 'Glazed Ruby Strawberry',
    category: 'Artisan Confection',
    backgroundWord: 'BERRY',
    headline: '70% VALRHONA & GOLD FLAKES',
    tagline: 'Hand-selected wild coastal strawberries dipped in rich velvet chocolate and crystallized sugar.',
    flavorNotes: ['Sweet Tart', 'Belgian Cocoa', 'Mint Infusion'],
    calories: '240 kcal',
    highlightTag: 'Sweet Surrender',
    accentColor: '#E11D48',
    accentBg: 'from-pink-500/20 via-rose-500/10 to-transparent',
    glowColor: 'rgba(225, 29, 72, 0.35)',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    modelType: 'strawberry'
  },
  {
    id: 'char_noodles',
    name: 'Steaming Tonkotsu Ramen',
    category: 'Handmade Asian',
    backgroundWord: 'RAMEN',
    headline: '18-HOUR SLOW BROTH & CHASHU',
    tagline: 'Springy hand-pulled noodles submerged in rich collagen broth with a jammy soy-marinated egg.',
    flavorNotes: ['Deep Broth', 'Jammy Egg', 'Sichuan Tingle'],
    calories: '610 kcal',
    highlightTag: 'Comfort Classic',
    accentColor: '#059669',
    accentBg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    glowColor: 'rgba(5, 150, 105, 0.35)',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    modelType: 'noodles'
  }
];

export const HeroCarousel: React.FC<{
  onDiscoverClick: () => void;
  onSurplusClick: () => void;
}> = ({ onDiscoverClick, onSurplusClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const total = FOOD_CHARACTERS.length;
  const current = FOOD_CHARACTERS[activeIndex];

  // Auto advance every 5.5s unless hovered
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(timer);
  }, [isHovered, total]);

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % total);
  };

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + total) % total);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Helper to calculate position in 3D carousel
  const getCardStyle = (index: number) => {
    const diff = (index - activeIndex + total) % total;

    if (diff === 0) {
      // Active center
      return {
        transform: `translate3d(0, 0, 0) scale(1) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
        opacity: 1,
        filter: 'blur(0px)',
        zIndex: 30,
        pointerEvents: 'auto' as const
      };
    } else if (diff === 1) {
      // Right preview
      return {
        transform: `translate3d(240px, 15px, -120px) scale(0.78) rotateY(-18deg)`,
        opacity: 0.45,
        filter: 'blur(2px)',
        zIndex: 20,
        pointerEvents: 'auto' as const
      };
    } else if (diff === total - 1) {
      // Left preview
      return {
        transform: `translate3d(-240px, 15px, -120px) scale(0.78) rotateY(18deg)`,
        opacity: 0.45,
        filter: 'blur(2px)',
        zIndex: 20,
        pointerEvents: 'auto' as const
      };
    } else {
      // Back item
      return {
        transform: `translate3d(0, -30px, -240px) scale(0.55)`,
        opacity: 0.15,
        filter: 'blur(4px)',
        zIndex: 10,
        pointerEvents: 'none' as const
      };
    }
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden bg-[#FAF7F2] select-none pt-4 pb-8"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.8) 0%, rgba(250, 247, 242, 0.4) 70%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E")`
      }}
    >
      {/* Dynamic ambient background glow */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ease-out"
        style={{
          backgroundColor: current.glowColor
        }}
      />

      {/* Dramatic oversized ghost text reading "3D SHAPE" */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
        <span 
          className="text-[20vw] font-black uppercase text-stone-200/50 tracking-tighter leading-none select-none transition-all duration-[650ms] ease-out drop-shadow-sm select-none"
          style={{
            fontFamily: "'Syne', 'Plus Jakarta Sans', sans-serif",
            textShadow: '0 10px 40px rgba(0,0,0,0.03)',
            letterSpacing: '-0.05em'
          }}
        >
          3D SHAPE
        </span>
      </div>

      {/* Floating 3D Food Ingredients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {/* Ingredient 1: Basil / Herb */}
        <div 
          className="absolute top-1/4 left-[12%] sm:left-[18%] px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-lg text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(${tilt.x * -0.6}px, ${tilt.y * -0.6}px, 0)` }}
        >
          <span className="text-sm">🌿</span>
          <span>Sweet Basil</span>
        </div>

        {/* Ingredient 2: Chili Flake */}
        <div 
          className="absolute top-1/3 right-[10%] sm:right-[16%] px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-lg text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(${tilt.x * 0.8}px, ${tilt.y * 0.8}px, 0)` }}
        >
          <span className="text-sm">🌶️</span>
          <span>Calabrian Chili</span>
        </div>

        {/* Ingredient 3: Garlic Crisp / Sesame */}
        <div 
          className="absolute bottom-1/4 left-[15%] sm:left-[22%] px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-lg text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(${tilt.x * -0.4}px, ${tilt.y * -0.4}px, 0)` }}
        >
          <span className="text-sm">🧄</span>
          <span>Garlic Crisp</span>
        </div>

        {/* Ingredient 4: Sea Salt / Spice */}
        <div 
          className="absolute bottom-1/3 right-[14%] sm:right-[20%] px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-lg text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-transform duration-700 ease-out"
          style={{ transform: `translate3d(${tilt.x * 0.5}px, ${tilt.y * 0.5}px, 0)` }}
        >
          <span className="text-sm">✨</span>
          <span>Maldon Salt</span>
        </div>
      </div>

      {/* Top Banner Tagline & Exact Headline */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center mt-8 sm:mt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-stone-200/80 shadow-xs mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Smart Taste Matching & Zero Food Waste
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
            Live Platform
          </span>
        </div>

        <h1 
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.08]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Your cravings. Your taste.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600">
            Your Tastely.
          </span>
        </h1>
      </div>

      {/* 3D Carousel Stage */}
      <div 
        className="relative z-20 w-full max-w-6xl mx-auto my-auto h-[380px] md:h-[440px] flex items-center justify-center perspective-[1200px]"
        style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
      >
        {/* Navigation Arrow Left */}
        <button
          onClick={handlePrev}
          aria-label="Previous food item"
          className="absolute left-4 md:left-12 z-40 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 text-stone-800 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 group cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
        </button>

        {/* 3D Carousel Cards */}
        <div 
          className="relative w-[300px] md:w-[380px] h-[340px] md:h-[390px] flex items-center justify-center transform-style-3d"
          style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
        >
          {FOOD_CHARACTERS.map((char, index) => {
            const style = getCardStyle(index);
            const isCenter = (index - activeIndex + total) % total === 0;

            return (
              <div
                key={char.id}
                onClick={() => setActiveIndex(index)}
                style={style}
                className={`absolute w-full h-full rounded-3xl p-6 transition-all duration-[650ms] ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer flex flex-col justify-between ${
                  isCenter 
                    ? 'bg-white/95 backdrop-blur-xl shadow-2xl border-2 border-stone-100 ring-1 ring-stone-900/5' 
                    : 'bg-white/60 backdrop-blur-md shadow-md border border-stone-200'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs" style={{ backgroundColor: char.accentColor }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {char.highlightTag}
                  </span>
                  <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                    {char.calories}
                  </span>
                </div>

                {/* 3D Character Food Art */}
                <div className="relative my-auto w-full h-[180px] md:h-[210px] flex items-center justify-center group">
                  {/* Subtle pedestal / shadow */}
                  <div 
                    className="absolute bottom-2 w-44 h-8 rounded-full blur-md opacity-40 transition-all duration-500"
                    style={{ backgroundColor: char.accentColor }}
                  />

                  {/* High Quality Food Image */}
                  <img
                    src={char.image}
                    alt={char.name}
                    className="relative z-10 w-44 h-44 md:w-52 md:h-52 object-cover rounded-full shadow-xl ring-4 ring-white transition-transform duration-500 group-hover:scale-105"
                    loading="eager"
                  />

                  {/* Floating floating badge */}
                  {isCenter && (
                    <div className="absolute top-2 right-4 z-20 animate-bounce duration-1000 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md text-amber-500">
                      <Flame className="w-5 h-5 fill-amber-500" />
                    </div>
                  )}
                </div>

                {/* Card Bottom Details */}
                <div className="text-center pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                    {char.category}
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-stone-900 mt-0.5 tracking-tight">
                    {char.name}
                  </h3>
                  
                  {/* Flavor chips */}
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {char.flavorNotes.map((note, nIdx) => (
                      <span 
                        key={nIdx} 
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleNext}
          aria-label="Next food item"
          className="absolute right-4 md:right-12 z-40 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 text-stone-800 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 group cursor-pointer"
        >
          <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Hero Bottom Controls & Action Bar */}
      <div className="relative z-30 max-w-4xl mx-auto w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
        {/* Left: Index Counter & Progress Dots */}
        <div className="flex items-center gap-4">
          <div className="text-lg font-black tracking-tight text-stone-900 font-mono">
            0{activeIndex + 1} <span className="text-stone-400 font-normal">/ 0{total}</span>
          </div>
          <div className="flex gap-2">
            {FOOD_CHARACTERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIndex 
                    ? 'w-8 bg-stone-900' 
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Primary Call to Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onSurplusClick}
            className="px-5 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-bold text-sm tracking-wide border border-amber-300/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            SURPLUS DEALS (-50%+)
          </button>

          <button
            onClick={onDiscoverClick}
            className="px-8 py-3.5 rounded-2xl bg-[#173829] hover:bg-[#0e241b] text-white font-black text-sm tracking-widest uppercase transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 group"
          >
            DISCOVER IT
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
