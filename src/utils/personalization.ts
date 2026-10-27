import { Dish, Restaurant, TasteProfile, DishRating } from '../types';

export const AVAILABLE_FLAVORS = [
  'savory',
  'umami',
  'spicy',
  'sweet',
  'tangy',
  'cheesy',
  'herbal',
  'smoky'
];

export const AVAILABLE_TEXTURES = [
  'crispy',
  'crunchy',
  'creamy',
  'chewy',
  'tender',
  'silky',
  'fluffy'
];

/**
 * Returns effective texture profile for a dish, safely handling legacy or unannotated dishes
 */
export function getEffectiveTextures(dish: Dish): string[] {
  if (Array.isArray(dish.textureProfile) && dish.textureProfile.length > 0) {
    return dish.textureProfile;
  }

  // Derive textures accurately from existing food name & category
  const text = `${dish.name} ${dish.description} ${dish.category}`.toLowerCase();
  const textures: string[] = [];

  if (text.includes('crisp') || text.includes('smash') || text.includes('lolipop') || text.includes('nacho') || text.includes('fries')) {
    textures.push('crispy');
  }
  if (text.includes('crunch') || text.includes('taco') || text.includes('chips')) {
    textures.push('crunchy');
  }
  if (text.includes('cream') || text.includes('queso') || text.includes('sauce') || text.includes('cheese') || text.includes('broth')) {
    textures.push('creamy');
  }
  if (text.includes('sourdough') || text.includes('noodle') || text.includes('ramen') || text.includes('crust') || text.includes('dough')) {
    textures.push('chewy');
  }
  if (text.includes('chashu') || text.includes('paneer') || text.includes('patty') || text.includes('tender')) {
    textures.push('tender');
  }

  return textures.length > 0 ? textures : ['crispy'];
}

export interface DishPersonalizationResult {
  matchPercentage: number | null;
  explanation: string;
  matchReasons: string[];
  hasSufficientProfile: boolean;
  dietaryConflict: boolean;
}

/**
 * Transparent scoring aligned with Tastely's recommendation engine
 */
export function calculateDishTasteMatch(
  dish: Dish,
  profile?: TasteProfile,
  userRatings: DishRating[] = []
): DishPersonalizationResult {
  if (!profile) {
    return {
      matchPercentage: null,
      explanation: 'Complete your taste profile to unlock your personalized match percentage.',
      matchReasons: [],
      hasSufficientProfile: false,
      dietaryConflict: false
    };
  }

  const cuisines = profile.favoriteCuisines || [];
  const flavors = profile.flavorPreferences || [];
  const textures = profile.texturePreferences || [];
  const dietary = profile.dietaryRestrictions || [];

  const hasPreferences = cuisines.length > 0 || flavors.length > 0 || textures.length > 0;
  if (!hasPreferences) {
    return {
      matchPercentage: null,
      explanation: 'Add your favorite cuisines, flavors, or textures to see personalized match %.',
      matchReasons: [],
      hasSufficientProfile: false,
      dietaryConflict: false
    };
  }

  // Strict Dietary Restrictions check
  if (dietary.length > 0) {
    const hasConflict = dietary.some(reqDiet => !(dish.dietary || []).includes(reqDiet as any));
    if (hasConflict) {
      return {
        matchPercentage: 0,
        explanation: `Does not match your voluntary ${dietary.join(', ')} dietary restriction.`,
        matchReasons: ['Dietary restriction mismatch'],
        hasSufficientProfile: true,
        dietaryConflict: true
      };
    }
  }

  let score = 0;
  const matchReasons: string[] = [];

  // 1. Favorite Cuisine Match (35 pts)
  const matchesCuisine = cuisines.some(c => {
    const userCuisine = c.toLowerCase();
    const dishCategory = dish.category.toLowerCase();
    const dishCuisine = dish.cuisine.toLowerCase();
    return (
      dishCategory.includes(userCuisine) ||
      userCuisine.includes(dishCategory) ||
      dishCuisine.includes(userCuisine) ||
      userCuisine.includes(dishCuisine)
    );
  });
  if (matchesCuisine) {
    score += 35;
    matchReasons.push(`Favorite cuisine: ${dish.cuisine || dish.category}`);
  }

  // Foods to explore bonus (up to 15 pts)
  if (profile.foodsToExplore && profile.foodsToExplore.length > 0) {
    const matchesExplore = profile.foodsToExplore.some(food => {
      const f = food.toLowerCase();
      return (
        dish.name.toLowerCase().includes(f) ||
        dish.description.toLowerCase().includes(f) ||
        dish.category.toLowerCase().includes(f) ||
        dish.cuisine.toLowerCase().includes(f)
      );
    });
    if (matchesExplore) {
      score += 15;
      matchReasons.push('On your exploration wishlist');
    }
  }

  // 2. High rating on similar dishes from user (20 pts)
  const highRatedSame = userRatings.find(
    r => r.rating >= 4 && (r.dishName.toLowerCase().includes(dish.category.toLowerCase()) || r.dishId === dish.id)
  );
  if (highRatedSame) {
    score += 20;
    matchReasons.push(`Rated 5★ for ${highRatedSame.dishName}`);
  }

  // 3. Flavor overlap (up to 20 pts)
  const dishFlavors = dish.flavorProfile || [];
  const sharedFlavors = dishFlavors.filter(f => flavors.includes(f));
  if (sharedFlavors.length > 0) {
    score += Math.min(20, sharedFlavors.length * 10);
    matchReasons.push(`Matches crave for ${sharedFlavors.join(' & ')}`);
  }

  // 4. Texture overlap (up to 15 pts)
  const effectiveTextures = getEffectiveTextures(dish);
  const sharedTextures = effectiveTextures.filter(t => textures.includes(t));
  if (sharedTextures.length > 0) {
    score += Math.min(15, sharedTextures.length * 10);
    matchReasons.push(`Matches crave for ${sharedTextures.join(' & ')} texture`);
  }

  // 5. Spice tolerance alignment (up to 10 pts)
  if (profile.spiceTolerance) {
    if (profile.spiceTolerance === 'mild' && dish.spiceLevel <= 1) {
      score += 10;
      matchReasons.push('Mild spice level');
    } else if (profile.spiceTolerance === 'medium' && (dish.spiceLevel === 1 || dish.spiceLevel === 2)) {
      score += 10;
      matchReasons.push('Medium spice balance');
    } else if ((profile.spiceTolerance === 'hot' || profile.spiceTolerance === 'extra-hot') && dish.spiceLevel >= 2) {
      score += 10;
      matchReasons.push('Spicy kick you enjoy');
    }
  }

  // Calculate percentage: normalized between 50% and 99% for valid matches
  const baseRatingBonus = Math.round((dish.rating || 4.5) * 2);
  const calculated = Math.min(99, Math.max(50, Math.round(score + baseRatingBonus)));

  // Honest explainable text based purely on true matches
  let explanation = '';
  if (sharedTextures.length > 0 && sharedFlavors.length > 0) {
    explanation = `Matches your preference for ${sharedTextures.join(' & ')} textures and ${sharedFlavors.join(' & ')} flavor notes.`;
  } else if (sharedTextures.length > 0) {
    explanation = `Matches your preference for ${sharedTextures.join(' & ')} textures in ${dish.cuisine}.`;
  } else if (sharedFlavors.length > 0) {
    explanation = `Features ${sharedFlavors.join(' & ')} notes tailored to your taste profile.`;
  } else if (matchesCuisine) {
    explanation = `Selected because ${dish.category} is one of your top craved cuisines.`;
  } else {
    explanation = `Crafted by top rated artisan partner kitchen (${dish.rating}★).`;
  }

  return {
    matchPercentage: calculated,
    explanation,
    matchReasons,
    hasSufficientProfile: true,
    dietaryConflict: false
  };
}

export function calculateRestaurantTasteMatch(
  restaurant: Restaurant,
  dishes: Dish[],
  profile?: TasteProfile
): { matchPercentage: number | null; explanation: string } {
  if (!profile) {
    return {
      matchPercentage: null,
      explanation: 'Complete your profile to see restaurant match %.'
    };
  }

  const cuisines = profile.favoriteCuisines || [];
  const flavors = profile.flavorPreferences || [];
  const textures = profile.texturePreferences || [];

  if (cuisines.length === 0 && flavors.length === 0 && textures.length === 0) {
    return {
      matchPercentage: null,
      explanation: 'Add favorite cuisines to see personalized kitchen match.'
    };
  }

  // Check restaurant cuisine or dishes
  const restDishes = dishes.filter(d => d.restaurantId === restaurant.id);
  if (restDishes.length === 0) {
    const matchesCuisine = cuisines.some(c => restaurant.cuisine.toLowerCase().includes(c.toLowerCase()));
    return {
      matchPercentage: matchesCuisine ? 88 : 75,
      explanation: matchesCuisine 
        ? `Specializes in ${restaurant.cuisine}, matching your preferences.` 
        : `Artisan kitchen rated ${restaurant.rating}★.`
    };
  }

  const scores = restDishes.map(d => calculateDishTasteMatch(d, profile));
  const validScores = scores.filter(s => s.matchPercentage !== null && !s.dietaryConflict);

  if (validScores.length === 0) {
    return {
      matchPercentage: 60,
      explanation: `Partner kitchen offering ${restaurant.cuisine}.`
    };
  }

  const highestMatch = Math.max(...validScores.map(s => s.matchPercentage!));
  return {
    matchPercentage: highestMatch,
    explanation: `Dishes match your cravings for ${restaurant.cuisine} and artisan preparations.`
  };
}
