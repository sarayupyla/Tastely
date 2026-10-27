import React, { useState } from 'react';
import { Order } from '../types';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  Sparkles, X, CheckCircle2, XCircle, AlertTriangle, 
  RotateCcw, ShieldAlert, ShieldCheck, Store, Clock, ArrowRight, Loader2, Info
} from 'lucide-react';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated?: (updatedOrder: Order) => void;
}

export const DemoPaymentModal: React.FC<Props> = ({
  order,
  isOpen,
  onClose,
  onPaymentUpdated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFailureReason, setSelectedFailureReason] = useState('Simulated Bank Network Timeout');
  const [showFailureOptions, setShowFailureOptions] = useState(false);

  if (!isOpen || !order) return null;

  const isCompleted = order.paymentStatus === 'demo_completed';
  const isFailed = order.paymentStatus === 'demo_failed';
  const isPending = order.paymentStatus === 'demo_pending' || !order.paymentStatus.startsWith('demo_');
  const isFinalized = order.orderStatus === 'completed' || order.orderStatus === 'cancelled';

  const handleSimulate = async (outcome: 'success' | 'failure', customReason?: string) => {
    if (isFinalized) {
      setErrorMsg(`Cannot simulate payment: Order #${order.orderNumber} is already ${order.orderStatus}. Payment status cannot be altered on finalized orders.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const reason = customReason || selectedFailureReason;
      const res = await api.simulateDemoPayment(order.id, outcome, reason);
      
      if (outcome === 'success') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (onPaymentUpdated) {
        onPaymentUpdated(res.order);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to simulate demo payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200 border-2 border-purple-400">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DEMO — NO REAL MONEY TRANSFERRED</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            College Expo Payment Simulator
          </h3>
          <p className="text-xs text-purple-200 mt-1">
            Order #{order.orderNumber} • Amount: ₹{order.totalAmount}
          </p>
        </div>

        {/* Prominent Warning Callout */}
        <div className="bg-amber-50 border-b border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-950 uppercase tracking-wide">
              Expo Demo Sandbox:
            </strong>{' '}
            No real UPI ID, QR code, bank transfer, PIN, or OTP is ever requested or used. Simulate customer payment behavior for booth evaluations.
          </div>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current State & Exact Line Items Breakdown */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-semibold">Vendor / Fest Stall:</span>
              <span className="font-bold text-stone-900">{order.restaurantName}</span>
            </div>
            
            {/* Explicit Line Items for Order Identification */}
            <div className="pt-2 border-t border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Order #{order.orderNumber} Line Items:
              </span>
              <div className="space-y-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-stone-800">
                    <span className="font-medium">{it.quantity} × {it.dishName}</span>
                    <span className="font-semibold text-stone-900">₹{it.itemTotal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-semibold">Total Amount:</span>
              <span className="text-base font-black text-purple-700">₹{order.totalAmount}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 font-semibold">Simulated Payee Handle:</span>
              <span className="font-mono text-[11px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-bold">
                demo.expo@tastely
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-semibold">Current Demo Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                isCompleted 
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : isFailed
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Simulated Success</span>
                  </>
                ) : isFailed ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-700" />
                    <span>Simulated Failure</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Pending Simulation</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Simulation Success Feedback */}
          {isCompleted && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-purple-900">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>DEMO PAYMENT SIMULATED AS SUCCESSFUL</span>
              </div>
              <div className="text-xs text-purple-800 leading-relaxed">
                A synthetic reference has been generated: <strong className="font-mono">{order.upiReference}</strong>.
              </div>
              <p className="text-[11px] text-purple-700">
                The vendor can now perform a <strong>Demo Order Handover</strong> at their booth. No real bank accounts were debited.
              </p>
            </div>
          )}

          {/* Simulation Failure Feedback */}
          {isFailed && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>DEMO PAYMENT SIMULATED AS FAILED</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Reason: <strong>{order.demoFailureReason || 'Simulated bank network decline'}</strong>.
              </p>
              <div className="text-[11px] text-rose-700 bg-white/70 p-2 rounded-xl border border-rose-200 font-medium">
                Handover safeguard active: Vendor handover remains strictly blocked while payment is failed.
              </div>
            </div>
          )}

          {/* Interactive Simulation Controls or Finalized Lockout Banner */}
          {isFinalized ? (
            <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 text-stone-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                <ShieldCheck className="w-4 h-4 text-stone-600" />
                <span>Order Finalized ({order.orderStatus.replace(/_/g, ' ')})</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Payment simulation is locked for completed and cancelled orders to preserve accurate transaction records.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Trigger Simulation Outcome
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Simulate Success Button */}
                <button
                  type="button"
                  onClick={() => handleSimulate('success')}
                  disabled={isSubmitting}
                  className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Simulate Success</span>
                </button>

                {/* Simulate Failure Button */}
                <button
                  type="button"
                  onClick={() => setShowFailureOptions(!showFailureOptions)}
                  disabled={isSubmitting}
                  className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Failure</span>
                </button>
              </div>

              {/* Failure Reason Selector Drawer */}
              {showFailureOptions && (
                <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-300 space-y-2 animate-in fade-in duration-150">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    Select Simulated Failure Scenario:
                  </label>
                  <select
                    value={selectedFailureReason}
                    onChange={(e) => setSelectedFailureReason(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Simulated Bank Network Timeout">Simulated Bank Network Timeout</option>
                    <option value="Simulated Insufficient Account Balance">Simulated Insufficient Account Balance</option>
                    <option value="Simulated Customer Declined Payment">Simulated Customer Declined Payment</option>
                    <option value="Simulated NPCI Switch Unavailable">Simulated NPCI Switch Unavailable</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSimulate('failure')}
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Execute Simulated Failure ({selectedFailureReason})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Notice */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[10px] text-stone-400 font-mono">
              EXPO SIMULATION • STRICT DATA ISOLATION
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
