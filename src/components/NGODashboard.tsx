import React, { useState, useEffect } from 'react';
import { DonationOffer, DonationRequest, Reservation, Order } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { 
  HeartHandshake, MapPin, Clock, CheckCircle2, 
  Truck, AlertCircle, RefreshCw, Sparkles, Building2, User,
  ShieldAlert, PackageCheck, AlertTriangle, Phone, Check,
  XCircle, ChefHat, Info, ArrowRight, ShieldCheck, CheckCheck,
  Ticket, CheckSquare, Loader2
} from 'lucide-react';

interface NGODashboardProps {
  initialFilter?: 'all' | 'available' | 'claimed' | 'completed';
}

export const NGODashboard: React.FC<NGODashboardProps> = ({ initialFilter = 'all' }) => {
  const { user, role, switchRole } = useAuth();
  const [donations, setDonations] = useState<DonationOffer[]>([]);
  const [myRequests, setMyRequests] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'requests' | 'history' | 'vouchers'>('available');
  
  // Voucher Verification & Handover states
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);
  const [verifiedVoucherData, setVerifiedVoucherData] = useState<{
    reservation: Reservation;
    order: Order;
    voucherCode: string;
    message?: string;
  } | null>(null);
  const [voucherSuccessMsg, setVoucherSuccessMsg] = useState('');
  const [voucherErrorMsg, setVoucherErrorMsg] = useState('');

  // Request Modal State
  const [selectedDonation, setSelectedDonation] = useState<DonationOffer | null>(null);
  const [requestedQty, setRequestedQty] = useState<number>(5);
  const [volunteerName, setVolunteerName] = useState(user?.name || 'Sarah Jenkins');
  const [volunteerPhone, setVolunteerPhone] = useState('+91 98765 43210');
  const [claimNotes, setClaimNotes] = useState('Arriving with insulated food-safe transport container.');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [collectingRequestId, setCollectingRequestId] = useState<string | null>(null);

  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [authNoticeModal, setAuthNoticeModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorNotice('');
      const [donationsData, requestsData] = await Promise.all([
        api.getDonations(),
        (user?.role === 'ngo' || user?.role === 'admin') ? api.getNGORequests().catch(() => []) : Promise.resolve([])
      ]);
      setDonations(Array.isArray(donationsData) ? donationsData : []);
      setMyRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err: any) {
      console.error('Failed to load NGO dashboard data:', err);
      setErrorNotice(err.message || 'Failed to load donations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenRequestModal = (donation: DonationOffer) => {
    const isAuthorized = user && (user.role === 'ngo' || user.role === 'admin');
    if (!isAuthorized) {
      setAuthNoticeModal(true);
      return;
    }
    setSelectedDonation(donation);
    setRequestedQty(Math.min(donation.availableQuantity, 5) || 1);
    setVolunteerName(user?.name || 'Sarah Jenkins');
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;

    const isAuthorized = user && (user.role === 'ngo' || user.role === 'admin');
    if (!isAuthorized) {
      setErrorNotice('Only verified NGO coordinators or registered volunteers can request food donations.');
      return;
    }

    if (requestedQty <= 0) {
      setErrorNotice('Please request at least 1 portion.');
      return;
    }

    if (requestedQty > selectedDonation.availableQuantity) {
      setErrorNotice(`Only ${selectedDonation.availableQuantity} portion(s) are currently available.`);
      return;
    }

    try {
      setIsSubmittingRequest(true);
      setErrorNotice('');
      
      const res = await api.requestDonation(selectedDonation.id, {
        requestedQuantity: Number(requestedQty),
        volunteerName: volunteerName.trim(),
        volunteerPhone: volunteerPhone.trim(),
        notes: claimNotes.trim()
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccessNotice(res.message || `Request submitted for ${requestedQty} portions! Waiting for ${selectedDonation.restaurantName} to approve.`);
      setTimeout(() => setSuccessNotice(''), 5000);
      setSelectedDonation(null);
      await loadData();
      setActiveTab('requests');
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to submit donation request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleConfirmCollection = async (requestId: string) => {
    const isAuthorized = user && (user.role === 'ngo' || user.role === 'admin');
    if (!isAuthorized) {
      setErrorNotice('Only authorized NGO volunteers can confirm pickup.');
      return;
    }

    try {
      setCollectingRequestId(requestId);
      setErrorNotice('');
      const res = await api.confirmDonationCollection(requestId);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });

      setSuccessNotice(res.message || 'Food collection confirmed! Wholesome meals safely delivered to shelter.');
      setTimeout(() => setSuccessNotice(''), 5000);
      await loadData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to confirm pickup');
    } finally {
      setCollectingRequestId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this request? Portions will be safely restored for other eligible food rescue partners.')) {
      return;
    }

    try {
      setCancellingRequestId(requestId);
      setErrorNotice('');
      const res = await api.cancelDonationRequest(requestId, 'Cancelled by NGO volunteer coordinator.');
      setSuccessNotice(res.message || 'Request cancelled. Portions released back to the donation pool.');
      setTimeout(() => setSuccessNotice(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to cancel request');
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleVerifyVoucher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      setVoucherErrorMsg('Please enter a customer voucher code (e.g. TST-7921) to verify.');
      return;
    }
    try {
      setIsVerifyingVoucher(true);
      setVoucherErrorMsg('');
      setVoucherSuccessMsg('');
      setVerifiedVoucherData(null);

      const res = await api.verifyVoucher(code);
      setVerifiedVoucherData(res);
      setVoucherCodeInput(code);
    } catch (err: any) {
      setVoucherErrorMsg(err.message || 'Invalid or unverified voucher code.');
      setVerifiedVoucherData(null);
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!verifiedVoucherData) return;
    try {
      setIsConfirmingHandover(true);
      setVoucherErrorMsg('');
      setVoucherSuccessMsg('');

      const res = await api.confirmHandover({ voucherCode: verifiedVoucherData.voucherCode });
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setVoucherSuccessMsg(res.message || `Food handover confirmed! Rescued meal handed over to customer. Order #${res.order?.orderNumber || ''} is now Completed in Orders section.`);
      setVerifiedVoucherData(null);
      setVoucherCodeInput('');
      await loadData();
    } catch (err: any) {
      setVoucherErrorMsg(err.message || 'Failed to confirm handover. Please try again.');
    } finally {
      setIsConfirmingHandover(false);
    }
  };

  const availableDonations = donations.filter(d => d && d.availableQuantity > 0 && d.status !== 'cancelled');
  const activeRequests = myRequests.filter(r => r.status !== 'collected');
  const completedRequests = myRequests.filter(r => r.status === 'collected');
  const totalMealsDelivered = completedRequests.reduce((sum, r) => sum + r.requestedQuantity, 0);

  return (
    <div className="py-10 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
              Verified NGO Food Rescue Network (Stage 3)
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">
              Food Rescue & Community Donation Hub
            </h1>
            <p className="text-sm md:text-base text-stone-600 max-w-2xl mt-1.5">
              Certified non-profits and registered student volunteers coordinate verified pickups of wholesome surplus food, redirecting fresh meals from kitchens and campus stalls to local shelters and community pantries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
              title="Refresh live rescue listings"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button 
              onClick={() => setErrorNotice('')}
              className="text-rose-500 hover:text-rose-800 font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {successNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Food Safety & Responsibility Disclaimer Banner */}
        <div className="mb-8 p-5 rounded-3xl bg-white border border-stone-200 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-xs space-y-1">
            <strong className="text-stone-900 font-bold block">
              Food Safety & Transportation Protocol:
            </strong>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              All offered food must be freshly cooked, unexpired, hygienically packaged, and verified safe for human consumption by the donor before listing. Volunteers must arrive before stated pickup deadlines and maintain safe transport standards (such as insulated temperature-controlled containers). <em>Tastely coordinates logistics and provides transparent audit logs; applicable health and food safety requirements must be respected by both donor and recipient organizations.</em>
            </p>
          </div>
        </div>

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Available Batches</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{availableDonations.length} Open</div>
            <span className="text-[10px] text-stone-500">
              {availableDonations.reduce((sum, d) => sum + (d.availableQuantity || 0), 0)} meals ready for claim
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active NGO Requests</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{activeRequests.length} Pending</div>
            <span className="text-[10px] text-stone-500">
              {activeRequests.filter(r => r.status === 'ready_for_pickup').length} ready for pickup
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Delivered to Shelters</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{totalMealsDelivered} Meals</div>
            <span className="text-[10px] text-rose-600 font-semibold">100% verified rescues</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Completed Pickups</span>
            <div className="text-2xl font-black text-stone-900 mt-1">{completedRequests.length} Batches</div>
            <span className="text-[10px] text-stone-500">Recorded in Platform Impact</span>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'available'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Available Food Donations ({availableDonations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>My Submitted Requests ({myRequests.length})</span>
            {myRequests.filter(r => r.status === 'ready_for_pickup').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 animate-pulse">
                {myRequests.filter(r => r.status === 'ready_for_pickup').length} Ready
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Verified Rescue History ({completedRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'vouchers'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-amber-700" />
            <span>Surplus Voucher Pickup & Handover</span>
          </button>
        </div>

        {/* TAB 1: Available Donations Grid */}
        {activeTab === 'available' && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-64 rounded-3xl bg-stone-200/50 animate-pulse" />
                ))}
              </div>
            ) : availableDonations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-8 shadow-2xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-800">No active leftover donations listed</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Partner kitchens and campus stalls publish safe surplus meal batches near closing time. Check back soon or refresh the dashboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableDonations.map(donation => (
                  <div
                    key={donation.id}
                    className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Portions & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{donation.availableQuantity} of {donation.initialQuantity} Portions Open</span>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {donation.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-stone-900 leading-snug">
                          {donation.dishName}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                          {donation.batchIdentifier || `Batch #${donation.id.replace('don_', '').slice(-4)}`}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                        {donation.description || 'Wholesome fresh meal batch offered for community rescue.'}
                      </p>

                      {/* Donor, Location, and Deadlines */}
                      <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600">
                        <div className="flex items-center gap-1.5 font-bold text-stone-800">
                          <Building2 className="w-4 h-4 text-stone-400 shrink-0" />
                          <span>{donation.restaurantName}</span>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-stone-600 leading-tight">
                            Pickup: {donation.pickupLocation || donation.restaurantAddress}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-rose-700">
                            Deadline: {donation.pickupDeadline}
                          </span>
                        </div>

                        {donation.prepTime && (
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            <ChefHat className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>Batch Cooked: {donation.prepTime}</span>
                          </div>
                        )}

                        {donation.handlingNotes && (
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-stone-600 italic">
                            "{donation.handlingNotes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-6 pt-4 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleOpenRequestModal(donation)}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Request Portions for Rescue</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: My Submitted Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-8 shadow-2xs">
                <Truck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-stone-800">No active rescue requests submitted</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Browse the Available Donations tab to claim portions for your non-profit organization or community shelter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => {
                  const isPending = req.status === 'requested';
                  const isApproved = req.status === 'approved';
                  const isReady = req.status === 'ready_for_pickup';
                  const isCollected = req.status === 'collected';
                  const isRejected = req.status === 'rejected';
                  const isCancelled = req.status === 'cancelled';

                  return (
                    <div
                      key={req.id}
                      className={`p-6 rounded-3xl border bg-white shadow-xs space-y-4 transition-all ${
                        isReady 
                          ? 'border-purple-300 ring-2 ring-purple-100' 
                          : isApproved 
                          ? 'border-blue-200' 
                          : isCollected 
                          ? 'border-emerald-200 bg-stone-50/50' 
                          : isRejected || isCancelled
                          ? 'border-stone-200 opacity-60'
                          : 'border-amber-200'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-stone-900">{req.dishName}</h3>
                            {req.batchIdentifier && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                {req.batchIdentifier}
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-900'
                                : isApproved
                                ? 'bg-blue-100 text-blue-900'
                                : isReady
                                ? 'bg-purple-100 text-purple-900 animate-pulse'
                                : isCollected
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}>
                              {req.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Kitchen / Establishment: <strong>{req.restaurantName}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-lg font-black text-rose-600 block">
                              {req.requestedQuantity} portion(s)
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Requested {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Logistics Info Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase block">Pickup Location</span>
                          <span className="font-bold text-stone-800">{req.pickupLocation}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase block">Pickup Deadline</span>
                          <span className="font-bold text-rose-700">{req.pickupDeadline}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase block">Assigned Volunteer</span>
                          <span className="font-semibold text-stone-800">{req.volunteerName} {req.volunteerPhone ? `(${req.volunteerPhone})` : ''}</span>
                        </div>
                        {req.notes && (
                          <div className="col-span-full pt-1 text-[11px] text-stone-500 border-t border-stone-200/50">
                            <strong>Coordinator Note:</strong> "{req.notes}"
                          </div>
                        )}
                        {req.rejectionReason && (
                          <div className="col-span-full pt-1 text-[11px] text-rose-700 font-medium">
                            <strong>Vendor Note:</strong> {req.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Progress Stage Tracker */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                          <span className={isPending ? 'text-amber-700' : 'text-stone-400'}>1. Submitted</span>
                          <span className={isApproved ? 'text-blue-700' : 'text-stone-400'}>2. Kitchen Approved</span>
                          <span className={isReady ? 'text-purple-700' : 'text-stone-400'}>3. Ready for Pickup</span>
                          <span className={isCollected ? 'text-emerald-700' : 'text-stone-400'}>4. Safely Collected</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isCollected 
                                ? 'w-full bg-emerald-500' 
                                : isReady 
                                ? 'w-3/4 bg-purple-600' 
                                : isApproved 
                                ? 'w-1/2 bg-blue-600' 
                                : isPending 
                                ? 'w-1/4 bg-amber-500' 
                                : 'w-0'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
                        <div>
                          {!isCollected && !isCancelled && !isRejected && (
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(req.id)}
                              disabled={cancellingRequestId === req.id}
                              className="text-xs font-bold text-stone-500 hover:text-rose-600 cursor-pointer transition-colors"
                            >
                              {cancellingRequestId === req.id ? 'Releasing...' : 'Cancel Request & Release Food'}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {(isApproved || isReady) && (
                            <button
                              type="button"
                              onClick={() => handleConfirmCollection(req.id)}
                              disabled={collectingRequestId === req.id}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-[1.01] active:scale-99"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{collectingRequestId === req.id ? 'Verifying...' : 'Confirm Food Collected / Delivered'}</span>
                            </button>
                          )}

                          {isCollected && (
                            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                              <span>Collection Confirmed & Logged to Platform Impact</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Completed Rescues History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Verified Delivered Food Batches</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                {totalMealsDelivered} Meals Successfully Rescued
              </span>
            </div>

            {completedRequests.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-8">
                No completed rescue collections yet. Verified pickups will be archived here.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {completedRequests.map(r => (
                  <div key={r.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{r.dishName}</div>
                      <div className="text-stone-500 mt-0.5">
                        Donor: <strong>{r.restaurantName}</strong> • Volunteer: {r.volunteerName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-700 text-base">+{r.requestedQuantity} meals</div>
                      <span className="text-[10px] text-stone-400">
                        {r.collectedAt ? new Date(r.collectedAt).toLocaleDateString() : 'Verified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Surplus Voucher Verification & Food Handover */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-2xs">
                  <Ticket className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    Surplus Voucher Pickup & Handover
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Step 1: Enter customer's voucher code and click "Verify Voucher". Step 2: Physically hand over the food, then click "Confirm Handover".
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Food Rescue Protocol
                </span>
              </div>
            </div>

            {/* Error Message */}
            {voucherErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{voucherErrorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoucherErrorMsg('')}
                  className="text-rose-600 hover:text-rose-900 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success Message */}
            {voucherSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{voucherSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoucherSuccessMsg('')}
                  className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Step 1: Input and Verify Voucher Form */}
            <form onSubmit={handleVerifyVoucher} className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3">
              <label className="text-xs font-black text-stone-900 uppercase tracking-wider block">
                1. Customer Pickup Voucher Code
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter Voucher Code (e.g. TST-7921)"
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-300 bg-white font-mono font-black text-sm text-stone-900 placeholder:text-stone-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-wider shadow-2xs"
                />

                <button
                  type="submit"
                  disabled={isVerifyingVoucher || !voucherCodeInput.trim()}
                  className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs shrink-0"
                >
                  {isVerifyingVoucher ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Verify Voucher</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Step 2: Validated Order Details Card & Confirm Handover Button */}
            {verifiedVoucherData && (
              <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500 shadow-md animate-in fade-in space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-mono font-black text-sm tracking-wider shadow-2xs">
                      {verifiedVoucherData.voucherCode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Voucher Validated
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Matching Order: <strong className="text-stone-900 font-bold">#{verifiedVoucherData.order?.orderNumber}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Customer Name</span>
                    <strong className="text-stone-900 text-sm block mt-0.5">{verifiedVoucherData.reservation?.userName || 'Campus Diner'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Meal Title</span>
                    <strong className="text-stone-900 text-sm block mt-0.5">
                      {verifiedVoucherData.reservation?.quantity}x {verifiedVoucherData.reservation?.dishTitle}
                    </strong>
                    <span className="text-[11px] text-stone-500 block mt-0.5">{verifiedVoucherData.reservation?.restaurantName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Amount</span>
                    <strong className="text-emerald-700 text-sm block mt-0.5">
                      ₹{verifiedVoucherData.reservation?.totalPrice}
                    </strong>
                    <span className="text-[11px] text-stone-500 block mt-0.5">Pay on Pickup</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Pickup Deadline: <strong>Today before {verifiedVoucherData.reservation?.pickupEnd}</strong>. After physically handing over the meal box, click <strong>Confirm Handover</strong> below.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmHandover}
                    disabled={isConfirmingHandover}
                    className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isConfirmingHandover ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Order to Completed...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>Confirm Handover</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifiedVoucherData(null)}
                    disabled={isConfirmingHandover}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Request Food Rescue Portions */}
        {selectedDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  Request Food Rescue Batch
                </h3>
                <p className="text-xs text-stone-500">
                  Specify how many meals your volunteer will collect from this available donation batch.
                </p>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900 text-sm">{selectedDonation.dishName}</div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {selectedDonation.batchIdentifier || `Batch #${selectedDonation.id.replace('don_', '').slice(-4)}`}
                    </span>
                  </div>
                  <div className="text-stone-600">
                    Prepared by: <strong>{selectedDonation.restaurantName}</strong> ({selectedDonation.pickupLocation})
                  </div>
                  <div className="text-rose-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pickup Deadline: {selectedDonation.pickupDeadline}</span>
                  </div>
                  {selectedDonation.handlingNotes && (
                    <div className="text-stone-500 italic pt-1 border-t border-stone-200/50">
                      Handling: {selectedDonation.handlingNotes}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-stone-700 block">
                      Number of Portions to Request *
                    </label>
                    <span className="text-[11px] text-stone-500 font-semibold">
                      Max Available: {selectedDonation.availableQuantity}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={selectedDonation.availableQuantity}
                    required
                    value={requestedQty}
                    onChange={(e) => setRequestedQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Requesting {requestedQty} portion(s) leaves {Math.max(0, selectedDonation.availableQuantity - requestedQty)} portion(s) available for other community NGOs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Volunteer Name *</label>
                    <input
                      type="text"
                      required
                      value={volunteerName}
                      onChange={(e) => setVolunteerName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Volunteer Phone *</label>
                    <input
                      type="tel"
                      required
                      value={volunteerPhone}
                      onChange={(e) => setVolunteerPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Arrival Estimate & Transport Notes</label>
                  <textarea
                    rows={2}
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    placeholder="e.g. Arriving in 25 mins with food-safe thermal carrier."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setSelectedDonation(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest || requestedQty > selectedDonation.availableQuantity}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmittingRequest ? 'Submitting Request...' : `Confirm Request for ${requestedQty} Portions`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Volunteer Verification Notice */}
        {authNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  NGO Volunteer Verification Required
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  To request surplus food for community shelters, an authorized NGO Volunteer or Administrator role is required.
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  You can instantly test the pickup workflow by switching to <strong>Sarah Jenkins (NGO Volunteer)</strong> in the top switcher.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAuthNoticeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await switchRole('ngo');
                    setAuthNoticeModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Switch to NGO Volunteer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
