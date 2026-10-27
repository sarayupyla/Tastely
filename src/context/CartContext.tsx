import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dish, CartItem, Order } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  cartRestaurant: { id: string; name: string; address?: string } | null;
  addToCart: (dish: Dish, quantity?: number, specialInstructions?: string) => { success: boolean; requiresReplace?: boolean; conflictVendor?: string };
  forceAddToCart: (dish: Dish, quantity?: number, specialInstructions?: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  vendorConflictPendingDish: Dish | null;
  setVendorConflictPendingDish: (dish: Dish | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'tastely_cart_items';
const CART_REST_KEY = 'tastely_cart_restaurant';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartRestaurant, setCartRestaurant] = useState<{ id: string; name: string; address?: string } | null>(() => {
    try {
      const saved = localStorage.getItem(CART_REST_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [vendorConflictPendingDish, setVendorConflictPendingDish] = useState<Dish | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      if (cartRestaurant) {
        localStorage.setItem(CART_REST_KEY, JSON.stringify(cartRestaurant));
      } else {
        localStorage.removeItem(CART_REST_KEY);
      }
    } catch (e) {
      console.error('Failed to sync cart to localStorage', e);
    }
  }, [cartItems, cartRestaurant]);

  const addToCart = (dish: Dish, quantity: number = 1, specialInstructions?: string) => {
    // Check if item is sold out
    if (dish.isSoldOut || (dish.remainingQty !== undefined && dish.remainingQty <= 0)) {
      return { success: false, requiresReplace: false };
    }

    // Check multi-vendor separation
    if (cartRestaurant && cartRestaurant.id !== dish.restaurantId && cartItems.length > 0) {
      setVendorConflictPendingDish(dish);
      return { 
        success: false, 
        requiresReplace: true, 
        conflictVendor: cartRestaurant.name 
      };
    }

    executeAdd(dish, quantity, specialInstructions);
    return { success: true };
  };

  const executeAdd = (dish: Dish, quantity: number, specialInstructions?: string) => {
    setCartRestaurant({
      id: dish.restaurantId,
      name: dish.restaurantName
    });

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.dish.id === dish.id);
      const maxAvailable = dish.remainingQty !== undefined ? dish.remainingQty : 999;

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, maxAvailable);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          dish: { ...dish } // refresh with latest live stock
        };
        return updated;
      } else {
        const safeQty = Math.min(quantity, maxAvailable);
        return [...prev, { dish, quantity: safeQty, specialInstructions }];
      }
    });

    setIsCartOpen(true);
  };

  const forceAddToCart = (dish: Dish, quantity: number = 1, specialInstructions?: string) => {
    setCartItems([]);
    setCartRestaurant({
      id: dish.restaurantId,
      name: dish.restaurantName
    });
    executeAdd(dish, quantity, specialInstructions);
    setVendorConflictPendingDish(null);
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }

    setCartItems(prev => prev.map(item => {
      if (item.dish.id === dishId) {
        const max = item.dish.remainingQty !== undefined ? item.dish.remainingQty : 999;
        return {
          ...item,
          quantity: Math.min(quantity, max)
        };
      }
      return item;
    }));
  };

  const removeFromCart = (dishId: string) => {
    setCartItems(prev => {
      const filtered = prev.filter(item => item.dish.id !== dishId);
      if (filtered.length === 0) {
        setCartRestaurant(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCartRestaurant(null);
    setVendorConflictPendingDish(null);
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartRestaurant,
      addToCart,
      forceAddToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItemsCount,
      subtotal,
      isCartOpen,
      setIsCartOpen,
      isCheckoutOpen,
      setIsCheckoutOpen,
      activeOrder,
      setActiveOrder,
      vendorConflictPendingDish,
      setVendorConflictPendingDish
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
