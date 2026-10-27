import React, { useState, useEffect } from 'react';
import { Order, Reservation, PaymentStatus } from '../types';
import { api } from '../services/api';
import { UpiPaymentModal } from './UpiPaymentModal';
import { DemoPaymentModal } from './DemoPaymentModal';
import { 
  ShoppingBag, X, Clock, MapPin, Store, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, ChevronRight, AlertTriangle, QrCode, ShieldCheck,
  Ticket, Copy, Check, Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderCancelled?: () => void;
  initialTab?: 'orders' | 'reservations';
}

export const CustomerOrdersDrawer: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onOrderCancelled,
  initialTab = 'orders'
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [selectedOrderForUpi, setSelectedOrderForUpi] = useState<Order | null>(null);
  const [selectedOrderForDemo, setSelectedOrderForDemo] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setErrorMsg('');
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load your orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setIsLoadingReservations(true);
      const data = await api.getMyReservations();
      setReservations(data || []);
    } catch (err: any) {
      console.error('Failed to load reservations:', err);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      fetchOrders();
      fetchReservations();
    }
  }, [isOpen, initialTab]);

  const handleCopyVoucher = (voucherCode: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(voucherCode);
      setCopiedVoucher(voucherCode);
      setTimeout(() => setCopiedVoucher(null), 2500);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? The reserved food portions will be returned to the vendor stock.')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);
      await api.cancelOrder(orderId, 'Cancelled by customer');
      await fetchOrders();
      if (onOrderCancelled) onOrderCancelled();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">Confirmed</span>;
      case 'preparing':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">Preparing</span>;
      case 'ready_for_pickup':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">Ready for Pickup</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-700">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  const getReservationStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Picked Up & Rescued
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      case 'reserved':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Reserved (Awaiting Pickup)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-stone-200 bg-stone-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                  {activeTab === 'orders' ? (
                    <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Ticket className="w-5 h-5 stroke-[2.5] text-amber-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-black text-stone-900">
                    {activeTab === 'orders' ? 'My Orders & Pickups' : 'My Surplus Reservations'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {activeTab === 'orders' 
                      ? 'Track live kitchen preparation & pickup status' 
                      : 'Active vouchers & collection status for rescued meals'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation Switcher */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Regular Orders ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reservations')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'reservations'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Surplus Deals ({reservations.length})</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Regular Orders Content */}
          {activeTab === 'orders' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingOrders ? (
                <div className="text-center py-20 text-stone-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
                  <span>Loading your orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-300 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">No Orders Placed Yet</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                    When you order handcrafted dishes or fest specials, your receipts and live pickup status will appear here!
                  </p>
                </div>
              ) : (
                orders.map(order => {
                  const canCancel = order.orderStatus === 'confirmed' || order.orderStatus === 'pending';
                  const isCancelled = order.orderStatus === 'cancelled';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCancelled 
                          ? 'border-stone-200 bg-stone-50/60 opacity-80' 
                          : 'border-stone-200/90 bg-white hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-100">
                        <div>
                          <div className="text-xs font-black text-stone-900 flex items-center gap-2 flex-wrap">
                            <span>#{order.orderNumber}</span>
                            {getStatusBadge(order.orderStatus)}
                            {order.voucherCode && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {order.voucherCode}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-orange-600" />
                            <span className="font-semibold">{order.restaurantName}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-stone-900">₹{order.totalAmount}</span>
                          <div className="text-[10px] text-stone-400 font-medium capitalize">
                            {order.paymentMethod.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Ordered items summary */}
                      <div className="space-y-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-stone-600">
                            <span className="truncate max-w-[220px]">{item.quantity} × {item.dishName}</span>
                            <span className="font-semibold text-stone-900">₹{item.itemTotal}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment Status & UPI Action Bar */}
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-stone-800">
                            <span>Payment:</span>
                            {order.isDemoPayment || order.paymentMethod === 'demo' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                                order.paymentStatus === 'demo_completed'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : order.paymentStatus === 'demo_failed'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {order.paymentStatus === 'demo_completed' 
                                  ? 'Demo Success' 
                                  : order.paymentStatus === 'demo_failed' 
                                  ? 'Demo Failed' 
                                  : 'Demo Pending'}
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                                order.paymentStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.paymentStatus === 'payment_submitted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.paymentStatus === 'failed'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {order.paymentStatus.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          {(order.isDemoPayment || order.paymentMethod === 'demo') && (
                            <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mt-0.5">
                              DEMO — NO REAL MONEY TRANSFERRED
                            </div>
                          )}
                          {order.upiReference && (
                            <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                              Ref: {order.upiReference}
                            </div>
                          )}
                        </div>

                        {(order.isDemoPayment || order.paymentMethod === 'demo') && !isCancelled ? (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDemo(order)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                              order.orderStatus === 'completed'
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                : 'bg-purple-700 hover:bg-purple-800 text-white shadow-2xs'
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${order.orderStatus === 'completed' ? 'text-purple-600' : ''}`} />
                            <span>{order.orderStatus === 'completed' ? 'View Demo Receipt' : order.paymentStatus === 'demo_completed' ? 'View Demo Result' : 'Simulate Demo Payment'}</span>
                          </button>
                        ) : order.paymentMethod === 'upi' && !isCancelled ? (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForUpi(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 shadow-2xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{order.paymentStatus === 'verified' ? 'View QR / Receipt' : order.paymentStatus === 'payment_submitted' ? 'View / Edit UTR' : 'Pay via UPI QR'}</span>
                          </button>
                        ) : null}
                      </div>

                      {order.pickupNotes && (
                        <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg italic">
                          Notes: "{order.pickupNotes}"
                        </div>
                      )}

                      {isCancelled && order.cancellationReason && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{order.cancellationReason}</span>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                        <div className="text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer border border-rose-200"
                          >
                            {cancellingOrderId === order.id ? 'Restoring Stock...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: My Surplus Reservations Content */}
          {activeTab === 'reservations' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingReservations ? (
                <div className="text-center py-20 text-stone-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                  <span>Loading your surplus reservations...</span>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800">No Surplus Reservations Yet</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                    When you rescue gourmet food from local kitchens at 50% discount, your pickup vouchers and collection status will appear here!
                  </p>
                </div>
              ) : (
                reservations.map(res => {
                  const isPickedUp = res.status === 'picked_up';
                  const isCancelled = res.status === 'cancelled';

                  return (
                    <div
                      key={res.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCancelled 
                          ? 'border-stone-200 bg-stone-50/60 opacity-80' 
                          : isPickedUp
                          ? 'border-emerald-200 bg-emerald-50/20 shadow-2xs'
                          : 'border-stone-200/90 bg-white hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      {/* Card Header: Status & Price */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-100">
                        <div>
                          {getReservationStatusBadge(res.status)}
                          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                            <Store className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="font-semibold text-stone-800 truncate">{res.restaurantName}</span>
                          </div>
                          {res.restaurantAddress && (
                            <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{res.restaurantAddress}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-emerald-700">₹{res.totalPrice}</div>
                          <div className="text-[10px] text-stone-400 font-medium">
                            {res.quantity} portion{res.quantity > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Food Name */}
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-snug">
                          {res.dishTitle}
                        </h4>
                      </div>

                      {/* Voucher Code Box */}
                      <div className="p-3 rounded-2xl bg-stone-900 text-white flex items-center justify-between gap-3 shadow-xs">
                        <div>
                          <div className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                            Pickup Voucher Code
                          </div>
                          <div className="text-lg font-mono font-black text-white tracking-widest">
                            {res.voucherCode}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyVoucher(res.voucherCode)}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Copy voucher code"
                          >
                            {copiedVoucher === res.voucherCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <div className="p-1.5 rounded-xl bg-stone-800 text-stone-300">
                            <QrCode className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Pickup deadline & timestamp */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <div className="flex items-center gap-1 text-amber-800 font-bold">
                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Pickup Window: Before {res.pickupEnd}</span>
                        </div>

                        <div className="text-[10px] text-stone-400">
                          {new Date(res.reservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Status contextual note */}
                      <div className="text-[10px] text-stone-500 italic bg-stone-50 p-2 rounded-xl">
                        {res.status === 'picked_up'
                          ? '✓ Meal collected and rescued. Your positive environmental impact is recorded!'
                          : res.status === 'cancelled'
                          ? 'Reservation cancelled.'
                          : 'Show this voucher code at kitchen counter to collect your fresh surplus meal.'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Drawer Footer */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                fetchOrders();
                fetchReservations();
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh {activeTab === 'orders' ? 'Orders' : 'Reservations'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Standalone UPI QR Modal */}
      {selectedOrderForUpi && (
        <UpiPaymentModal
          order={selectedOrderForUpi}
          isOpen={Boolean(selectedOrderForUpi)}
          onClose={() => setSelectedOrderForUpi(null)}
          onPaymentUpdated={(updated) => {
            setSelectedOrderForUpi(updated);
            fetchOrders();
          }}
        />
      )}

      {/* Standalone Demo Payment Modal */}
      {selectedOrderForDemo && (
        <DemoPaymentModal
          order={selectedOrderForDemo}
          isOpen={Boolean(selectedOrderForDemo)}
          onClose={() => setSelectedOrderForDemo(null)}
          onPaymentUpdated={(updated) => {
            setSelectedOrderForDemo(updated);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};
