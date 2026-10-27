import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Order, PaymentStatus } from '../types';
import { api } from '../services/api';
import { 
  QrCode, X, Copy, Check, ExternalLink, ShieldCheck, 
  AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight, Loader2, Info
} from 'lucide-react';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentUpdated?: (updatedOrder: Order) => void;
}

export const UpiPaymentModal: React.FC<Props> = ({ 
  order, 
  isOpen, 
  onClose, 
  onPaymentUpdated 
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);
  const [utrNumber, setUtrNumber] = useState(order?.upiReference || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extract clean UPI ID and payee name
  const upiId = order?.upiId || 'merchant@upi';
  const payeeName = order?.upiPayeeName || order?.restaurantName || 'Tastely Vendor';
  const amount = order?.totalAmount || 0;
  const orderNumber = order?.orderNumber || 'ORD-00000';

  // Construct standard Indian National Payments Corporation (NPCI) UPI deep-link URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}`;

  useEffect(() => {
    if (order) {
      setUtrNumber(order.upiReference || '');
      setErrorMsg('');
      setSuccessMsg('');

      // Generate scannable QR code
      QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1c1917', // stone-900
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => {
          console.error('Failed to generate UPI QR code', err);
          setErrorMsg('Failed to render QR Code preview.');
        });
    }
  }, [order, upiUri]);

  if (!isOpen || !order) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmt = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmt(true);
    setTimeout(() => setCopiedAmt(false), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI transaction reference (UTR) from your payment app.');
      return;
    }

    try {
      setIsSubmittingUtr(true);
      setErrorMsg('');
      const res = await api.submitOrderUtr(order.id, cleanUtr, customerNotes);
      setSuccessMsg(`UTR reference "${cleanUtr}" submitted! Vendor will verify against their UPI account.`);
      if (onPaymentUpdated) {
        onPaymentUpdated(res.order);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit UTR reference. Please try again.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            Payment Verified by Vendor
          </span>
        );
      case 'payment_submitted':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            UTR Submitted · Awaiting Vendor Verification
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            Payment Failed / Resubmission Required
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden my-6 border border-stone-200 animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">
                  Scan & Pay via UPI
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-stone-900 text-white">
                  INR (₹)
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Order #{order.orderNumber} · <strong>{order.restaurantName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Current Payment Status Banner */}
          <div className="text-center space-y-2">
            {renderStatusBadge(order.paymentStatus)}
            
            <div className="pt-2">
              <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
                Total Payable Amount
              </div>
              <div className="text-4xl font-black text-stone-900 tracking-tight flex items-center justify-center gap-1.5">
                <span>₹{amount}</span>
                <button
                  type="button"
                  onClick={handleCopyAmt}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Copy amount"
                >
                  {copiedAmt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="p-5 rounded-3xl bg-stone-50 border-2 border-stone-200 text-center space-y-3">
            <div className="inline-block p-3 rounded-2xl bg-white shadow-md border border-stone-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR Code for Order ${orderNumber}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-stone-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>

            <div className="text-xs text-stone-600 space-y-1">
              <div className="font-bold text-stone-800">
                Scan with any UPI app
              </div>
              <div className="text-[11px] text-stone-500">
                Google Pay · PhonePe · Paytm · BHIM · Cred · Banking UPI Apps
              </div>
            </div>

            {/* Direct Open in UPI App button for supported mobile devices */}
            <div className="pt-2">
              <a
                href={upiUri}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-xs transition-transform hover:scale-[1.02] active:scale-98"
              >
                <span>Open in Supported UPI App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Payee Details & Copy Tool */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500 font-medium">Merchant / Payee Name:</span>
              <span className="font-bold text-stone-900">{payeeName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-500 font-medium">Vendor UPI ID:</span>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                  {upiId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
              <span>Payment Reference:</span>
              <span className="font-mono font-semibold text-stone-700">Order {order.orderNumber}</span>
            </div>
          </div>

          {/* Customer UTR Submission Section */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-stone-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                Step 2: Enter Transaction UTR Reference
              </h4>
            </div>
            
            <p className="text-[11px] text-stone-500 leading-relaxed">
              After completing the payment in your UPI app, enter your 12-digit UPI Reference No. (UTR) below so the vendor can check their bank account and verify your payment.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {order.paymentStatus === 'verified' ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Payment Verified by Vendor!
                </div>
                <p className="text-[11px] text-emerald-800">
                  UTR Reference: <strong className="font-mono">{order.upiReference}</strong>. Your food order is being prepared by the kitchen.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitUtr} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    UPI Reference / UTR Number (12 digits) *
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="e.g. 429182749102"
                    maxLength={30}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <div className="text-[10px] text-stone-400 mt-1">
                    Found in your Google Pay, PhonePe, or Paytm receipt details.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Optional Notes (e.g. Payer Name or Phone)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Paid from Ananya's HDFC UPI"
                    maxLength={100}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingUtr || !utrNumber.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {isSubmittingUtr ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting UTR...</span>
                    </>
                  ) : (
                    <>
                      <span>{order.upiReference ? 'Update Submitted UTR' : 'Submit UTR for Verification'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Safety & Anti-Fraud Notice */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Security Notice:</span>
              <p className="text-amber-800 leading-relaxed">
                Tastely will <strong>never</strong> ask for your UPI PIN, OTP, or net banking password. Payments are verified manually by authorized vendors against actual bank receipts before preparation.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-500 font-medium">
            Status: <strong className="capitalize">{order.paymentStatus.replace('_', ' ')}</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close & Track Order
          </button>
        </div>

      </div>
    </div>
  );
};
