import React from 'react';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBag, X, Plus, Minus, Trash2, 
  Store, AlertCircle, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    cartRestaurant,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemsCount,
    subtotal,
    vendorConflictPendingDish,
    setVendorConflictPendingDish,
    forceAddToCart
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <span>Your Food Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-stone-900 text-white">
                      {totalItemsCount}
                    </span>
                  )}
                </h2>
                {cartRestaurant && (
                  <p className="text-xs text-stone-500 flex items-center gap-1 font-medium truncate max-w-[240px]">
                    <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate">{cartRestaurant.name}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-300 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-800">Your Cart is Empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  Browse delicious restaurant menus or college fest stalls, and add items with freshly prepared portions!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
                >
                  Explore Food Items
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
                  <span>Selected Items ({cartItems.length})</span>
                  <button
                    onClick={clearCart}
                    className="text-stone-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {cartItems.map(({ dish, quantity, specialInstructions }) => {
                  const maxStock = dish.remainingQty !== undefined ? dish.remainingQty : 999;
                  const itemTotal = dish.price * quantity;
                  const isMaxReached = quantity >= maxStock;

                  return (
                    <div 
                      key={dish.id} 
                      className="p-3.5 rounded-2xl border border-stone-200/90 bg-white hover:border-stone-300 transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={dish.image} 
                          alt={dish.name} 
                          className="w-16 h-16 rounded-xl object-cover ring-1 ring-stone-200 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug truncate">
                              {dish.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(dish.id)}
                              className="text-stone-300 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-[11px] font-bold text-stone-500 mt-0.5 flex items-center gap-2">
                            <span>₹{dish.price} each</span>
                            {dish.remainingQty !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                                dish.remainingQty <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {dish.remainingQty} in stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        {/* Plus / Minus Buttons */}
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <span className="w-7 text-center font-black text-xs text-stone-900">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, quantity + 1)}
                            disabled={isMaxReached}
                            className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title={isMaxReached ? 'Maximum available stock reached' : 'Add another unit'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right">
                          <span className="text-xs text-stone-400 font-medium mr-1.5">{quantity} × ₹{dish.price} =</span>
                          <span className="text-sm font-black text-stone-900">₹{itemTotal}</span>
                        </div>
                      </div>

                      {isMaxReached && (
                        <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Maximum available portions reached ({maxStock})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Restaurant Packaging & Taxes</span>
                  <span className="font-semibold text-emerald-700">Free</span>
                </div>
                <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-lg text-orange-600">₹{subtotal}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live stock reserved on confirmation • Safe payment at pickup</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Vendor Conflict Modal */}
      {vendorConflictPendingDish && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Store className="w-6 h-6 text-amber-700" />
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900">
                Replace Current Cart?
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Your cart currently contains items from <strong>{cartRestaurant?.name}</strong>. 
                You are adding <strong>"{vendorConflictPendingDish.name}"</strong> from <strong>{vendorConflictPendingDish.restaurantName}</strong>.
              </p>
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 font-medium">
                To guarantee synchronized stock deduction and pickup logistics, each order is placed with one vendor at a time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVendorConflictPendingDish(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Keep Current Cart
              </button>
              <button
                type="button"
                onClick={() => forceAddToCart(vendorConflictPendingDish)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
