import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

import { 
  User, Restaurant, Dish, InventoryItem, SurplusOffer, 
  Reservation, DonationOffer, DonationRequest, DonationStatus, DishRating, BusinessType, Role,
  VerificationRequest, PlatformReport, AdminOverviewStats,
  Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, TasteProfile,
  FoodieRequest, FoodieConnection, DirectMessage, ConversationSummary, TasteTwin
} from './src/types/index.ts';
import { ENRICHED_RESTAURANTS, ENRICHED_DISHES, ENRICHED_INVENTORY } from './src/data/menuData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'tastely-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface TastelyDB {
  users: User[];
  restaurants: Restaurant[];
  dishes: Dish[];
  inventory: InventoryItem[];
  surplusOffers: SurplusOffer[];
  reservations: Reservation[];
  donations: DonationOffer[];
  donationRequests: DonationRequest[];
  ratings: DishRating[];
  verifications: VerificationRequest[];
  reports: PlatformReport[];
  orders: Order[];
  friendRequests?: FoodieRequest[];
  messages?: DirectMessage[];
}

// Initial Database Seeds in Indian Rupees (₹)
const INITIAL_DB: TastelyDB = {
  users: [
    {
      id: 'usr_customer_1',
      name: 'Alex Rivera',
      email: 'alex@tastely.local',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      tasteProfile: {
        favoriteCuisines: ['Asian & Noodles', 'Burgers', 'Italian & Pizza'],
        dietaryRestrictions: [],
        spiceTolerance: 'hot',
        flavorPreferences: ['savory', 'umami', 'crispy', 'spicy'],
        isTasteTwinDiscoverable: true,
        tasteTwinAlias: 'FlavorHunter_Alex'
      }
    },
    {
      id: 'usr_vendor_1',
      name: 'Chef Marco Valenti',
      email: 'marco@forno.local',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
      organizationId: 'rest_2',
      tasteProfile: {
        favoriteCuisines: ['Italian & Pizza'],
        dietaryRestrictions: [],
        spiceTolerance: 'medium',
        flavorPreferences: ['savory', 'cheesy'],
        isTasteTwinDiscoverable: false
      }
    },
    {
      id: 'usr_vendor_canteen',
      name: 'Ramesh Sharma',
      email: 'canteen@campus.local',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      organizationId: 'rest_4',
      tasteProfile: {
        favoriteCuisines: ['Healthy & Bowls', 'Asian & Noodles'],
        dietaryRestrictions: ['Vegetarian'],
        spiceTolerance: 'hot',
        flavorPreferences: ['spicy', 'savory'],
        isTasteTwinDiscoverable: false
      }
    },
    {
      id: 'usr_ngo_1',
      name: 'Sarah Jenkins',
      email: 'sarah@foodrescue.local',
      role: 'ngo',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      organizationId: 'ngo_1',
      tasteProfile: {
        favoriteCuisines: ['Healthy & Bowls'],
        dietaryRestrictions: ['Vegetarian'],
        spiceTolerance: 'mild',
        flavorPreferences: ['fresh', 'herbal'],
        isTasteTwinDiscoverable: false
      }
    },
    {
      id: 'usr_admin_1',
      name: 'Elena Rostova (Admin)',
      email: 'admin@tastely.local',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      tasteProfile: {
        favoriteCuisines: ['Burgers', 'Desserts & Sweets'],
        dietaryRestrictions: [],
        spiceTolerance: 'medium',
        flavorPreferences: ['sweet', 'savory'],
        isTasteTwinDiscoverable: false
      }
    }
  ],
  restaurants: [
    {
      id: 'rest_1',
      name: 'The Urban Patty Lab',
      cuisine: 'Burgers & American',
      address: '422 Innovation Way, University Avenue',
      city: 'Campus Hub',
      phone: '+91 98765 43210',
      rating: 4.8,
      ratingCount: 312,
      deliveryTime: '20-30 min',
      priceRange: '₹₹',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      description: 'Craft smash burgers on artisanal brioche buns, aged cheddar, and house secret sauce.',
      tags: ['Smash Burger', 'Truffle Fries', 'Craft Shakes', 'Late Night'],
      ownerId: 'usr_vendor_1',
      businessType: 'Restaurant',
      upiId: 'pattylab@upi',
      upiPayeeName: 'The Urban Patty Lab'
    },
    {
      id: 'rest_2',
      name: 'Forno Di Napoli',
      cuisine: 'Italian & Artisan Pizza',
      address: '88 Piazza Bella, Arts Quarter',
      city: 'Campus Hub',
      phone: '+91 98765 43211',
      rating: 4.9,
      ratingCount: 450,
      deliveryTime: '25-35 min',
      priceRange: '₹₹',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      description: 'Traditional wood-fired Neapolitan pizza, 48-hour fermented sourdough, San Marzano tomatoes and fresh mozzarella.',
      tags: ['Wood-Fired', 'Sourdough', 'Vegetarian Friendly', 'Mozzarella'],
      ownerId: 'usr_vendor_1',
      businessType: 'Restaurant',
      upiId: 'fornodinapoli@okhdfcbank',
      upiPayeeName: 'Forno Di Napoli'
    },
    {
      id: 'rest_3',
      name: 'Sakura Artisanal Noodle Bar',
      cuisine: 'Asian & Noodles',
      address: '154 Lantern Alley, Old Town',
      city: 'Campus Hub',
      phone: '+91 98765 43212',
      rating: 4.9,
      ratingCount: 520,
      deliveryTime: '15-25 min',
      priceRange: '₹₹',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      description: 'Simmered 18-hour broth, hand-pulled wheat noodles, char siu toppings, and seasoned ramen eggs.',
      tags: ['Tonkotsu', 'Handmade Noodles', 'Spicy Miso', 'Authentic'],
      ownerId: 'usr_vendor_1',
      businessType: 'Restaurant',
      upiId: 'sakuranoodles@icici',
      upiPayeeName: 'Sakura Artisanal Noodle Bar'
    },
    {
      id: 'rest_4',
      name: 'Campus Central Canteen',
      cuisine: 'Healthy Bowls & Snacks',
      address: 'Block A, North Campus Plaza',
      city: 'Campus Hub',
      phone: '+91 98765 43213',
      rating: 4.6,
      ratingCount: 380,
      deliveryTime: '10-15 min',
      priceRange: '₹',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      description: 'Daily fresh student canteen meals, nutritious grain bowls, fresh juices, and budget-friendly wraps.',
      tags: ['Student Budget', 'Fast Pickup', 'Nutritious', 'Vegetarian'],
      ownerId: 'usr_vendor_canteen',
      businessType: 'College Canteen',
      collegeName: 'Metro Institute of Technology',
      upiId: 'campuscanteen@sbi',
      upiPayeeName: 'Campus Central Canteen'
    },
    {
      id: 'rest_5',
      name: 'Spicy Fiesta Stall #14',
      cuisine: 'Street Food & Tacos',
      address: 'Stall 14, Annual Tech Fest Grounds',
      city: 'Campus Hub',
      phone: '+91 98765 43214',
      rating: 4.8,
      ratingCount: 210,
      deliveryTime: '5-10 min',
      priceRange: '₹',
      image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
      description: 'Vibrant college fest stall serving sizzling chili cheese bites, spicy nachos, and fusion rolls.',
      tags: ['Fest Special', 'Quick Bites', 'Spicy', 'Student Run'],
      ownerId: 'usr_vendor_1',
      businessType: 'College Fest Stall',
      collegeName: 'Metro Institute of Technology',
      stallNumber: 'Stall #14',
      upiId: 'feststall14@paytm',
      upiPayeeName: 'Spicy Fiesta Stall #14'
    },
    {
      id: 'rest_fest_myfood',
      name: 'My Food',
      cuisine: 'Fest Street Food & Snacks',
      address: 'STALL#521, Annual Cultural & Tech Fest Grounds',
      city: 'Campus Hub',
      phone: '+91 98765 00521',
      rating: 5.0,
      ratingCount: 1,
      deliveryTime: '5-10 min',
      priceRange: '₹',
      image: 'https://5.imimg.com/data5/RE/TP/KK/ANDROID-15187579/img-20190703-wa0000-jpg-500x500.jpg',
      description: 'Student-run food stall serving sizzling street snacks, loaded nachos, and chilled coolers at the campus festival.',
      tags: ['Fest Special', 'Student Run', 'Quick Bites'],
      ownerId: 'usr_vendor_1',
      businessType: 'College Fest Stall',
      collegeName: 'Metro Institute of Technology',
      stallNumber: 'STALL#521',
      festTheme: 'Annual Cultural & Tech Fest',
      upiId: 'myfood521@upi',
      upiPayeeName: 'My Food Stall'
    }
  ],
  dishes: [
    {
      id: 'dish_fest_lolipop',
      restaurantId: 'rest_fest_myfood',
      restaurantName: 'My Food',
      name: 'lolipop',
      description: 'Crispy festival special lolipop, handcrafted street snack.',
      price: 10,
      image: 'https://5.imimg.com/data5/RE/TP/KK/ANDROID-15187579/img-20190703-wa0000-jpg-500x500.jpg',
      category: 'Fest Street Food & Snacks',
      cuisine: 'Fest Street Food & Snacks',
      tags: ['Fest Special', 'Student Run', 'Quick Bites'],
      dietary: ['Vegetarian'],
      rating: 5.0,
      ratingCount: 1,
      flavorProfile: ['savory', 'crispy', 'spicy'],
      spiceLevel: 2,
      remainingQty: 30,
      isSoldOut: false,
      inventoryId: 'inv_fest_lolipop'
    },
    {
      id: 'dish_1',
      restaurantId: 'rest_1',
      restaurantName: 'The Urban Patty Lab',
      name: 'Truffle Smash Cheeseburger',
      description: 'Double smash patties, molten aged cheddar, black truffle aioli, pickles, toasted brioche bun.',
      price: 189,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      category: 'Burgers',
      cuisine: 'Burgers & American',
      tags: ['Bestseller', 'Cheesy', 'Savory'],
      dietary: ['Halal'],
      rating: 4.9,
      ratingCount: 184,
      flavorProfile: ['savory', 'umami', 'cheesy'],
      spiceLevel: 0
    },
    {
      id: 'dish_2',
      restaurantId: 'rest_1',
      restaurantName: 'The Urban Patty Lab',
      name: 'Nashville Crispy Hot Chicken Burger',
      description: 'Buttermilk fried chicken dipped in cayenne glaze, cooling dill slaw, honey drizzle on sesame bun.',
      price: 159,
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
      category: 'Burgers',
      cuisine: 'Burgers & American',
      tags: ['Spicy', 'Crispy', 'Popular'],
      dietary: ['Halal'],
      rating: 4.8,
      ratingCount: 142,
      flavorProfile: ['spicy', 'crispy', 'savory'],
      spiceLevel: 2
    },
    {
      id: 'dish_3',
      restaurantId: 'rest_2',
      restaurantName: 'Forno Di Napoli',
      name: 'Margherita Verace D.O.P.',
      description: '48-hour fermented sourdough crust, San Marzano tomato sauce, fresh buffalo mozzarella, fragrant basil.',
      price: 199,
      image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
      category: 'Pizza',
      cuisine: 'Italian & Artisan Pizza',
      tags: ['Wood-Fired', 'Vegetarian', 'Classic'],
      dietary: ['Vegetarian'],
      rating: 4.9,
      ratingCount: 220,
      flavorProfile: ['savory', 'herbal', 'cheesy'],
      spiceLevel: 0
    },
    {
      id: 'dish_4',
      restaurantId: 'rest_2',
      restaurantName: 'Forno Di Napoli',
      name: 'Diavola Spianata Piccante Pizza',
      description: 'Spicy peppered toppings, Fior di Latte mozzarella, chili-infused honey, and roasted bell peppers.',
      price: 249,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      category: 'Pizza',
      cuisine: 'Italian & Artisan Pizza',
      tags: ['Spicy', 'Hot Honey', 'Signature'],
      dietary: [],
      rating: 4.8,
      ratingCount: 160,
      flavorProfile: ['spicy', 'savory', 'sweet'],
      spiceLevel: 2
    },
    {
      id: 'dish_5',
      restaurantId: 'rest_3',
      restaurantName: 'Sakura Artisanal Noodle Bar',
      name: 'Rich Tonkotsu Chashu Ramen',
      description: '18-hour slow-cooked rich broth, handcrafted noodles, seasoned egg, scallions, nori.',
      price: 220,
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      category: 'Asian & Noodles',
      cuisine: 'Asian & Noodles',
      tags: ['Comfort Food', 'Broth Master', 'Top Rated'],
      dietary: [],
      rating: 5.0,
      ratingCount: 298,
      flavorProfile: ['umami', 'savory', 'comforting'],
      spiceLevel: 0
    },
    {
      id: 'dish_6',
      restaurantId: 'rest_3',
      restaurantName: 'Sakura Artisanal Noodle Bar',
      name: 'Spicy Dan Dan Hand-Pulled Noodles',
      description: 'Wok-tossed noodles in Sichuan sesame chili broth, minced spiced filling, crushed peanuts, bok choy.',
      price: 180,
      image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
      category: 'Asian & Noodles',
      cuisine: 'Asian & Noodles',
      tags: ['Sichuan Spice', 'Handmade', 'Spicy'],
      dietary: [],
      rating: 4.9,
      ratingCount: 175,
      flavorProfile: ['spicy', 'umami', 'nutty'],
      spiceLevel: 3
    },
    {
      id: 'dish_7',
      restaurantId: 'rest_4',
      restaurantName: 'Campus Central Canteen',
      name: 'Roasted Paneer & Grain Power Bowl',
      description: 'Warm spiced quinoa, roasted tandoori paneer, black beans, avocado lime dressing, toasted pumpkin seeds.',
      price: 120,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      category: 'Healthy & Bowls',
      cuisine: 'Healthy Bowls & Snacks',
      tags: ['Student Favorite', 'High Protein', 'Vegetarian'],
      dietary: ['Vegetarian', 'Gluten-Free'],
      rating: 4.7,
      ratingCount: 140,
      flavorProfile: ['earthy', 'citrus', 'savory'],
      spiceLevel: 1
    },
    {
      id: 'dish_8',
      restaurantId: 'rest_5',
      restaurantName: 'Spicy Fiesta Stall #14',
      name: 'Cheesy Fest Nacho Supreme',
      description: 'Crispy stone-ground nachos loaded with jalapeno queso, pico de gallo, and fresh coriander dip.',
      price: 99,
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
      category: 'Mexican',
      cuisine: 'Street Food & Tacos',
      tags: ['Fest Special', 'Cheesy', 'Quick Bite'],
      dietary: ['Vegetarian'],
      rating: 4.8,
      ratingCount: 95,
      flavorProfile: ['cheesy', 'spicy', 'crispy'],
      spiceLevel: 2
    }
  ],
  inventory: [
    {
      id: 'inv_fest_lolipop',
      restaurantId: 'rest_fest_myfood',
      dishId: 'dish_fest_lolipop',
      dishName: 'lolipop',
      description: 'Crispy festival special lolipop, handcrafted street snack.',
      category: 'Fest Street Food & Snacks',
      image: 'https://5.imimg.com/data5/RE/TP/KK/ANDROID-15187579/img-20190703-wa0000-jpg-500x500.jpg',
      preparedQty: 30,
      soldQty: 0,
      reservedQty: 0,
      donationAllocatedQty: 0,
      remainingQty: 30,
      price: 10,
      cost: 4,
      surplusDiscountPrice: 5,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_1',
      restaurantId: 'rest_1',
      dishId: 'dish_1',
      dishName: 'Truffle Smash Cheeseburger',
      description: 'Double smash patties, molten aged cheddar, black truffle aioli on toasted brioche.',
      category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      preparedQty: 45,
      soldQty: 32,
      reservedQty: 5,
      remainingQty: 8,
      price: 189,
      cost: 65,
      surplusDiscountPrice: 89,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_2',
      restaurantId: 'rest_1',
      dishId: 'dish_2',
      dishName: 'Nashville Crispy Hot Chicken Burger',
      description: 'Buttermilk fried chicken dipped in cayenne glaze, cooling dill slaw.',
      category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
      preparedQty: 35,
      soldQty: 29,
      reservedQty: 3,
      remainingQty: 3,
      price: 159,
      cost: 55,
      surplusDiscountPrice: 75,
      isSurplusEligible: true,
      isDonationEligible: false,
      status: 'low_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_3',
      restaurantId: 'rest_2',
      dishId: 'dish_3',
      dishName: 'Margherita Verace D.O.P.',
      description: '48-hour fermented sourdough crust, San Marzano tomato sauce, fresh buffalo mozzarella.',
      category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
      preparedQty: 50,
      soldQty: 38,
      reservedQty: 6,
      remainingQty: 6,
      price: 199,
      cost: 60,
      surplusDiscountPrice: 95,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_4',
      restaurantId: 'rest_2',
      dishId: 'dish_4',
      dishName: 'Diavola Spianata Piccante Pizza',
      description: 'Spicy peppered toppings, Fior di Latte mozzarella, chili-infused honey.',
      category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      preparedQty: 30,
      soldQty: 25,
      reservedQty: 4,
      remainingQty: 1,
      price: 249,
      cost: 75,
      surplusDiscountPrice: 119,
      isSurplusEligible: true,
      isDonationEligible: false,
      status: 'low_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_5',
      restaurantId: 'rest_4',
      dishId: 'dish_7',
      dishName: 'Roasted Paneer & Grain Power Bowl',
      description: 'Warm spiced quinoa, roasted tandoori paneer, black beans, avocado dressing.',
      category: 'Healthy & Bowls',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      preparedQty: 40,
      soldQty: 28,
      reservedQty: 5,
      remainingQty: 7,
      price: 120,
      cost: 45,
      surplusDiscountPrice: 59,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_6',
      restaurantId: 'rest_5',
      dishId: 'dish_8',
      dishName: 'Cheesy Fest Nacho Supreme',
      description: 'Crispy stone-ground nachos loaded with jalapeno queso, pico de gallo.',
      category: 'Mexican',
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
      preparedQty: 60,
      soldQty: 48,
      reservedQty: 8,
      remainingQty: 4,
      price: 99,
      cost: 35,
      surplusDiscountPrice: 49,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_7',
      restaurantId: 'rest_3',
      dishId: 'dish_5',
      dishName: 'Rich Tonkotsu Chashu Ramen',
      description: '18-hour slow-cooked rich broth, handcrafted noodles, seasoned egg, scallions, nori.',
      category: 'Asian & Noodles',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      preparedQty: 30,
      soldQty: 15,
      reservedQty: 0,
      remainingQty: 15,
      price: 220,
      cost: 85,
      surplusDiscountPrice: 119,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv_8',
      restaurantId: 'rest_3',
      dishId: 'dish_6',
      dishName: 'Spicy Dan Dan Hand-Pulled Noodles',
      description: 'Wok-tossed noodles in Sichuan sesame chili broth, minced spiced filling, crushed peanuts, bok choy.',
      category: 'Asian & Noodles',
      image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
      preparedQty: 25,
      soldQty: 15,
      reservedQty: 0,
      remainingQty: 10,
      price: 180,
      cost: 70,
      surplusDiscountPrice: 99,
      isSurplusEligible: true,
      isDonationEligible: true,
      status: 'in_stock',
      updatedAt: new Date().toISOString()
    }
  ],
  surplusOffers: [
    {
      id: 'surplus_1',
      restaurantId: 'rest_1',
      restaurantName: 'The Urban Patty Lab',
      restaurantAddress: '422 Innovation Way, University Avenue',
      dishId: 'dish_1',
      title: 'Truffle Smash Cheeseburger Surplus Meal Box',
      description: 'Fresh evening batch crafted before peak dinner rush. Complete burger with golden sea salt fries.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      originalPrice: 189,
      discountPrice: 89,
      discountPercentage: 53,
      availableQuantity: 4,
      pickupStart: '20:00',
      pickupEnd: '22:30',
      status: 'active',
      dietary: ['Halal'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'surplus_2',
      restaurantId: 'rest_2',
      restaurantName: 'Forno Di Napoli',
      restaurantAddress: '88 Piazza Bella, Arts Quarter',
      dishId: 'dish_3',
      title: 'Artisan Margherita Sourdough Whole Pizza',
      description: 'Wood-fired to perfection. Baked fresh today, perfect for quick reheat or immediate feast.',
      image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
      originalPrice: 199,
      discountPrice: 89,
      discountPercentage: 55,
      availableQuantity: 5,
      pickupStart: '20:30',
      pickupEnd: '22:00',
      status: 'active',
      dietary: ['Vegetarian'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'surplus_3',
      restaurantId: 'rest_4',
      restaurantName: 'Campus Central Canteen',
      restaurantAddress: 'Block A, North Campus Plaza',
      dishId: 'dish_7',
      title: 'Nutritious Grain & Paneer Bowl Meal Box',
      description: 'Wholesome student evening special. High protein and ready for quick pickup.',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      originalPrice: 120,
      discountPrice: 59,
      discountPercentage: 51,
      availableQuantity: 5,
      pickupStart: '18:30',
      pickupEnd: '21:00',
      status: 'active',
      dietary: ['Vegetarian', 'Gluten-Free'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'surplus_4',
      restaurantId: 'rest_5',
      restaurantName: 'Spicy Fiesta Stall #14',
      restaurantAddress: 'Stall 14, Annual Tech Fest Grounds',
      dishId: 'dish_8',
      title: 'Fest Nacho Supreme Snack Box',
      description: 'Hot melted queso and crispy nachos prepared before fest evening event.',
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
      originalPrice: 99,
      discountPrice: 49,
      discountPercentage: 51,
      availableQuantity: 4,
      pickupStart: '19:00',
      pickupEnd: '22:00',
      status: 'active',
      dietary: ['Vegetarian'],
      createdAt: new Date().toISOString()
    }
  ],
  reservations: [
    {
      id: 'res_1',
      voucherCode: 'TST-7921',
      userId: 'usr_customer_1',
      userName: 'Alex Rivera',
      surplusOfferId: 'surplus_1',
      restaurantName: 'The Urban Patty Lab',
      restaurantAddress: '422 Innovation Way, University Avenue',
      dishTitle: 'Truffle Smash Cheeseburger Surplus Meal Box',
      quantity: 1,
      totalPrice: 89,
      pickupEnd: '22:30',
      status: 'reserved',
      reservedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  donations: [
    {
      id: 'don_1',
      restaurantId: 'rest_2',
      restaurantName: 'Forno Di Napoli',
      restaurantAddress: '88 Piazza Bella, Arts Quarter',
      pickupLocation: 'Kitchen dispatch alley, 88 Piazza Bella',
      prepTime: 'Today 17:30',
      dishName: 'Fresh Baked Sourdough Focaccia & Pizzas',
      description: '12 portions of fresh artisanal bread and Margherita cuts securely boxed in thermal packaging.',
      quantityPortions: 12,
      initialQuantity: 12,
      availableQuantity: 12,
      allocatedQuantity: 0,
      collectedQuantity: 0,
      handlingNotes: 'Stored at 3°C, hygienic containers. Contains dairy & gluten.',
      confirmedSuitable: true,
      dietaryInfo: ['Vegetarian'],
      pickupDeadline: 'Today before 23:00',
      status: 'available',
      requestsCount: 0,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'don_2',
      restaurantId: 'rest_4',
      restaurantName: 'Campus Central Canteen',
      restaurantAddress: 'Block A, North Campus Plaza',
      pickupLocation: 'Campus Central Canteen dispatch counter, Block A',
      prepTime: 'Today 16:45',
      dishName: 'Fresh Veggie & Dal Meal Packs',
      description: '15 hearty nutritious meal trays with lentils, rice, and steamed vegetables.',
      quantityPortions: 15,
      initialQuantity: 15,
      availableQuantity: 0,
      allocatedQuantity: 15,
      collectedQuantity: 0,
      handlingNotes: 'Nutritious vegetarian trays, sealed lids.',
      confirmedSuitable: true,
      dietaryInfo: ['Vegetarian'],
      pickupDeadline: 'Today before 21:30',
      status: 'approved',
      claimedByNGOId: 'ngo_1',
      claimedByNGOName: 'City Food Rescue Alliance',
      claimedByVolunteerName: 'Sarah Jenkins',
      claimedAt: new Date(Date.now() - 7200000).toISOString(),
      notes: 'Volunteer arriving with thermal insulated carrier at 20:30',
      requestsCount: 1,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'don_3',
      restaurantId: 'rest_5',
      restaurantName: 'Spicy Fiesta Stall #14',
      restaurantAddress: 'Stall 14, Annual Tech Fest Grounds',
      pickupLocation: 'Stall 14, Annual Tech Fest Grounds',
      prepTime: 'Yesterday 18:00',
      dishName: 'Fest Snack Packs for Community Shelter',
      description: '10 portions of fresh rolls and snacks packaged safely.',
      quantityPortions: 10,
      initialQuantity: 10,
      availableQuantity: 0,
      allocatedQuantity: 0,
      collectedQuantity: 10,
      handlingNotes: 'Insulated snack packs, hygienically prepared.',
      confirmedSuitable: true,
      dietaryInfo: ['Vegetarian'],
      pickupDeadline: 'Yesterday 22:00',
      status: 'collected',
      claimedByNGOId: 'ngo_1',
      claimedByNGOName: 'City Food Rescue Alliance',
      claimedByVolunteerName: 'Arjun Verma',
      claimedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 82800000).toISOString(),
      notes: 'Delivered to university shelter dining. Verified.',
      requestsCount: 1,
      createdAt: new Date(Date.now() - 90000000).toISOString(),
      updatedAt: new Date(Date.now() - 82800000).toISOString()
    }
  ],
  donationRequests: [
    {
      id: 'dreq_1',
      donationId: 'don_2',
      restaurantId: 'rest_4',
      restaurantName: 'Campus Central Canteen',
      dishName: 'Fresh Veggie & Dal Meal Packs',
      pickupLocation: 'Campus Central Canteen dispatch counter, Block A',
      pickupDeadline: 'Today before 21:30',
      ngoId: 'ngo_1',
      ngoName: 'City Food Rescue Alliance',
      volunteerName: 'Sarah Jenkins',
      volunteerPhone: '+91 98765 11223',
      requestedQuantity: 15,
      status: 'approved',
      notes: 'Volunteer arriving with thermal insulated carrier at 20:30',
      handlingNotes: 'Nutritious vegetarian trays, sealed lids.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      approvedAt: new Date(Date.now() - 5400000).toISOString()
    },
    {
      id: 'dreq_2',
      donationId: 'don_3',
      restaurantId: 'rest_5',
      restaurantName: 'Spicy Fiesta Stall #14',
      dishName: 'Fest Snack Packs for Community Shelter',
      pickupLocation: 'Stall 14, Annual Tech Fest Grounds',
      pickupDeadline: 'Yesterday 22:00',
      ngoId: 'ngo_1',
      ngoName: 'City Food Rescue Alliance',
      volunteerName: 'Arjun Verma',
      volunteerPhone: '+91 98765 44332',
      requestedQuantity: 10,
      status: 'collected',
      notes: 'Delivered to university shelter dining. Verified.',
      handlingNotes: 'Insulated snack packs, hygienically prepared.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 84000000).toISOString(),
      collectedAt: new Date(Date.now() - 82800000).toISOString()
    }
  ],
  ratings: [
    {
      id: 'rat_1',
      userId: 'usr_customer_1',
      userName: 'Alex Rivera',
      dishId: 'dish_5',
      dishName: 'Rich Tonkotsu Chashu Ramen',
      restaurantId: 'rest_3',
      rating: 5,
      reviewText: 'Hands down the best broth in the city. Noodles have ideal al dente chew, perfectly rich!',
      tasteTags: ['Savory', 'Umami', 'Deep Broth', 'Tender Meat'],
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'rat_2',
      userId: 'usr_customer_1',
      userName: 'Alex Rivera',
      dishId: 'dish_1',
      dishName: 'Truffle Smash Cheeseburger',
      restaurantId: 'rest_1',
      rating: 5,
      reviewText: 'Crisp lacy edges on the patties and that truffle sauce is addictive. Great portion size.',
      tasteTags: ['Crispy Edges', 'Cheesy', 'Savory Truffle'],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  verifications: [
    {
      id: 'verif_1',
      organizationId: 'rest_2',
      organizationName: 'Forno Di Napoli',
      entityType: 'restaurant',
      applicantName: 'Chef Marco Valenti',
      email: 'marco@forno.local',
      phone: '+91 98765 22001',
      licenseNumber: 'FSSAI-112233445566',
      status: 'verified',
      submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      reviewedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      notes: 'Passed hygiene standards and municipal food business verification.'
    },
    {
      id: 'verif_2',
      organizationId: 'ngo_1',
      organizationName: 'City Food Rescue Alliance',
      entityType: 'ngo',
      applicantName: 'Sarah Jenkins',
      email: 'sarah@foodrescue.local',
      phone: '+91 98765 99887',
      licenseNumber: 'NGO-DARPAN-DL/2023/00192',
      status: 'verified',
      submittedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      reviewedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      notes: 'Verified 80G non-profit certification and refrigerated rescue vehicle protocol.'
    },
    {
      id: 'verif_3',
      organizationId: 'rest_5',
      organizationName: 'Spicy Fiesta Stall #14',
      entityType: 'fest_stall',
      applicantName: 'Carlos Gomez',
      email: 'feststall14@campus.local',
      phone: '+91 98765 77665',
      licenseNumber: 'CAMPUS-FEST-STALL-14',
      status: 'pending',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      notes: 'Student council fest food committee safety review underway.'
    },
    {
      id: 'verif_4',
      organizationId: 'ngo_relief',
      organizationName: 'Youth Campus Hunger Action',
      entityType: 'ngo',
      applicantName: 'Priya Mehta',
      email: 'relief@youthhunger.org',
      phone: '+91 98765 33441',
      licenseNumber: 'NGO-VOLUNTEER-REG-4412',
      status: 'pending',
      submittedAt: new Date(Date.now() - 43200000).toISOString(),
      notes: 'Submitted evening shelter distribution permit.'
    }
  ],
  reports: [
    {
      id: 'rep_1',
      reportedBy: 'usr_customer_1',
      reporterName: 'Alex Rivera',
      targetType: 'stall',
      targetId: 'rest_5',
      targetTitle: 'Spicy Fiesta Stall #14',
      reason: 'Fest stall menu allergy indicator missing - dish contains peanuts without warning.',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'rep_2',
      reportedBy: 'usr_ngo_1',
      reporterName: 'Sarah Jenkins',
      targetType: 'donation',
      targetId: 'don_2',
      targetTitle: 'Campus Central Canteen Meal Packs',
      reason: 'Pickup timing coordination - canteen closed 15 mins ahead of pickup schedule.',
      status: 'resolved',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      resolutionNotes: 'Contacted canteen manager Ramesh; updated evening pickup buffer window.'
    }
  ],
  orders: []
};

// Helper to ensure an Order in db.orders exists and is linked for each surplus reservation
function ensureOrderForReservation(db: TastelyDB, reservation: Reservation): Order {
  if (!db.orders) db.orders = [];
  const existing = db.orders.find(o => 
    (o.voucherCode && o.voucherCode.toUpperCase() === reservation.voucherCode.toUpperCase()) ||
    (o.reservationId && o.reservationId === reservation.id) ||
    ((reservation as any).orderId && o.id === (reservation as any).orderId)
  );

  if (existing) {
    if (!existing.reservationId) existing.reservationId = reservation.id;
    if (!existing.voucherCode) existing.voucherCode = reservation.voucherCode;
    if (!existing.orderType) existing.orderType = 'surplus_pickup';
    (reservation as any).orderId = existing.id;
    return existing;
  }

  const offer = (db.surplusOffers || []).find(o => o.id === reservation.surplusOfferId);
  const rest = (db.restaurants || []).find(r => 
    (offer && r.id === offer.restaurantId) || 
    r.name === reservation.restaurantName
  );
  const customer = (db.users || []).find(u => u.id === reservation.userId);

  const orderId = `ord_surplus_${reservation.id}`;
  const orderNumber = `ORD-S-${reservation.voucherCode.replace('TST-', '')}`;
  const orderTotal = reservation.totalPrice || (offer ? offer.discountPrice * reservation.quantity : 0);
  const originalSubtotal = offer ? offer.originalPrice * reservation.quantity : orderTotal;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    userId: reservation.userId,
    customerName: reservation.userName || customer?.name || 'Campus Diner',
    customerEmail: customer?.email || 'customer@tastely.local',
    customerPhone: (customer as any)?.phone || '+91 98765 00000',
    restaurantId: rest?.id || offer?.restaurantId || 'rest_1',
    restaurantName: reservation.restaurantName || rest?.name || 'Local Kitchen',
    restaurantAddress: reservation.restaurantAddress || rest?.address || 'Campus Hub',
    businessType: rest?.businessType || 'Restaurant',
    items: [
      {
        dishId: offer?.dishId || 'dish_surplus',
        dishName: reservation.dishTitle,
        image: offer?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        price: reservation.quantity > 0 ? Math.round(orderTotal / reservation.quantity) : orderTotal,
        quantity: reservation.quantity || 1,
        itemTotal: orderTotal,
        category: 'Surplus Food Rescue',
        specialInstructions: `Surplus Voucher: ${reservation.voucherCode}`
      }
    ],
    subtotal: originalSubtotal,
    discount: Math.max(0, originalSubtotal - orderTotal),
    totalAmount: orderTotal,
    paymentMethod: 'pay_on_pickup',
    paymentStatus: reservation.status === 'picked_up' ? 'paid' : 'pay_on_pickup',
    orderStatus: reservation.status === 'picked_up' ? 'completed' : reservation.status === 'cancelled' ? 'cancelled' : 'ready_for_pickup',
    pickupNotes: `Food Rescue Voucher: ${reservation.voucherCode} (Pickup deadline: Today before ${reservation.pickupEnd})`,
    estimatedPrepTime: 'Ready for Pickup (Surplus Meal)',
    createdAt: reservation.reservedAt || new Date().toISOString(),
    updatedAt: reservation.pickedUpAt || reservation.reservedAt || new Date().toISOString(),
    voucherCode: reservation.voucherCode,
    reservationId: reservation.id,
    orderType: 'surplus_pickup',
    ...(reservation.pickedUpAt ? { completedAt: reservation.pickedUpAt } : {})
  };

  db.orders.unshift(newOrder);
  (reservation as any).orderId = orderId;
  return newOrder;
}

// Database Read & Write helpers with atomic writing to disk
function readDB(): TastelyDB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data) as TastelyDB;
    if (!parsed.verifications) parsed.verifications = INITIAL_DB.verifications;
    if (!parsed.reports) parsed.reports = INITIAL_DB.reports;
    if (!parsed.orders) parsed.orders = [];
    if (!parsed.donationRequests) parsed.donationRequests = INITIAL_DB.donationRequests || [];
    if (!parsed.friendRequests) parsed.friendRequests = [];
    if (!parsed.messages) parsed.messages = [];

    let dbNeedsSave = false;

    // Synchronize orders for all surplus reservations so they appear in Orders section
    if (parsed.reservations && parsed.reservations.length > 0) {
      if (!parsed.orders) parsed.orders = [];
      const ordersBeforeCount = parsed.orders.length;
      for (const resItem of parsed.reservations) {
        ensureOrderForReservation(parsed, resItem);
      }
      if (parsed.orders.length !== ordersBeforeCount) {
        dbNeedsSave = true;
      }
    }

    // Prune fabricated seed user usr_twin_1 ('NoodleNirvana') and its reviews if present
    if (parsed.users) {
      const prevUsersLen = parsed.users.length;
      parsed.users = parsed.users.filter(u => u.id !== 'usr_twin_1' && u.email !== 'maya@tastely.local');
      if (parsed.users.length !== prevUsersLen) dbNeedsSave = true;
    }
    if (parsed.ratings) {
      const prevRatingsLen = parsed.ratings.length;
      parsed.ratings = parsed.ratings.filter(r => r.userId !== 'usr_twin_1');
      if (parsed.ratings.length !== prevRatingsLen) dbNeedsSave = true;
    }

    if (parsed.donations) {
      parsed.donations.forEach(d => {
        if (d.initialQuantity === undefined) {
          d.initialQuantity = d.quantityPortions || 10;
          d.availableQuantity = d.status === 'available' ? (d.quantityPortions || 10) : 0;
          d.allocatedQuantity = (d.status === 'claimed' || d.status === 'requested' || d.status === 'approved') ? (d.quantityPortions || 10) : 0;
          d.collectedQuantity = (d.status === 'completed' || d.status === 'collected') ? (d.quantityPortions || 10) : 0;
        }
        if (!d.pickupLocation) d.pickupLocation = d.restaurantAddress || 'Main kitchen counter';
        if (d.confirmedSuitable === undefined) d.confirmedSuitable = true;
      });
    }

    if (!parsed.restaurants) {
      parsed.restaurants = [...INITIAL_DB.restaurants, ...ENRICHED_RESTAURANTS];
      dbNeedsSave = true;
    } else {
      const existingRestIds = new Set(parsed.restaurants.map(r => r.id));
      for (const enrichedRest of ENRICHED_RESTAURANTS) {
        if (!existingRestIds.has(enrichedRest.id)) {
          parsed.restaurants.push({ ...enrichedRest });
          existingRestIds.add(enrichedRest.id);
          dbNeedsSave = true;
        }
      }
      parsed.restaurants.forEach(r => {
        if (!r.upiId) {
          const match = [...INITIAL_DB.restaurants, ...ENRICHED_RESTAURANTS].find(ir => ir.id === r.id);
          r.upiId = match?.upiId || `${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`;
          r.upiPayeeName = match?.upiPayeeName || r.name;
          dbNeedsSave = true;
        }
      });
    }

    if (!parsed.dishes) {
      parsed.dishes = [...INITIAL_DB.dishes, ...ENRICHED_DISHES];
      dbNeedsSave = true;
    } else {
      const existingDishIds = new Set(parsed.dishes.map(d => d.id));
      for (const enrichedDish of ENRICHED_DISHES) {
        if (!existingDishIds.has(enrichedDish.id)) {
          parsed.dishes.push({ ...enrichedDish });
          existingDishIds.add(enrichedDish.id);
          dbNeedsSave = true;
        }
      }
      // Ensure vegetarian flag is populated
      parsed.dishes.forEach(d => {
        if (d.isVegetarian === undefined) {
          const enrichedMatch = ENRICHED_DISHES.find(ed => ed.id === d.id);
          if (enrichedMatch && enrichedMatch.isVegetarian !== undefined) {
            d.isVegetarian = enrichedMatch.isVegetarian;
            dbNeedsSave = true;
          } else if (d.dietary?.includes('Vegetarian') || d.dietary?.includes('Vegan')) {
            d.isVegetarian = true;
            dbNeedsSave = true;
          } else {
            d.isVegetarian = false;
            dbNeedsSave = true;
          }
        }
      });
    }

    if (!parsed.inventory) {
      parsed.inventory = [...INITIAL_DB.inventory, ...ENRICHED_INVENTORY];
      dbNeedsSave = true;
    } else {
      const existingDishIds = new Set(parsed.inventory.map(i => i.dishId));
      for (const initialItem of [...INITIAL_DB.inventory, ...ENRICHED_INVENTORY]) {
        if (!existingDishIds.has(initialItem.dishId)) {
          parsed.inventory.push({ ...initialItem });
          existingDishIds.add(initialItem.dishId);
          dbNeedsSave = true;
        }
      }
    }

    if (dbNeedsSave) {
      try {
        const tempFile = `${DB_FILE}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(parsed, null, 2), 'utf-8');
        fs.renameSync(tempFile, DB_FILE);
      } catch (writeErr) {
        console.error('Error persisting backfilled data in readDB:', writeErr);
      }
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, restoring initial seed:', err);
    return INITIAL_DB;
  }
}

function writeDB(data: TastelyDB) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing DB:', err);
    throw err;
  }
}

// Initialize database if missing
readDB();

// Build Express Application
const app = express();
app.use(express.json({ limit: '10mb' }));

// Auth & Session Helper
function getUserFromHeader(req: Request): User | null {
  const db = readDB();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = authHeader.substring(7).trim();
    const user = db.users.find(u => u.id === userId);
    if (user) return user;
  }
  const xUserId = req.headers['x-user-id'];
  if (typeof xUserId === 'string' && xUserId.trim()) {
    const user = db.users.find(u => u.id === xUserId.trim());
    if (user) return user;
  }
  return null;
}

function getActiveUser(req: Request): User {
  const user = getUserFromHeader(req);
  if (user) return user;
  const db = readDB();
  return db.users[0]; // fallback to demo customer
}

// Role-Based Authorization Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ 
      error: 'Authentication required. Please sign in to perform this action.',
      code: 'UNAUTHENTICATED'
    });
  }
  next();
}

function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getUserFromHeader(req);
    if (!user) {
      return res.status(401).json({ 
        error: `Authentication required. This action requires ${allowedRoles.join(' or ')} privileges.`,
        code: 'UNAUTHENTICATED'
      });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: `Access denied. This action requires ${allowedRoles.join(' or ')} privileges. Your current role is '${user.role}'.`,
        code: 'FORBIDDEN_ROLE',
        requiredRoles: allowedRoles,
        currentRole: user.role
      });
    }
    next();
  };
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Auth & System Status
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getUserFromHeader(req);
  res.json({ user });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password' });
  }

  const db = readDB();
  const normalizedEmail = email.toLowerCase().trim();
  let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    // Check aliases
    if (normalizedEmail.includes('marco')) user = db.users.find(u => u.email === 'marco@forno.local');
    else if (normalizedEmail.includes('alex')) user = db.users.find(u => u.email === 'alex@tastely.local');
    else if (normalizedEmail.includes('sarah')) user = db.users.find(u => u.email === 'sarah@foodrescue.local');
    else if (normalizedEmail.includes('admin')) user = db.users.find(u => u.email === 'admin@tastely.local');
  }

  if (!user) {
    return res.status(401).json({ error: 'No account registered with this email address' });
  }

  if (user.passwordHash && user.salt) {
    const computed = hashPassword(password, user.salt);
    if (computed !== user.passwordHash) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  } else {
    // Demo accounts accept password123 or admin123
    if (password !== 'password123' && password !== 'admin123' && password !== 'demo123') {
      return res.status(401).json({ error: 'Incorrect password. (For demo accounts, use: password123)' });
    }
  }

  res.json({ user, token: user.id });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/system/storage-status', (_req: Request, res: Response) => {
  res.json({
    status: 'connected',
    storageEngine: 'Persistent Disk JSON with Atomic Temp-Rename Lock',
    dbFilePath: DB_FILE,
    persisted: true,
    lastSynced: new Date().toISOString()
  });
});

app.post('/api/auth/switch-demo', (req: Request, res: Response) => {
  const { role } = req.body;
  const db = readDB();
  const targetUser = db.users.find(u => u.role === role);
  if (!targetUser) {
    return res.status(404).json({ error: `No demo user found for role ${role}` });
  }
  res.json({ user: targetUser, token: targetUser.id });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { 
    name, email, password, confirmPassword, role, 
    dietaryRestrictions, favoriteCuisines, spiceTolerance, 
    businessType, organizationName, collegeName, stallNumber, festTheme 
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Full name and email address are required' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Password confirmation does not match' });
  }

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUserId = `usr_${Date.now()}`;
  let organizationId = undefined;

  // If vendor, create their restaurant / stall profile
  if (role === 'vendor') {
    organizationId = `rest_${Date.now()}`;
    const newRestaurant: Restaurant = {
      id: organizationId,
      name: organizationName || (businessType === 'College Fest Stall' ? `${name}'s Fest Stall` : `${name}'s Kitchen`),
      cuisine: 'Multi-Cuisine',
      address: businessType === 'College Fest Stall' ? `${stallNumber || 'Stall #1'}, Campus Fest Grounds` : 'Campus Road',
      city: 'Campus Hub',
      phone: '+91 98765 00000',
      rating: 5.0,
      ratingCount: 1,
      deliveryTime: '10-15 min',
      priceRange: '₹',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      description: `Fresh food crafted with care by ${name}.`,
      tags: ['Fresh Daily', businessType || 'Restaurant'],
      ownerId: newUserId,
      businessType: businessType || 'Restaurant',
      collegeName: collegeName || 'Metro Institute of Technology',
      stallNumber: stallNumber || 'Stall #1',
      festTheme: festTheme || 'Annual Cultural & Tech Fest'
    };
    db.restaurants.push(newRestaurant);
  }

  const newUser: User = {
    id: newUserId,
    name,
    email: email.trim(),
    role: role || 'customer',
    organizationId,
    passwordHash,
    salt,
    avatar: `https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=200&q=80`,
    tasteProfile: {
      favoriteCuisines: favoriteCuisines || ['Burgers', 'Italian & Pizza'],
      dietaryRestrictions: dietaryRestrictions || [],
      spiceTolerance: spiceTolerance || 'medium',
      flavorPreferences: ['savory', 'crispy'],
      isTasteTwinDiscoverable: true,
      tasteTwinAlias: name.split(' ')[0] + '_Foodie'
    }
  };

  db.users.push(newUser);
  writeDB(db);
  res.status(201).json({ user: newUser, token: newUser.id });
});

app.put('/api/auth/taste-profile', (req: Request, res: Response) => {
  const user = getUserFromHeader(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in to update your taste profile.' });
  }

  const {
    flavorPreferences,
    texturePreferences,
    favoriteCuisines,
    dietaryRestrictions,
    spiceTolerance,
    isTasteTwinDiscoverable,
    tasteTwinAlias,
    allowFriendRequests,
    allowDirectMessages,
    showFlavorPreferences,
    showTexturePreferences,
    showSpiceTolerance
  } = req.body;

  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found in database.' });
  }

  const existingProfile = db.users[userIndex].tasteProfile || {
    favoriteCuisines: [],
    dietaryRestrictions: [],
    spiceTolerance: 'medium',
    flavorPreferences: [],
    texturePreferences: [],
    isTasteTwinDiscoverable: true
  };

  const updatedProfile: TasteProfile = {
    ...existingProfile,
    favoriteCuisines: Array.isArray(favoriteCuisines) ? favoriteCuisines : existingProfile.favoriteCuisines,
    dietaryRestrictions: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : existingProfile.dietaryRestrictions,
    spiceTolerance: spiceTolerance ? spiceTolerance : existingProfile.spiceTolerance,
    flavorPreferences: Array.isArray(flavorPreferences) ? flavorPreferences : existingProfile.flavorPreferences,
    texturePreferences: Array.isArray(texturePreferences) ? texturePreferences : (existingProfile.texturePreferences || []),
    isTasteTwinDiscoverable: typeof isTasteTwinDiscoverable === 'boolean' ? isTasteTwinDiscoverable : existingProfile.isTasteTwinDiscoverable,
    tasteTwinAlias: tasteTwinAlias !== undefined ? String(tasteTwinAlias).trim() : existingProfile.tasteTwinAlias,
    allowFriendRequests: typeof allowFriendRequests === 'boolean' ? allowFriendRequests : (existingProfile.allowFriendRequests ?? true),
    allowDirectMessages: typeof allowDirectMessages === 'boolean' ? allowDirectMessages : (existingProfile.allowDirectMessages ?? true),
    showFlavorPreferences: typeof showFlavorPreferences === 'boolean' ? showFlavorPreferences : (existingProfile.showFlavorPreferences ?? true),
    showTexturePreferences: typeof showTexturePreferences === 'boolean' ? showTexturePreferences : (existingProfile.showTexturePreferences ?? true),
    showSpiceTolerance: typeof showSpiceTolerance === 'boolean' ? showSpiceTolerance : (existingProfile.showSpiceTolerance ?? true)
  };

  db.users[userIndex].tasteProfile = updatedProfile;
  writeDB(db);

  res.json({
    success: true,
    user: db.users[userIndex],
    tasteProfile: updatedProfile,
    message: 'Taste profile updated and persisted successfully'
  });
});


// 2. College Fest Stall Hub Endpoint
app.get('/api/stalls', (_req: Request, res: Response) => {
  const db = readDB();
  const festStalls = db.restaurants.filter(r => r.businessType === 'College Fest Stall');
  
  const stallsWithItems = festStalls.map(stall => {
    const stallDishes = db.dishes.filter(d => 
      d.restaurantId === stall.id || 
      (stall.stallNumber && d.restaurantId === stall.stallNumber) ||
      (d.restaurantName && d.restaurantName.toLowerCase() === stall.name.toLowerCase())
    );
    const stallInventory = db.inventory.filter(i => 
      i.restaurantId === stall.id || 
      (stall.stallNumber && i.restaurantId === stall.stallNumber)
    );

    const itemsMap = new Map<string, any>();
    stallDishes.forEach(dish => {
      const inv = stallInventory.find(i => 
        i.dishId === dish.id || 
        i.dishName.trim().toLowerCase() === dish.name.trim().toLowerCase()
      );
      const rem = inv ? inv.remainingQty : (dish.remainingQty !== undefined ? dish.remainingQty : 15);
      const prep = inv ? inv.preparedQty : ((dish as any).preparedQty || 25);
      const sold = inv ? inv.soldQty : 0;
      const effectiveCategory = (dish.category && dish.category !== 'Mexican')
        ? dish.category
        : (stall.cuisine || 'Fest Street Food & Snacks');

      itemsMap.set(dish.name.trim().toLowerCase(), {
        ...dish,
        restaurantId: stall.id,
        restaurantName: stall.name,
        category: effectiveCategory,
        cuisine: dish.cuisine || stall.cuisine,
        remainingQty: rem,
        preparedQty: prep,
        soldQty: sold,
        isSoldOut: rem <= 0
      });
    });

    stallInventory.forEach(inv => {
      const key = inv.dishName.trim().toLowerCase();
      if (!itemsMap.has(key)) {
        const effectiveCategory = (inv.category && inv.category !== 'Mexican')
          ? inv.category
          : (stall.cuisine || 'Fest Street Food & Snacks');
        itemsMap.set(key, {
          id: inv.dishId || `dish_${inv.id}`,
          restaurantId: stall.id,
          restaurantName: stall.name,
          name: inv.dishName,
          batchIdentifier: inv.batchIdentifier,
          description: inv.description || `${inv.dishName} freshly prepared at ${stall.name}`,
          price: inv.price,
          image: inv.image || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
          category: effectiveCategory,
          cuisine: stall.cuisine,
          tags: ['Fest Special', 'Freshly Prepared'],
          dietary: [],
          rating: 5.0,
          ratingCount: 1,
          flavorProfile: ['savory', 'crispy'],
          spiceLevel: 1,
          remainingQty: inv.remainingQty,
          preparedQty: inv.preparedQty,
          soldQty: inv.soldQty,
          isSoldOut: inv.remainingQty <= 0
        });
      }
    });

    return {
      ...stall,
      items: Array.from(itemsMap.values())
    };
  });

  res.json({ stalls: stallsWithItems });
});

app.post('/api/stalls', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { name, collegeName, stallNumber, festTheme, cuisine, description, image } = req.body;
  if (!name || !collegeName) {
    return res.status(400).json({ error: 'Stall name and college/university name are required' });
  }

  const db = readDB();
  const stallId = `rest_fest_${Date.now()}`;
  const newStall: Restaurant = {
    id: stallId,
    name: name.trim(),
    cuisine: cuisine || 'Fest Street Food',
    address: `${stallNumber || 'Stall #1'}, ${festTheme || 'Campus Fest'} Grounds`,
    city: 'Campus Hub',
    phone: '+91 98765 00000',
    rating: 5.0,
    ratingCount: 1,
    deliveryTime: '5-10 min',
    priceRange: '₹',
    image: image || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
    description: description || `Student-run fest stall at ${collegeName}.`,
    tags: ['Fest Special', 'Student Run', 'Quick Bites'],
    ownerId: user.id,
    businessType: 'College Fest Stall',
    collegeName: collegeName.trim(),
    stallNumber: stallNumber || 'Stall #1',
    festTheme: festTheme || 'Annual Cultural & Tech Fest'
  };

  db.restaurants.push(newStall);
  writeDB(db);
  res.status(201).json({ success: true, stall: newStall });
});

// Update Existing Stall (Edit Stall)
const handleUpdateStall = (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { 
    name, 
    collegeName, 
    stallNumber, 
    festTheme, 
    cuisine, 
    description, 
    image, 
    deliveryTime, 
    upiId, 
    upiPayeeName 
  } = req.body;

  const db = readDB();
  const stallIndex = db.restaurants.findIndex(r => 
    r.id === id || 
    r.stallNumber === id || 
    (r.stallNumber && r.stallNumber.toLowerCase() === id.toLowerCase()) ||
    r.name.toLowerCase() === id.toLowerCase()
  );
  if (stallIndex === -1) {
    return res.status(404).json({ error: 'Stall not found' });
  }

  const stall = db.restaurants[stallIndex];

  // Authorization check: Only authorized stall owner or system admin
  const isOwner = stall.ownerId === user.id || user.organizationId === stall.id || !stall.ownerId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: You are only permitted to edit stalls you own or manage.' });
  }

  // Validation
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ error: 'Stall name cannot be empty.' });
  }
  if (collegeName !== undefined && (typeof collegeName !== 'string' || !collegeName.trim())) {
    return res.status(400).json({ error: 'College/university name cannot be empty.' });
  }

  // Update existing record in place (Do not create a duplicate stall)
  if (name !== undefined) stall.name = name.trim();
  if (collegeName !== undefined) stall.collegeName = collegeName.trim();
  if (stallNumber !== undefined) stall.stallNumber = stallNumber.trim();
  if (festTheme !== undefined) stall.festTheme = festTheme.trim();
  if (cuisine !== undefined) stall.cuisine = cuisine.trim();
  if (description !== undefined) stall.description = description.trim();
  if (deliveryTime !== undefined) stall.deliveryTime = deliveryTime.trim();
  if (upiId !== undefined) stall.upiId = upiId.trim();
  if (upiPayeeName !== undefined) stall.upiPayeeName = upiPayeeName.trim();
  if (image !== undefined) {
    const trimmedImg = typeof image === 'string' ? image.trim() : '';
    stall.image = trimmedImg || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';
  }

  // Update address
  stall.address = `${stall.stallNumber || 'Stall #1'}, ${stall.festTheme || 'Campus Fest'} Grounds`;

  // Sync restaurantName on dishes belonging to this stall if name changed
  if (name !== undefined) {
    db.dishes.forEach(d => {
      if (d.restaurantId === stall.id || (stall.stallNumber && d.restaurantId === stall.stallNumber)) {
        d.restaurantName = stall.name;
      }
    });
  }

  writeDB(db);

  res.json({
    success: true,
    stall,
    message: `Stall "${stall.name}" updated successfully.`
  });
};

app.patch('/api/stalls/:id', requireRole(['vendor', 'admin']), handleUpdateStall);
app.put('/api/stalls/:id', requireRole(['vendor', 'admin']), handleUpdateStall);

app.post('/api/stalls/:id/dishes', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, batchIdentifier, description, price, preparedQty, image, category } = req.body;
  if (!name || !price || preparedQty === undefined) {
    return res.status(400).json({ error: 'Dish name, price in ₹, and prepared quantity are required' });
  }

  const db = readDB();
  const stall = db.restaurants.find(r => 
    r.id === id || 
    r.stallNumber === id || 
    (r.stallNumber && r.stallNumber.toLowerCase() === id.toLowerCase()) ||
    r.name.toLowerCase() === id.toLowerCase()
  );
  if (!stall) {
    return res.status(404).json({ error: 'Fest stall not found' });
  }

  const trimmedName = name.trim();
  const normalizedName = trimmedName.toLowerCase();
  const trimmedBatch = batchIdentifier ? String(batchIdentifier).trim() : '';

  const stallInventory = db.inventory.filter(i => 
    i.restaurantId === stall.id || 
    (stall.stallNumber && i.restaurantId === stall.stallNumber)
  );
  const matchingItems = stallInventory.filter(i => 
    i.dishName.trim().toLowerCase() === normalizedName
  );

  if (matchingItems.length > 0) {
    if (!trimmedBatch) {
      return res.status(409).json({ 
        error: `Duplicate Food Item Detected: "${trimmedName}" is already listed for this stall. To restock or update, please edit existing inventory. To intentionally create a separate batch, specify a distinct Batch Identifier.` 
      });
    }

    const duplicateBatch = matchingItems.find(i => {
      if (i.batchIdentifier && i.batchIdentifier.trim().toLowerCase() === trimmedBatch.toLowerCase()) {
        return true;
      }
      const legacyBatch = `Batch #${i.id.replace('inv_', '').slice(-4)}`.toLowerCase();
      if (legacyBatch === trimmedBatch.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (duplicateBatch) {
      return res.status(409).json({
        error: `Duplicate Batch Detected: A batch with identifier "${trimmedBatch}" for "${trimmedName}" already exists for this stall. Please specify a distinct batch identifier.`
      });
    }
  }

  const prep = Number(preparedQty);
  if (isNaN(prep) || prep < 0) {
    return res.status(400).json({ error: 'Prepared quantity must be a non-negative number' });
  }

  const dishId = `dish_fest_${Date.now()}`;
  const invId = `inv_fest_${Date.now()}`;
  const effectiveBatch = trimmedBatch || (matchingItems.length > 0 ? `Batch #${invId.replace('inv_', '').slice(-4)}` : undefined);
  const effectiveCategory = (category && category !== 'Mexican')
    ? category
    : (stall.cuisine || 'Fest Street Food & Snacks');

  const newDish: Dish = {
    id: dishId,
    restaurantId: stall.id,
    restaurantName: stall.name,
    name: trimmedName,
    batchIdentifier: effectiveBatch,
    description: description || `Festival special freshly prepared at ${stall.name}.`,
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
    category: effectiveCategory as any,
    cuisine: stall.cuisine,
    tags: ['Fest Special', effectiveBatch ? `Batch: ${effectiveBatch}` : 'Fresh Batch'],
    dietary: [],
    rating: 5.0,
    ratingCount: 1,
    flavorProfile: ['savory', 'crispy'],
    spiceLevel: 2,
    remainingQty: prep,
    isSoldOut: prep === 0
  };
  db.dishes.push(newDish);

  const newInv: InventoryItem = {
    id: invId,
    restaurantId: stall.id,
    dishId,
    dishName: newDish.name,
    batchIdentifier: effectiveBatch,
    description: newDish.description,
    category: newDish.category,
    image: newDish.image,
    price: Number(price),
    cost: Math.round(Number(price) * 0.4),
    preparedQty: prep,
    soldQty: 0,
    reservedQty: 0,
    donationAllocatedQty: 0,
    remainingQty: prep,
    surplusDiscountPrice: Math.round(Number(price) * 0.5),
    isSurplusEligible: true,
    isDonationEligible: true,
    status: prep === 0 ? 'sold_out' : prep < 4 ? 'low_stock' : 'in_stock',
    updatedAt: new Date().toISOString()
  };
  db.inventory.push(newInv);
  writeDB(db);

  res.status(201).json({ success: true, dish: newDish, inventory: newInv });
});

// Update Individual Dish & Sync Inventory
const handleUpdateDish = (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const dishId = req.params.dishId || req.params.id;
  const stallId = req.params.stallId;
  const { name, price, description, image, preparedQty, remainingQty, category } = req.body;

  const db = readDB();

  // Find dish by ID or matching stallId + dishName
  let dishIndex = db.dishes.findIndex(d => d.id === dishId);
  if (dishIndex === -1 && stallId) {
    const stall = db.restaurants.find(r => 
      r.id === stallId || 
      r.stallNumber === stallId || 
      (r.stallNumber && r.stallNumber.toLowerCase() === stallId.toLowerCase())
    );
    if (stall) {
      dishIndex = db.dishes.findIndex(d => 
        (d.restaurantId === stall.id || (stall.stallNumber && d.restaurantId === stall.stallNumber)) &&
        (name ? d.name.toLowerCase() === name.trim().toLowerCase() : false)
      );
    }
  }

  // Find matching inventory record
  let invIndex = db.inventory.findIndex(i => i.dishId === dishId || i.id === dishId);
  if (invIndex === -1 && dishIndex !== -1) {
    const d = db.dishes[dishIndex];
    invIndex = db.inventory.findIndex(i => 
      (i.restaurantId === d.restaurantId) && 
      (i.dishName.trim().toLowerCase() === d.name.trim().toLowerCase())
    );
  }

  if (dishIndex === -1 && invIndex === -1) {
    return res.status(404).json({ error: 'Dish not found' });
  }

  // Authorization check
  const targetRestaurantId = (dishIndex !== -1 ? db.dishes[dishIndex].restaurantId : db.inventory[invIndex].restaurantId);
  const targetRestaurant = db.restaurants.find(r => r.id === targetRestaurantId || (r.stallNumber && r.stallNumber === targetRestaurantId));
  const isOwner = targetRestaurant && (targetRestaurant.ownerId === user.id || user.organizationId === targetRestaurant.id || !targetRestaurant.ownerId);
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to edit dishes for this establishment' });
  }

  // Update image (support HTTP URLs or base64 data URLs)
  const trimmedImage = typeof image === 'string' && image.trim() ? image.trim() : undefined;

  // Update dish record in dishes table
  if (dishIndex !== -1) {
    const dish = db.dishes[dishIndex];
    if (name !== undefined && typeof name === 'string' && name.trim()) dish.name = name.trim();
    if (price !== undefined && !isNaN(Number(price))) dish.price = Number(price);
    if (description !== undefined) dish.description = typeof description === 'string' ? description.trim() : dish.description;
    if (trimmedImage) dish.image = trimmedImage;
    if (category !== undefined && typeof category === 'string' && category.trim()) dish.category = category.trim() as any;
    if (remainingQty !== undefined && !isNaN(Number(remainingQty))) {
      dish.remainingQty = Number(remainingQty);
      dish.isSoldOut = Number(remainingQty) <= 0;
    }
  }

  // Update inventory record in inventory table
  if (invIndex !== -1) {
    const inv = db.inventory[invIndex];
    if (name !== undefined && typeof name === 'string' && name.trim()) inv.dishName = name.trim();
    if (price !== undefined && !isNaN(Number(price))) {
      inv.price = Number(price);
      inv.cost = Math.round(Number(price) * 0.4);
      inv.surplusDiscountPrice = Math.round(Number(price) * 0.5);
    }
    if (description !== undefined) inv.description = typeof description === 'string' ? description.trim() : inv.description;
    if (trimmedImage) inv.image = trimmedImage;
    if (category !== undefined && typeof category === 'string' && category.trim()) inv.category = category.trim();
    if (preparedQty !== undefined && !isNaN(Number(preparedQty))) inv.preparedQty = Number(preparedQty);
    if (remainingQty !== undefined && !isNaN(Number(remainingQty))) {
      const rem = Number(remainingQty);
      inv.remainingQty = rem;
      inv.soldQty = Math.max(0, inv.preparedQty - rem - (inv.reservedQty || 0) - (inv.donationAllocatedQty || 0));
      inv.status = rem === 0 ? 'sold_out' : rem <= 3 ? 'low_stock' : 'in_stock';
    }
    inv.updatedAt = new Date().toISOString();
  }

  writeDB(db);

  const updatedDish = dishIndex !== -1 ? db.dishes[dishIndex] : null;
  const updatedInv = invIndex !== -1 ? db.inventory[invIndex] : null;

  res.json({
    success: true,
    dish: updatedDish || updatedInv,
    inventory: updatedInv,
    message: 'Dish updated successfully'
  });
};

app.patch('/api/stalls/:stallId/dishes/:dishId', requireRole(['vendor', 'admin']), handleUpdateDish);
app.put('/api/stalls/:stallId/dishes/:dishId', requireRole(['vendor', 'admin']), handleUpdateDish);
app.patch('/api/dishes/:id', requireRole(['vendor', 'admin']), handleUpdateDish);
app.put('/api/dishes/:id', requireRole(['vendor', 'admin']), handleUpdateDish);

// 2. Vendor Profile & Business Type Management
app.get('/api/vendor/profile', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();
  const restaurant = db.restaurants.find(r => r.id === user.organizationId) || db.restaurants[0];
  res.json({ restaurant });
});

app.put('/api/vendor/profile', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();
  const restId = user.organizationId || db.restaurants[0]?.id;
  const restIndex = db.restaurants.findIndex(r => r.id === restId);
  if (restIndex === -1) {
    return res.status(404).json({ error: 'Restaurant or stall profile not found.' });
  }

  // Vendors can only edit their own establishment
  if (user.role === 'vendor' && user.organizationId && db.restaurants[restIndex].id !== user.organizationId) {
    return res.status(403).json({ error: 'You are only authorized to edit your own establishment.' });
  }

  const {
    name,
    cuisine,
    address,
    city,
    phone,
    deliveryTime,
    priceRange,
    image,
    description,
    tags,
    collegeName,
    stallNumber,
    festTheme,
    upiId,
    upiPayeeName
  } = req.body;

  const current = db.restaurants[restIndex];
  const oldName = current.name;
  const newName = name ? String(name).trim() : current.name;

  db.restaurants[restIndex] = {
    ...current,
    name: newName,
    cuisine: cuisine ? String(cuisine).trim() : current.cuisine,
    address: address ? String(address).trim() : current.address,
    city: city ? String(city).trim() : current.city,
    phone: phone ? String(phone).trim() : current.phone,
    deliveryTime: deliveryTime ? String(deliveryTime).trim() : current.deliveryTime,
    priceRange: priceRange || current.priceRange,
    image: image ? String(image).trim() : current.image,
    description: description !== undefined ? String(description).trim() : current.description,
    tags: Array.isArray(tags) ? tags : current.tags,
    collegeName: collegeName !== undefined ? String(collegeName).trim() : current.collegeName,
    stallNumber: stallNumber !== undefined ? String(stallNumber).trim() : current.stallNumber,
    festTheme: festTheme !== undefined ? String(festTheme).trim() : current.festTheme,
    upiId: upiId !== undefined ? String(upiId).trim() : current.upiId,
    upiPayeeName: upiPayeeName !== undefined ? String(upiPayeeName).trim() : current.upiPayeeName
  };

  // Keep dish restaurantName in sync
  if (newName !== oldName) {
    db.dishes.forEach(d => {
      if (d.restaurantId === current.id) {
        d.restaurantName = newName;
      }
    });
  }

  writeDB(db);
  res.json({
    success: true,
    restaurant: db.restaurants[restIndex],
    message: 'Profile updated and persisted successfully.'
  });
});


app.put('/api/vendor/business-type', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { businessType, collegeName, stallNumber, restaurantName } = req.body;
  if (!businessType) {
    return res.status(400).json({ error: 'businessType is required' });
  }

  const db = readDB();
  let restIndex = db.restaurants.findIndex(r => r.id === user.organizationId);
  if (restIndex === -1) {
    // If not found, update first or create
    restIndex = 0;
  }

  db.restaurants[restIndex] = {
    ...db.restaurants[restIndex],
    businessType: businessType as BusinessType,
    collegeName: collegeName ?? db.restaurants[restIndex].collegeName,
    stallNumber: stallNumber ?? db.restaurants[restIndex].stallNumber,
    name: restaurantName || db.restaurants[restIndex].name
  };

  writeDB(db);
  res.json({ success: true, restaurant: db.restaurants[restIndex] });
});

// 2.1 Vendor Payment Settings (UPI ID & Payee Name)
app.get('/api/vendor/payment-settings', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();
  const restId = user.organizationId || db.restaurants[0]?.id;
  const restaurant = db.restaurants.find(r => r.id === restId);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant or fest stall not found for this vendor.' });
  }

  res.json({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    upiId: restaurant.upiId || '',
    upiPayeeName: restaurant.upiPayeeName || restaurant.name,
    businessType: restaurant.businessType
  });
});

app.put('/api/vendor/payment-settings', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { upiId, upiPayeeName } = req.body;

  if (!upiId || typeof upiId !== 'string') {
    return res.status(400).json({ error: 'UPI ID is required.' });
  }

  const cleanUpiId = upiId.trim().toLowerCase();
  // Standard Indian UPI ID regex: username@bankhandle (e.g. merchant@upi, user@okhdfcbank, name@sbi, etc.)
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
  if (!upiRegex.test(cleanUpiId)) {
    return res.status(400).json({ 
      error: 'Invalid UPI ID format. A valid UPI ID follows username@bankhandle (e.g. foodstall@upi, vendor@okhdfcbank).' 
    });
  }

  if (!upiPayeeName || typeof upiPayeeName !== 'string' || upiPayeeName.trim().length === 0) {
    return res.status(400).json({ error: 'Merchant / Payee Name is required.' });
  }

  const db = readDB();
  const restId = user.organizationId || db.restaurants[0]?.id;
  const restIndex = db.restaurants.findIndex(r => r.id === restId);
  if (restIndex === -1) {
    return res.status(404).json({ error: 'Restaurant or fest stall not found for this vendor.' });
  }

  // Ensure vendor can only update their own restaurant
  if (user.role === 'vendor' && user.organizationId && db.restaurants[restIndex].id !== user.organizationId) {
    return res.status(403).json({ error: 'You are only authorized to manage payment settings for your own establishment.' });
  }

  db.restaurants[restIndex].upiId = cleanUpiId;
  db.restaurants[restIndex].upiPayeeName = upiPayeeName.trim();

  writeDB(db);

  res.json({
    success: true,
    message: 'UPI payment settings updated and persisted successfully.',
    settings: {
      restaurantId: db.restaurants[restIndex].id,
      restaurantName: db.restaurants[restIndex].name,
      upiId: db.restaurants[restIndex].upiId,
      upiPayeeName: db.restaurants[restIndex].upiPayeeName
    }
  });
});

// 3. Restaurants and Dishes
app.get('/api/restaurants', (_req: Request, res: Response) => {
  const db = readDB();
  res.json({ restaurants: db.restaurants });
});

app.get('/api/dishes', (req: Request, res: Response) => {
  const { category, search, dietary, businessType } = req.query;
  const db = readDB();

  // Map existing dishes and normalize categories for fest stalls
  const dishesMap = new Map<string, Dish>();
  db.dishes.forEach(d => {
    let cat = d.category;
    let rId = d.restaurantId;
    const matchingRest = db.restaurants.find(r => 
      r.id === rId || 
      (r.stallNumber && r.stallNumber === rId) ||
      (d.restaurantName && r.name && d.restaurantName.toLowerCase() === r.name.toLowerCase())
    );
    if (matchingRest) {
      rId = matchingRest.id;
      if (matchingRest.businessType === 'College Fest Stall' && (!cat || cat === 'Mexican')) {
        cat = matchingRest.cuisine || 'Fest Street Food & Snacks';
      }
    }
    dishesMap.set(d.id, {
      ...d,
      restaurantId: rId,
      category: cat
    });
  });

  // Also include any inventory items for published stalls/restaurants not yet in dishesMap
  db.inventory.forEach(inv => {
    const key = inv.dishId || `inv_dish_${inv.id}`;
    if (!dishesMap.has(key)) {
      const rest = db.restaurants.find(r => 
        r.id === inv.restaurantId || 
        (r.stallNumber && r.stallNumber === inv.restaurantId)
      );
      if (rest) {
        const effectiveCat = (inv.category && inv.category !== 'Mexican')
          ? inv.category
          : (rest.cuisine || 'Fest Street Food & Snacks');
        const synthDish: Dish = {
          id: key,
          restaurantId: rest.id,
          restaurantName: rest.name,
          name: inv.dishName,
          batchIdentifier: inv.batchIdentifier,
          description: inv.description || `${inv.dishName} freshly prepared at ${rest.name}`,
          price: inv.price,
          image: inv.image || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
          category: effectiveCat as any,
          cuisine: rest.cuisine,
          tags: ['Fest Special', 'Freshly Prepared'],
          dietary: [],
          rating: 5.0,
          ratingCount: 1,
          flavorProfile: ['savory', 'crispy'],
          spiceLevel: 1,
          remainingQty: inv.remainingQty,
          isSoldOut: inv.remainingQty === 0 || inv.status === 'sold_out'
        };
        dishesMap.set(key, synthDish);
      }
    }
  });

  let list = Array.from(dishesMap.values());

  if (category && category !== 'All') {
    list = list.filter(d => 
      (d.category && d.category.toLowerCase().includes(String(category).toLowerCase())) || 
      (d.cuisine && d.cuisine.toLowerCase().includes(String(category).toLowerCase()))
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(d => 
      d.name.toLowerCase().includes(q) || 
      (d.description && d.description.toLowerCase().includes(q)) || 
      (d.restaurantName && d.restaurantName.toLowerCase().includes(q)) ||
      (d.cuisine && d.cuisine.toLowerCase().includes(q))
    );
  }

  if (dietary && dietary !== 'All') {
    list = list.filter(d => d.dietary && d.dietary.includes(dietary as any));
  }

  if (businessType && businessType !== 'All') {
    const matchedRestIds = db.restaurants
      .filter(r => r.businessType === businessType)
      .map(r => r.id);
    list = list.filter(d => matchedRestIds.includes(d.restaurantId));
  }

  // Enrich each dish with live stock and sold-out status from inventory
  const dishesWithStock = list.map(dish => {
    const inv = db.inventory.find(i => 
      i.dishId === dish.id || 
      (i.restaurantId === dish.restaurantId && i.dishName.trim().toLowerCase() === dish.name.trim().toLowerCase())
    );
    const remainingQty = inv ? inv.remainingQty : (dish.remainingQty !== undefined ? dish.remainingQty : 0);
    const isSoldOut = inv ? (inv.remainingQty === 0 || inv.status === 'sold_out') : (dish.isSoldOut ?? (remainingQty === 0));
    return {
      ...dish,
      remainingQty,
      isSoldOut,
      inventoryId: inv?.id
    };
  });

  res.json({ dishes: dishesWithStock });
});

// 4. Inventory Management (Full CRUD + Strict Invariant Logic)
app.get('/api/inventory', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();

  let items = db.inventory;
  if (user && user.role === 'vendor' && user.organizationId) {
    items = items.filter(i => i.restaurantId === user.organizationId);
  } else if (user && user.role === 'customer') {
    // Fallback to primary demo restaurant so preview of vendor dashboard shows real items
    items = db.inventory.filter(i => i.restaurantId === 'rest_1');
  }

  // Count items with same food name within the same restaurant to distinguish duplicates
  const nameCounts: Record<string, number> = {};
  items.forEach(i => {
    const key = `${i.restaurantId}_${i.dishName.trim().toLowerCase()}`;
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });

  // Distinguish identical food names with batch identifiers & recalculate accurate remaining stock
  items = items.map(item => {
    const key = `${item.restaurantId}_${item.dishName.trim().toLowerCase()}`;
    const hasDuplicates = (nameCounts[key] || 0) > 1;
    let batchId = item.batchIdentifier;
    if (!batchId) {
      if (hasDuplicates) {
        batchId = `Batch #${item.id.replace('inv_', '').slice(-4)}`;
      } else {
        batchId = 'Batch #1';
      }
    }
    const rem = Math.max(0, item.preparedQty - item.soldQty - item.reservedQty - (item.donationAllocatedQty || 0));
    return {
      ...item,
      batchIdentifier: batchId,
      remainingQty: rem,
      status: (rem === 0 ? 'sold_out' : rem <= 3 ? 'low_stock' : 'in_stock') as 'in_stock' | 'low_stock' | 'sold_out' | 'paused'
    };
  });

  res.json({ inventory: items });
});

app.post('/api/inventory', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);

  const { 
    dishName, batchIdentifier, description, category, image, 
    preparedQty, soldQty, reservedQty, remainingQty, donationAllocatedQty, price, cost,
    surplusDiscountPrice, isSurplusEligible, isDonationEligible,
    restaurantName, location, discountPercentage, offerExpiryTime
  } = req.body;

  if (!dishName || preparedQty === undefined || price === undefined) {
    return res.status(400).json({ error: 'Missing required inventory fields: dishName, preparedQty, price' });
  }

  const db = readDB();
  const restId = (user && user.organizationId) ? user.organizationId : 'rest_1';
  let restaurant = db.restaurants.find(r => r.id === restId);
  if (!restaurant) {
    restaurant = db.restaurants[0];
  }

  if (restaurantName) {
    restaurant.name = restaurantName;
  }
  if (location) {
    restaurant.address = location;
  }

  const trimmedName = dishName.trim();
  const normalizedName = trimmedName.toLowerCase();
  const trimmedBatch = batchIdentifier ? String(batchIdentifier).trim() : '';

  // Requirement 2: Prevent accidental duplicate food records when the same vendor submits the same food item repeatedly.
  // Allow separate batches only when intentionally created with distinct batch identifiers.
  const restaurantInventory = db.inventory.filter(i => i.restaurantId === restaurant.id);
  const matchingItems = restaurantInventory.filter(i => 
    i.dishName.trim().toLowerCase() === normalizedName
  );

  if (matchingItems.length > 0) {
    // If no batch identifier was provided, reject accidental duplicate submission
    if (!trimmedBatch) {
      return res.status(409).json({ 
        error: `Duplicate Food Item Detected: "${trimmedName}" is already listed in your inventory. To restock or update this item, please edit the existing inventory record. To intentionally create a separate batch, provide a distinct Batch Identifier (e.g. "Batch 101", "Dinner Lot 2").` 
      });
    }

    // If batch identifier was provided, ensure it is distinct from any existing batches of this food item
    const duplicateBatch = matchingItems.find(i => {
      if (i.batchIdentifier && i.batchIdentifier.trim().toLowerCase() === trimmedBatch.toLowerCase()) {
        return true;
      }
      const legacyBatch = `Batch #${i.id.replace('inv_', '').slice(-4)}`.toLowerCase();
      if (legacyBatch === trimmedBatch.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (duplicateBatch) {
      return res.status(409).json({
        error: `Duplicate Batch Detected: A batch with identifier "${trimmedBatch}" for "${trimmedName}" already exists in your inventory. Please specify a distinct batch identifier to intentionally create a separate batch.`
      });
    }
  }

  const prep = Number(preparedQty);
  const donationAlloc = Number(donationAllocatedQty || 0);
  const sold = soldQty !== undefined ? Number(soldQty) : (remainingQty !== undefined ? Math.max(0, prep - Number(remainingQty) - donationAlloc) : 0);
  const reserved = reservedQty !== undefined ? Number(reservedQty) : 0;
  const rem = remainingQty !== undefined ? Number(remainingQty) : Math.max(0, prep - sold - reserved - donationAlloc);

  // Requirement 3: Keep stock calculations correct for prepared, sold, reserved, and donation-allocated quantities.
  if (sold < 0 || rem < 0 || reserved < 0 || donationAlloc < 0 || (sold + reserved + donationAlloc + rem > prep && remainingQty === undefined)) {
    return res.status(400).json({ error: 'Quantity invariant violated: preparedQty must equal soldQty + reservedQty + donationAllocatedQty + remainingQty.' });
  }

  const dishId = `dish_${Date.now()}`;
  const invId = `inv_${Date.now()}`;
  const defaultImage = image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  const numPrice = Number(price);
  let effectiveSurplusPrice = surplusDiscountPrice ? Number(surplusDiscountPrice) : undefined;
  if (!effectiveSurplusPrice && discountPercentage && Number(discountPercentage) > 0) {
    effectiveSurplusPrice = Math.round(numPrice * (1 - Number(discountPercentage) / 100));
  }
  if (!effectiveSurplusPrice) {
    effectiveSurplusPrice = Math.round(numPrice * 0.5);
  }

  const effectiveBatch = trimmedBatch || (matchingItems.length > 0 ? `Batch #${invId.replace('inv_', '').slice(-4)}` : undefined);

  const newItem: InventoryItem = {
    id: invId,
    restaurantId: restaurant.id,
    dishId,
    dishName: trimmedName,
    batchIdentifier: effectiveBatch,
    description: description || 'Fresh handcrafted specialty prepared daily.',
    category: category || 'Burgers',
    image: defaultImage,
    preparedQty: prep,
    soldQty: sold,
    reservedQty: reserved,
    donationAllocatedQty: donationAlloc,
    remainingQty: rem,
    price: numPrice,
    cost: Number(cost || Math.round(numPrice * 0.4)),
    surplusDiscountPrice: effectiveSurplusPrice,
    isSurplusEligible: isSurplusEligible ?? true,
    isDonationEligible: isDonationEligible ?? true,
    status: rem > 3 ? 'in_stock' : rem > 0 ? 'low_stock' : 'sold_out',
    updatedAt: new Date().toISOString()
  };

  // Also register in Dishes table so customers immediately see it!
  const newDish: Dish = {
    id: dishId,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    name: trimmedName,
    batchIdentifier: effectiveBatch,
    description: description || 'Fresh handcrafted specialty prepared daily.',
    price: numPrice,
    image: defaultImage,
    category: (category as any) || 'Burgers',
    cuisine: restaurant.cuisine,
    tags: [restaurant.businessType, effectiveBatch ? `Batch: ${effectiveBatch}` : 'Fresh Daily'],
    dietary: ['Vegetarian'],
    rating: 5.0,
    ratingCount: 1,
    flavorProfile: ['savory', 'crispy'],
    spiceLevel: 1,
    remainingQty: rem,
    isSoldOut: rem === 0,
    inventoryId: invId
  };

  // Surplus configuration is kept separate from surplus deal activation.
  // Adding or editing an item must NOT automatically publish a surplus deal.
  newItem.reservedQty = 0;
  newItem.remainingQty = rem;

  db.inventory.unshift(newItem);
  db.dishes.unshift(newDish);
  writeDB(db);

  res.status(201).json({ item: newItem, dish: newDish });
});

app.put('/api/inventory/:id', (req: Request, res: Response) => {
  const user = getActiveUser(req);

  const { id } = req.params;
  const { 
    dishName, batchIdentifier, description, category, image, price, cost, 
    preparedQty, soldQty, reservedQty, remainingQty, donationAllocatedQty,
    surplusDiscountPrice, isSurplusEligible, isDonationEligible, status 
  } = req.body;

  const db = readDB();
  const index = db.inventory.findIndex(i => i.id === id || i.dishId === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const current = db.inventory[index];
  let newPrepared = preparedQty !== undefined ? Number(preparedQty) : current.preparedQty;
  let newSold = soldQty !== undefined ? Number(soldQty) : current.soldQty;
  let newReserved = reservedQty !== undefined ? Number(reservedQty) : current.reservedQty;
  let newDonationAlloc = donationAllocatedQty !== undefined ? Number(donationAllocatedQty) : (current.donationAllocatedQty || 0);

  // If client provided remainingQty directly:
  if (remainingQty !== undefined && preparedQty === undefined && soldQty === undefined) {
    const rem = Number(remainingQty);
    newSold = Math.max(0, newPrepared - rem - newReserved - newDonationAlloc);
  }

  // Strict Server Invariant: Remaining stock cannot be negative
  const remaining = newPrepared - newSold - newReserved - newDonationAlloc;
  if (remaining < 0) {
    return res.status(400).json({ 
      error: `Stock invariant violation: Remaining quantity cannot be negative (${newPrepared} prepared - ${newSold} sold - ${newReserved} reserved - ${newDonationAlloc} donation-allocated = ${remaining}).` 
    });
  }

  const updatedStatus = status || (remaining === 0 ? 'sold_out' : remaining < 4 ? 'low_stock' : 'in_stock');

  db.inventory[index] = {
    ...current,
    dishName: dishName || current.dishName,
    batchIdentifier: batchIdentifier !== undefined ? (batchIdentifier ? String(batchIdentifier).trim() : undefined) : current.batchIdentifier,
    description: description ?? current.description,
    category: category || current.category,
    image: image || current.image,
    price: price !== undefined ? Number(price) : current.price,
    cost: cost !== undefined ? Number(cost) : current.cost,
    preparedQty: newPrepared,
    soldQty: newSold,
    reservedQty: newReserved,
    donationAllocatedQty: newDonationAlloc,
    remainingQty: remaining,
    surplusDiscountPrice: surplusDiscountPrice !== undefined ? Number(surplusDiscountPrice) : current.surplusDiscountPrice,
    isSurplusEligible: isSurplusEligible !== undefined ? Boolean(isSurplusEligible) : current.isSurplusEligible,
    isDonationEligible: isDonationEligible !== undefined ? Boolean(isDonationEligible) : current.isDonationEligible,
    status: updatedStatus,
    updatedAt: new Date().toISOString()
  };

  // Sync associated Dish in dishes table
  const dishIndex = db.dishes.findIndex(d => d.id === current.dishId);
  if (dishIndex !== -1) {
    db.dishes[dishIndex] = {
      ...db.dishes[dishIndex],
      name: dishName || db.dishes[dishIndex].name,
      batchIdentifier: batchIdentifier !== undefined ? (batchIdentifier ? String(batchIdentifier).trim() : undefined) : db.dishes[dishIndex].batchIdentifier,
      description: description ?? db.dishes[dishIndex].description,
      price: price !== undefined ? Number(price) : db.dishes[dishIndex].price,
      image: image || db.dishes[dishIndex].image,
      category: (category as any) || db.dishes[dishIndex].category,
      remainingQty: remaining,
      isSoldOut: remaining === 0
    };
  }

  writeDB(db);
  res.json({ item: db.inventory[index] });
});

// Record Sale (record quantity sold and auto-calculate remaining stock)
app.post('/api/inventory/:id/record-sale', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);

  const { id } = req.params;
  const { quantity = 1 } = req.body;
  const qtyToRecord = Number(quantity);

  if (isNaN(qtyToRecord) || qtyToRecord <= 0) {
    return res.status(400).json({ error: 'Quantity sold must be a positive number' });
  }

  const db = readDB();
  const index = db.inventory.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const current = db.inventory[index];
  if (current.remainingQty < qtyToRecord) {
    return res.status(400).json({ 
      error: `Cannot record sale of ${qtyToRecord} units. Only ${current.remainingQty} available in remaining stock.` 
    });
  }

  current.soldQty += qtyToRecord;
  current.remainingQty = Math.max(0, current.preparedQty - current.soldQty - current.reservedQty - (current.donationAllocatedQty || 0));
  current.status = current.remainingQty === 0 ? 'sold_out' : current.remainingQty < 4 ? 'low_stock' : 'in_stock';
  current.updatedAt = new Date().toISOString();

  // Sync catalog dish so customer menu reflects accurate stock
  const dishIdx = db.dishes.findIndex(d => d.id === current.dishId);
  if (dishIdx !== -1) {
    db.dishes[dishIdx].remainingQty = current.remainingQty;
    db.dishes[dishIdx].isSoldOut = current.remainingQty === 0;
  }

  writeDB(db);
  res.json({ success: true, item: current, message: `Recorded sale of ${qtyToRecord} unit(s). Remaining stock: ${current.remainingQty}.` });
});

// Mark item as SOLD OUT
app.post('/api/inventory/:id/mark-sold-out', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);

  const { id } = req.params;
  const db = readDB();
  const index = db.inventory.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const current = db.inventory[index];
  // Mark sold out by setting soldQty = preparedQty - reservedQty
  current.soldQty = current.preparedQty - current.reservedQty;
  current.remainingQty = 0;
  current.status = 'sold_out';
  current.updatedAt = new Date().toISOString();

  // Also close any active surplus offer
  db.surplusOffers.forEach(offer => {
    if (offer.dishId === current.dishId) {
      offer.status = 'sold_out';
      offer.availableQuantity = 0;
    }
  });

  writeDB(db);
  res.json({ success: true, item: current });
});

// Delete an item listing
app.delete('/api/inventory/:id', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);

  const { id } = req.params;
  const db = readDB();
  const index = db.inventory.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }

  const item = db.inventory[index];
  // Remove from inventory
  db.inventory.splice(index, 1);

  // Remove corresponding dish
  const dishIdx = db.dishes.findIndex(d => d.id === item.dishId);
  if (dishIdx !== -1) {
    db.dishes.splice(dishIdx, 1);
  }

  // Remove surplus offers
  db.surplusOffers = db.surplusOffers.filter(o => o.dishId !== item.dishId);

  writeDB(db);
  res.json({ success: true, message: `Removed listing for ${item.dishName}` });
});

// Expiry check helper for surplus offers
function isSurplusOfferExpired(offer: { pickupEnd?: string; expiryTime?: string }): boolean {
  const end = (offer.expiryTime || offer.pickupEnd || '').trim();
  if (!end) return false;

  // 1. If ISO string or parseable full date (e.g. 2026-10-25T22:00:00)
  const parsed = Date.parse(end);
  if (!isNaN(parsed) && end.includes('-') && end.length > 10) {
    return parsed <= Date.now();
  }

  // 2. If time string like HH:mm or HH:mm:ss
  const timeMatch = end.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const deadline = new Date();
    deadline.setHours(hours, minutes, 0, 0);
    return deadline.getTime() <= Date.now();
  }

  return false;
}

// Vendor-Controlled Surplus Deal Release Execution & Validation
function executeSurplusRelease(
  user: User, 
  item: InventoryItem, 
  reqBody: any, 
  db: TastelyDB
): { success: true; offer: SurplusOffer; item: InventoryItem } | { error: string; status: number } {
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== item.restaurantId) {
    return { status: 403, error: 'Unauthorized to release surplus deals for another restaurant.' };
  }

  // 1. Review and confirm actual available stock
  if (item.remainingQty <= 0) {
    return { status: 400, error: `Cannot release surplus deal: "${item.dishName}" is sold out with 0 available portions in stock.` };
  }

  // 2. Enter and validate quantity to release
  const qty = Number(reqBody.surplusQty || reqBody.quantity);
  if (!qty || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
    return { status: 400, error: 'Please specify a valid whole number of portions to release (minimum 1).' };
  }
  if (qty > item.remainingQty) {
    return { status: 400, error: `Cannot release ${qty} surplus portions. Only ${item.remainingQty} portions are currently available in stock.` };
  }

  // 3. Set discount percentage or deal price and calculate final deal price in INR (₹)
  let discountPrice: number;
  let pct: number;

  if (reqBody.discountPercentage !== undefined && reqBody.discountPercentage !== null && String(reqBody.discountPercentage).trim() !== '') {
    pct = Math.round(Number(reqBody.discountPercentage));
    if (isNaN(pct) || pct < 1 || pct > 95) {
      return { status: 400, error: 'Discount percentage must be between 1% and 95%.' };
    }
    discountPrice = Math.round(item.price * (1 - pct / 100));
  } else if (reqBody.surplusPrice !== undefined || reqBody.dealPrice !== undefined) {
    discountPrice = Math.round(Number(reqBody.surplusPrice || reqBody.dealPrice));
    if (isNaN(discountPrice) || discountPrice <= 0 || discountPrice >= item.price) {
      return { status: 400, error: `Surplus deal price (₹${discountPrice}) must be greater than ₹0 and less than regular price (₹${item.price}).` };
    }
    pct = Math.round(((item.price - discountPrice) / item.price) * 100);
  } else {
    pct = 50;
    discountPrice = Math.round(item.price * 0.5);
  }

  const minimumPrice = Number(reqBody.minPrice || item.minSellingPrice || 5);
  if (discountPrice < minimumPrice) {
    return { status: 400, error: `Surplus deal price (₹${discountPrice}) cannot be set below minimum threshold of ₹${minimumPrice}.` };
  }

  // 4. Set and validate expiry time
  const effectiveExpiry = (reqBody.expiryTime || reqBody.pickupEnd || '').trim();
  if (!effectiveExpiry) {
    return { status: 400, error: 'Please set a valid expiry time for the surplus deal.' };
  }
  if (isSurplusOfferExpired({ expiryTime: effectiveExpiry, pickupEnd: effectiveExpiry })) {
    return { status: 400, error: `Expiry time (${effectiveExpiry}) must be set to a future time today.` };
  }

  // 5. Confirm that the food is suitable for discounted sale
  const confirmed = Boolean(reqBody.suitabilityConfirmed || reqBody.confirmedSuitable);
  if (!confirmed) {
    return { status: 400, error: 'Food suitability confirmation required: You must verify and confirm that the food was freshly prepared today, meets hygiene standards, and is suitable for discounted sale.' };
  }

  // 6. Deduct from remaining and add to reserved stock atomically
  item.reservedQty += qty;
  item.remainingQty = Math.max(0, item.preparedQty - item.soldQty - item.reservedQty - (item.donationAllocatedQty || 0));
  item.surplusDiscountPrice = discountPrice;
  item.isSurplusEligible = true;
  item.status = item.remainingQty === 0 ? 'sold_out' : item.remainingQty <= 3 ? 'low_stock' : 'in_stock';
  item.updatedAt = new Date().toISOString();

  // Sync catalog dish so regular ordering respects shared inventory
  const dishIdx = db.dishes.findIndex(d => d.id === item.dishId);
  if (dishIdx !== -1) {
    db.dishes[dishIdx].remainingQty = item.remainingQty;
    db.dishes[dishIdx].isSoldOut = item.remainingQty === 0;
  }

  const restaurant = db.restaurants.find(r => r.id === item.restaurantId) || db.restaurants[0];

  const newOffer: SurplusOffer = {
    id: `surplus_${Date.now()}`,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address || 'Campus Main Court',
    dishId: item.dishId,
    inventoryId: item.id,
    title: `${item.dishName} Surplus Special`,
    description: (reqBody.description && String(reqBody.description).trim()) || `Fresh batch from ${restaurant.name} offered at ${pct}% discount to eliminate food waste.`,
    image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    originalPrice: item.price,
    discountPrice,
    discountPercentage: pct,
    availableQuantity: qty,
    pickupStart: (reqBody.pickupStart && String(reqBody.pickupStart).trim()) || 'Immediately',
    pickupEnd: effectiveExpiry,
    expiryTime: effectiveExpiry,
    status: 'active',
    isExplicitlyReleased: true,
    suitabilityConfirmed: true,
    dietary: (item as any).dietary || ['Vegetarian'],
    createdAt: new Date().toISOString()
  };

  db.surplusOffers.unshift(newOffer);
  return { success: true, offer: newOffer, item };
}

// Primary endpoint: Explicit Surplus Deal Release by Vendor
app.post('/api/surplus/release', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { inventoryId, dishId } = req.body;
  const db = readDB();

  const item = db.inventory.find(i => (inventoryId && i.id === inventoryId) || (dishId && i.dishId === dishId));
  if (!item) {
    return res.status(404).json({ error: 'Selected food item not found in inventory.' });
  }

  const result = executeSurplusRelease(user, item, req.body, db);
  if ('error' in result) {
    return res.status(result.status).json({ error: result.error });
  }

  writeDB(db);
  res.status(201).json(result);
});

// Alias for item-scoped release
app.post('/api/inventory/:id/release-surplus', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const db = readDB();

  const item = db.inventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found in inventory' });

  const result = executeSurplusRelease(user, item, req.body, db);
  if ('error' in result) {
    return res.status(result.status).json({ error: result.error });
  }

  writeDB(db);
  res.status(201).json(result);
});

// Backwards-compatible route for existing UI callers
app.post('/api/inventory/:id/surplus-discount', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const db = readDB();

  const item = db.inventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found in inventory' });

  const result = executeSurplusRelease(user, item, req.body, db);
  if ('error' in result) {
    return res.status(result.status).json({ error: result.error });
  }

  writeDB(db);
  res.status(201).json(result);
});

// Unpublish / Pause Surplus Deal by Vendor
app.post('/api/surplus/:id/unpublish', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const db = readDB();

  const offer = db.surplusOffers.find(o => o.id === id);
  if (!offer) return res.status(404).json({ error: 'Surplus offer not found' });

  if (user.role === 'vendor' && user.organizationId && user.organizationId !== offer.restaurantId) {
    return res.status(403).json({ error: 'Unauthorized to unpublish surplus deals for another restaurant.' });
  }

  // Return unreserved available surplus quantity back to remaining stock
  const item = db.inventory.find(i => (offer.inventoryId && i.id === offer.inventoryId) || i.dishId === offer.dishId);
  if (item && offer.availableQuantity > 0 && offer.status === 'active') {
    item.reservedQty = Math.max(0, item.reservedQty - offer.availableQuantity);
    item.remainingQty = Math.max(0, item.preparedQty - item.soldQty - item.reservedQty - (item.donationAllocatedQty || 0));
    item.status = item.remainingQty === 0 ? 'sold_out' : item.remainingQty <= 3 ? 'low_stock' : 'in_stock';
    item.updatedAt = new Date().toISOString();

    const dishIdx = db.dishes.findIndex(d => d.id === item.dishId);
    if (dishIdx !== -1) {
      db.dishes[dishIdx].remainingQty = item.remainingQty;
      db.dishes[dishIdx].isSoldOut = item.remainingQty === 0;
    }
  }

  offer.status = 'unreleased';
  offer.isExplicitlyReleased = false;
  offer.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, offer, item });
});

// Quick Mark Surplus Food for NGO Donation
app.post('/api/inventory/:id/donation-mark', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);

  const { id } = req.params;
  const { donationPortions, notes, pickupDeadline } = req.body;

  const db = readDB();
  const item = db.inventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const portions = Number(donationPortions || Math.min(item.remainingQty, 5));
  if (portions > item.remainingQty) {
    return res.status(400).json({ error: `Cannot donate ${portions} portions. Only ${item.remainingQty} available.` });
  }

  // Deduct from remaining and add to donationAllocatedQty
  item.donationAllocatedQty = (item.donationAllocatedQty || 0) + portions;
  item.remainingQty = Math.max(0, item.preparedQty - item.soldQty - item.reservedQty - item.donationAllocatedQty);
  item.status = item.remainingQty === 0 ? 'sold_out' : item.remainingQty <= 3 ? 'low_stock' : 'in_stock';
  item.isDonationEligible = true;
  item.updatedAt = new Date().toISOString();

  // Sync catalog dish remainingQty
  const dishIdx = db.dishes.findIndex(d => d.id === item.dishId);
  if (dishIdx !== -1) {
    db.dishes[dishIdx].remainingQty = item.remainingQty;
    db.dishes[dishIdx].isSoldOut = item.remainingQty === 0;
  }

  const restaurant = db.restaurants.find(r => r.id === item.restaurantId) || db.restaurants[0];

  const newDonation: DonationOffer = {
    id: `don_${Date.now()}`,
    inventoryId: item.id,
    dishId: item.dishId,
    dishName: item.dishName,
    description: notes || `Wholesome freshly prepared meal packages donated by ${restaurant.name}.`,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    pickupLocation: restaurant.address,
    prepTime: 'Freshly prepared today',
    pickupDeadline: pickupDeadline || 'Today before 22:30',
    handlingNotes: 'Hygienically packaged and temperature controlled.',
    confirmedSuitable: true,
    initialQuantity: portions,
    availableQuantity: portions,
    allocatedQuantity: 0,
    collectedQuantity: 0,
    quantityPortions: portions,
    dietaryInfo: ['Vegetarian'],
    status: 'available',
    requestsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.donations.unshift(newDonation);
  writeDB(db);

  res.status(201).json({ success: true, donation: newDonation, item });
});

// 5. Surplus Food Deals & Customer Reservations
app.get('/api/surplus', (req: Request, res: Response) => {
  const db = readDB();
  const includeAll = req.query.includeAll === 'true';

  let hasUpdates = false;
  // Update expired statuses
  for (const offer of (db.surplusOffers || [])) {
    if (offer.status === 'active' && isSurplusOfferExpired(offer)) {
      offer.status = 'expired';
      hasUpdates = true;
    }
  }
  if (hasUpdates) {
    writeDB(db);
  }

  // Management view (vendors/admins see all their deals)
  if (includeAll) {
    return res.json({ offers: db.surplusOffers || [] });
  }

  // Customer surplus feed: Show ONLY explicitly released, active, non-expired deals with available stock
  const customerOffers = (db.surplusOffers || []).filter(offer => {
    if (offer.isExplicitlyReleased !== true) return false;
    if (offer.status !== 'active') return false;
    if (offer.availableQuantity <= 0) return false;
    if (isSurplusOfferExpired(offer)) return false;
    return true;
  });

  res.json({ offers: customerOffers });
});

app.post('/api/surplus/:id/reserve', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const quantity = Number(req.body.quantity || 1);

  const db = readDB();
  const offerIndex = (db.surplusOffers || []).findIndex(o => o.id === id);
  if (offerIndex === -1) {
    return res.status(404).json({ error: 'Surplus offer not found' });
  }

  const offer = db.surplusOffers[offerIndex];

  // Prevent ordering expired deals even if page was left open
  if (isSurplusOfferExpired(offer)) {
    offer.status = 'expired';
    writeDB(db);
    return res.status(400).json({ error: 'This surplus offer has expired and is no longer available.' });
  }

  // Only allow active deals with sufficient available quantity
  if (offer.status !== 'active' || offer.isExplicitlyReleased === false || offer.availableQuantity < quantity) {
    return res.status(400).json({ error: 'This surplus offer is sold out, expired, or unavailable.' });
  }

  // Atomic reservation update
  offer.availableQuantity -= quantity;
  if (offer.availableQuantity <= 0) {
    offer.status = 'sold_out';
  }

  const voucherCode = `TST-${Math.floor(1000 + Math.random() * 9000)}`;
  const reservation: Reservation = {
    id: `res_${Date.now()}`,
    voucherCode,
    userId: user.id,
    userName: user.name,
    surplusOfferId: offer.id,
    restaurantName: offer.restaurantName,
    restaurantAddress: offer.restaurantAddress,
    dishTitle: offer.title,
    quantity,
    totalPrice: Math.round(offer.discountPrice * quantity),
    pickupEnd: offer.pickupEnd,
    status: 'reserved',
    reservedAt: new Date().toISOString()
  };

  const order = ensureOrderForReservation(db, reservation);
  db.reservations.unshift(reservation);
  writeDB(db);

  res.status(201).json({ 
    success: true, 
    reservation, 
    order,
    remainingOfferQuantity: offer.availableQuantity 
  });
});

app.get('/api/reservations', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();
  const allReservations = db.reservations || [];
  const userReservations = user.role === 'admin'
    ? allReservations
    : allReservations.filter(r => r.userId === user.id);
  res.json({ reservations: userReservations });
});

// 5.2 VENDOR SURPLUS RESERVATIONS & PICKUP CONFIRMATION
app.get('/api/vendor/reservations', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();
  const { status, search, restaurantId } = req.query;

  let reservations = db.reservations || [];

  if (user.role === 'vendor') {
    const vendorOwnedRestIds = (db.restaurants || []).filter(rst => rst.ownerId === user.id).map(rst => rst.id);
    if (!user.organizationId && vendorOwnedRestIds.length === 0) {
      return res.status(403).json({ error: 'Vendor has no associated organization or owned restaurant.' });
    }
    reservations = reservations.filter(r => {
      const offer = (db.surplusOffers || []).find(o => o.id === r.surplusOfferId);
      if (!offer || !offer.restaurantId) return false;
      const rest = (db.restaurants || []).find(rst => rst.id === offer.restaurantId);
      return (user.organizationId && offer.restaurantId === user.organizationId) || (rest && rest.ownerId === user.id) || vendorOwnedRestIds.includes(offer.restaurantId);
    });
  } else if (user.role === 'admin') {
    if (restaurantId && restaurantId !== 'all') {
      reservations = reservations.filter(r => {
        const offer = (db.surplusOffers || []).find(o => o.id === r.surplusOfferId);
        return offer && offer.restaurantId === restaurantId;
      });
    }
  }

  if (status && status !== 'all') {
    reservations = reservations.filter(r => r.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    reservations = reservations.filter(r => 
      r.voucherCode.toLowerCase().includes(q) ||
      r.dishTitle.toLowerCase().includes(q) ||
      (r.userName && r.userName.toLowerCase().includes(q))
    );
  }

  res.json({ reservations });
});

// 5.2.1 VERIFY VOUCHER (Volunteers, Vendors & Admins)
app.post('/api/reservations/verify-voucher', requireRole(['vendor', 'ngo', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const voucherCode = req.body?.voucherCode ? String(req.body.voucherCode).trim().toUpperCase() : null;
  if (!voucherCode) {
    return res.status(400).json({ error: 'Voucher code is required.' });
  }

  const db = readDB();
  const reservation = (db.reservations || []).find(r => r.voucherCode.toUpperCase() === voucherCode);
  if (!reservation) {
    return res.status(404).json({ error: `Invalid voucher code: "${voucherCode}" was not found.` });
  }

  // Positive vendor authorization check (vendors can only verify vouchers for their own restaurant/stall)
  if (user.role === 'vendor') {
    const offer = (db.surplusOffers || []).find(o => o.id === reservation.surplusOfferId);
    if (!offer || !offer.restaurantId) {
      return res.status(403).json({ error: 'Surplus offer for this reservation could not be verified.' });
    }
    const rest = (db.restaurants || []).find(rst => rst.id === offer.restaurantId);
    const isOwner = (user.organizationId && offer.restaurantId === user.organizationId) || (rest && rest.ownerId === user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'You are only authorized to verify vouchers for surplus meals from your own establishment.' });
    }
  }

  // Reject cancelled vouchers
  if (reservation.status === 'cancelled') {
    return res.status(400).json({ 
      error: `Cannot verify voucher: Voucher #${reservation.voucherCode} has been cancelled.`,
      status: 'cancelled',
      reservation
    });
  }

  // Reject already-used vouchers
  if (reservation.status === 'picked_up') {
    return res.status(400).json({ 
      error: `Cannot verify voucher: Voucher #${reservation.voucherCode} has already been used and handed over.`,
      status: 'already_used',
      alreadyUsed: true,
      reservation
    });
  }

  // Ensure and retrieve matching order details
  const order = ensureOrderForReservation(db, reservation);

  res.json({
    success: true,
    valid: true,
    voucherCode: reservation.voucherCode,
    reservation,
    order,
    customer: {
      name: reservation.userName,
      userId: reservation.userId
    },
    meal: {
      title: reservation.dishTitle,
      quantity: reservation.quantity,
      totalPrice: reservation.totalPrice,
      restaurantName: reservation.restaurantName,
      pickupEnd: reservation.pickupEnd
    },
    message: `Voucher ${reservation.voucherCode} is verified! Ready for food handover.`
  });
});

// 5.2.2 CONFIRM HANDOVER & MARK ORDER COMPLETED
function executeHandover(req: Request, res: Response, resIdentifier: string, reqVoucherCode?: string | null) {
  const user = getActiveUser(req);
  const db = readDB();
  const searchCode = reqVoucherCode ? reqVoucherCode.trim().toUpperCase() : null;

  const resIndex = (db.reservations || []).findIndex(r => 
    r.id === resIdentifier || 
    r.voucherCode.toUpperCase() === resIdentifier.toUpperCase() ||
    (searchCode && r.voucherCode.toUpperCase() === searchCode)
  );

  if (resIndex === -1) {
    return res.status(404).json({ error: 'Reservation not found with the provided identifier or voucher code.' });
  }

  const reservation = db.reservations[resIndex];

  // Vendor authorization check
  if (user.role === 'vendor') {
    const offer = (db.surplusOffers || []).find(o => o.id === reservation.surplusOfferId);
    if (!offer || !offer.restaurantId) {
      return res.status(403).json({ error: 'Surplus offer for this reservation could not be verified.' });
    }
    const rest = (db.restaurants || []).find(rst => rst.id === offer.restaurantId);
    const isOwner = (user.organizationId && offer.restaurantId === user.organizationId) || (rest && rest.ownerId === user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'You are only authorized to confirm handover for surplus meals from your own establishment.' });
    }
  }

  // Reject cancelled reservations
  if (reservation.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot confirm handover: this reservation has been cancelled.' });
  }

  // Idempotency: Prevent duplicate handovers
  if (reservation.status === 'picked_up') {
    return res.status(400).json({
      error: `Duplicate handover prevented: Voucher #${reservation.voucherCode} was already confirmed and handed over.`,
      alreadyConfirmed: true,
      reservation
    });
  }

  // Update existing reservation to 'picked_up' status
  reservation.status = 'picked_up';
  reservation.pickedUpAt = new Date().toISOString();
  reservation.confirmedByUserId = user.id;
  reservation.confirmedByUserName = user.name;

  // Update corresponding order in db.orders to 'completed'
  const order = ensureOrderForReservation(db, reservation);
  order.orderStatus = 'completed';
  order.paymentStatus = 'paid';
  (order as any).completedAt = reservation.pickedUpAt;
  (order as any).completedByUserId = user.id;
  (order as any).completedByUserName = user.name;
  (order as any).completedByRole = user.role;
  order.updatedAt = new Date().toISOString();
  reservation.orderId = order.id;

  writeDB(db);

  res.json({
    success: true,
    reservation,
    order,
    message: `Food handover confirmed! Voucher ${reservation.voucherCode} verified and marked as Completed for ${reservation.quantity}x "${reservation.dishTitle}". Order #${order.orderNumber} is now Completed in the Orders section!`
  });
}

function handleConfirmPickup(req: Request, res: Response) {
  const { id } = req.params;
  const voucherCode = req.body?.voucherCode ? String(req.body.voucherCode).trim().toUpperCase() : null;
  return executeHandover(req, res, id, voucherCode);
}

app.post('/api/reservations/confirm-handover', requireRole(['vendor', 'ngo', 'admin']), (req: Request, res: Response) => {
  const voucherCode = req.body?.voucherCode ? String(req.body.voucherCode).trim().toUpperCase() : null;
  const reservationId = req.body?.reservationId ? String(req.body.reservationId).trim() : null;
  const identifier = voucherCode || reservationId;
  if (!identifier) {
    return res.status(400).json({ error: 'Either voucherCode or reservationId is required to confirm handover.' });
  }
  return executeHandover(req, res, identifier, voucherCode);
});

app.patch('/api/reservations/:id/confirm-pickup', requireRole(['vendor', 'ngo', 'admin']), handleConfirmPickup);
app.post('/api/reservations/:id/confirm-pickup', requireRole(['vendor', 'ngo', 'admin']), handleConfirmPickup);

// -------------------------------------------------------------
// 5.1 CUSTOMER ORDERS & VENDOR INVENTORY REDUCTION
// -------------------------------------------------------------

app.get('/api/orders', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();
  const { status, restaurantId } = req.query;

  let orders = db.orders || [];

  if (user.role === 'vendor') {
    const vendorRestIds = new Set(
      (db.restaurants || [])
        .filter(r => r.ownerId === user.id || (user.organizationId && r.id === user.organizationId))
        .map(r => r.id)
    );

    const reqRestId = restaurantId as string;
    if (reqRestId && reqRestId !== 'all') {
      if (vendorRestIds.has(reqRestId)) {
        orders = orders.filter(o => o.restaurantId === reqRestId);
      } else {
        orders = [];
      }
    } else {
      orders = orders.filter(o => vendorRestIds.has(o.restaurantId));
    }
  } else if (user.role === 'admin') {
    if (restaurantId && restaurantId !== 'all') {
      orders = orders.filter(o => o.restaurantId === restaurantId);
    }
  } else {
    // Customer
    orders = orders.filter(o => o.userId === user.id);
  }

  if (status && status !== 'all') {
    orders = orders.filter(o => o.orderStatus === status);
  }

  res.json({ orders });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const db = readDB();
  const order = (db.orders || []).find(o => o.id === id || o.orderNumber === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Authorization check: Admin, customer owner, or authorized vendor owning the restaurant/stall
  if (user.role === 'vendor') {
    const isOwner = (db.restaurants || []).some(
      r => r.id === order.restaurantId && (r.ownerId === user.id || (user.organizationId && r.id === user.organizationId))
    );
    if (!isOwner) {
      return res.status(403).json({ error: 'Unauthorized to view this order.' });
    }
  } else if (user.role === 'customer' && order.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this order.' });
  }

  res.json({ order });
});

app.post('/api/orders', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { 
    restaurantId, 
    items, 
    customerName, 
    customerPhone, 
    customerEmail, 
    pickupNotes, 
    paymentMethod,
    idempotencyKey 
  } = req.body;

  if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain a vendor/restaurant ID and at least one item.' });
  }

  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Customer name and contact phone number are required.' });
  }

  const db = readDB();

  // 1. Idempotency Check: Prevent duplicate orders from repeated clicks or network retries
  if (idempotencyKey) {
    const existingOrder = (db.orders || []).find(o => o.idempotencyKey === idempotencyKey);
    if (existingOrder) {
      // Safety check: ensure the existing order belongs to the same user and target restaurant
      if (existingOrder.userId !== user.id || existingOrder.restaurantId !== restaurantId) {
        return res.status(409).json({
          error: 'Idempotency conflict: This checkout key was previously used for a different order session. Please refresh and try again.'
        });
      }

      // Safety check: ensure requested items match the existing order items
      const existingDishCounts = new Map(existingOrder.items.map(i => [i.dishId, i.quantity]));
      const itemsMatch = items.length === existingOrder.items.length &&
        items.every((it: any) => existingDishCounts.get(it.dishId) === Number(it.quantity));

      if (!itemsMatch) {
        return res.status(409).json({
          error: 'Idempotency conflict: This checkout key was previously submitted with different cart items. Please start a new checkout attempt.'
        });
      }

      return res.status(200).json({ 
        success: true, 
        order: existingOrder, 
        duplicatePrevented: true,
        message: 'Order already processed with this request key.' 
      });
    }
  }

  // 2. Locate Restaurant / Fest Stall
  const restaurant = db.restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: 'The selected restaurant or fest stall was not found.' });
  }

  // 3. Multi-Vendor Check & Atomic Pre-Order Stock Validation
  const orderItems: OrderItem[] = [];
  let subtotal = 0;

  for (const requestedItem of items) {
    const qty = Number(requestedItem.quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Each item quantity must be at least 1.' });
    }

    const dish = db.dishes.find(d => d.id === requestedItem.dishId);
    if (!dish) {
      return res.status(404).json({ error: `Dish ID ${requestedItem.dishId} does not exist.` });
    }

    if (dish.restaurantId !== restaurantId) {
      return res.status(400).json({ 
        error: `Dish "${dish.name}" belongs to "${dish.restaurantName}", not "${restaurant.name}". All items in a single checkout must be from the same vendor.` 
      });
    }

    // Match inventory record
    const invItem = db.inventory.find(i => i.dishId === dish.id);
    if (!invItem) {
      return res.status(400).json({ error: `No active inventory record found for "${dish.name}".` });
    }

    // Strict stock check against available inventory
    if (invItem.remainingQty < qty || invItem.status === 'sold_out') {
      return res.status(400).json({ 
        error: `Insufficient stock for "${invItem.dishName}". Requested: ${qty}, Available: ${invItem.remainingQty}. Please adjust your quantity.` 
      });
    }

    const itemTotal = dish.price * qty;
    subtotal += itemTotal;

    orderItems.push({
      dishId: dish.id,
      dishName: dish.name,
      image: dish.image,
      price: dish.price,
      quantity: qty,
      itemTotal,
      category: dish.category,
      specialInstructions: requestedItem.specialInstructions || ''
    });
  }

  // 4. ATOMIC STOCK DEDUCTION
  // Once all items pass validation, decrement available stock and update soldQty
  for (const ordered of orderItems) {
    const invItem = db.inventory.find(i => i.dishId === ordered.dishId);
    if (invItem) {
      invItem.soldQty += ordered.quantity;
      invItem.remainingQty = Math.max(0, invItem.preparedQty - invItem.soldQty - invItem.reservedQty - (invItem.donationAllocatedQty || 0));
      if (invItem.remainingQty === 0) {
        invItem.status = 'sold_out';
      } else if (invItem.remainingQty <= 3) {
        invItem.status = 'low_stock';
      } else {
        invItem.status = 'in_stock';
      }
      invItem.updatedAt = new Date().toISOString();

      // Sync associated dish in catalog
      const dishIdx = db.dishes.findIndex(d => d.id === invItem.dishId);
      if (dishIdx !== -1) {
        db.dishes[dishIdx].remainingQty = invItem.remainingQty;
        db.dishes[dishIdx].isSoldOut = invItem.remainingQty === 0;
      }
    }
  }

  // 5. Create Order Record
  const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  const isDemo = paymentMethod === 'demo';
  const effectivePaymentMethod: PaymentMethod = isDemo ? 'demo' : paymentMethod === 'upi' ? 'upi' : 'pay_on_pickup';

  const initialPaymentStatus: PaymentStatus = isDemo 
    ? 'demo_pending' 
    : effectivePaymentMethod === 'upi' 
      ? 'pending' 
      : 'pay_on_pickup';

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    idempotencyKey,
    userId: user.id,
    customerName: customerName.trim(),
    customerEmail: customerEmail?.trim() || user.email,
    customerPhone: customerPhone.trim(),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    businessType: restaurant.businessType,
    items: orderItems,
    subtotal,
    discount: 0,
    totalAmount: subtotal,
    paymentMethod: effectivePaymentMethod,
    paymentStatus: initialPaymentStatus,
    orderStatus: 'confirmed',
    pickupNotes: pickupNotes?.trim() || '',
    estimatedPrepTime: restaurant.deliveryTime || '15-20 min',
    upiId: isDemo ? 'demo.expo@tastely' : effectivePaymentMethod === 'upi' ? (restaurant.upiId || 'tastely.vendor@upi') : undefined,
    upiPayeeName: isDemo ? 'Tastely Expo Demo Stall' : effectivePaymentMethod === 'upi' ? (restaurant.upiPayeeName || restaurant.name) : undefined,
    isDemoPayment: isDemo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.orders) db.orders = [];
  db.orders.unshift(newOrder);

  // Atomic write to disk
  writeDB(db);

  res.status(201).json({
    success: true,
    order: newOrder,
    message: `Order #${orderNumber} placed successfully!`
  });
});

app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { status, cancellationReason } = req.body;

  const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid order status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const db = readDB();
  const orderIndex = (db.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = db.orders[orderIndex];

  // Authorization check
  const isVendorOwner = user.role === 'vendor' && (
    user.organizationId === order.restaurantId ||
    !user.organizationId ||
    (db.restaurants || []).some(r => r.id === order.restaurantId && r.ownerId === user.id)
  );
  const isCustomerOwner = user.id === order.userId;
  const isAdmin = user.role === 'admin';

  if (!isVendorOwner && !isCustomerOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to update this order.' });
  }

  // Customers are only allowed to cancel their own orders, never advance fulfillment
  if (isCustomerOwner && !isVendorOwner && !isAdmin) {
    if (status !== 'cancelled') {
      return res.status(403).json({ error: 'Unauthorized: Customers are only permitted to cancel pending orders, not advance fulfillment status.' });
    }
  }

  // Once an order is cancelled, its status cannot be changed further
  if (order.orderStatus === 'cancelled') {
    return res.status(400).json({ error: 'Cannot update status of a cancelled order.' });
  }

  // Prevent duplicate completion attempts or cancelling completed orders
  if (order.orderStatus === 'completed' && status === 'completed') {
    return res.status(400).json({ error: 'Order is already marked as completed and handed over.' });
  }
  if (order.orderStatus === 'completed' && status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot cancel an order that has already been completed and handed over.' });
  }

  // PAYMENT SAFEGUARDS BEFORE ORDER HANDOVER:
  // Allow preparation while payment is pending, but block completion/handover until payment is verified or recorded.
  if (status === 'completed') {
    if (order.isDemoPayment || order.paymentMethod === 'demo') {
      if (order.paymentStatus !== 'demo_completed') {
        const failureDetail = order.demoFailureReason ? ` (${order.demoFailureReason})` : '';
        return res.status(400).json({
          error: `Cannot complete handover: Demo payment is in "${order.paymentStatus}" state${failureDetail}. Handover for demo orders is blocked until a successful demo payment simulation is completed. (DEMO — NO REAL MONEY TRANSFERRED)`
        });
      }
    } else if (order.paymentMethod === 'upi') {
      if (order.paymentStatus !== 'verified') {
        if (order.paymentStatus === 'payment_submitted') {
          return res.status(400).json({
            error: `Cannot complete handover: Customer has submitted UPI reference (${order.upiReference || 'UTR'}), but payment has not been verified against your bank statement. Please verify payment first.`
          });
        }
        return res.status(400).json({
          error: 'Cannot complete handover: UPI payment is pending or unverified. Order cannot be handed over until payment is verified.'
        });
      }
    } else if (order.paymentMethod === 'pay_on_pickup') {
      const isPaid = order.paymentStatus === 'verified' || order.paymentStatus === 'received' || order.paymentStatus === 'paid';
      if (!isPaid) {
        return res.status(400).json({
          error: 'Cannot complete handover: In-person payment for Pay on Pickup order has not been recorded as received. Please record payment collection at the counter before completing handover.'
        });
      }
    }
  }

  const previousStatus = order.orderStatus;

  // SAFE STOCK RESTORATION: If cancelling an active order, restore inventory remainingQty and reduce soldQty
  if (status === 'cancelled') {
    for (const item of order.items) {
      const invItem = db.inventory.find(i => i.dishId === item.dishId);
      if (invItem) {
        invItem.soldQty = Math.max(0, invItem.soldQty - item.quantity);
        invItem.remainingQty = Math.max(0, invItem.preparedQty - invItem.soldQty - invItem.reservedQty - (invItem.donationAllocatedQty || 0));
        invItem.status = invItem.remainingQty === 0 ? 'sold_out' : invItem.remainingQty <= 3 ? 'low_stock' : 'in_stock';
        invItem.updatedAt = new Date().toISOString();

        // Sync dish
        const dishIdx = db.dishes.findIndex(d => d.id === invItem.dishId);
        if (dishIdx !== -1) {
          db.dishes[dishIdx].remainingQty = invItem.remainingQty;
          db.dishes[dishIdx].isSoldOut = invItem.remainingQty === 0;
        }
      }
    }
    order.cancelledAt = new Date().toISOString();
    order.cancellationReason = cancellationReason || (isCustomerOwner ? 'Cancelled by customer' : 'Cancelled by vendor');
  }

  order.orderStatus = status;
  order.updatedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    success: true,
    order,
    message: status === 'cancelled'
      ? `Order #${order.orderNumber} has been cancelled and stock has been restored.`
      : `Order #${order.orderNumber} status updated to ${status}.`
  });
});

app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDB();
  const orderIndex = (db.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = db.orders[orderIndex];

  // Authorization check: Only authorized vendor for this restaurant, customer owner, or admin can cancel
  const isVendorOwner = user.role === 'vendor' && (
    user.organizationId === order.restaurantId ||
    (db.restaurants || []).some(r => r.id === order.restaurantId && r.ownerId === user.id)
  );
  const isCustomerOwner = user.id === order.userId;
  const isAdmin = user.role === 'admin';

  if (!isVendorOwner && !isCustomerOwner && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to cancel this order.' });
  }

  if (order.orderStatus === 'cancelled') {
    return res.status(400).json({ error: 'Order is already cancelled' });
  }

  if (order.orderStatus === 'completed') {
    return res.status(400).json({ error: 'Cannot cancel an order that has already been completed and handed over.' });
  }

  // Restore stock safely
  for (const item of order.items) {
    const invItem = db.inventory.find(i => i.dishId === item.dishId);
    if (invItem) {
      invItem.soldQty = Math.max(0, invItem.soldQty - item.quantity);
      invItem.remainingQty = Math.max(0, invItem.preparedQty - invItem.soldQty - invItem.reservedQty - (invItem.donationAllocatedQty || 0));
      invItem.status = invItem.remainingQty === 0 ? 'sold_out' : invItem.remainingQty <= 3 ? 'low_stock' : 'in_stock';
      invItem.updatedAt = new Date().toISOString();

      // Sync dish
      const dishIdx = db.dishes.findIndex(d => d.id === invItem.dishId);
      if (dishIdx !== -1) {
        db.dishes[dishIdx].remainingQty = invItem.remainingQty;
        db.dishes[dishIdx].isSoldOut = invItem.remainingQty === 0;
      }
    }
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.cancellationReason = reason || 'Customer requested cancellation';
  order.updatedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    success: true,
    order,
    message: `Order #${order.orderNumber} has been cancelled and stock has been restored.`
  });
});

// 5.2 CUSTOMER UPI UTR SUBMISSION
app.post('/api/orders/:id/submit-utr', requireAuth, (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { upiReference, notes } = req.body;

  if (!upiReference || typeof upiReference !== 'string' || upiReference.trim().length < 6) {
    return res.status(400).json({ 
      error: 'Please enter a valid UPI transaction reference / 12-digit UTR number from your payment app (Google Pay, PhonePe, Paytm, etc.).' 
    });
  }

  const db = readDB();
  const orderIndex = (db.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const order = db.orders[orderIndex];

  // Authorization check: Customer owner or Admin
  if (order.userId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'You are not authorized to submit payment for this order.' });
  }

  // Update payment status to payment_submitted (never auto-verify)
  order.upiReference = upiReference.trim();
  order.paymentStatus = 'payment_submitted';
  order.paymentSubmittedAt = new Date().toISOString();
  if (notes) {
    order.paymentVerificationNotes = notes.trim();
  }
  order.updatedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    success: true,
    order,
    message: `UPI Reference "${order.upiReference}" submitted successfully. Payment status is now "Payment Submitted" awaiting vendor verification.`
  });
});

// 5.2.1 DEMO PAYMENT SIMULATION (College Expo Mode)
app.post('/api/orders/:id/simulate-demo-payment', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { outcome, failureReason } = req.body;

  if (!outcome || !['success', 'failure'].includes(outcome)) {
    return res.status(400).json({ error: 'outcome must be either "success" or "failure"' });
  }

  const db = readDB();
  const orderIndex = (db.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = db.orders[orderIndex];

  // Must be a demo order
  if (!order.isDemoPayment && order.paymentMethod !== 'demo') {
    return res.status(400).json({ 
      error: 'Cannot simulate payment on a real order. Only orders placed in Demo Payment Mode can be simulated.' 
    });
  }

  // Authorization check: Vendors are strictly forbidden from simulating or altering customer payments.
  // Only the customer who placed the order (or admin) is authorized to trigger demo payment simulation.
  if (user.role === 'vendor') {
    return res.status(403).json({ 
      error: 'Vendors are not permitted to simulate customer payments. Only the ordering customer can simulate demo payment.' 
    });
  }

  const isCustomerOwner = user.id === order.userId;
  const isAdmin = user.role === 'admin';

  if (!isCustomerOwner && !isAdmin) {
    return res.status(403).json({ 
      error: 'Unauthorized: Only the customer who placed this order can simulate payment.' 
    });
  }

  // Reject attempts to re-simulate payment for orders whose fulfillment status is completed or cancelled
  if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') {
    return res.status(400).json({ 
      error: `Cannot simulate payment: Order #${order.orderNumber} is already ${order.orderStatus}. Payment status cannot be changed on finalized orders.` 
    });
  }

  if (outcome === 'success') {
    const simRef = `DEMO-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
    order.paymentStatus = 'demo_completed';
    order.demoPaymentOutcome = 'success';
    order.upiReference = simRef;
    order.demoFailureReason = undefined;
    order.paymentVerificationNotes = 'DEMO SIMULATION: Simulated successful payment for College Expo (DEMO — NO REAL MONEY TRANSFERRED)';
    order.demoSimulatedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    writeDB(db);

    return res.json({
      success: true,
      order,
      message: `Demo payment simulated successfully! Reference: ${simRef}. (DEMO — NO REAL MONEY TRANSFERRED)`
    });
  } else {
    const reason = typeof failureReason === 'string' && failureReason.trim()
      ? failureReason.trim()
      : 'Simulated bank network decline';
    order.paymentStatus = 'demo_failed';
    order.demoPaymentOutcome = 'failure';
    order.demoFailureReason = reason;
    order.paymentVerificationNotes = `DEMO SIMULATION FAILED: ${reason} (DEMO — NO REAL MONEY TRANSFERRED)`;
    order.demoSimulatedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    writeDB(db);

    return res.json({
      success: true,
      order,
      message: `Demo payment simulated as Failed: "${reason}". (DEMO — NO REAL MONEY TRANSFERRED)`
    });
  }
});

// 5.3 VENDOR PAYMENT VERIFICATION & RECORDING (Mark as Verified, Received, or Failed)
app.patch('/api/orders/:id/verify-payment', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { status, verificationNotes, notes } = req.body;

  const validPaymentStatuses = ['verified', 'failed', 'received'];
  if (!status || !validPaymentStatuses.includes(status)) {
    return res.status(400).json({ error: 'Payment status must be marked as either "verified", "received", or "failed".' });
  }

  const db = readDB();
  const orderIndex = (db.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const order = db.orders[orderIndex];

  // Prevent cross-contamination with demo orders
  if (order.isDemoPayment || order.paymentMethod === 'demo') {
    return res.status(400).json({
      error: 'Demo orders cannot be processed through real bank verification. Use the Demo Simulation panel. (DEMO — NO REAL MONEY TRANSFERRED)'
    });
  }

  // Ensure vendor can only verify payments for their own establishment's orders
  const isVendorOwner = user.role === 'vendor' && (
    user.organizationId === order.restaurantId ||
    !user.organizationId ||
    (db.restaurants || []).some(r => r.id === order.restaurantId && r.ownerId === user.id)
  );
  const isAdmin = user.role === 'admin';

  if (!isVendorOwner && !isAdmin) {
    return res.status(403).json({ error: 'You are only authorized to verify payments for orders from your own establishment.' });
  }

  // Before marking a UPI order as verified, require that the customer has submitted a non-empty UTR (upiReference)
  if (status === 'verified') {
    if (order.paymentMethod === 'upi' && (!order.upiReference || !order.upiReference.trim())) {
      return res.status(400).json({ error: 'Cannot verify payment: Customer has not submitted a UPI reference (UTR) yet.' });
    }
  }

  // Accept both verificationNotes and notes for backward compatibility
  const rawNotes = verificationNotes !== undefined ? verificationNotes : notes;
  const suppliedNotes = typeof rawNotes === 'string' ? rawNotes.trim() : '';

  order.paymentStatus = status as PaymentStatus;
  order.paymentVerifiedAt = new Date().toISOString();

  if (status === 'verified' || status === 'received') {
    // When marking an order verified or received, clear any stale failure note.
    const defaultNote = order.paymentMethod === 'pay_on_pickup'
      ? 'In-person payment recorded as received by vendor at counter'
      : 'Payment manually verified by vendor';
    order.paymentVerificationNotes = suppliedNotes || defaultNote;
  } else {
    // When marking an order failed, save the supplied reason or a sensible default.
    order.paymentVerificationNotes = suppliedNotes || 'Payment verification failed: Amount mismatch or UTR not found';
  }

  order.updatedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    success: true,
    order,
    message: (status === 'verified' || status === 'received')
      ? `Payment for Order #${order.orderNumber} (₹${order.totalAmount}) successfully recorded as ${status}.`
      : `Payment for Order #${order.orderNumber} marked as Failed.`
  });
});

// 5.4 VENDOR RECORD PAY ON PICKUP PAYMENT (Convenience endpoint)
app.post('/api/orders/:id/record-payment', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { notes, status = 'received' } = req.body;

  const db = readDB();
  const orderIndex = (db.orders || []).findIndex(o => o.id === id || o.orderNumber === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const order = db.orders[orderIndex];

  const isVendorOwner = user.role === 'vendor' && (
    user.organizationId === order.restaurantId ||
    !user.organizationId ||
    (db.restaurants || []).some(r => r.id === order.restaurantId && r.ownerId === user.id)
  );
  const isAdmin = user.role === 'admin';

  if (!isVendorOwner && !isAdmin) {
    return res.status(403).json({ error: 'You are only authorized to record payments for orders from your own establishment.' });
  }

  const paymentStatusToSet = (status === 'verified' || status === 'received') ? status : 'received';
  order.paymentStatus = paymentStatusToSet as PaymentStatus;
  order.paymentVerifiedAt = new Date().toISOString();
  order.paymentVerificationNotes = (typeof notes === 'string' && notes.trim()) ? notes.trim() : 'In-person payment recorded as received by vendor at counter';
  order.updatedAt = new Date().toISOString();

  writeDB(db);

  res.json({
    success: true,
    order,
    message: `Payment for Order #${order.orderNumber} (₹${order.totalAmount}) successfully recorded as received.`
  });
});

// 6. Food Donation and NGO/Volunteer Rescue Endpoints

// 6.1 BROWSE DONATIONS (All active/available donations)
app.get('/api/donations', (req: Request, res: Response) => {
  const db = readDB();
  const { restaurantId, status } = req.query;

  let list = db.donations || [];
  if (restaurantId && typeof restaurantId === 'string') {
    list = list.filter(d => d.restaurantId === restaurantId);
  }
  if (status && typeof status === 'string') {
    list = list.filter(d => d.status === status);
  }

  // Enrich with request count and traceable batchIdentifier
  const enriched = list.map(d => {
    let batchId = d.batchIdentifier;
    if (!batchId && d.inventoryId) {
      const inv = (db.inventory || []).find(i => i.id === d.inventoryId);
      if (inv) {
        batchId = inv.batchIdentifier || `Batch #${inv.id.replace('inv_', '').slice(-4)}`;
      }
    }
    if (!batchId) {
      batchId = `Batch #${d.id.replace('don_', '').slice(-4)}`;
    }
    return {
      ...d,
      batchIdentifier: batchId,
      requestsCount: (db.donationRequests || []).filter(r => r.donationId === d.id).length
    };
  });

  res.json({ donations: enriched });
});

// 6.2 GET SINGLE DONATION DETAILS
app.get('/api/donations/:id', (req: Request, res: Response) => {
  const db = readDB();
  const { id } = req.params;
  const donation = (db.donations || []).find(d => d.id === id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation listing not found.' });
  }

  let batchId = donation.batchIdentifier;
  if (!batchId && donation.inventoryId) {
    const inv = (db.inventory || []).find(i => i.id === donation.inventoryId);
    if (inv) {
      batchId = inv.batchIdentifier || `Batch #${inv.id.replace('inv_', '').slice(-4)}`;
    }
  }

  const enrichedDonation = {
    ...donation,
    batchIdentifier: batchId || `Batch #${donation.id.replace('don_', '').slice(-4)}`
  };

  const requests = (db.donationRequests || []).filter(r => r.donationId === id);
  res.json({ donation: enrichedDonation, requests });
});

// 6.3 VENDOR PUBLISHES DONATION FROM INVENTORY (Atomic stock connection)
app.post('/api/donations', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { 
    inventoryId, dishId, quantity, quantityPortions, 
    pickupDeadline, pickupLocation, prepTime, 
    handlingNotes, confirmedSuitable 
  } = req.body;

  // Food safety mandatory confirmation
  if (!confirmedSuitable) {
    return res.status(400).json({ 
      error: 'Food Safety Verification Required: As per food safety guidelines, you must verify and confirm that the food is freshly prepared, hygienically packaged, and safe for human consumption before offering it for donation.' 
    });
  }

  if (!pickupDeadline || !String(pickupDeadline).trim()) {
    return res.status(400).json({ error: 'Pickup deadline is required so NGOs and volunteers can collect the food promptly.' });
  }

  const qty = Number(quantity || quantityPortions);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Donation quantity must be a positive number greater than 0.' });
  }

  const db = readDB();

  // Find inventory item
  const invIndex = db.inventory.findIndex(i => i.id === inventoryId || i.dishId === dishId);
  if (invIndex === -1) {
    return res.status(404).json({ error: 'Inventory food item not found.' });
  }

  const invItem = db.inventory[invIndex];

  // Vendor ownership check
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== invItem.restaurantId) {
    return res.status(403).json({ error: 'You are only authorized to offer food donations from your own establishment.' });
  }

  // CRITICAL CHECK: Sold meals cannot be donated, and donations cannot exceed available remaining stock
  if (invItem.remainingQty < qty) {
    return res.status(400).json({ 
      error: `Cannot allocate ${qty} portions for donation. Only ${invItem.remainingQty} portions are remaining in available stock.` 
    });
  }

  // ATOMIC ALLOCATION:
  // Allocate portions from remaining stock into donationAllocatedQty
  invItem.donationAllocatedQty = (invItem.donationAllocatedQty || 0) + qty;
  invItem.remainingQty = Math.max(0, invItem.preparedQty - invItem.soldQty - invItem.reservedQty - invItem.donationAllocatedQty);
  invItem.status = invItem.remainingQty === 0 ? 'sold_out' : invItem.remainingQty <= 3 ? 'low_stock' : 'in_stock';
  invItem.isDonationEligible = true;
  invItem.updatedAt = new Date().toISOString();

  // Sync associated catalog dish so customers cannot buy these allocated units
  const dishIndex = db.dishes.findIndex(d => d.id === invItem.dishId);
  if (dishIndex !== -1) {
    db.dishes[dishIndex].remainingQty = invItem.remainingQty;
    db.dishes[dishIndex].isSoldOut = invItem.remainingQty === 0;
  }

  const restaurant = db.restaurants.find(r => r.id === invItem.restaurantId) || db.restaurants[0];

  const newDonation: DonationOffer = {
    id: `don_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    inventoryId: invItem.id,
    dishId: invItem.dishId,
    dishName: invItem.dishName,
    batchIdentifier: invItem.batchIdentifier || (db.inventory.filter(i => i.restaurantId === invItem.restaurantId && i.dishName.trim().toLowerCase() === invItem.dishName.trim().toLowerCase()).length > 1 ? `Batch #${invItem.id.replace('inv_', '').slice(-4)}` : undefined),
    description: handlingNotes ? `${invItem.dishName} — ${handlingNotes}` : (invItem.description || `Freshly prepared meal batch from ${restaurant.name}.`),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    pickupLocation: (pickupLocation && String(pickupLocation).trim()) || restaurant.address,
    prepTime: (prepTime && String(prepTime).trim()) || 'Freshly prepared today',
    pickupDeadline: String(pickupDeadline).trim(),
    handlingNotes: (handlingNotes && String(handlingNotes).trim()) || 'Kept in temperature-controlled hygienic containers.',
    confirmedSuitable: true,
    initialQuantity: qty,
    availableQuantity: qty,
    allocatedQuantity: 0,
    collectedQuantity: 0,
    quantityPortions: qty,
    dietaryInfo: ['Vegetarian'],
    status: 'available',
    requestsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.donations.unshift(newDonation);
  writeDB(db);

  res.status(201).json({ 
    success: true, 
    donation: newDonation, 
    remainingStock: invItem.remainingQty,
    message: `Published ${qty} portions of "${invItem.dishName}" for NGO donation. Remaining customer stock: ${invItem.remainingQty}.`
  });
});

// 6.4 VENDOR EDITS DONATION LISTING
app.patch('/api/donations/:id', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { pickupDeadline, pickupLocation, prepTime, handlingNotes } = req.body;

  const db = readDB();
  const donIndex = db.donations.findIndex(d => d.id === id);
  if (donIndex === -1) {
    return res.status(404).json({ error: 'Donation listing not found.' });
  }

  const donation = db.donations[donIndex];
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== donation.restaurantId) {
    return res.status(403).json({ error: 'You are only authorized to edit your own donation listings.' });
  }

  if (pickupDeadline) donation.pickupDeadline = String(pickupDeadline).trim();
  if (pickupLocation) donation.pickupLocation = String(pickupLocation).trim();
  if (prepTime) donation.prepTime = String(prepTime).trim();
  if (handlingNotes) donation.handlingNotes = String(handlingNotes).trim();
  donation.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, donation, message: 'Donation listing updated successfully.' });
});

// 6.5 VENDOR CANCELS DONATION LISTING (Safe stock restoration when uncollected)
app.post('/api/donations/:id/cancel', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDB();
  const donIndex = db.donations.findIndex(d => d.id === id);
  if (donIndex === -1) {
    return res.status(404).json({ error: 'Donation listing not found.' });
  }

  const donation = db.donations[donIndex];
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== donation.restaurantId) {
    return res.status(403).json({ error: 'You are only authorized to cancel your own donation listings.' });
  }

  // CRITICAL RULE: Collected food is NEVER returned to available inventory
  if (donation.status === 'collected' || (donation.collectedQuantity || 0) > 0) {
    return res.status(400).json({ error: 'Cannot cancel a donation listing where food has already been collected.' });
  }

  // Cancel any associated non-collected requests
  if (db.donationRequests) {
    db.donationRequests.forEach(r => {
      if (r.donationId === id && r.status !== 'collected') {
        r.status = 'cancelled';
        r.cancelledAt = new Date().toISOString();
        r.cancellationReason = reason || 'Vendor cancelled donation listing';
      }
    });
  }

  // SAFE STOCK RESTORATION: Restore uncollected portions to inventory
  const portionsToRestore = donation.availableQuantity + (donation.allocatedQuantity || 0);
  const invItem = db.inventory.find(i => i.id === donation.inventoryId || i.dishId === donation.dishId);
  if (invItem && portionsToRestore > 0) {
    invItem.donationAllocatedQty = Math.max(0, (invItem.donationAllocatedQty || 0) - portionsToRestore);
    invItem.remainingQty = Math.max(0, invItem.preparedQty - invItem.soldQty - invItem.reservedQty - invItem.donationAllocatedQty);
    invItem.status = invItem.remainingQty === 0 ? 'sold_out' : invItem.remainingQty <= 3 ? 'low_stock' : 'in_stock';
    invItem.updatedAt = new Date().toISOString();

    const dishIdx = db.dishes.findIndex(d => d.id === invItem.dishId);
    if (dishIdx !== -1) {
      db.dishes[dishIdx].remainingQty = invItem.remainingQty;
      db.dishes[dishIdx].isSoldOut = invItem.remainingQty === 0;
    }
  }

  donation.status = 'cancelled';
  donation.cancelledAt = new Date().toISOString();
  donation.availableQuantity = 0;
  donation.allocatedQuantity = 0;
  donation.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ 
    success: true, 
    donation, 
    restoredPortions: portionsToRestore, 
    remainingStock: invItem?.remainingQty,
    message: `Donation listing cancelled. ${portionsToRestore} portion(s) safely restored to inventory.` 
  });
});

// 6.6 NGO REQUESTS SPECIFIC QUANTITY OF AVAILABLE DONATION
app.post('/api/donations/:id/request', requireRole(['ngo', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { requestedQuantity, volunteerName, volunteerPhone, notes } = req.body;

  const db = readDB();
  const donIndex = db.donations.findIndex(d => d.id === id);
  if (donIndex === -1) {
    return res.status(404).json({ error: 'Donation listing not found.' });
  }

  const donation = db.donations[donIndex];

  if (donation.status === 'cancelled' || donation.status === 'collected' || donation.status === 'rejected') {
    return res.status(400).json({ error: 'This donation listing is no longer available for new requests.' });
  }

  const reqQty = Number(requestedQuantity);
  if (isNaN(reqQty) || reqQty <= 0) {
    return res.status(400).json({ error: 'Requested quantity must be at least 1 portion.' });
  }

  // Multiple NGOs cannot claim more food than is available
  if (reqQty > donation.availableQuantity) {
    return res.status(400).json({ 
      error: `Cannot request ${reqQty} portions. Only ${donation.availableQuantity} portion(s) are remaining available for donation.` 
    });
  }

  // ATOMIC RESERVATION ON DONATION LISTING
  donation.availableQuantity -= reqQty;
  donation.allocatedQuantity = (donation.allocatedQuantity || 0) + reqQty;
  if (donation.availableQuantity === 0 && donation.status === 'available') {
    donation.status = 'requested';
  }
  donation.requestsCount = (donation.requestsCount || 0) + 1;
  donation.updatedAt = new Date().toISOString();

  const newRequest: DonationRequest = {
    id: `dreq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    donationId: donation.id,
    inventoryId: donation.inventoryId,
    dishId: donation.dishId,
    dishName: donation.dishName,
    batchIdentifier: donation.batchIdentifier,
    restaurantId: donation.restaurantId,
    restaurantName: donation.restaurantName,
    pickupLocation: donation.pickupLocation,
    pickupDeadline: donation.pickupDeadline,
    prepTime: donation.prepTime,
    handlingNotes: donation.handlingNotes,
    ngoId: user.organizationId || user.id,
    ngoName: 'City Food Rescue Alliance',
    volunteerName: (volunteerName && String(volunteerName).trim()) || user.name,
    volunteerPhone: (volunteerPhone && String(volunteerPhone).trim()) || '',
    requestedQuantity: reqQty,
    status: 'requested',
    notes: (notes && String(notes).trim()) || 'Requested by authorized NGO volunteer coordinator.',
    createdAt: new Date().toISOString()
  };

  if (!db.donationRequests) db.donationRequests = [];
  db.donationRequests.unshift(newRequest);

  writeDB(db);

  res.status(201).json({
    success: true,
    request: newRequest,
    remainingAvailable: donation.availableQuantity,
    message: `Request for ${reqQty} portion(s) submitted successfully. Waiting for vendor approval.`
  });
});

// 6.7 NGO REQUESTS LIST (For NGO / Volunteer Dashboard)
app.get('/api/ngo/requests', requireRole(['ngo', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();

  let requests = db.donationRequests || [];
  if (user.role === 'ngo') {
    // Return requests by this NGO or user
    requests = requests.filter(r => r.ngoId === user.organizationId || r.ngoId === user.id || !r.ngoId);
  }

  res.json({ requests });
});

// 6.8 VENDOR DONATION REQUESTS LIST (For Vendor Dashboard)
app.get('/api/vendor/donation-requests', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();

  let requests = db.donationRequests || [];
  if (user.role === 'vendor' && user.organizationId) {
    requests = requests.filter(r => r.restaurantId === user.organizationId);
  }

  res.json({ requests });
});

// 6.9 VENDOR APPROVES DONATION REQUEST
app.post('/api/donation-requests/:id/approve', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;

  const db = readDB();
  const reqIndex = (db.donationRequests || []).findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Donation request not found.' });
  }

  const request = db.donationRequests[reqIndex];
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== request.restaurantId) {
    return res.status(403).json({ error: 'You are only authorized to approve requests for your own establishment.' });
  }

  if (request.status !== 'requested') {
    return res.status(400).json({ error: `Cannot approve request with current status: ${request.status}` });
  }

  request.status = 'approved';
  request.approvedAt = new Date().toISOString();

  const don = db.donations.find(d => d.id === request.donationId);
  if (don && don.status !== 'collected') {
    don.status = 'approved';
    don.updatedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json({ 
    success: true, 
    request, 
    message: `Request for ${request.requestedQuantity} portions approved. You can now prepare packages and mark Ready for Pickup.` 
  });
});

// 6.10 VENDOR REJECTS DONATION REQUEST (Safely returns portions to available pool)
app.post('/api/donation-requests/:id/reject', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDB();
  const reqIndex = (db.donationRequests || []).findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Donation request not found.' });
  }

  const request = db.donationRequests[reqIndex];
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== request.restaurantId) {
    return res.status(403).json({ error: 'You are only authorized to reject requests for your own establishment.' });
  }

  if (request.status === 'collected') {
    return res.status(400).json({ error: 'Cannot reject an already collected request.' });
  }

  request.status = 'rejected';
  request.rejectedAt = new Date().toISOString();
  request.rejectionReason = (reason && String(reason).trim()) || 'Declined by vendor due to timing or kitchen capacity.';

  // Return allocated portions back to donation listing
  const don = db.donations.find(d => d.id === request.donationId);
  if (don) {
    don.availableQuantity += request.requestedQuantity;
    don.allocatedQuantity = Math.max(0, (don.allocatedQuantity || 0) - request.requestedQuantity);
    if (don.availableQuantity > 0 && don.status !== 'cancelled') {
      don.status = 'available';
    }
    don.updatedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json({ 
    success: true, 
    request, 
    message: `Request rejected. ${request.requestedQuantity} portion(s) returned to available donation pool.` 
  });
});

// 6.11 VENDOR MARKS READY FOR PICKUP
app.post('/api/donation-requests/:id/ready-for-pickup', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;

  const db = readDB();
  const reqIndex = (db.donationRequests || []).findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Donation request not found.' });
  }

  const request = db.donationRequests[reqIndex];
  if (user.role === 'vendor' && user.organizationId && user.organizationId !== request.restaurantId) {
    return res.status(403).json({ error: 'You are only authorized to update requests for your own establishment.' });
  }

  if (request.status !== 'approved') {
    return res.status(400).json({ error: 'Request must be approved before marking ready for pickup.' });
  }

  request.status = 'ready_for_pickup';
  request.readyAt = new Date().toISOString();

  const don = db.donations.find(d => d.id === request.donationId);
  if (don) {
    don.status = 'ready_for_pickup';
    don.updatedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json({ 
    success: true, 
    request, 
    message: `Marked ${request.requestedQuantity} portion(s) as Ready for Pickup.` 
  });
});

// 6.12 CONFIRM COLLECTION (Safe, clear workflow for NGO Volunteer or Vendor)
app.post('/api/donation-requests/:id/collect', requireRole(['ngo', 'vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;

  const db = readDB();
  const reqIndex = (db.donationRequests || []).findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Donation request not found.' });
  }

  const request = db.donationRequests[reqIndex];

  // Authorization check
  const isAuthorizedNGO = user.role === 'ngo' && (user.organizationId === request.ngoId || !request.ngoId || user.id === request.ngoId);
  const isAuthorizedVendor = user.role === 'vendor' && (user.organizationId === request.restaurantId || !user.organizationId);
  const isAdmin = user.role === 'admin';

  if (!isAuthorizedNGO && !isAuthorizedVendor && !isAdmin) {
    return res.status(403).json({ error: 'Unauthorized to confirm collection for this donation request.' });
  }

  if (request.status === 'collected') {
    return res.status(400).json({ error: 'This donation has already been marked as collected.' });
  }

  if (request.status === 'cancelled' || request.status === 'rejected') {
    return res.status(400).json({ error: `Cannot collect a ${request.status} donation request.` });
  }

  // Update request
  request.status = 'collected';
  request.collectedAt = new Date().toISOString();

  // Update parent donation offer
  const don = db.donations.find(d => d.id === request.donationId);
  if (don) {
    don.collectedQuantity = (don.collectedQuantity || 0) + request.requestedQuantity;
    don.allocatedQuantity = Math.max(0, (don.allocatedQuantity || 0) - request.requestedQuantity);
    if (don.availableQuantity === 0 && don.allocatedQuantity === 0) {
      don.status = 'collected';
      don.completedAt = new Date().toISOString();
    }
    don.updatedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json({ 
    success: true, 
    request, 
    message: `Collection confirmed! ${request.requestedQuantity} meal(s) successfully rescued and added to verified Impact statistics.` 
  });
});

// 6.13 NGO CANCELS REQUEST (Before collection only)
app.post('/api/donation-requests/:id/cancel', requireRole(['ngo', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { reason } = req.body;

  const db = readDB();
  const reqIndex = (db.donationRequests || []).findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Donation request not found.' });
  }

  const request = db.donationRequests[reqIndex];
  if (user.role === 'ngo' && user.organizationId && user.organizationId !== request.ngoId) {
    return res.status(403).json({ error: 'You are only authorized to cancel requests from your own organization.' });
  }

  // CRITICAL RULE: Collected food can never be cancelled
  if (request.status === 'collected') {
    return res.status(400).json({ error: 'Cannot cancel a donation request that has already been collected.' });
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date().toISOString();
  request.cancellationReason = (reason && String(reason).trim()) || 'Cancelled by NGO coordinator.';

  // Return portions back to donation listing available pool
  const don = db.donations.find(d => d.id === request.donationId);
  if (don) {
    don.availableQuantity += request.requestedQuantity;
    don.allocatedQuantity = Math.max(0, (don.allocatedQuantity || 0) - request.requestedQuantity);
    if (don.availableQuantity > 0 && don.status !== 'cancelled') {
      don.status = 'available';
    }
    don.updatedAt = new Date().toISOString();
  }

  writeDB(db);
  res.json({ 
    success: true, 
    request, 
    message: `Request cancelled. ${request.requestedQuantity} portion(s) safely restored to donation availability.` 
  });
});

// 6.14 END-OF-DAY / CLOSING TIME LEFTOVER RECONCILIATION PROMPT
app.get('/api/vendor/closing-time-check', requireRole(['vendor', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();

  let vendorInventory = db.inventory;
  if (user.role === 'vendor' && user.organizationId) {
    vendorInventory = vendorInventory.filter(i => i.restaurantId === user.organizationId);
  }

  const unsoldItems = vendorInventory.filter(i => i.remainingQty > 0);
  const totalUnsoldPortions = unsoldItems.reduce((acc, i) => acc + i.remainingQty, 0);

  res.json({
    closingTimePrompt: totalUnsoldPortions > 0,
    unsoldItemsCount: unsoldItems.length,
    totalUnsoldPortions,
    unsoldItems: unsoldItems.map(i => ({
      id: i.id,
      dishId: i.dishId,
      dishName: i.dishName,
      preparedQty: i.preparedQty,
      soldQty: i.soldQty,
      remainingQty: i.remainingQty,
      category: i.category,
      price: i.price,
      isDonationEligible: i.isDonationEligible !== false
    })),
    message: totalUnsoldPortions > 0 
      ? `Closing time check: You have ${totalUnsoldPortions} unsold portion(s) across ${unsoldItems.length} item(s). Confirm safe leftovers to publish for NGO food rescue.`
      : 'All prepared portions have been sold or allocated. No leftover surplus remaining.'
  });
});

// 6.15 BACKWARD COMPATIBILITY: Legacy claim & pickup wrappers
app.post('/api/donations/:id/claim', requireRole(['ngo', 'admin']), (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { id } = req.params;
  const { notes, volunteerName, quantity } = req.body;

  const db = readDB();
  const donIndex = db.donations.findIndex(d => d.id === id);
  if (donIndex === -1) {
    return res.status(404).json({ error: 'Donation listing not found' });
  }

  const donation = db.donations[donIndex];
  if (donation.availableQuantity <= 0) {
    return res.status(400).json({ error: 'This donation is already fully requested or claimed.' });
  }

  const claimQty = Number(quantity || donation.availableQuantity);
  donation.availableQuantity -= claimQty;
  donation.allocatedQuantity = (donation.allocatedQuantity || 0) + claimQty;
  donation.status = 'approved';
  donation.claimedByNGOId = user.organizationId || 'ngo_1';
  donation.claimedByNGOName = 'City Food Rescue Alliance';
  donation.claimedByVolunteerName = volunteerName || user.name;
  donation.claimedAt = new Date().toISOString();
  donation.notes = notes || 'Volunteer scheduled for pickup';
  donation.updatedAt = new Date().toISOString();

  // Create corresponding request
  const newRequest: DonationRequest = {
    id: `dreq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    donationId: donation.id,
    inventoryId: donation.inventoryId,
    dishId: donation.dishId,
    dishName: donation.dishName,
    restaurantId: donation.restaurantId,
    restaurantName: donation.restaurantName,
    pickupLocation: donation.pickupLocation,
    pickupDeadline: donation.pickupDeadline,
    prepTime: donation.prepTime,
    handlingNotes: donation.handlingNotes,
    ngoId: user.organizationId || user.id,
    ngoName: 'City Food Rescue Alliance',
    volunteerName: (volunteerName && String(volunteerName).trim()) || user.name,
    requestedQuantity: claimQty,
    status: 'approved',
    notes: notes || 'Legacy claimed donation.',
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString()
  };

  if (!db.donationRequests) db.donationRequests = [];
  db.donationRequests.unshift(newRequest);

  writeDB(db);
  res.json({ donation, request: newRequest });
});

app.post('/api/donations/:id/pickup', requireRole(['ngo', 'vendor', 'admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const donIndex = db.donations.findIndex(d => d.id === id);
  if (donIndex === -1) {
    return res.status(404).json({ error: 'Donation listing not found' });
  }

  const donation = db.donations[donIndex];
  donation.status = 'collected';
  donation.collectedQuantity = donation.initialQuantity;
  donation.allocatedQuantity = 0;
  donation.availableQuantity = 0;
  donation.completedAt = new Date().toISOString();
  donation.updatedAt = new Date().toISOString();

  // Mark all associated requests as collected
  if (db.donationRequests) {
    db.donationRequests.forEach(r => {
      if (r.donationId === id && r.status !== 'collected') {
        r.status = 'collected';
        r.collectedAt = new Date().toISOString();
      }
    });
  }

  writeDB(db);
  res.json({ donation });
});

// 7. Ratings, Reviews & Personalized Recommendations
app.post('/api/ratings', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const { dishId, rating, reviewText, tasteTags } = req.body;

  if (!dishId || rating === undefined) {
    return res.status(400).json({ error: 'dishId and rating are required' });
  }

  const db = readDB();
  const dish = db.dishes.find(d => d.id === dishId);
  if (!dish) {
    return res.status(404).json({ error: 'Dish not found' });
  }

  const newRating: DishRating = {
    id: `rat_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    dishId,
    dishName: dish.name,
    restaurantId: dish.restaurantId,
    rating: Number(rating),
    reviewText: reviewText || '',
    tasteTags: tasteTags || dish.flavorProfile,
    createdAt: new Date().toISOString()
  };

  db.ratings.unshift(newRating);

  const dishRatings = db.ratings.filter(r => r.dishId === dishId);
  const avg = dishRatings.reduce((sum, r) => sum + r.rating, 0) / dishRatings.length;
  dish.rating = Math.round(avg * 10) / 10;
  dish.ratingCount = dishRatings.length;

  if (Number(rating) >= 4) {
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      const u = db.users[userIndex];
      if (!u.tasteProfile.favoriteCuisines.includes(dish.category)) {
        u.tasteProfile.favoriteCuisines.push(dish.category);
      }
      dish.flavorProfile.forEach(flavor => {
        if (!u.tasteProfile.flavorPreferences.includes(flavor)) {
          u.tasteProfile.flavorPreferences.push(flavor);
        }
      });
    }
  }

  writeDB(db);
  res.status(201).json({ rating: newRating, dishUpdatedRating: dish.rating });
});

app.get('/api/dishes/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const dish = db.dishes.find(d => d.id === id);
  if (!dish) {
    return res.status(404).json({ error: 'Dish not found' });
  }

  const currentUser = getUserFromHeader(req) || getActiveUser(req);
  const myProfile = currentUser?.tasteProfile;

  const rawReviews = (db.ratings || []).filter(r => r.dishId === id);

  // Enrich with reviewer data & compute truthful taste similarity with requesting user
  const enrichedReviews = rawReviews.map(r => {
    const reviewer = db.users.find(u => u.id === r.userId);
    const revProfile = reviewer?.tasteProfile;

    let simScore = 50; // base default
    if (currentUser && r.userId === currentUser.id) {
      simScore = 100;
    } else if (revProfile && myProfile) {
      // Overlap on favorite cuisines
      const myCuisines = myProfile.favoriteCuisines || [];
      const theirCuisines = revProfile.favoriteCuisines || [];
      const sharedCuisines = myCuisines.filter(c => theirCuisines.includes(c));
      const totalCuisines = new Set([...myCuisines, ...theirCuisines]);
      const cuisineScore = totalCuisines.size > 0 ? (sharedCuisines.length / totalCuisines.size) * 35 : 15;

      // Overlap on flavor preferences
      const myFlavors = myProfile.flavorPreferences || [];
      const theirFlavors = revProfile.flavorPreferences || [];
      const sharedFlavors = myFlavors.filter(f => theirFlavors.includes(f));
      const flavorScore = sharedFlavors.length > 0 ? Math.min(30, sharedFlavors.length * 10) : 10;

      // Overlap on texture preferences
      const myTextures = myProfile.texturePreferences || [];
      const theirTextures = revProfile.texturePreferences || [];
      const sharedTextures = myTextures.filter(t => theirTextures.includes(t));
      const textureScore = sharedTextures.length > 0 ? Math.min(20, sharedTextures.length * 10) : 10;

      // Spice tolerance alignment
      const spiceScore = myProfile.spiceTolerance === revProfile.spiceTolerance ? 15 : 5;

      simScore = Math.min(99, Math.round(cuisineScore + flavorScore + textureScore + spiceScore));
    }

    const isTasteTwin = simScore >= 65 || Boolean(reviewer && reviewer.id !== currentUser?.id && reviewer.tasteProfile?.isTasteTwinDiscoverable);

    return {
      ...r,
      userAvatar: reviewer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      reviewerTasteProfile: revProfile,
      similarityScore: simScore,
      isTasteTwin
    };
  });

  // Sort: higher similarity first, then newer
  enrichedReviews.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Reviews from people like you: reviewers with similarity >= 60%
  const otherReviews = enrichedReviews.filter(r => r.userId !== currentUser?.id);
  const reviewsFromPeopleLikeYou = otherReviews.filter(r => (r.similarityScore || 0) >= 60);

  const avg = enrichedReviews.length > 0
    ? Math.round((enrichedReviews.reduce((sum, r) => sum + r.rating, 0) / enrichedReviews.length) * 10) / 10
    : dish.rating;

  res.json({
    dish,
    reviews: enrichedReviews,
    reviewsFromPeopleLikeYou: reviewsFromPeopleLikeYou.length > 0 ? reviewsFromPeopleLikeYou : otherReviews,
    averageRating: avg,
    totalCount: enrichedReviews.length
  });
});

app.get('/api/recommendations', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = readDB();

  const userRatings = db.ratings.filter(r => r.userId === user.id);
  const profile = user.tasteProfile;

  const recommendations = db.dishes.map(dish => {
    let score = 0;
    const matchReasons: string[] = [];

    if (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) {
      const hasConflict = profile.dietaryRestrictions.some(
        reqDiet => !dish.dietary.includes(reqDiet as any)
      );
      if (hasConflict) return null;
      score += 30;
      matchReasons.push(`Matches your ${profile.dietaryRestrictions.join(', ')} dietary choice`);
    }

    const matchesCuisine = profile.favoriteCuisines.some(
      c => c.toLowerCase() === dish.category.toLowerCase() || c.toLowerCase() === dish.cuisine.toLowerCase()
    );
    if (matchesCuisine) {
      score += 35;
      matchReasons.push(`In your favorite category: ${dish.category}`);
    }

    const highRatedSame = userRatings.find(
      r => r.rating >= 4 && db.dishes.find(d => d.id === r.dishId)?.category === dish.category
    );
    if (highRatedSame) {
      score += 25;
      matchReasons.push(`You gave 5★ to ${highRatedSame.dishName}`);
    }

    const sharedFlavors = dish.flavorProfile.filter(f => (profile.flavorPreferences || []).includes(f));
    if (sharedFlavors.length > 0) {
      score += sharedFlavors.length * 10;
      matchReasons.push(`Features ${sharedFlavors.join(' & ')} notes you crave`);
    }

    const dishTextures = dish.textureProfile || [];
    const sharedTextures = dishTextures.filter(t => (profile.texturePreferences || []).includes(t));
    if (sharedTextures.length > 0) {
      score += sharedTextures.length * 10;
      matchReasons.push(`Matches your preference for ${sharedTextures.join(' & ')} texture`);
    }

    if (profile.spiceTolerance === 'hot' && dish.spiceLevel >= 2) {
      score += 15;
      matchReasons.push('Delivers the spicy kick you prefer');
    }

    score += Math.round(dish.rating * 5);

    let explanation = '';
    if (highRatedSame) {
      explanation = `Recommended because you loved ${highRatedSame.dishName} and crave ${dish.category}.`;
    } else if (sharedTextures.length > 0 && sharedFlavors.length > 0) {
      explanation = `Recommended because you enjoy ${sharedTextures.join(', ')} texture and ${sharedFlavors.join(', ')} flavors in ${dish.cuisine}.`;
    } else if (sharedFlavors.length > 0) {
      explanation = `Recommended because you enjoy ${sharedFlavors.join(', ')} food in ${dish.cuisine}.`;
    } else if (sharedTextures.length > 0) {
      explanation = `Recommended for its delightful ${sharedTextures.join(', ')} texture in ${dish.category}.`;
    } else if (matchesCuisine) {
      explanation = `Recommended because ${dish.category} is one of your top craved categories.`;
    } else {
      explanation = `Popular choice rated ${dish.rating}★ with artisan culinary preparation.`;
    }

    return { dish, score, matchReasons, explanation };
  }).filter(Boolean);

  recommendations.sort((a, b) => b!.score - a!.score);
  res.json({ recommendations: recommendations.slice(0, 6) });
});


// 8. Taste Twins, Foodie Connections & Private Messaging
app.get('/api/taste-twins', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req) || getActiveUser(req);
  const db = readDB();

  // Candidates: real registered users, excluding self, respecting discoverability
  const candidates = db.users.filter(u => 
    u.id !== currentUser.id && 
    u.tasteProfile?.isTasteTwinDiscoverable !== false
  );

  const myProfile = currentUser.tasteProfile || {
    favoriteCuisines: [],
    flavorPreferences: [],
    texturePreferences: [],
    dietaryRestrictions: []
  };

  const myCuisines = myProfile.favoriteCuisines || [];
  const myFlavors = myProfile.flavorPreferences || [];
  const myTextures = myProfile.texturePreferences || [];
  const myDietary = myProfile.dietaryRestrictions || [];
  const mySpice = myProfile.spiceTolerance || 'medium';
  const hasMyProfile = myCuisines.length > 0 || myFlavors.length > 0 || myTextures.length > 0;

  const friendRequests = db.friendRequests || [];

  const twins = candidates.map(otherUser => {
    const theirProfile = otherUser.tasteProfile || {
      favoriteCuisines: [],
      flavorPreferences: [],
      texturePreferences: [],
      dietaryRestrictions: []
    };
    const theirCuisines = theirProfile.favoriteCuisines || [];
    const theirFlavors = theirProfile.flavorPreferences || [];
    const theirTextures = theirProfile.texturePreferences || [];
    const theirDietary = theirProfile.dietaryRestrictions || [];
    const theirSpice = theirProfile.spiceTolerance || 'medium';
    const hasTheirProfile = theirCuisines.length > 0 || theirFlavors.length > 0 || theirTextures.length > 0;

    const hasSufficientData = hasMyProfile && hasTheirProfile;

    let totalSim = 0;
    let matchReason = '';

    if (!hasSufficientData) {
      if (!hasMyProfile && !hasTheirProfile) {
        matchReason = 'Both palates incomplete. Save your Food Personality to calculate similarity.';
      } else if (!hasMyProfile) {
        matchReason = 'Complete your Food Personality profile to calculate palate overlap with this foodie.';
      } else {
        matchReason = `${theirProfile.tasteTwinAlias || otherUser.name} has not finished setting up their Food Personality yet.`;
      }
    } else {
      // 1. Cuisines overlap (weight: up to 40%)
      const sharedCuisines = myCuisines.filter(c => 
        theirCuisines.some(tc => tc.toLowerCase().trim() === c.toLowerCase().trim())
      );
      const allCuisines = new Set([...myCuisines, ...theirCuisines]);
      const cuisineScore = allCuisines.size > 0 ? (sharedCuisines.length / allCuisines.size) * 40 : 0;

      // 2. Flavor preferences overlap (weight: up to 25%)
      const sharedFlavors = myFlavors.filter(f => theirFlavors.includes(f));
      const allFlavors = new Set([...myFlavors, ...theirFlavors]);
      const flavorScore = allFlavors.size > 0 ? (sharedFlavors.length / allFlavors.size) * 25 : 0;

      // 3. Texture preferences overlap (weight: up to 15%)
      const sharedTextures = myTextures.filter(t => theirTextures.includes(t));
      const allTextures = new Set([...myTextures, ...theirTextures]);
      const textureScore = allTextures.size > 0 ? (sharedTextures.length / allTextures.size) * 15 : 0;

      // 4. Spice tolerance match (weight: up to 10%)
      const spiceLevels = ['mild', 'medium', 'hot', 'extra-hot'];
      const mySpiceIdx = spiceLevels.indexOf(mySpice);
      const theirSpiceIdx = spiceLevels.indexOf(theirSpice);
      let spiceScore = 0;
      if (mySpiceIdx !== -1 && theirSpiceIdx !== -1) {
        const diff = Math.abs(mySpiceIdx - theirSpiceIdx);
        if (diff === 0) spiceScore = 10;
        else if (diff === 1) spiceScore = 5;
      }

      // 5. Shared dish ratings (weight: up to 10%)
      const myRatings = db.ratings.filter(r => r.userId === currentUser.id);
      const theirRatings = db.ratings.filter(r => r.userId === otherUser.id);
      let sharedRatingCount = 0;
      myRatings.forEach(mr => {
        const tr = theirRatings.find(r => r.dishId === mr.dishId);
        if (tr && Math.abs(mr.rating - tr.rating) <= 1) sharedRatingCount++;
      });
      const ratingScore = Math.min(10, sharedRatingCount * 5);

      totalSim = Math.min(100, Math.round(cuisineScore + flavorScore + textureScore + spiceScore + ratingScore));

      // Construct truthful explanation from genuine shared attributes
      const reasons: string[] = [];
      if (sharedCuisines.length > 0) {
        reasons.push(`mutual love for ${sharedCuisines.slice(0, 2).join(' & ')}`);
      }
      if (sharedFlavors.length > 0) {
        reasons.push(`shared ${sharedFlavors.slice(0, 2).join(' and ')} flavor cravings`);
      }
      if (sharedTextures.length > 0) {
        reasons.push(`${sharedTextures[0]} texture affinity`);
      }
      if (spiceScore === 10) {
        reasons.push(`matching ${mySpice} spice tolerance`);
      }

      if (reasons.length > 0) {
        matchReason = `Matched through ${reasons.join(', ')}.`;
      } else {
        matchReason = 'Distinct culinary palates across cuisine categories and flavor profiles.';
      }
    }

    // Determine connection state between current user and otherUser
    let connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' = 'none';
    let requestId: string | undefined = undefined;

    const existingReq = friendRequests.find(r => 
      (r.senderId === currentUser.id && r.receiverId === otherUser.id) ||
      (r.receiverId === currentUser.id && r.senderId === otherUser.id)
    );

    if (existingReq) {
      if (existingReq.status === 'accepted') {
        connectionStatus = 'accepted';
        requestId = existingReq.id;
      } else if (existingReq.status === 'pending') {
        if (existingReq.senderId === currentUser.id) {
          connectionStatus = 'pending_sent';
          requestId = existingReq.id;
        } else {
          connectionStatus = 'pending_received';
          requestId = existingReq.id;
        }
      }
    }

    // Shared rated dishes
    const myRatings = db.ratings.filter(r => r.userId === currentUser.id);
    const theirRatings = db.ratings.filter(r => r.userId === otherUser.id);
    const sharedRatedDishes: { dishName: string; dishImage: string; rating: number }[] = [];
    myRatings.forEach(mr => {
      const tr = theirRatings.find(r => r.dishId === mr.dishId);
      if (tr && Math.abs(mr.rating - tr.rating) <= 1) {
        const dish = db.dishes.find(d => d.id === mr.dishId);
        if (dish) {
          sharedRatedDishes.push({
            dishName: dish.name,
            dishImage: dish.image,
            rating: Math.round(((mr.rating + tr.rating) / 2) * 10) / 10
          });
        }
      }
    });

    const recommendedFromTwin = theirRatings
      .filter(tr => tr.rating >= 4 && !myRatings.some(mr => mr.dishId === tr.dishId))
      .map(tr => {
        const d = db.dishes.find(dish => dish.id === tr.dishId);
        return {
          dishId: tr.dishId,
          dishName: tr.dishName,
          restaurantName: d ? d.restaurantName : 'Campus Kitchen',
          twinRating: tr.rating
        };
      });

    const twinReviews = theirRatings.map(tr => {
      const d = db.dishes.find(dish => dish.id === tr.dishId);
      return {
        id: tr.id,
        dishId: tr.dishId,
        dishName: tr.dishName,
        restaurantName: d ? d.restaurantName : 'Campus Kitchen',
        rating: tr.rating,
        reviewText: tr.reviewText,
        tasteTags: tr.tasteTags || [],
        createdAt: tr.createdAt
      };
    });

    // Sanitized user profile respecting privacy controls
    const publicUser = {
      id: otherUser.id,
      displayName: theirProfile.tasteTwinAlias || otherUser.name,
      avatar: otherUser.avatar,
      favoriteCuisines: theirCuisines,
      sharedDietary: myDietary.filter(d => theirDietary.includes(d)),
      flavorPreferences: theirProfile.showFlavorPreferences !== false ? theirFlavors : undefined,
      texturePreferences: theirProfile.showTexturePreferences !== false ? theirTextures : undefined,
      spiceTolerance: theirProfile.showSpiceTolerance !== false ? theirSpice : undefined
    };

    return {
      user: publicUser,
      similarityPercentage: totalSim,
      matchReason,
      hasSufficientData,
      connectionStatus,
      requestId,
      sharedFavoriteDishes: sharedRatedDishes,
      recommendedForYouFromTwin: recommendedFromTwin,
      twinReviews
    };
  });

  twins.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
  res.json({ twins });
});

// Foodie Connections & Requests Endpoints
app.get('/api/taste-twins/connections', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const db = readDB();
  const allRequests = db.friendRequests || [];

  const pendingReceived = allRequests.filter(r => r.receiverId === currentUser.id && r.status === 'pending');
  const pendingSent = allRequests.filter(r => r.senderId === currentUser.id && r.status === 'pending');
  
  const acceptedRequests = allRequests.filter(r => 
    r.status === 'accepted' && 
    (r.senderId === currentUser.id || r.receiverId === currentUser.id)
  );

  const myProfile = currentUser.tasteProfile;
  const myCuisines = myProfile?.favoriteCuisines || [];

  const connections: FoodieConnection[] = acceptedRequests.map(r => {
    const otherUserId = r.senderId === currentUser.id ? r.receiverId : r.senderId;
    const otherUser = db.users.find(u => u.id === otherUserId);
    const theirCuisines = otherUser?.tasteProfile?.favoriteCuisines || [];
    
    // Quick similarity
    const shared = myCuisines.filter(c => theirCuisines.includes(c));
    const allC = new Set([...myCuisines, ...theirCuisines]);
    const sim = allC.size > 0 ? Math.round((shared.length / allC.size) * 100) : 50;

    return {
      id: r.id,
      user: {
        id: otherUserId,
        name: otherUser ? otherUser.name : 'Foodie Friend',
        avatar: otherUser ? otherUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        tasteTwinAlias: otherUser?.tasteProfile?.tasteTwinAlias,
        favoriteCuisines: theirCuisines,
        similarityPercentage: sim
      },
      connectedAt: r.updatedAt || r.createdAt
    };
  });

  res.json({
    connections,
    pendingReceived,
    pendingSent
  });
});

app.post('/api/taste-twins/requests', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required to connect with foodies.' });
  }

  const { targetUserId } = req.body;
  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'Target user ID is required.' });
  }

  if (targetUserId === currentUser.id) {
    return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
  }

  const db = readDB();
  const targetUser = db.users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target foodie profile not found.' });
  }

  if (targetUser.tasteProfile?.allowFriendRequests === false) {
    return res.status(403).json({ error: 'This user is currently not accepting new connection requests.' });
  }

  if (!db.friendRequests) db.friendRequests = [];

  // Check existing request
  const existing = db.friendRequests.find(r => 
    (r.senderId === currentUser.id && r.receiverId === targetUserId) ||
    (r.receiverId === currentUser.id && r.senderId === targetUserId)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(400).json({ error: 'You are already connected with this foodie!' });
    }
    if (existing.status === 'pending') {
      if (existing.senderId === currentUser.id) {
        return res.status(400).json({ error: 'You have already sent a connection request to this foodie.' });
      } else {
        // Auto-accept if they already requested you
        existing.status = 'accepted';
        existing.updatedAt = new Date().toISOString();
        writeDB(db);
        return res.json({ success: true, request: existing, message: 'Connected with foodie!' });
      }
    }
  }

  const newRequest: FoodieRequest = {
    id: `freq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderAvatar: currentUser.avatar,
    senderAlias: currentUser.tasteProfile?.tasteTwinAlias,
    senderCuisines: currentUser.tasteProfile?.favoriteCuisines || [],
    receiverId: targetUser.id,
    receiverName: targetUser.name,
    receiverAvatar: targetUser.avatar,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.friendRequests.push(newRequest);
  writeDB(db);

  res.json({
    success: true,
    request: newRequest,
    message: `Connection request sent to ${targetUser.tasteProfile?.tasteTwinAlias || targetUser.name}!`
  });
});

app.post('/api/taste-twins/requests/:id/accept', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { id } = req.params;
  const db = readDB();
  if (!db.friendRequests) db.friendRequests = [];

  const request = db.friendRequests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: 'Connection request not found.' });
  }

  if (request.receiverId !== currentUser.id) {
    return res.status(403).json({ error: 'Unauthorized. You can only respond to requests sent to you.' });
  }

  request.status = 'accepted';
  request.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({
    success: true,
    request,
    message: `You are now connected with ${request.senderAlias || request.senderName}!`
  });
});

app.post('/api/taste-twins/requests/:id/decline', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { id } = req.params;
  const db = readDB();
  if (!db.friendRequests) db.friendRequests = [];

  const request = db.friendRequests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ error: 'Connection request not found.' });
  }

  if (request.receiverId !== currentUser.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  request.status = 'declined';
  request.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({
    success: true,
    request,
    message: 'Request declined.'
  });
});

app.delete('/api/taste-twins/requests/:id', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { id } = req.params;
  const db = readDB();
  if (!db.friendRequests) db.friendRequests = [];

  const index = db.friendRequests.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Connection request not found.' });
  }

  const request = db.friendRequests[index];
  if (request.senderId !== currentUser.id) {
    return res.status(403).json({ error: 'Unauthorized. You can only cancel requests you sent.' });
  }

  db.friendRequests.splice(index, 1);
  writeDB(db);

  res.json({ success: true, message: 'Connection request cancelled.' });
});

// Private Messaging Endpoints
app.get('/api/taste-twins/conversations', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const db = readDB();
  const friendRequests = db.friendRequests || [];
  const messages = db.messages || [];

  // Accepted friends
  const acceptedFriends = friendRequests.filter(r => 
    r.status === 'accepted' && 
    (r.senderId === currentUser.id || r.receiverId === currentUser.id)
  );

  const summaries: ConversationSummary[] = acceptedFriends.map(conn => {
    const otherUserId = conn.senderId === currentUser.id ? conn.receiverId : conn.senderId;
    const otherUser = db.users.find(u => u.id === otherUserId);

    const convMessages = messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === otherUserId) ||
      (m.senderId === otherUserId && m.receiverId === currentUser.id)
    );

    convMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : undefined;
    const unreadCount = convMessages.filter(m => m.receiverId === currentUser.id && !m.read).length;

    return {
      otherUser: {
        id: otherUserId,
        name: otherUser ? otherUser.name : 'Foodie Friend',
        avatar: otherUser ? otherUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        tasteTwinAlias: otherUser?.tasteProfile?.tasteTwinAlias
      },
      lastMessage: lastMsg,
      unreadCount,
      updatedAt: lastMsg ? lastMsg.createdAt : conn.updatedAt || conn.createdAt
    };
  });

  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ conversations: summaries });
});

app.get('/api/taste-twins/conversations/:otherUserId', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { otherUserId } = req.params;
  const db = readDB();

  // Validate friendship
  const isAcceptedFriend = (db.friendRequests || []).some(r => 
    r.status === 'accepted' &&
    ((r.senderId === currentUser.id && r.receiverId === otherUserId) ||
     (r.receiverId === currentUser.id && r.senderId === otherUserId))
  );

  if (!isAcceptedFriend) {
    return res.status(403).json({ error: 'You can only view messages with accepted foodie connections.' });
  }

  if (!db.messages) db.messages = [];

  let dbNeedsSave = false;
  const userMessages = db.messages.filter(m => {
    const isConv = (m.senderId === currentUser.id && m.receiverId === otherUserId) ||
                   (m.senderId === otherUserId && m.receiverId === currentUser.id);
    if (isConv && m.receiverId === currentUser.id && !m.read) {
      m.read = true;
      dbNeedsSave = true;
    }
    return isConv;
  });

  if (dbNeedsSave) {
    writeDB(db);
  }

  userMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json({ messages: userMessages });
});

app.post('/api/taste-twins/messages', (req: Request, res: Response) => {
  const currentUser = getUserFromHeader(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { receiverId, text } = req.body;
  if (!receiverId || typeof receiverId !== 'string') {
    return res.status(400).json({ error: 'Receiver ID is required.' });
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }

  if (text.trim().length > 2000) {
    return res.status(400).json({ error: 'Message cannot exceed 2000 characters.' });
  }

  const db = readDB();
  const receiverUser = db.users.find(u => u.id === receiverId);
  if (!receiverUser) {
    return res.status(404).json({ error: 'Recipient foodie not found.' });
  }

  // Authorization check: must be accepted friends!
  const isAcceptedFriend = (db.friendRequests || []).some(r => 
    r.status === 'accepted' &&
    ((r.senderId === currentUser.id && r.receiverId === receiverId) ||
     (r.receiverId === currentUser.id && r.senderId === receiverId))
  );

  if (!isAcceptedFriend) {
    return res.status(403).json({ error: 'You can only send private messages to accepted foodie connections.' });
  }

  if (receiverUser.tasteProfile?.allowDirectMessages === false) {
    return res.status(403).json({ error: 'This user has disabled direct messaging in their privacy settings.' });
  }

  if (!db.messages) db.messages = [];

  const sortedPair = [currentUser.id, receiverId].sort().join('_');
  const newMessage: DirectMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId: sortedPair,
    senderId: currentUser.id, // Strictly validated server-side
    senderName: currentUser.tasteProfile?.tasteTwinAlias || currentUser.name,
    receiverId: receiverId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    read: false
  };

  db.messages.push(newMessage);
  writeDB(db);

  res.json({
    success: true,
    message: newMessage
  });
});

// 9. Impact Statistics in Indian Rupees (₹)
app.get('/api/impact', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const db = readDB();

  // Number of meals rescued through completed surplus pickups only
  const completedReservations = (db.reservations || []).filter(r => r.status === 'picked_up');
  const surplusMealsRescued = completedReservations.reduce((acc, r) => acc + (r.quantity || 0), 0);

  // Completed food collections ONLY (collected requests and completed donations)
  const completedRequests = (db.donationRequests || []).filter(r => r.status === 'collected');
  const completedDonationOffers = (db.donations || []).filter(d => 
    (d.status === 'collected' || d.status === 'completed') && 
    !completedRequests.some(r => r.donationId === d.id)
  );

  const donatedPortions = completedRequests.reduce((acc, r) => acc + (r.requestedQuantity || 0), 0) +
    completedDonationOffers.reduce((acc, d) => acc + (d.collectedQuantity || d.quantityPortions || 0), 0);

  const donationsCompleted = completedRequests.length + completedDonationOffers.length;

  const totalMeals = surplusMealsRescued + donatedPortions;
  const totalFoodWeightKg = Math.round(totalMeals * 0.42 * 10) / 10;
  const co2eAvoidedKg = Math.round(totalFoodWeightKg * 2.5 * 10) / 10;

  const dollarsSaved = completedReservations.reduce((acc, r) => {
    const offer = (db.surplusOffers || []).find(o => o.id === r.surplusOfferId);
    if (offer) {
      return acc + (offer.originalPrice - offer.discountPrice) * (r.quantity || 1);
    }
    return acc + (100 * (r.quantity || 1));
  }, 0);

  res.json({
    stats: {
      totalMealsRescued: totalMeals,
      surplusMealsRescued,
      donationsCompleted,
      donatedPortions,
      totalFoodWeightKg,
      co2eAvoidedKg,
      dollarsSavedByCommunity: Math.round(dollarsSaved),
      activeNGOsCount: (db.users || []).filter(u => u.role === 'ngo').length || 1,
      participatingRestaurantsCount: (db.restaurants || []).length
    }
  });
});

// -------------------------------------------------------------
// 10. ADMIN DASHBOARD ROUTES (Role: 'admin' only)
// -------------------------------------------------------------

app.get('/api/admin/overview', requireRole(['admin']), (_req: Request, res: Response) => {
  const db = readDB();
  const completedReservations = (db.reservations || []).filter(r => r.status === 'picked_up');
  const surplusMealsRescued = completedReservations.reduce((acc, r) => acc + (r.quantity || 0), 0);
  const completedRequests = (db.donationRequests || []).filter(r => r.status === 'collected');
  const completedDonationOffers = (db.donations || []).filter(d => 
    (d.status === 'collected' || d.status === 'completed') && 
    !completedRequests.some(r => r.donationId === d.id)
  );

  const donatedPortions = completedRequests.reduce((acc, r) => acc + (r.requestedQuantity || 0), 0) +
    completedDonationOffers.reduce((acc, d) => acc + (d.collectedQuantity || d.quantityPortions || 0), 0);

  const totalMeals = surplusMealsRescued + donatedPortions;

  const dollarsSaved = completedReservations.reduce((acc, r) => {
    const offer = (db.surplusOffers || []).find(o => o.id === r.surplusOfferId);
    if (offer) {
      return acc + (offer.originalPrice - offer.discountPrice) * (r.quantity || 1);
    }
    return acc + (100 * (r.quantity || 1));
  }, 0);

  const stats: AdminOverviewStats = {
    totalUsers: db.users.length,
    activeVendors: db.users.filter(u => u.role === 'vendor').length,
    verifiedNGOs: db.users.filter(u => u.role === 'ngo').length,
    totalListings: db.inventory.length || db.dishes.length,
    activeSurplusDeals: (db.surplusOffers || []).filter(s => s.status === 'active').length,
    totalDonations: (db.donations || []).length,
    pendingVerifications: (db.verifications || []).filter(v => v.status === 'pending').length,
    openReports: (db.reports || []).filter(r => r.status === 'open').length,
    totalCommunitySavingsInRupees: Math.round(dollarsSaved),
    totalMealsRescued: totalMeals
  };

  res.json({ stats });
});

app.get('/api/admin/users', requireRole(['admin']), (_req: Request, res: Response) => {
  const db = readDB();
  const sanitized = db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    organizationId: u.organizationId,
    status: u.status || 'active',
    verified: u.verified !== false,
    tasteProfile: u.tasteProfile
  }));
  res.json({ users: sanitized });
});

app.patch('/api/admin/users/:id/role', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const validRoles: Role[] = ['customer', 'vendor', 'ngo', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role;
  writeDB(db);
  res.json({ success: true, user, message: `Updated user ${user.name} role to ${role}` });
});

app.patch('/api/admin/users/:id/status', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Status must be "active" or "suspended"' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = status;
  writeDB(db);
  res.json({ success: true, user, message: `User ${user.name} status updated to ${status}` });
});

app.get('/api/admin/verifications', requireRole(['admin']), (_req: Request, res: Response) => {
  const db = readDB();
  res.json({ verifications: db.verifications || [] });
});

app.post('/api/admin/verifications/:id/review', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (status !== 'verified' && status !== 'rejected') {
    return res.status(400).json({ error: 'Status must be "verified" or "rejected"' });
  }

  const db = readDB();
  if (!db.verifications) db.verifications = [];
  const verif = db.verifications.find(v => v.id === id);
  if (!verif) return res.status(404).json({ error: 'Verification request not found' });

  verif.status = status;
  verif.reviewedAt = new Date().toISOString();
  if (notes) verif.notes = notes;

  if (status === 'verified') {
    const org = db.restaurants.find(r => r.id === verif.organizationId);
    if (org && !org.tags.includes('Verified Partner')) {
      org.tags.push('Verified Partner');
    }
  }

  writeDB(db);
  res.json({ success: true, verification: verif, message: `Verification status set to ${status}` });
});

app.get('/api/admin/listings', requireRole(['admin']), (_req: Request, res: Response) => {
  const db = readDB();
  res.json({
    dishes: db.dishes,
    inventory: db.inventory,
    surplusOffers: db.surplusOffers
  });
});

app.delete('/api/admin/listings/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();

  const dishIdx = db.dishes.findIndex(d => d.id === id);
  if (dishIdx !== -1) {
    const removed = db.dishes.splice(dishIdx, 1)[0];
    db.inventory = db.inventory.filter(i => i.dishId !== id);
    db.surplusOffers = db.surplusOffers.filter(s => s.dishId !== id);
    writeDB(db);
    return res.json({ success: true, message: `Removed dish "${removed.name}" from platform` });
  }

  const invIdx = db.inventory.findIndex(i => i.id === id);
  if (invIdx !== -1) {
    const removed = db.inventory.splice(invIdx, 1)[0];
    db.dishes = db.dishes.filter(d => d.id !== removed.dishId);
    db.surplusOffers = db.surplusOffers.filter(s => s.dishId !== removed.dishId);
    writeDB(db);
    return res.json({ success: true, message: `Removed inventory listing "${removed.dishName}" from platform` });
  }

  res.status(404).json({ error: 'Listing not found' });
});

app.get('/api/admin/reports', requireRole(['admin']), (_req: Request, res: Response) => {
  const db = readDB();
  res.json({ reports: db.reports || [] });
});

app.post('/api/admin/reports/:id/resolve', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;
  if (!['investigating', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "investigating", "resolved", or "dismissed"' });
  }

  const db = readDB();
  if (!db.reports) db.reports = [];
  const report = db.reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.status = status;
  if (resolutionNotes) report.resolutionNotes = resolutionNotes;

  writeDB(db);
  res.json({ success: true, report, message: `Report marked as ${status}` });
});

// Explicit JSON 404 handler for any unhandled /api/* routes to prevent HTML falling through to Vite
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found', code: 'NOT_FOUND' });
});

// -------------------------------------------------------------
// VITE OR STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Tastely full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
