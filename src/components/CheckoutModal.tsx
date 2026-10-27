import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order } from '../types';
import { UpiPaymentModal } from './UpiPaymentModal';
import { DemoPaymentModal } from './DemoPaymentModal';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Clock, MapPin, Store, 
  ShoppingBag, Phone, User as UserIcon, Mail, 
  FileText, ShieldCheck, AlertCircle, ArrowLeft, Loader2, QrCode, Sparkles
} from 'lucide-react';

interface Props {
  onOrderSuccess: (order: Order) => void;
}

const generateIdempotencyKey = () => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const CheckoutModal: React.FC<Props> = ({ onOrderSuccess }) => {
  const { user } = useAuth();
  const { 
    cartItems, 
    cartRestaurant, 
    subtotal, 
    clearCart, 
    isCheckoutOpen, 
    setIsCheckoutOpen,
    setActiveOrder
  } = useCart();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [pickupNotes, setPickupNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pay_on_pickup' | 'upi' | 'demo'>('pay_on_pickup');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Generate an idempotency key tied to this checkout session
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  // Track modal open/close transitions and cart contents to ensure genuinely new checkouts get fresh keys
  const prevIsOpenRef = useRef(isCheckoutOpen);
  const cartSignature = `${cartRestaurant?.id || ''}:${cartItems.map(i => `${i.dish.id}:${i.quantity}`).sort().join('|')}`;
  const prevCartSignatureRef = useRef(cartSignature);

  // When checkout modal is opened anew (and not in the middle of a completed order view), generate a fresh key
  useEffect(() => {
    if (!prevIsOpenRef.current && isCheckoutOpen) {
      if (!completedOrder) {
        setIdempotencyKey(generateIdempotencyKey());
        setErrorMsg('');
      }
    }
    prevIsOpenRef.current = isCheckoutOpen;
  }, [isCheckoutOpen, completedOrder]);

  // When cart items or restaurant changes, this is a different checkout attempt: regenerate key
  useEffect(() => {
    if (prevCartSignatureRef.current !== cartSignature) {
      prevCartSignatureRef.current = cartSignature;
      setIdempotencyKey(generateIdempotencyKey());
    }
  }, [cartSignature]);

  if (!isCheckoutOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartRestaurant) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please enter your full name and contact phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const orderPayload = {
        restaurantId: cartRestaurant.id,
        items: cartItems.map(item => ({
          dishId: item.dish.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        pickupNotes: pickupNotes.trim() || undefined,
        paymentMethod,
        idempotencyKey
      };

      const res = await api.createOrder(orderPayload);
      const returnedOrder = res.order;

      // Validate that the returned order matches this intended checkout attempt
      const matchesRestaurant = returnedOrder && returnedOrder.restaurantId === cartRestaurant.id;
      const matchesItems = returnedOrder && Array.isArray(returnedOrder.items) &&
        cartItems.length === returnedOrder.items.length &&
        cartItems.every(ci => returnedOrder.items.some(oi => oi.dishId === ci.dish.id && oi.quantity === ci.quantity));

      if (!returnedOrder || !matchesRestaurant || !matchesItems) {
        // Crucial safety check: returned order does not match current cart!
        // Never clear the cart or show confirmation for a mismatched order.
        setIdempotencyKey(generateIdempotencyKey());
        setErrorMsg('Order verification failed: The returned order does not match your current cart items. Your cart has been preserved. Please try placing your order again.');
        return;
      }

      if (res.duplicatePrevented) {
        console.info('Order was processed via idempotent retry:', returnedOrder.orderNumber);
      }
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setCompletedOrder(returnedOrder);
      setActiveOrder(returnedOrder);
      clearCart();
      onOrderSuccess(returnedOrder);
      // Rotate idempotency key immediately so any subsequent checkout cannot reuse this order's key
      setIdempotencyKey(generateIdempotencyKey());
    } catch (err: any) {
      // NOTE: On submission failure, we deliberately do NOT change idempotencyKey here.
      // If the user retries the SAME checkout request, reusing the key ensures backend deduplication
      // in case the previous request succeeded on the server but timed out on the client.
      setErrorMsg(err.message || 'Failed to place your order. Please check stock and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setCompletedOrder(null);
    setErrorMsg('');
    setShowDemoModal(false);
    setShowUpiModal(false);
    // Prepare a fresh unique key for the next checkout session
    setIdempotencyKey(generateIdempotencyKey());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
        
        {completedOrder ? (
          /* Order Confirmation View */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Order Confirmed & Stock Reserved
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
                Order #{completedOrder.orderNumber}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Your order has been sent directly to <strong>{completedOrder.restaurantName}</strong> and stock has been automatically deducted.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-stone-900">{completedOrder.restaurantName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px] bg-stone-900 text-white">
                  Status: {completedOrder.orderStatus}
                </span>
              </div>

              {completedOrder.restaurantAddress && (
                <div className="flex items-center gap-1.5 text-stone-500">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{completedOrder.restaurantAddress}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-stone-500">
                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Estimated Prep: <strong>{completedOrder.estimatedPrepTime}</strong></span>
              </div>

              {/* Items Breakdown */}
              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-700">Ordered Items:</div>
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-stone-600">
                    <span className="truncate">{item.quantity} × {item.dishName}</span>
                    <span className="font-semibold text-stone-900">₹{item.itemTotal}</span>
                  </div>
                ))}
                
                <div className="flex justify-between items-center font-black text-stone-900 text-sm pt-2 border-t border-stone-200">
                  <span>Total Amount Paid / Due:</span>
                  <span className="text-orange-600 text-base">₹{completedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-900">
                    Payment Method: {
                      completedOrder.paymentMethod === 'demo' || completedOrder.isDemoPayment
                        ? 'Demo Payment (College Expo)'
                        : completedOrder.paymentMethod === 'upi'
                        ? 'UPI QR Code'
                        : 'Pay on Pickup'
                    }
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Payment Status: <span className="font-bold capitalize">{completedOrder.paymentStatus.replace('_', ' ')}</span>
                    {completedOrder.upiReference && (
                      <span className="ml-1 text-stone-700 font-mono">({completedOrder.upiReference})</span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-bold text-stone-700">
                  Customer: {completedOrder.customerName}
                </div>
              </div>

              {/* Demo Payment Mode Callout & Simulator Action */}
              {(completedOrder.isDemoPayment || completedOrder.paymentMethod === 'demo') && (
                <div className="p-4 rounded-2xl bg-purple-50/90 border-2 border-purple-400 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 mb-0.5">
                          DEMO — NO REAL MONEY TRANSFERRED
                        </div>
                        <div className="text-xs font-black text-stone-900">
                          College Expo Sandbox Simulation
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
                    This order was placed in Demo Mode. Real bank UPI accounts were not charged. Click below to simulate an approved or failed payment response in real time.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs cursor-pointer shadow-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-99"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open Demo Payment Simulator (Simulate Success / Failure)</span>
                  </button>
                </div>
              )}

              {/* UPI QR Payment Callout & Action */}
              {!completedOrder.isDemoPayment && completedOrder.paymentMethod === 'upi' && (
                <div className="p-4 rounded-2xl bg-orange-50/80 border-2 border-orange-300 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                        <QrCode className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-stone-900">
                          Scan & Pay ₹{completedOrder.totalAmount} via UPI
                        </div>
                        <div className="text-[11px] text-stone-600">
                          Payee: <strong>{completedOrder.upiPayeeName || completedOrder.restaurantName}</strong> ({completedOrder.upiId || 'merchant@upi'})
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Open the UPI QR code to pay using Google Pay, PhonePe, Paytm, or BHIM. Then enter your 12-digit UTR reference so the vendor can verify the transaction.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowUpiModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs cursor-pointer shadow-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-99"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{completedOrder.paymentStatus === 'payment_submitted' ? 'View QR / Update Submitted UTR' : 'Open UPI QR Code & Submit UTR'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {(completedOrder.isDemoPayment || completedOrder.paymentMethod === 'demo') ? (
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simulate Payment</span>
                </button>
              ) : completedOrder.paymentMethod === 'upi' ? (
                <button
                  type="button"
                  onClick={() => setShowUpiModal(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan UPI QR Code</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleClose}
                className={`py-3 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-md ${
                  completedOrder.paymentMethod === 'upi' ? 'flex-1' : 'w-full'
                }`}
              >
                Done & Return to Menu
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form View */
          <div>
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-black text-stone-900">Checkout & Confirm Order</h3>
                  <p className="text-xs text-stone-500">
                    Order directly from <strong>{cartRestaurant?.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
              
              {/* Customer Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                  Customer Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">Phone Number (For Pickup) *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="alex@tastely.local"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Special Pickup Notes</label>
                  <input
                    type="text"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="e.g. Please pack extra napkins, pickup in 10 mins"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Payment Method
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                    paymentMethod === 'pay_on_pickup' 
                      ? 'border-orange-500 bg-orange-50/50 shadow-xs' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay_on_pickup"
                      checked={paymentMethod === 'pay_on_pickup'}
                      onChange={() => setPaymentMethod('pay_on_pickup')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-900">Pay on Pickup</div>
                      <div className="text-[10px] text-stone-500">Cash / card at counter</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                    paymentMethod === 'upi' 
                      ? 'border-orange-500 bg-orange-50/50 shadow-xs' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-900 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-stone-600" />
                        <span>UPI Payment</span>
                      </div>
                      <div className="text-[10px] text-stone-500">Real NPCI bank transfer</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border-2 flex flex-col justify-between gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'demo' 
                      ? 'border-purple-600 bg-purple-50/70 shadow-xs' 
                      : 'border-stone-200 hover:border-purple-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="demo"
                        checked={paymentMethod === 'demo'}
                        onChange={() => setPaymentMethod('demo')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <div className="text-xs font-black text-purple-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Demo Payment</span>
                      </div>
                    </div>
                    <div className="pl-5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 mb-0.5">
                        DEMO — NO REAL MONEY TRANSFERRED
                      </span>
                      <div className="text-[10px] text-purple-800 leading-tight">
                        College expo simulation
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="font-bold text-stone-800 flex items-center justify-between">
                  <span>Order Items ({cartItems.length})</span>
                  <span>Amount in ₹</span>
                </div>

                <div className="space-y-1 text-stone-600 max-h-36 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="truncate">
                        {item.quantity} × {item.dish.name}
                      </span>
                      <span className="font-bold text-stone-900 shrink-0">
                        ₹{item.dish.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-between items-center font-black text-sm text-stone-900">
                  <span>Final Total:</span>
                  <span className="text-orange-600 text-base">₹{subtotal}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Back to Cart
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Stock...</span>
                    </>
                  ) : (
                    <span>Confirm & Place Order (₹{subtotal})</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* UPI QR Payment Modal */}
      {showUpiModal && completedOrder && (
        <UpiPaymentModal
          order={completedOrder}
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          onPaymentUpdated={(updated) => {
            setCompletedOrder(updated);
            onOrderSuccess(updated);
          }}
        />
      )}

      {/* Demo Payment Simulator Modal */}
      {showDemoModal && completedOrder && (
        <DemoPaymentModal
          order={completedOrder}
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          onPaymentUpdated={(updated) => {
            setCompletedOrder(updated);
            onOrderSuccess(updated);
          }}
        />
      )}
    </div>
  );
};
