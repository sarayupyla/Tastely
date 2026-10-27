import React, { useState, useEffect } from 'react';
import { SurplusOffer, Reservation } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, Clock, MapPin, Tag, 
  Store, AlertCircle, Sparkles, QrCode 
} from 'lucide-react';

interface Props {
  offer: SurplusOffer | null;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
  onViewReservations?: () => void;
}

export const ReservationModal: React.FC<Props> = ({ 
  offer, 
  onClose, 
  onSuccess,
  onViewReservations 
}) => {
  const { refreshUser, setReservationsCount } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  // Clear or reset the previous reservation's temporary success-screen state when starting a new reservation
  useEffect(() => {
    setCreatedReservation(null);
    setQuantity(1);
    setErrorMsg('');
    setIsSubmitting(false);
  }, [offer?.id]);

  const handleClose = () => {
    setCreatedReservation(null);
    setQuantity(1);
    setErrorMsg('');
    setIsSubmitting(false);
    onClose();
  };

  const handleDoneAndView = () => {
    handleClose();
    if (onViewReservations) {
      onViewReservations();
    }
  };

  if (!offer) return null;

  const totalPrice = Math.round(offer.discountPrice * quantity * 100) / 100;
  const totalSavings = Math.round((offer.originalPrice - offer.discountPrice) * quantity * 100) / 100;

  const handleConfirmReservation = async () => {
    if (!offer || isSubmitting || createdReservation) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await api.reserveSurplusOffer(offer.id, quantity);
      
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 }
      });

      setCreatedReservation(res.reservation);
      setReservationsCount(prev => prev + 1);
      await refreshUser();
      onSuccess(res.reservation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {createdReservation ? (
          // Success Voucher View
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-black text-stone-900">
              Meal Successfully Rescued!
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Show this digital voucher code to the kitchen staff when picking up your fresh surplus meal.
            </p>

            {/* Voucher Code Box */}
            <div className="my-6 p-6 rounded-3xl bg-stone-900 text-white relative overflow-hidden">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
                Pickup Voucher Code
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white">
                {createdReservation.voucherCode}
              </div>
              <div className="mt-3 text-xs text-stone-300 font-medium flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pickup today before {createdReservation.pickupEnd}
              </div>
            </div>

            <div className="text-left p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5 mb-6">
              <div className="font-bold text-stone-900">{createdReservation.dishTitle} ({createdReservation.quantity}x)</div>
              <div className="text-stone-600 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-stone-400" />
                {createdReservation.restaurantName}
              </div>
              <div className="text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {createdReservation.restaurantAddress}
              </div>
              <div className="font-extrabold text-emerald-700 pt-1">
                Total Paid at Counter: ₹{createdReservation.totalPrice}
              </div>
            </div>

            <button
              onClick={handleDoneAndView}
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Done & View Vouchers
            </button>
          </div>
        ) : (
          // Reservation Confirmation Form
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                  <Tag className="w-3 h-3" />
                  Save {offer.discountPercentage}%
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-1">
                  Reserve Surplus Meal
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Offer Summary */}
            <div className="flex gap-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 mb-5">
              <img
                src={offer.image}
                alt={offer.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-stone-900 truncate">
                  {offer.title}
                </h4>
                <div className="text-xs text-stone-500 mt-0.5">{offer.restaurantName}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-stone-400 line-through">
                    ₹{offer.originalPrice}
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    ₹{offer.discountPrice}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {offer.availableQuantity} in stock
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-stone-700 block mb-2">
                Select Quantity:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-sm font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-black text-stone-900 w-10 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(offer.availableQuantity, q + 1))}
                    disabled={quantity >= offer.availableQuantity}
                    className="px-3 py-2 text-sm font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-stone-500">
                  Total food saved: ~{(quantity * 0.45).toFixed(1)} kg
                </span>
              </div>
            </div>

            {/* Total breakdown */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-2 mb-6 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Original Total Value:</span>
                <span className="line-through">₹{offer.originalPrice * quantity}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-amber-800">
                <span>You Save (-{offer.discountPercentage}%):</span>
                <span>-₹{totalSavings}</span>
              </div>
              <div className="flex items-center justify-between font-black text-stone-900 text-sm pt-2 border-t border-amber-200/60">
                <span>Reservation Total:</span>
                <span className="text-emerald-700 text-base">₹{totalPrice}</span>
              </div>
            </div>

            {/* Pickup Info */}
            <div className="flex items-center gap-2 text-xs text-stone-600 font-medium mb-6">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pickup Window: {offer.pickupStart} – {offer.pickupEnd} tonight</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmitting}
                className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Reserving...' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
