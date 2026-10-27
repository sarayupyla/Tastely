import React, { useState, useEffect } from 'react';
import { Reservation } from '../types';
import { api } from '../services/api';
import { 
  Ticket, Clock, MapPin, Store, CheckCircle2, 
  X, RefreshCw, QrCode, AlertCircle 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VouchersDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMyReservations();
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReservations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Ticket className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">
                My Surplus Vouchers
              </h3>
              <p className="text-xs text-stone-500">
                Active meal pickups reserved by you
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-36 rounded-2xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-16 text-stone-500">
              <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <div className="text-sm font-bold text-stone-800">No active meal vouchers</div>
              <div className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                Explore the Surplus Deals section to rescue high-end restaurant meals at 50% discount!
              </div>
            </div>
          ) : (
            reservations.map(res => (
              <div
                key={res.id}
                className="p-5 rounded-3xl bg-stone-50 border border-stone-200/90 shadow-2xs relative overflow-hidden"
              >
                {/* Top voucher badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Surplus Meal Voucher
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      res.status === 'picked_up'
                        ? 'bg-emerald-100 text-emerald-800'
                        : res.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {res.status === 'picked_up' ? 'Picked Up' : res.status === 'cancelled' ? 'Cancelled' : 'Reserved'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    ₹{res.totalPrice} ({res.quantity}x)
                  </span>
                </div>

                {/* Voucher code display */}
                <div className="p-3 rounded-2xl bg-stone-900 text-white flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                      Show at Counter
                    </div>
                    <div className="text-xl font-mono font-black text-white tracking-wider">
                      {res.voucherCode}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-stone-800 text-stone-300">
                    <QrCode className="w-6 h-6" />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-stone-900 leading-snug">
                  {res.dishTitle}
                </h4>

                <div className="mt-2 text-xs text-stone-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{res.restaurantName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{res.restaurantAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pickup Window: Before {res.pickupEnd}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-5 border-t border-stone-200 bg-stone-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer"
          >
            Close Vouchers
          </button>
        </div>

      </div>
    </div>
  );
};
