import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { InventoryItem, Restaurant, BusinessType, SurplusOffer, Order, OrderStatus, DonationOffer, DonationRequest, DonationStatus, Reservation } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Store, Package, Plus, AlertTriangle, CheckCircle2, 
  Tag, HeartHandshake, RefreshCw, Calculator, 
  Trash2, Edit3, XCircle, Building, Tent, Utensils, 
  Database, Image as ImageIcon, Sparkles, Check,
  LayoutGrid, Table as TableIcon, Upload, Clock, ShoppingCart,
  ShoppingBag, Phone, ChefHat, CheckSquare, QrCode, Copy,
  CreditCard, ShieldCheck, ShieldAlert, ExternalLink, ArrowRight, Loader2,
  Calendar, MapPin, BellRing, UserCheck, AlertCircle, CheckCheck, Truck, Ticket, Banknote, X
} from 'lucide-react';

const PRESET_FOOD_IMAGES = [
  { label: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
  { label: 'Noodles / Ramen', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' },
  { label: 'Healthy Rice Bowl', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fest Nachos / Street Food', url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dessert & Pastry', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80' }
];

export const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [surplusOffers, setSurplusOffers] = useState<SurplusOffer[]>([]);
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);
  const [vendorDonations, setVendorDonations] = useState<DonationOffer[]>([]);
  const [vendorRequests, setVendorRequests] = useState<DonationRequest[]>([]);
  const [vendorReservations, setVendorReservations] = useState<Reservation[]>([]);
  const [closingCheck, setClosingCheck] = useState<any | null>(null);
  const [activeVendorTab, setActiveVendorTab] = useState<'inventory' | 'orders' | 'reservations' | 'donations' | 'payments' | 'profile'>('inventory');
  const [reservationsFilter, setReservationsFilter] = useState<'all' | 'reserved' | 'picked_up' | 'cancelled'>('all');
  const [reservationSearchQuery, setReservationSearchQuery] = useState('');
  const [voucherLookupInput, setVoucherLookupInput] = useState('');
  const [isConfirmingPickup, setIsConfirmingPickup] = useState(false);
  const [confirmingResId, setConfirmingResId] = useState<string | null>(null);
  const [pickupSuccessBanner, setPickupSuccessBanner] = useState<string | null>(null);
  const [pickupErrorBanner, setPickupErrorBanner] = useState<string | null>(null);
  const [verifiedVoucherData, setVerifiedVoucherData] = useState<{
    reservation: Reservation;
    order: Order;
    voucherCode: string;
    message?: string;
  } | null>(null);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);

  // Restaurant Profile Edit states
  const [profileName, setProfileName] = useState('');
  const [profileCuisine, setProfileCuisine] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDeliveryTime, setProfileDeliveryTime] = useState('');
  const [profilePriceRange, setProfilePriceRange] = useState<'₹' | '₹₹' | '₹₹₹'>('₹₹');
  const [profileImage, setProfileImage] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileTags, setProfileTags] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [donationsSubTab, setDonationsSubTab] = useState<'listings' | 'requests'>('listings');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'active' | 'awaiting_payment' | 'completed' | 'cancelled'>('active');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [vendorProfile, setVendorProfile] = useState<Restaurant | null>(null);
  const [storageStatus, setStorageStatus] = useState<string>('Connected to Persistent Disk Storage');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Vendor UPI Payment Settings states
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiPayeeNameInput, setUpiPayeeNameInput] = useState('');
  const [isSavingUpiSettings, setIsSavingUpiSettings] = useState(false);
  const [upiPreviewQrUrl, setUpiPreviewQrUrl] = useState('');
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [verifyingPaymentOrderId, setVerifyingPaymentOrderId] = useState<string | null>(null);

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showSurplusModal, setShowSurplusModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Add Item form fields
  const [addName, setAddName] = useState('');
  const [addBatchIdentifier, setAddBatchIdentifier] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addCategory, setAddCategory] = useState('Burgers');
  const [addImage, setAddImage] = useState(PRESET_FOOD_IMAGES[0].url);
  const [addPrice, setAddPrice] = useState<number>(149);
  const [addCost, setAddCost] = useState<number>(60);
  const [addPreparedQty, setAddPreparedQty] = useState<number>(30);
  const [addRemainingQty, setAddRemainingQty] = useState<number>(30);
  const [addSurplusDiscountPrice, setAddSurplusDiscountPrice] = useState<number>(75);
  const [addIsSurplusEligible, setAddIsSurplusEligible] = useState(true);
  const [addIsDonationEligible, setAddIsDonationEligible] = useState(true);
  const [addRestaurantName, setAddRestaurantName] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [addDiscountPercentage, setAddDiscountPercentage] = useState<number>(40);
  const [addOfferExpiryTime, setAddOfferExpiryTime] = useState('22:00');
  const [showInlineAddForm, setShowInlineAddForm] = useState(true);

  // Edit Item form fields
  const [editName, setEditName] = useState('');
  const [editBatchIdentifier, setEditBatchIdentifier] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editPreparedQty, setEditPreparedQty] = useState<number>(0);
  const [editSoldQty, setEditSoldQty] = useState<number>(0);

  // Surplus modal form fields (Vendor-Controlled Release)
  const [surplusPrice, setSurplusPrice] = useState<number>(79);
  const [surplusQty, setSurplusQty] = useState<number>(4);
  const [surplusPickupEnd, setSurplusPickupEnd] = useState('22:00');
  const [surplusDiscountPct, setSurplusDiscountPct] = useState<number>(50);
  const [surplusSuitabilityConfirmed, setSurplusSuitabilityConfirmed] = useState(false);
  const [surplusSelectedItemId, setSurplusSelectedItemId] = useState('');
  const [isReleasingSurplus, setIsReleasingSurplus] = useState(false);

  // Donation modal form fields
  const [donationPortions, setDonationPortions] = useState<number>(5);
  const [donationPrepTime, setDonationPrepTime] = useState('Freshly prepared today at 18:00');
  const [donationDeadline, setDonationDeadline] = useState('Today before 22:30');
  const [donationLocation, setDonationLocation] = useState('');
  const [donationHandlingNotes, setDonationHandlingNotes] = useState('Kept chilled under 4°C, packaged in food-grade foil trays. Contains dairy & gluten.');
  const [donationConfirmedSuitable, setDonationConfirmedSuitable] = useState(false);
  const [donationSelectedItemId, setDonationSelectedItemId] = useState('');

  // Editing donation listing
  const [editingDonation, setEditingDonation] = useState<DonationOffer | null>(null);
  const [editDonationDeadline, setEditDonationDeadline] = useState('');
  const [editDonationLocation, setEditDonationLocation] = useState('');
  const [editDonationNotes, setEditDonationNotes] = useState('');

  // Rejecting donation request
  const [rejectingRequest, setRejectingRequest] = useState<DonationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Declined due to early kitchen closing.');

  // Order cancellation & stock restoration modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');

  // Business Type modal fields
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType>('Restaurant');
  const [vendorName, setVendorName] = useState('');
  const [collegeName, setCollegeName] = useState('Metro Institute of Technology');
  const [stallNumber, setStallNumber] = useState('Stall #14');

  const filteredOrders = vendorOrders.filter(o => {
    if (ordersFilter === 'active') return o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled';
    if (ordersFilter === 'awaiting_payment') {
      if (o.paymentMethod === 'upi') {
        return o.paymentStatus === 'payment_submitted' || o.paymentStatus === 'pending';
      }
      if (o.paymentMethod === 'pay_on_pickup') {
        return o.paymentStatus === 'pay_on_pickup' || o.paymentStatus === 'pending';
      }
      if (o.paymentMethod === 'demo' || o.isDemoPayment) {
        return o.paymentStatus === 'demo_pending' || o.paymentStatus === 'pending';
      }
      return false;
    }
    if (ordersFilter === 'completed') return o.orderStatus === 'completed';
    if (ordersFilter === 'cancelled') return o.orderStatus === 'cancelled';
    return true;
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const [invData, profileData, statusData, offersData, ordersData, paymentData, donationsData, requestsData, closingData, reservationsData] = await Promise.all([
        api.getInventory(),
        api.getVendorProfile().catch(() => null),
        api.getStorageStatus().catch(() => null),
        api.getAllSurplusOffers().catch(() => []),
        api.getOrders().catch(() => []),
        api.getVendorPaymentSettings().catch(() => null),
        api.getDonations().catch(() => []),
        api.getVendorDonationRequests().catch(() => []),
        api.getClosingTimeCheck().catch(() => null),
        api.getVendorReservations().catch(() => [])
      ]);
      setInventory(invData);
      setSurplusOffers(offersData);
      setVendorOrders(ordersData);
      setVendorDonations(donationsData);
      setVendorRequests(requestsData);
      setClosingCheck(closingData);
      setVendorReservations(reservationsData);

      if (profileData) {
        setVendorProfile(profileData);
        setSelectedBusinessType(profileData.businessType || 'Restaurant');
        setVendorName(profileData.name);
        setAddRestaurantName(profileData.name);
        const loc = profileData.stallNumber || profileData.address || profileData.collegeName || 'Campus Main Grounds';
        setAddLocation(loc);
        setDonationLocation(loc);
        if (profileData.collegeName) setCollegeName(profileData.collegeName);
        if (profileData.stallNumber) setStallNumber(profileData.stallNumber);

        // Storefront Profile Edit states
        setProfileName(profileData.name || '');
        setProfileCuisine(profileData.cuisine || '');
        setProfileAddress(profileData.address || '');
        setProfileCity(profileData.city || 'Campus Hub');
        setProfilePhone(profileData.phone || '+91 98765 00000');
        setProfileDeliveryTime(profileData.deliveryTime || '20-30 min');
        setProfilePriceRange(profileData.priceRange || '₹₹');
        setProfileImage(profileData.image || '');
        setProfileDescription(profileData.description || '');
        setProfileTags((profileData.tags || []).join(', '));
      }
      if (paymentData) {
        setUpiIdInput(paymentData.upiId || '');
        setUpiPayeeNameInput(paymentData.upiPayeeName || profileData?.name || '');
      } else if (profileData) {
        setUpiIdInput(profileData.upiId || '');
        setUpiPayeeNameInput(profileData.upiPayeeName || profileData.name || '');
      }
      if (statusData) {
        setStorageStatus(`Persisted on Server: ${statusData.storageEngine}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load vendor dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Generate live UPI QR preview whenever inputs change
  useEffect(() => {
    const cleanId = upiIdInput.trim();
    if (cleanId && cleanId.includes('@')) {
      const demoUri = `upi://pay?pa=${encodeURIComponent(cleanId)}&pn=${encodeURIComponent(upiPayeeNameInput.trim() || 'Tastely Vendor')}&cu=INR&tn=Sample%20Menu%20Order`;
      QRCode.toDataURL(demoUri, { width: 240, margin: 2, color: { dark: '#1c1917', light: '#ffffff' } })
        .then(setUpiPreviewQrUrl)
        .catch(() => setUpiPreviewQrUrl(''));
    } else {
      setUpiPreviewQrUrl('');
    }
  }, [upiIdInput, upiPayeeNameInput]);

  const handleSaveUpiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = upiIdInput.trim().toLowerCase();
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
    if (!upiRegex.test(cleanUpi)) {
      setErrorMsg('Invalid UPI ID format. Format must be username@bankhandle (e.g. pattylab@upi, stall14@paytm).');
      return;
    }
    if (!upiPayeeNameInput.trim()) {
      setErrorMsg('Merchant / Payee Name cannot be blank.');
      return;
    }

    try {
      setIsSavingUpiSettings(true);
      setErrorMsg('');
      const res = await api.updateVendorPaymentSettings({
        upiId: cleanUpi,
        upiPayeeName: upiPayeeNameInput.trim()
      });
      setSuccessMsg(`UPI settings saved! Customers will now scan ${res.settings.upiId} for payments.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save payment settings');
    } finally {
      setIsSavingUpiSettings(false);
    }
  };

  const handleSaveRestaurantProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMsg('Establishment name cannot be blank.');
      return;
    }

    try {
      setIsSavingProfile(true);
      setErrorMsg('');
      const tagArray = profileTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.updateVendorProfile({
        name: profileName.trim(),
        cuisine: profileCuisine.trim() || 'Multi-Cuisine',
        address: profileAddress.trim(),
        city: profileCity.trim() || 'Campus Hub',
        phone: profilePhone.trim(),
        deliveryTime: profileDeliveryTime.trim() || '20-30 min',
        priceRange: profilePriceRange,
        image: profileImage.trim() || undefined,
        description: profileDescription.trim(),
        tags: tagArray
      });

      setVendorProfile(res.restaurant);
      setSuccessMsg(`Storefront profile for "${res.restaurant.name}" updated successfully! Changes permanently saved to disk.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update restaurant profile');
    } finally {
      setIsSavingProfile(false);
    }
  };


  const handleVerifyPayment = async (orderId: string, status: 'verified' | 'failed' | 'received', notes?: string) => {
    try {
      setVerifyingPaymentOrderId(orderId);
      setErrorMsg('');
      await api.verifyOrderPayment(orderId, status, notes);
      setSuccessMsg(
        status === 'failed'
          ? 'Payment marked as Failed.'
          : status === 'received'
          ? 'Payment recorded as Received!'
          : 'Payment marked as Verified!'
      );
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update payment verification');
    } finally {
      setVerifyingPaymentOrderId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      if (status === 'completed') {
        const targetOrder = vendorOrders.find(o => o.id === orderId);
        if (targetOrder) {
          const isDemo = targetOrder.isDemoPayment || targetOrder.paymentMethod === 'demo';
          const isSatisfied = isDemo
            ? targetOrder.paymentStatus === 'demo_completed'
            : targetOrder.paymentMethod === 'upi'
            ? targetOrder.paymentStatus === 'verified'
            : ['verified', 'received', 'paid'].includes(targetOrder.paymentStatus);

          if (!isSatisfied) {
            if (isDemo) {
              const failureDetail = targetOrder.demoFailureReason ? ` (${targetOrder.demoFailureReason})` : '';
              setErrorMsg(
                `Cannot complete handover: Demo payment is in "${targetOrder.paymentStatus}" state${failureDetail}. Handover for demo orders is blocked until a successful demo payment simulation is completed. (DEMO — NO REAL MONEY TRANSFERRED)`
              );
            } else if (targetOrder.paymentMethod === 'upi') {
              setErrorMsg(
                targetOrder.paymentStatus === 'payment_submitted'
                  ? `Cannot complete handover: Customer submitted UPI UTR (${targetOrder.upiReference || ''}), but it has not been verified against your bank statement yet.`
                  : 'Cannot complete handover: UPI payment is pending or unverified. Verify payment first.'
              );
            } else {
              setErrorMsg('Cannot complete handover: In-person counter payment has not been recorded as received. Please record payment collection first.');
            }
            return;
          }
        }
      }

      setUpdatingOrderId(orderId);
      setErrorMsg('');
      const res = await api.updateOrderStatus(orderId, status, reason);
      const targetOrder = vendorOrders.find(o => o.id === orderId);
      setSuccessMsg(
        res.message ||
        (status === 'cancelled'
          ? `Order #${targetOrder?.orderNumber || orderId} has been cancelled and stock has been restored.`
          : `Order updated to "${status.replace(/_/g, ' ')}"!`)
      );
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Step 1: Verify customer voucher
  const handleVerifyVoucher = async (codeToVerify?: string) => {
    const code = (codeToVerify || voucherLookupInput).trim().toUpperCase();
    if (!code) {
      setPickupErrorBanner('Please enter a voucher code (e.g. TST-7921) to verify.');
      return;
    }
    try {
      setIsVerifyingVoucher(true);
      setPickupErrorBanner(null);
      setPickupSuccessBanner(null);
      setVerifiedVoucherData(null);

      const res = await api.verifyVoucher(code);
      setVerifiedVoucherData(res);
      setVoucherLookupInput(code);
    } catch (err: any) {
      setPickupErrorBanner(err.message || 'Invalid or unverified voucher code.');
      setVerifiedVoucherData(null);
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  // Step 2: Confirm physical handover and update order to Completed
  const handleConfirmHandover = async (codeOrId?: string) => {
    const code = codeOrId || verifiedVoucherData?.voucherCode || voucherLookupInput.trim().toUpperCase();
    if (!code) {
      setPickupErrorBanner('Please enter or verify a voucher code before confirming handover.');
      return;
    }
    try {
      setIsConfirmingHandover(true);
      setConfirmingResId(code);
      setPickupErrorBanner(null);
      setPickupSuccessBanner(null);

      const res = await api.confirmHandover({ voucherCode: code });
      setPickupSuccessBanner(res.message || `Food handover confirmed for Voucher ${code}! Order is now Completed in Orders section.`);
      setVerifiedVoucherData(null);
      setVoucherLookupInput('');
      await loadData();
    } catch (err: any) {
      setPickupErrorBanner(err.message || 'Failed to confirm handover. Please check voucher code.');
    } finally {
      setIsConfirmingHandover(false);
      setConfirmingResId(null);
    }
  };

  const handleConfirmPickupReservation = async (reservationIdOrVoucher: string, code?: string) => {
    return handleConfirmHandover(code || reservationIdOrVoucher);
  };

  // Handle Business Type Selection
  const handleSaveBusinessType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      const res = await api.updateVendorBusinessType({
        businessType: selectedBusinessType,
        restaurantName: vendorName || vendorProfile?.name,
        collegeName: selectedBusinessType !== 'Restaurant' ? collegeName : undefined,
        stallNumber: selectedBusinessType === 'College Fest Stall' ? stallNumber : undefined
      });
      setVendorProfile(res.restaurant);
      setShowBusinessTypeModal(false);
      setSuccessMsg(`Business profile updated to ${selectedBusinessType}! Changes permanently saved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Image file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (target === 'add') setAddImage(reader.result);
          if (target === 'edit') setEditImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Item Submit
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setErrorMsg('Item name is required');
      return;
    }
    if (Number(addRemainingQty) > Number(addPreparedQty)) {
      setErrorMsg('Available quantity cannot be greater than prepared quantity');
      return;
    }
    try {
      setErrorMsg('');
      await api.createInventoryItem({
        dishName: addName.trim(),
        batchIdentifier: addBatchIdentifier.trim() || undefined,
        description: addDescription.trim(),
        category: addCategory,
        image: addImage,
        price: Number(addPrice),
        cost: Number(addCost),
        preparedQty: Number(addPreparedQty),
        remainingQty: Number(addRemainingQty),
        surplusDiscountPrice: Number(addSurplusDiscountPrice),
        isSurplusEligible: addIsSurplusEligible,
        isDonationEligible: addIsDonationEligible,
        restaurantName: addRestaurantName.trim() || undefined,
        location: addLocation.trim() || undefined,
        discountPercentage: addIsSurplusEligible ? Number(addDiscountPercentage) : undefined,
        offerExpiryTime: addIsSurplusEligible ? addOfferExpiryTime : undefined
      });

      setShowAddItemModal(false);
      setAddName('');
      setAddBatchIdentifier('');
      setAddDescription('');
      setSuccessMsg(`Added "${addName}"${addBatchIdentifier ? ` (${addBatchIdentifier})` : ''} (₹${addPrice}) to inventory! Permanently saved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditName(item.dishName);
    setEditBatchIdentifier(item.batchIdentifier || '');
    setEditDescription(item.description || '');
    setEditCategory(item.category);
    setEditImage(item.image || PRESET_FOOD_IMAGES[0].url);
    setEditPrice(item.price);
    setEditCost(item.cost);
    setEditPreparedQty(item.preparedQty);
    setEditSoldQty(item.soldQty);
    setShowEditItemModal(true);
  };

  // Edit Item Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const reserved = selectedItem.reservedQty || 0;
    const donationAllocated = selectedItem.donationAllocatedQty || 0;
    const calcRemaining = Number(editPreparedQty) - Number(editSoldQty) - reserved - donationAllocated;
    if (calcRemaining < 0) {
      setErrorMsg(`Invalid counts: Prepared (${editPreparedQty}) must be >= Sold (${editSoldQty}) + Reserved (${reserved}) + Donation Allocated (${donationAllocated}).`);
      return;
    }

    try {
      setErrorMsg('');
      await api.updateInventoryItem(selectedItem.id, {
        dishName: editName.trim(),
        batchIdentifier: editBatchIdentifier.trim() || undefined,
        description: editDescription.trim(),
        category: editCategory,
        image: editImage,
        price: Number(editPrice),
        cost: Number(editCost),
        preparedQty: Number(editPreparedQty),
        soldQty: Number(editSoldQty),
        remainingQty: calcRemaining
      });

      setShowEditItemModal(false);
      setSuccessMsg(`Updated "${editName}" successfully! Remaining stock is ${calcRemaining}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Quick Record Sale
  const handleRecordSale = async (item: InventoryItem, qty: number = 1) => {
    if (item.remainingQty < qty) {
      setErrorMsg(`Cannot record sale. Only ${item.remainingQty} portions remaining in stock.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    try {
      setErrorMsg('');
      await api.recordSale(item.id, qty);
      setSuccessMsg(`Recorded sale of ${qty} unit(s) for "${item.dishName}". Remaining: ${item.remainingQty - qty}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Mark Sold Out
  const handleMarkSoldOut = async (item: InventoryItem) => {
    try {
      setErrorMsg('');
      await api.markItemSoldOut(item.id);
      setSuccessMsg(`Marked "${item.dishName}" as Sold Out!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Delete Listing
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${item.dishName}" from your menu?`)) {
      return;
    }
    try {
      setErrorMsg('');
      await api.deleteInventoryItem(item.id);
      setSuccessMsg(`Removed listing for "${item.dishName}".`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Vendor-Controlled Explicit Surplus Deal Release
  const handleLaunchSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemToRelease = selectedItem || inventory.find(i => i.id === surplusSelectedItemId);
    if (!itemToRelease) {
      setErrorMsg('Please select an existing food item from your inventory to release as surplus.');
      return;
    }

    if (itemToRelease.remainingQty <= 0) {
      setErrorMsg(`"${itemToRelease.dishName}" is sold out. Cannot release surplus deals with 0 available stock.`);
      return;
    }

    const qty = Number(surplusQty);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      setErrorMsg('Please enter a valid whole number quantity of portions to release (minimum 1).');
      return;
    }

    if (qty > itemToRelease.remainingQty) {
      setErrorMsg(`Cannot release ${qty} surplus portions. Only ${itemToRelease.remainingQty} portions available in current stock.`);
      return;
    }

    const priceNum = Number(surplusPrice);
    if (!priceNum || priceNum <= 0 || priceNum >= itemToRelease.price) {
      setErrorMsg(`Surplus deal price (₹${priceNum}) must be greater than ₹0 and less than regular price (₹${itemToRelease.price}).`);
      return;
    }

    if (!surplusPickupEnd.trim()) {
      setErrorMsg('Please specify an expiry time for the surplus deal.');
      return;
    }

    if (!surplusSuitabilityConfirmed) {
      setErrorMsg('Food Safety Confirmation Required: You must verify and confirm that the food was freshly prepared today, meets hygiene standards, and is suitable for discounted sale.');
      return;
    }

    try {
      setIsReleasingSurplus(true);
      setErrorMsg('');
      const res = await api.releaseSurplusDeal({
        inventoryId: itemToRelease.id,
        surplusQty: qty,
        surplusPrice: priceNum,
        discountPercentage: surplusDiscountPct,
        expiryTime: surplusPickupEnd.trim(),
        suitabilityConfirmed: true
      });

      setShowSurplusModal(false);
      setSelectedItem(null);
      setSurplusSelectedItemId('');
      setSurplusSuitabilityConfirmed(false);
      setSuccessMsg(`Surplus deal released! ${qty} portions of "${itemToRelease.dishName}" are now live on the customer Surplus Feed at ₹${priceNum} (${res.offer.discountPercentage}% OFF).`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to release surplus deal');
    } finally {
      setIsReleasingSurplus(false);
    }
  };

  // Vendor Unpublish / Cancel Surplus Deal
  const handleUnpublishSurplus = async (offer: SurplusOffer) => {
    try {
      setErrorMsg('');
      await api.unpublishSurplusDeal(offer.id);
      setSuccessMsg(`Unpublished surplus deal "${offer.title}". Unreserved portions returned to available inventory.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to unpublish surplus deal');
    }
  };

  // Donation Management Lifecycle Handlers
  const handleLaunchDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemToDonate = selectedItem || inventory.find(i => i.id === donationSelectedItemId);
    if (!itemToDonate) {
      setErrorMsg('Please select an existing food item from your inventory to donate.');
      return;
    }

    if (!donationConfirmedSuitable) {
      setErrorMsg('Food Safety Confirmation Required: You must verify and check that the food is freshly prepared, unexpired, and safe for human consumption.');
      return;
    }

    if (donationPortions > itemToDonate.remainingQty) {
      setErrorMsg(`Cannot donate ${donationPortions} portions. Only ${itemToDonate.remainingQty} portions available in remaining stock.`);
      return;
    }

    if (!donationDeadline.trim()) {
      setErrorMsg('Please specify a pickup deadline so volunteers can arrive in time.');
      return;
    }

    try {
      setErrorMsg('');
      const res = await api.createDonationListing({
        inventoryId: itemToDonate.id,
        dishId: itemToDonate.dishId,
        quantity: Number(donationPortions),
        pickupDeadline: donationDeadline.trim(),
        pickupLocation: (donationLocation || vendorProfile?.address || vendorProfile?.stallNumber || 'Main kitchen counter').trim(),
        prepTime: donationPrepTime.trim(),
        handlingNotes: donationHandlingNotes.trim(),
        confirmedSuitable: true
      });

      setShowDonationModal(false);
      setSelectedItem(null);
      setDonationConfirmedSuitable(false);
      setSuccessMsg(res.message || `Published ${donationPortions} portions of "${itemToDonate.dishName}" for NGO Food Rescue!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish donation listing');
    }
  };

  const handleCancelDonationListing = async (donation: DonationOffer) => {
    if (donation.status === 'collected') {
      setErrorMsg('Cannot cancel food that has already been collected by the NGO.');
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel the donation listing for "${donation.dishName}"? Any uncollected portions (${donation.availableQuantity + (donation.allocatedQuantity || 0)}) will be safely restored to your menu inventory.`)) {
      return;
    }

    try {
      setErrorMsg('');
      const res = await api.cancelDonationListing(donation.id, 'Vendor cancelled donation listing');
      setSuccessMsg(res.message || `Donation listing cancelled. ${res.restoredPortions} portion(s) safely restored to inventory.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel donation listing');
    }
  };

  const handleSaveEditDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation) return;

    try {
      setErrorMsg('');
      await api.updateDonationListing(editingDonation.id, {
        pickupDeadline: editDonationDeadline.trim(),
        pickupLocation: editDonationLocation.trim(),
        handlingNotes: editDonationNotes.trim()
      });
      setEditingDonation(null);
      setSuccessMsg('Donation details updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update donation listing');
    }
  };

  const handleApproveDonationRequest = async (request: DonationRequest) => {
    try {
      setErrorMsg('');
      const res = await api.approveDonationRequest(request.id);
      setSuccessMsg(res.message || `Request from ${request.ngoName} for ${request.requestedQuantity} portion(s) approved!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve donation request');
    }
  };

  const handleRejectDonationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    try {
      setErrorMsg('');
      const res = await api.rejectDonationRequest(rejectingRequest.id, rejectReason.trim());
      setRejectingRequest(null);
      setSuccessMsg(res.message || `Request rejected. Portions returned to available pool.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject donation request');
    }
  };

  const handleMarkDonationReadyForPickup = async (request: DonationRequest) => {
    try {
      setErrorMsg('');
      const res = await api.markDonationReadyForPickup(request.id);
      setSuccessMsg(res.message || `Marked ${request.requestedQuantity} portions of "${request.dishName}" as Ready for Pickup.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to mark ready for pickup');
    }
  };

  const handleConfirmDonationCollected = async (request: DonationRequest) => {
    if (!window.confirm(`Confirm that volunteer "${request.volunteerName}" (${request.ngoName}) has collected the ${request.requestedQuantity} portions of "${request.dishName}"?`)) {
      return;
    }

    try {
      setErrorMsg('');
      const res = await api.confirmDonationCollection(request.id);
      setSuccessMsg(res.message || `Collection confirmed! Food successfully rescued and logged in Impact stats.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm collection');
    }
  };

  // Aggregate stats in ₹
  const totalItemsCount = inventory.length;
  const totalPrepared = inventory.reduce((sum, i) => sum + i.preparedQty, 0);
  const totalSold = inventory.reduce((sum, i) => sum + i.soldQty, 0);
  const totalReserved = inventory.reduce((sum, i) => sum + i.reservedQty, 0);
  const totalRemaining = inventory.reduce((sum, i) => sum + i.remainingQty, 0);
  const activeOffersCount = surplusOffers.filter(o => o.status === 'active').length + inventory.filter(i => i.isDonationEligible && i.reservedQty > 0).length;

  const businessType = vendorProfile?.businessType || 'Restaurant';

  // Calculated remaining in edit modal
  const editCalculatedRemaining = Math.max(0, Number(editPreparedQty) - Number(editSoldQty) - (selectedItem?.reservedQty || 0) - (selectedItem?.donationAllocatedQty || 0));

  return (
    <div className="py-10 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Business Type & Info Banner */}
        <div className="mb-6 p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3.5 rounded-2xl text-white ${
              businessType === 'College Fest Stall' 
                ? 'bg-amber-600' 
                : businessType === 'College Canteen'
                ? 'bg-emerald-600'
                : 'bg-stone-900'
            }`}>
              {businessType === 'College Fest Stall' ? <Tent className="w-6 h-6" /> : businessType === 'College Canteen' ? <Building className="w-6 h-6" /> : <Store className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-black text-stone-900">
                  {vendorProfile?.name || 'Kitchen & Food Inventory Hub'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide uppercase ${
                  businessType === 'College Fest Stall'
                    ? 'bg-amber-100 text-amber-900'
                    : businessType === 'College Canteen'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-stone-100 text-stone-800'
                }`}>
                  {businessType}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {businessType === 'College Fest Stall' 
                  ? `${vendorProfile?.stallNumber || 'Stall #14'} • ${vendorProfile?.collegeName || 'Annual College Fest'} • Live Campus Stall`
                  : businessType === 'College Canteen'
                  ? `${vendorProfile?.collegeName || 'Campus Central'} • Daily Student Cafeteria`
                  : `${vendorProfile?.address || 'Fine Artisan Restaurant'} • Commercial Kitchen`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Business Type Selector Button */}
            <button
              onClick={() => setShowBusinessTypeModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Change Business Type</span>
            </button>

            {/* Add Food Item Button */}
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Food Item</span>
            </button>
            
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Persistent Storage Confirmation Notice */}
        <div className="mb-6 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Persistent Backend Active:</strong> All food items, prices in Indian Rupees (₹), prepared quantities, sold records, and surplus deals are saved to disk in the backend database. They will not disappear on page refresh.
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
            <Check className="w-3 h-3 stroke-[3]" /> Auto-Saved
          </span>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Summary Metric Cards in INR (₹) */}
        {/* Total Items, Prepared, Sold, Remaining, and Active Offers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Items</span>
            <div className="text-3xl font-black text-stone-900 mt-1">{totalItemsCount}</div>
            <span className="text-[10px] text-stone-500">Active menu listings</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Prepared</span>
            <div className="text-3xl font-black text-stone-900 mt-1">{totalPrepared}</div>
            <span className="text-[10px] text-stone-500">Total batch cooked</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sold</span>
            <div className="text-3xl font-black text-blue-600 mt-1">{totalSold}</div>
            <span className="text-[10px] text-blue-500">Orders completed</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Remaining</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{totalRemaining}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">Available to serve</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Active Offers</span>
            <div className="text-3xl font-black text-amber-600 mt-1">{activeOffersCount}</div>
            <span className="text-[10px] text-amber-600 font-semibold">Surplus & NGO rescue</span>
          </div>
        </div>

        {/* Inventory Invariant Formula Display */}
        <div className="mb-6 p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-800">
              <Calculator className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                Automatic Stock Accounting Formula
              </div>
              <div className="text-xs font-mono font-bold text-stone-700 mt-0.5">
                Remaining Stock = Prepared ({totalPrepared}) − Sold ({totalSold}) − Reserved ({totalReserved}) = <span className="text-emerald-700 font-extrabold text-sm">{totalRemaining} Units</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            Atomic server verification: stock cannot become negative or double-committed.
          </div>
        </div>

        {/* Stage 3: End-of-Day / Closing Time Leftover Reconciliation Banner */}
        {closingCheck?.closingTimePrompt && (
          <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 shadow-xs flex items-start gap-3 animate-in fade-in">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-xs shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Closing Time Leftover Check
                </span>
                <span className="text-xs font-bold text-stone-700">
                  {closingCheck.totalUnsoldPortions} unsold portion(s) available across {closingCheck.unsoldItemsCount} item(s)
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
                Near or after closing time: Confirm how much fresh food remains unsold, verify suitability, and offer safe portions to local rescue NGOs before closing.
              </p>
            </div>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveVendorTab('inventory')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeVendorTab === 'inventory'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Food Inventory & Menu ({inventory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveVendorTab('orders')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeVendorTab === 'orders'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Incoming Orders</span>
            {vendorOrders.filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeVendorTab === 'orders' ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
              }`}>
                {vendorOrders.filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled').length} Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveVendorTab('reservations')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeVendorTab === 'reservations'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-500" />
            <span>Surplus Reservations ({vendorReservations.length})</span>
            {vendorReservations.filter(r => r.status === 'reserved').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeVendorTab === 'reservations' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'
              }`}>
                {vendorReservations.filter(r => r.status === 'reserved').length} Awaiting
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveVendorTab('donations')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeVendorTab === 'donations'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-rose-500" />
            <span>Donate Surplus Food ({vendorDonations.length})</span>
            {vendorRequests.filter(r => r.status === 'requested').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
                activeVendorTab === 'donations' ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'
              }`}>
                {vendorRequests.filter(r => r.status === 'requested').length} New Request(s)
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveVendorTab('payments')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeVendorTab === 'payments'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-orange-500" />
            <span>UPI Payment Settings</span>
            {upiIdInput && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeVendorTab === 'payments' ? 'bg-stone-800 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Configured
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveVendorTab('profile')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeVendorTab === 'profile'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Store className="w-4 h-4 text-amber-500" />
            <span>Storefront Profile</span>
          </button>
        </div>

        {activeVendorTab === 'inventory' && (
          <>
            {/* Inline Add Food Item Form Card */}
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs mb-8">
          <div className="p-5 bg-gradient-to-r from-orange-50 via-amber-50 to-white border-b border-stone-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <span>Add Food Item</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-extrabold uppercase">
                    Live Form
                  </span>
                </h3>
                <p className="text-xs text-stone-600">
                  Fill in your dish details. Price and stock are recorded in Indian Rupees (₹) and stored persistently on server.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInlineAddForm(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-stone-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              {showInlineAddForm ? 'Minimize Form' : '+ Expand Form'}
            </button>
          </div>

          {showInlineAddForm && (
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Item Name */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Food Item Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Schezwan Paneer Kathi Roll"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  {addName.trim() && inventory.some(i => i.dishName.trim().toLowerCase() === addName.trim().toLowerCase()) && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1">
                      ⚠️ Item already exists. Set a distinct batch identifier below to create a new batch.
                    </p>
                  )}
                </div>

                {/* Batch Identifier */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">
                    Batch Identifier <span className="text-stone-400 font-normal">(Required if creating separate batch)</span>
                  </label>
                  <input
                    type="text"
                    value={addBatchIdentifier}
                    onChange={(e) => setAddBatchIdentifier(e.target.value)}
                    placeholder="e.g. Batch 101, Evening Prep"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* 2. Category */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="Burgers">Burgers & Rolls</option>
                    <option value="Pizza">Pizza & Breads</option>
                    <option value="Asian & Noodles">Asian & Noodles</option>
                    <option value="Desserts & Sweets">Desserts & Sweets</option>
                    <option value="Healthy & Bowls">Healthy & Bowls</option>
                    <option value="Mexican">Mexican & Street Snacks</option>
                  </select>
                </div>

                {/* 3. Price in ₹ */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Selling Price in ₹ *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-stone-600 text-xs">₹</span>
                    <input
                      type="number"
                      min="10"
                      required
                      value={addPrice}
                      onChange={(e) => setAddPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* 4. Quantity Prepared */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Quantity Prepared *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addPreparedQty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAddPreparedQty(val);
                      setAddRemainingQty(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* 5. Quantity Available */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Quantity Available (Initial) *</label>
                  <input
                    type="number"
                    min="0"
                    max={addPreparedQty}
                    required
                    value={addRemainingQty}
                    onChange={(e) => setAddRemainingQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* 6. Stall / Restaurant Name */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Stall / Restaurant Name</label>
                  <input
                    type="text"
                    value={addRestaurantName}
                    onChange={(e) => setAddRestaurantName(e.target.value)}
                    placeholder="e.g. Sizzling Bites Stall #14"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* 7. Location */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">Location / Fest Quad</label>
                  <input
                    type="text"
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    placeholder="e.g. Main Quad, Food Court"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* 8. Description */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-stone-800 block mb-1">Description</label>
                  <input
                    type="text"
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="Spicy marinated paneer rolls with mint mayonnaise & pickled onions."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Image Selection / Upload */}
              <div className="pt-2">
                <label className="text-xs font-bold text-stone-800 block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                    Food Image (Select Preset, Upload File, or Paste URL)
                  </span>
                  <label className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'add')}
                    />
                  </label>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2">
                  {PRESET_FOOD_IMAGES.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => setAddImage(preset.url)}
                      className={`p-1 rounded-xl border text-center cursor-pointer transition-all ${
                        addImage === preset.url ? 'border-orange-500 ring-2 ring-orange-300 bg-orange-50/40' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 rounded-lg object-cover mb-1" />
                      <span className="text-[9px] font-bold text-stone-700 block truncate">{preset.label}</span>
                    </div>
                  ))}
                </div>

                <input
                  type="url"
                  value={addImage}
                  onChange={(e) => setAddImage(e.target.value)}
                  placeholder="Or enter custom image URL"
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] font-mono"
                />
              </div>

              {/* Optional Surplus Discount & NGO Donation Settings */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Surplus Discount & Food Waste Prevention
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Surplus Discount %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={addDiscountPercentage}
                        onChange={(e) => {
                          const pct = Number(e.target.value);
                          setAddDiscountPercentage(pct);
                          setAddSurplusDiscountPrice(Math.round(addPrice * (1 - pct / 100)));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Discount Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={addPrice}
                        value={addSurplusDiscountPrice}
                        onChange={(e) => setAddSurplusDiscountPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Offer Expiry Time</label>
                    <input
                      type="time"
                      value={addOfferExpiryTime}
                      onChange={(e) => setAddOfferExpiryTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                  <input
                    type="checkbox"
                    id="inlineFormDonationOpt"
                    checked={addIsDonationEligible}
                    onChange={(e) => setAddIsDonationEligible(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="inlineFormDonationOpt" className="text-xs font-bold text-stone-800 cursor-pointer flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                    Mark surplus food as available for NGO Food Rescue Donation
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddName('');
                    setAddDescription('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-all cursor-pointer"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Save Food Item to Menu</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Food Items Inventory Container (Table or Cards view) */}
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs mb-8">
          <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900">
                {businessType === 'College Fest Stall' ? 'Fest Stall Menu & Stock' : businessType === 'College Canteen' ? 'Canteen Daily Menu & Stock' : 'Restaurant Menu & Stock'}
              </h3>
              <p className="text-xs text-stone-500">
                Manage your items, record sales, set surplus discounts in ₹, or mark portions for food shelter donation.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Explicit Release Surplus Deal Action */}
              <button
                type="button"
                onClick={() => {
                  const firstEligible = inventory.find(i => i.remainingQty > 0);
                  if (firstEligible) {
                    setSelectedItem(firstEligible);
                    setSurplusSelectedItemId(firstEligible.id);
                    const defaultPrice = firstEligible.surplusDiscountPrice || Math.round(firstEligible.price * 0.5);
                    setSurplusPrice(defaultPrice);
                    setSurplusDiscountPct(Math.round(((firstEligible.price - defaultPrice) / firstEligible.price) * 100));
                    setSurplusQty(Math.min(firstEligible.remainingQty, 4));
                  } else {
                    setSelectedItem(null);
                    setSurplusSelectedItemId('');
                    setSurplusPrice(50);
                    setSurplusDiscountPct(50);
                    setSurplusQty(1);
                  }
                  setSurplusSuitabilityConfirmed(false);
                  setShowSurplusModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5"
                title="Explicitly release a surplus food deal for customer pickup"
              >
                <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Release Surplus Deal</span>
              </button>

              {/* View Toggle */}
              <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Cards
                </button>
              </div>

              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl">
                {inventory.length} items
              </span>
            </div>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center py-16 p-6">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-stone-800">No Food Items Added Yet</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Click "+ Add Food Item" above to add your first dish with prepared quantity and selling price in Indian Rupees (₹).
              </p>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                + Add First Dish
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Price / Cost</th>
                    <th className="py-3 px-4 text-center">Prepared</th>
                    <th className="py-3 px-4 text-center">Sold</th>
                    <th className="py-3 px-4 text-center">Available Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {inventory.map(item => {
                    const isSoldOut = item.remainingQty === 0 || item.status === 'sold_out';
                    const isLow = !isSoldOut && item.remainingQty <= 3;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Item Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || PRESET_FOOD_IMAGES[0].url}
                              alt={item.dishName}
                              className="w-12 h-12 rounded-xl object-cover ring-1 ring-stone-200 shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-stone-900 text-sm truncate">{item.dishName}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                  {item.batchIdentifier || `Batch #${item.id.replace('inv_', '').slice(-4)}`}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500 truncate">{item.description || item.category}</div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                                  {item.category}
                                </span>
                                {item.donationAllocatedQty !== undefined && item.donationAllocatedQty > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                    Donated: {item.donationAllocatedQty}
                                  </span>
                                )}
                                {item.surplusDiscountPrice && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Surplus: ₹{item.surplusDiscountPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price / Cost */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-stone-900 text-sm">₹{item.price}</div>
                          <div className="text-[11px] text-stone-400">Cost: ₹{item.cost}</div>
                        </td>

                        {/* Prepared Qty */}
                        <td className="py-3.5 px-4 text-center font-bold text-stone-800 text-sm">
                          {item.preparedQty}
                        </td>

                        {/* Sold Qty with Quick +1 Button */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span className="font-bold text-blue-700 text-sm">{item.soldQty}</span>
                            {!isSoldOut && (
                              <button
                                onClick={() => handleRecordSale(item, 1)}
                                className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black cursor-pointer border border-blue-200"
                                title="Quick record +1 sale"
                              >
                                +1 Sold
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Available Stock */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-black ${
                            isSoldOut 
                              ? 'bg-rose-100 text-rose-800' 
                              : isLow 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.remainingQty}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                            isSoldOut
                              ? 'bg-stone-100 text-stone-600 border border-stone-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isSoldOut ? 'Sold Out' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                              title="Edit listing details, price, or stock"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>

                            {/* Mark Sold Out */}
                            {!isSoldOut && (
                              <button
                                onClick={() => handleMarkSoldOut(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                                title="Mark item as Sold Out"
                              >
                                <XCircle className="w-3 h-3" />
                                Sold Out
                              </button>
                            )}

                            {/* Explicit Release Surplus Deal */}
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setSurplusSelectedItemId(item.id);
                                const defaultPrice = item.surplusDiscountPrice || Math.round(item.price * 0.5);
                                setSurplusPrice(defaultPrice);
                                setSurplusDiscountPct(Math.round(((item.price - defaultPrice) / item.price) * 100));
                                setSurplusQty(Math.min(item.remainingQty, 4) || 1);
                                setSurplusSuitabilityConfirmed(false);
                                setShowSurplusModal(true);
                              }}
                              disabled={isSoldOut}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-stone-950 font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Explicitly release surplus deal for this dish"
                            >
                              <Tag className="w-3 h-3" />
                              Release Deal
                            </button>

                            {/* Mark for Donation */}
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setDonationPortions(Math.min(item.remainingQty, 5));
                                setShowDonationModal(true);
                              }}
                              disabled={isSoldOut}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Mark surplus food as available for NGO donation"
                            >
                              <HeartHandshake className="w-3 h-3" />
                              Donate
                            </button>

                            {/* Delete Listing */}
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Remove listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {inventory.map(item => {
                const isSoldOut = item.remainingQty === 0 || item.status === 'sold_out';
                const isLow = !isSoldOut && item.remainingQty <= 3;

                return (
                  <div 
                    key={item.id} 
                    className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative mb-3">
                        <img 
                          src={item.image || PRESET_FOOD_IMAGES[0].url} 
                          alt={item.dishName} 
                          className="w-full h-36 rounded-xl object-cover ring-1 ring-stone-200"
                        />
                        <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          isSoldOut 
                            ? 'bg-rose-600 text-white' 
                            : isLow 
                            ? 'bg-amber-500 text-stone-950' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {isSoldOut ? 'Sold Out' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-stone-900 text-sm">{item.dishName}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                              {item.batchIdentifier || `Batch #${item.id.replace('inv_', '').slice(-4)}`}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-stone-500 uppercase">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-stone-900">₹{item.price}</span>
                        </div>
                      </div>

                      {/* Stock Counts Grid */}
                      <div className="grid grid-cols-4 gap-1.5 py-2 px-2 rounded-xl bg-white border border-stone-200 text-center mb-3">
                        <div>
                          <div className="text-[9px] text-stone-400 font-bold uppercase">Prepared</div>
                          <div className="text-xs font-black text-stone-800">{item.preparedQty}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-blue-500 font-bold uppercase">Sold</div>
                          <div className="text-xs font-black text-blue-700">{item.soldQty}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-purple-500 font-bold uppercase">Allocated</div>
                          <div className="text-xs font-black text-purple-700">{item.reservedQty + (item.donationAllocatedQty || 0)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-emerald-600 font-bold uppercase">Remaining</div>
                          <div className="text-xs font-black text-emerald-700">{item.remainingQty}</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="space-y-2 pt-2 border-t border-stone-200/60">
                      <div className="flex items-center gap-1.5">
                        {!isSoldOut && (
                          <button
                            onClick={() => handleRecordSale(item, 1)}
                            className="flex-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-1 border border-blue-200"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            +1 Sold
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setSurplusSelectedItemId(item.id);
                            const defaultPrice = item.surplusDiscountPrice || Math.round(item.price * 0.5);
                            setSurplusPrice(defaultPrice);
                            setSurplusDiscountPct(Math.round(((item.price - defaultPrice) / item.price) * 100));
                            setSurplusQty(Math.min(item.remainingQty, 4) || 1);
                            setSurplusSuitabilityConfirmed(false);
                            setShowSurplusModal(true);
                          }}
                          disabled={isSoldOut}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-stone-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                          title="Explicitly release surplus deal for this dish"
                        >
                          <Tag className="w-3 h-3" />
                          Release Deal
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setDonationPortions(Math.min(item.remainingQty, 5));
                            setShowDonationModal(true);
                          }}
                          disabled={isSoldOut}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <HeartHandshake className="w-3 h-3" />
                          Donate
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700 cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dedicated Surplus & Food Rescue Section on Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Surplus Offers */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Tag className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900">Active Surplus Discount Offers</h4>
                  <p className="text-[11px] text-stone-500">Live discount deals visible in the customer surplus feed</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                {surplusOffers.filter(o => o.status === 'active').length} Live
              </span>
            </div>

            {surplusOffers.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">No surplus offers currently running. Click "Surplus ₹" on any remaining dish above to create one.</p>
            ) : (
              <div className="space-y-2.5">
                {surplusOffers.map(offer => (
                  <div key={offer.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{offer.title}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span>Original: <del>₹{offer.originalPrice}</del></span>
                        <span className="text-amber-800 font-extrabold">Deal: ₹{offer.discountPrice} (-{offer.discountPercentage}%)</span>
                        <span>•</span>
                        <span>{offer.availableQuantity} portions left</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Until {offer.pickupEnd}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Donation Shelter Options */}
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                  <HeartHandshake className="w-4 h-4 text-rose-700" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900">NGO Food Rescue Pledges</h4>
                  <p className="text-[11px] text-stone-500">Portions committed for verified food shelter pickup</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 mb-3 text-xs text-rose-950">
              <p className="font-semibold mb-1">Safe Food Donation Protocol:</p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Portions marked for donation are reserved from sale and made immediately claimable by verified campus & city food rescue NGOs.
              </p>
            </div>

            <p className="text-xs text-stone-500">
              To donate unsold stock before closing, click the <strong>Donate</strong> button on any inventory item above.
            </p>
          </div>
        </div>
      </>
    )}

    {/* Section: Incoming Orders & Kitchen Fulfillment */}
    {activeVendorTab === 'orders' && (
      <div className="space-y-6 mb-8">
        {/* Orders Header & Filter Bar */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>Customer Orders Fulfillment</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 uppercase">
                Live Queue
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Customer orders atomically decrement from available stock. Update preparation stage and manage pickups.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['active', 'awaiting_payment', 'all', 'completed', 'cancelled'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setOrdersFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  ordersFilter === tab
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {tab === 'active' ? 'Active Kitchen' : tab === 'awaiting_payment' ? 'Awaiting Payment' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Order Action Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-8">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-stone-800">No {ordersFilter} orders found</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
              When customers place orders from your menu, they will appear here in real time with line-item quantities and customer contact details.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map(order => {
              const isCancelled = order.orderStatus === 'cancelled';
              const isCompleted = order.orderStatus === 'completed';
              const isPaymentSatisfied = (order.isDemoPayment || order.paymentMethod === 'demo')
                ? order.paymentStatus === 'demo_completed'
                : order.paymentMethod === 'upi'
                ? order.paymentStatus === 'verified'
                : ['verified', 'received', 'paid'].includes(order.paymentStatus);

              return (
                <div 
                  key={order.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 ${
                    isCancelled 
                      ? 'border-stone-200 bg-stone-50/70 opacity-75' 
                      : isCompleted 
                      ? 'border-stone-200 bg-white'
                      : (order.isDemoPayment || order.paymentMethod === 'demo')
                      ? 'border-purple-300 bg-white shadow-xs ring-1 ring-purple-100'
                      : 'border-orange-200 bg-white shadow-xs ring-1 ring-orange-100'
                  }`}
                >
                  {/* Top Order Row */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-stone-900">
                          #{order.orderNumber}
                        </span>
                        {order.voucherCode && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-amber-100 text-amber-900 border border-amber-300">
                            {order.voucherCode}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          order.orderStatus === 'confirmed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : order.orderStatus === 'preparing' 
                            ? 'bg-amber-100 text-amber-800 animate-pulse' 
                            : order.orderStatus === 'ready_for_pickup' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : order.orderStatus === 'completed' 
                            ? 'bg-stone-100 text-stone-700' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                        <span className="font-bold text-stone-700">{order.customerName}</span>
                        <span>•</span>
                        <a href={`tel:${order.customerPhone}`} className="text-orange-600 hover:underline flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-stone-900">₹{order.totalAmount}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        (order.isDemoPayment || order.paymentMethod === 'demo')
                          ? order.paymentStatus === 'demo_completed'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : order.paymentStatus === 'demo_failed'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                          : order.paymentStatus === 'verified' || order.paymentStatus === 'received' || order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : order.paymentStatus === 'payment_submitted' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                          : order.paymentStatus === 'failed'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {(order.isDemoPayment || order.paymentMethod === 'demo')
                          ? order.paymentStatus === 'demo_completed'
                            ? 'Demo Success'
                            : order.paymentStatus === 'demo_failed'
                            ? 'Demo Failed'
                            : 'Demo Pending'
                          : order.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Demo Order Banner */}
                  {(order.isDemoPayment || order.paymentMethod === 'demo') && (
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-950 border border-purple-300 font-black text-[11px] uppercase tracking-wider flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>DEMO — NO REAL MONEY TRANSFERRED</span>
                      </div>
                      <span className="text-[10px] font-semibold text-purple-800 lowercase bg-white/70 px-2 py-0.5 rounded-full">
                        expo sandbox
                      </span>
                    </div>
                  )}

                  {/* Payment Verification Box for Vendors */}
                  <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/90 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-1.5 font-bold text-stone-800">
                        <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                        <span>Payment Method:</span>
                        <span className="font-semibold text-stone-700 uppercase text-[10px]">
                          {(order.isDemoPayment || order.paymentMethod === 'demo')
                            ? 'College Expo Demo Simulation'
                            : order.paymentMethod === 'upi'
                            ? 'UPI QR Code'
                            : 'Pay on Pickup'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Total Amount: <strong className="text-stone-900 text-xs">₹{order.totalAmount}</strong>
                      </div>
                    </div>

                    {(order.isDemoPayment || order.paymentMethod === 'demo') ? (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="text-stone-500 font-medium">Demo Simulation Status:</span>
                          <span className="font-bold text-stone-900">
                            {order.paymentStatus === 'demo_completed' 
                              ? 'Simulated Payment Successful' 
                              : order.paymentStatus === 'demo_failed'
                              ? 'Simulated Payment Declined'
                              : 'Simulation Pending'}
                          </span>
                        </div>
                        {order.upiReference && (
                          <div className="text-[11px] text-stone-600">
                            Simulation Reference: <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200">{order.upiReference}</code>
                          </div>
                        )}
                        {order.paymentStatus === 'demo_failed' && (
                          <div className="text-[11px] p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                            <span className="font-bold text-rose-950">Failure Reason:</span> {order.demoFailureReason || 'Simulated bank network decline'}
                          </div>
                        )}
                        {order.paymentVerificationNotes && (
                          <div className={`text-[11px] p-2 rounded-xl border ${
                            order.paymentStatus === 'demo_completed'
                              ? 'text-purple-900 bg-purple-50/70 border-purple-200'
                              : 'text-rose-800 bg-rose-50 border-rose-200'
                          }`}>
                            <strong>Note:</strong> {order.paymentVerificationNotes}
                          </div>
                        )}
                        {isCompleted && (order.paymentStatus === 'demo_failed' || order.paymentStatus === 'demo_pending') && (
                          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-900 uppercase tracking-wide block">Payment Status Anomaly Detected:</span>
                              <span>Completed order has payment status "{order.paymentStatus}". Re-simulation is locked; record is preserved for investigation.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : order.paymentMethod === 'upi' ? (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="text-stone-500 font-medium">Customer-Submitted UTR:</span>
                          {order.upiReference ? (
                            <div className="flex items-center gap-1.5">
                              <code className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200 text-xs">
                                {order.upiReference}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  if (order.upiReference) navigator.clipboard.writeText(order.upiReference);
                                }}
                                className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                                title="Copy UTR to verify in bank app"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-medium italic">
                              Awaiting customer payment submission
                            </span>
                          )}
                        </div>

                        {order.paymentSubmittedAt && (
                          <div className="text-[10px] text-stone-400">
                            Submitted at {new Date(order.paymentSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}

                        {order.paymentVerificationNotes && (
                          <div className={`text-[11px] p-2 rounded-xl border ${
                            order.paymentStatus === 'verified'
                              ? 'text-emerald-800 bg-emerald-50/70 border-emerald-200'
                              : order.paymentStatus === 'failed'
                              ? 'text-rose-800 bg-rose-50 border-rose-200'
                              : 'text-stone-600 bg-white border-stone-200'
                          }`}>
                            <strong>
                              {order.paymentStatus === 'failed'
                                ? 'Payment Rejection Reason:'
                                : order.paymentStatus === 'verified'
                                ? 'Verification Note:'
                                : 'Note:'}
                            </strong>{' '}
                            {order.paymentStatus === 'verified' &&
                            (order.paymentVerificationNotes.toLowerCase().includes('mismatch') ||
                             order.paymentVerificationNotes.toLowerCase().includes('fail') ||
                             order.paymentVerificationNotes.toLowerCase().includes('not found'))
                              ? 'Payment manually verified by vendor against bank statement'
                              : order.paymentVerificationNotes}
                          </div>
                        )}

                        {/* Manual Verification Action Buttons */}
                        {!isCancelled && (
                          <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2">
                            {order.paymentStatus === 'verified' ? (
                              <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Verified against Bank Statement</span>
                              </div>
                            ) : !order.upiReference || !order.upiReference.trim() ? (
                              <div className="flex-1 py-1.5 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center justify-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Awaiting customer UTR submission before verification</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const confirm = window.confirm(`Have you checked your actual UPI merchant app or bank statement and confirmed receipt of ₹${order.totalAmount} with UTR "${order.upiReference}"?`);
                                  if (confirm) {
                                    handleVerifyPayment(order.id, 'verified');
                                  }
                                }}
                                disabled={verifyingPaymentOrderId === order.id}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-transform hover:scale-[1.01] active:scale-99"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verify Received Payment</span>
                              </button>
                            )}

                            {order.paymentStatus !== 'failed' && order.paymentStatus !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleVerifyPayment(order.id, 'failed', 'UTR not found in bank statement');
                                }}
                                disabled={verifyingPaymentOrderId === order.id}
                                className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs cursor-pointer border border-rose-200 shadow-2xs"
                              >
                                Mark Failed
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-600 font-medium">Counter Payment Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === 'verified' || order.paymentStatus === 'received' || order.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus === 'verified' || order.paymentStatus === 'received' || order.paymentStatus === 'paid'
                              ? 'Paid / Received'
                              : 'Pending Collection'}
                          </span>
                        </div>

                        {order.paymentVerificationNotes && (
                          <div className={`text-[11px] p-2 rounded-xl border ${
                            order.paymentStatus === 'verified' || order.paymentStatus === 'received' || order.paymentStatus === 'paid'
                              ? 'text-emerald-800 bg-emerald-50/70 border-emerald-200'
                              : 'text-stone-600 bg-white border-stone-200'
                          }`}>
                            <strong>Note:</strong> {order.paymentVerificationNotes}
                          </div>
                        )}

                        <div className="text-[11px] text-stone-500 italic">
                          Customer pays ₹{order.totalAmount} at the kitchen counter during meal pickup.
                        </div>

                        {!isCancelled && (
                          <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2">
                            {order.paymentStatus === 'verified' || order.paymentStatus === 'received' || order.paymentStatus === 'paid' ? (
                              <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Payment Received (₹{order.totalAmount})</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const confirm = window.confirm(`Confirm receipt of ₹${order.totalAmount} (Cash / Counter UPI) from customer for Order #${order.orderNumber}?`);
                                  if (confirm) {
                                    handleVerifyPayment(order.id, 'received', 'In-person payment recorded as received by vendor at counter');
                                  }
                                }}
                                disabled={verifyingPaymentOrderId === order.id}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-transform hover:scale-[1.01] active:scale-99"
                              >
                                <Banknote className="w-4 h-4" />
                                <span>Record Payment Received (₹{order.totalAmount})</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items Ordered */}
                  <div className="space-y-1.5 text-xs bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    <div className="font-bold text-stone-500 uppercase text-[10px] tracking-wider mb-1">
                      Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)} portions)
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-stone-700">
                        <span className="font-semibold">{item.quantity} × {item.dishName}</span>
                        <span className="font-bold text-stone-900">₹{item.itemTotal}</span>
                      </div>
                    ))}
                  </div>

                  {order.pickupNotes && (
                    <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
                      <strong>Customer Note:</strong> "{order.pickupNotes}"
                    </div>
                  )}

                  {isCancelled && order.cancellationReason && (
                    <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
                      <strong>Cancellation Reason:</strong> {order.cancellationReason} • Portions restored to inventory.
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isCancelled && !isCompleted && (
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      {order.orderStatus === 'ready_for_pickup' && !isPaymentSatisfied && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong>Handover Safeguard:</strong>{' '}
                            {(order.isDemoPayment || order.paymentMethod === 'demo') ? (
                              `Demo payment is in "${order.paymentStatus}" state. Handover is blocked until a successful demo payment is simulated. (DEMO — NO REAL MONEY TRANSFERRED)`
                            ) : order.paymentMethod === 'upi' ? (
                              order.paymentStatus === 'payment_submitted'
                                ? `Customer submitted UTR (${order.upiReference || ''}), but payment has not been verified against your bank statement yet. Click "Verify Received Payment" above to verify before handover.`
                                : 'UPI payment is pending or unverified. Verify payment above once confirmed to unlock handover.'
                            ) : (
                              'Payment has not been recorded as received. Click "Record Payment Received" above before completing handover.'
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {order.orderStatus === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                            disabled={updatingOrderId === order.id}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Start Preparing</span>
                          </button>
                        )}

                        {order.orderStatus === 'preparing' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                            disabled={updatingOrderId === order.id}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ready for Pickup</span>
                          </button>
                        )}

                        {order.orderStatus === 'ready_for_pickup' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            disabled={updatingOrderId === order.id || !isPaymentSatisfied}
                            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-opacity ${
                              !isPaymentSatisfied
                                ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-70'
                                : (order.isDemoPayment || order.paymentMethod === 'demo')
                                ? 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer'
                                : 'bg-stone-900 hover:bg-black text-white cursor-pointer'
                            }`}
                            title={!isPaymentSatisfied ? 'Payment must be verified or recorded before order can be handed over' : 'Complete and hand over order'}
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>{(order.isDemoPayment || order.paymentMethod === 'demo') ? 'Complete Demo Handover' : 'Completed & Handed Over'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrder(order);
                            setCancellationReasonInput(
                              (order.isDemoPayment || order.paymentMethod === 'demo') && order.paymentStatus === 'demo_failed'
                                ? 'Cancelled by vendor: Demo payment failed (stock restored)'
                                : 'Kitchen ran out of key ingredients'
                            );
                          }}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 font-bold text-xs cursor-pointer border border-stone-200 transition-colors"
                        >
                          Cancel & Restore Stock
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* Section: Surplus Food Reservations & Customer Pickups */}
    {activeVendorTab === 'reservations' && (
      <div className="space-y-6 mb-8 animate-in fade-in duration-200">
        {/* Header & Quick Lookup Banner */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div className="flex items-start gap-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-xs shrink-0">
                <Ticket className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-stone-900 tracking-tight">
                    Surplus Reservations & Voucher Pickup
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase">
                    Food Rescue
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                  Verify customer meal vouchers, confirm collected orders, and prevent surplus food waste. Rescued surplus meals are verified and added to the Impact Dashboard once pickup is confirmed.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-auto shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Pickups</span>
            </button>
          </div>

          {/* 2-Step Voucher Verification & Handover Workflow Card */}
          <div className="mt-6 p-5 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Surplus Voucher Verification & Food Handover
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Step 1: Enter voucher code to verify customer order. Step 2: Physically hand over the food and click "Confirm Handover".
                </p>
              </div>
            </div>

            {/* Step 1: Input and Verify Voucher Button */}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (voucherLookupInput.trim()) {
                  handleVerifyVoucher(voucherLookupInput.trim());
                }
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={voucherLookupInput}
                  onChange={e => setVoucherLookupInput(e.target.value.toUpperCase())}
                  placeholder="Enter Customer Voucher Code (e.g. TST-7921)"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-sm text-stone-900 placeholder:text-stone-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-wider"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingVoucher || !voucherLookupInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs shrink-0"
              >
                {isVerifyingVoucher ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Verifying Voucher...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Verify Voucher</span>
                  </>
                )}
              </button>
            </form>

            {/* Error Banner */}
            {pickupErrorBanner && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pickupErrorBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickupErrorBanner(null)}
                  className="text-rose-700 hover:text-rose-900 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success Banner */}
            {pickupSuccessBanner && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pickupSuccessBanner}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickupSuccessBanner(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Step 2: Verified Order Preview Card & Prominent Confirm Handover Button */}
            {verifiedVoucherData && (
              <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-md animate-in fade-in space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-mono font-black text-sm tracking-wider shadow-2xs">
                      {verifiedVoucherData.voucherCode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Voucher Valid & Verified
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Linked Order: <strong className="text-stone-900 font-bold">#{verifiedVoucherData.order?.orderNumber}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Customer</span>
                    <strong className="text-stone-900 text-sm block mt-0.5">{verifiedVoucherData.reservation?.userName || 'Campus Diner'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Rescued Meal Box</span>
                    <strong className="text-stone-900 text-sm block mt-0.5">
                      {verifiedVoucherData.reservation?.quantity}x {verifiedVoucherData.reservation?.dishTitle}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Amount Due</span>
                    <strong className="text-emerald-700 text-sm block mt-0.5">
                      ₹{verifiedVoucherData.reservation?.totalPrice} (Pay on Pickup)
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Pickup deadline: <strong>Today before {verifiedVoucherData.reservation?.pickupEnd}</strong>. Please physically hand over the prepared meal before confirming.
                  </span>
                </div>

                {/* Handover Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleConfirmHandover(verifiedVoucherData.voucherCode)}
                    disabled={isConfirmingHandover}
                    className="flex-1 w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
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
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Released Surplus Deals Controls */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Your Surplus Deals ({surplusOffers.filter(o => !vendorProfile?.id || o.restaurantId === vendorProfile.id).length})</span>
              </h4>
              <p className="text-xs text-stone-500">
                Only explicitly released deals appear in customer surplus feeds. You can release new deals or unpublish active ones at any time.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const firstEligible = inventory.find(i => i.remainingQty > 0);
                if (firstEligible) {
                  setSelectedItem(firstEligible);
                  setSurplusSelectedItemId(firstEligible.id);
                  const defaultPrice = firstEligible.surplusDiscountPrice || Math.round(firstEligible.price * 0.5);
                  setSurplusPrice(defaultPrice);
                  setSurplusDiscountPct(Math.round(((firstEligible.price - defaultPrice) / firstEligible.price) * 100));
                  setSurplusQty(Math.min(firstEligible.remainingQty, 4) || 1);
                } else {
                  setSelectedItem(null);
                  setSurplusSelectedItemId('');
                }
                setSurplusSuitabilityConfirmed(false);
                setShowSurplusModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Release Surplus Deal</span>
            </button>
          </div>

          {surplusOffers.filter(o => !vendorProfile?.id || o.restaurantId === vendorProfile.id).length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              No surplus deals created yet. Click <strong>"Release Surplus Deal"</strong> above to publish your first discounted evening meal offer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {surplusOffers
                .filter(o => !vendorProfile?.id || o.restaurantId === vendorProfile.id)
                .map(deal => {
                  const isLive = deal.isExplicitlyReleased === true && deal.status === 'active' && deal.availableQuantity > 0;
                  return (
                    <div key={deal.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isLive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : deal.status === 'expired'
                              ? 'bg-stone-200 text-stone-600'
                              : deal.availableQuantity === 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isLive ? '● Live on Customer Feed' : deal.availableQuantity === 0 ? 'Sold Out' : deal.status === 'expired' ? 'Expired' : 'Unpublished / Draft'}
                          </span>
                          <span className="text-xs font-black text-emerald-700">₹{deal.discountPrice}</span>
                        </div>

                        <h5 className="font-bold text-sm text-stone-900 mt-2">{deal.title}</h5>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Original: <span className="line-through">₹{deal.originalPrice}</span> • {deal.discountPercentage}% OFF
                        </p>
                        <p className="text-[11px] text-stone-600 mt-1">
                          Available: <strong>{deal.availableQuantity} portion{deal.availableQuantity > 1 ? 's' : ''}</strong> • Expires: <strong>{deal.expiryTime || deal.pickupEnd}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-end gap-2">
                        {isLive ? (
                          <button
                            type="button"
                            onClick={() => handleUnpublishSurplus(deal)}
                            className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-all cursor-pointer"
                            title="Unpublish this deal and return unsold portions to available stock"
                          >
                            Unpublish Deal
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const matchingInv = inventory.find(i => (deal.inventoryId && i.id === deal.inventoryId) || i.dishId === deal.dishId);
                              if (matchingInv) {
                                setSelectedItem(matchingInv);
                                setSurplusSelectedItemId(matchingInv.id);
                                setSurplusPrice(deal.discountPrice || Math.round(matchingInv.price * 0.5));
                                setSurplusDiscountPct(deal.discountPercentage || 50);
                                setSurplusQty(Math.min(matchingInv.remainingQty, deal.availableQuantity || 4) || 1);
                              }
                              setSurplusPickupEnd(deal.expiryTime || deal.pickupEnd || '22:00');
                              setSurplusSuitabilityConfirmed(false);
                              setShowSurplusModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all cursor-pointer"
                            title="Re-release this deal"
                          >
                            Release Surplus Deal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'reserved', 'picked_up', 'cancelled'] as const).map(tab => {
              const count = tab === 'all'
                ? vendorReservations.length
                : vendorReservations.filter(r => r.status === tab).length;
              const labels = {
                all: 'All Pickups',
                reserved: 'Awaiting Pickup',
                picked_up: 'Picked Up & Rescued',
                cancelled: 'Cancelled'
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setReservationsFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    reservationsFilter === tab
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  <span>{labels[tab]}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    reservationsFilter === tab ? 'bg-white text-amber-700' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={reservationSearchQuery}
              onChange={e => setReservationSearchQuery(e.target.value)}
              placeholder="Search voucher, meal, customer..."
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Reservations Cards List */}
        {vendorReservations.filter(r => {
          if (reservationsFilter !== 'all' && r.status !== reservationsFilter) return false;
          if (reservationSearchQuery.trim()) {
            const q = reservationSearchQuery.trim().toLowerCase();
            const matchVoucher = r.voucherCode.toLowerCase().includes(q);
            const matchDish = r.dishTitle.toLowerCase().includes(q);
            const matchCustomer = (r.userName || '').toLowerCase().includes(q);
            return matchVoucher || matchDish || matchCustomer;
          }
          return true;
        }).length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-stone-200 shadow-xs">
            <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h4 className="text-sm font-black text-stone-800">No Surplus Reservations Found</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {reservationsFilter === 'reserved'
                ? 'There are currently no surplus reservations awaiting customer pickup.'
                : 'No customer surplus reservations match the selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorReservations.filter(r => {
              if (reservationsFilter !== 'all' && r.status !== reservationsFilter) return false;
              if (reservationSearchQuery.trim()) {
                const q = reservationSearchQuery.trim().toLowerCase();
                const matchVoucher = r.voucherCode.toLowerCase().includes(q);
                const matchDish = r.dishTitle.toLowerCase().includes(q);
                const matchCustomer = (r.userName || '').toLowerCase().includes(q);
                return matchVoucher || matchDish || matchCustomer;
              }
              return true;
            }).map(res => {
              const isConfirmingThis = confirmingResId === res.id || confirmingResId === res.voucherCode;
              return (
                <div
                  key={res.id}
                  className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-amber-300"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Voucher Code Badge */}
                        <div className="px-3 py-1 rounded-xl bg-stone-900 text-amber-400 font-mono font-black text-sm tracking-wider shadow-2xs">
                          {res.voucherCode}
                        </div>
                        {/* Status Badge */}
                        {res.status === 'picked_up' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Picked Up & Rescued
                          </span>
                        ) : res.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Reserved (Awaiting Pickup)
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-700">₹{res.totalPrice}</div>
                        <div className="text-[10px] text-stone-400 font-bold">
                          {res.quantity} portion{res.quantity > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Meal Title & Info */}
                    <div className="mt-3">
                      <h4 className="text-sm font-black text-stone-900 leading-snug">
                        {res.dishTitle}
                      </h4>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{res.restaurantName}</span>
                      </div>
                    </div>

                    {/* Customer & Pickup Details */}
                    <div className="mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Customer:</span>
                        <span className="font-bold text-stone-900">{res.userName || 'Campus Diner'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 font-medium">Pickup Deadline:</span>
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Today before {res.pickupEnd}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-400">Reserved:</span>
                        <span className="text-stone-500">{new Date(res.reservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {res.status === 'picked_up' && res.pickedUpAt && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 text-emerald-700">
                          <span className="font-semibold">Collected:</span>
                          <span className="font-bold">{new Date(res.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-stone-100">
                    {res.status === 'reserved' ? (
                      verifiedVoucherData?.voucherCode === res.voucherCode ? (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Voucher Verified!</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wide bg-emerald-200/80 px-2 py-0.5 rounded-md">Order #{verifiedVoucherData.order?.orderNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleConfirmHandover(res.voucherCode)}
                            disabled={isConfirmingHandover}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:scale-[1.01] active:scale-[0.99]"
                          >
                            {isConfirmingHandover && confirmingResId === res.voucherCode ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Confirming Handover...</span>
                              </>
                            ) : (
                              <>
                                <CheckSquare className="w-4 h-4" />
                                <span>Confirm Handover</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setVoucherLookupInput(res.voucherCode);
                            handleVerifyVoucher(res.voucherCode);
                          }}
                          disabled={isVerifyingVoucher && voucherLookupInput === res.voucherCode}
                          className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:scale-[1.01] active:scale-[0.99]"
                        >
                          {isVerifyingVoucher && voucherLookupInput === res.voucherCode ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              <span>Verifying Voucher...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <span>Verify Voucher for Handover</span>
                            </>
                          )}
                        </button>
                      )
                    ) : res.status === 'picked_up' ? (
                      <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Handover Completed • Order Completed</span>
                      </div>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-xl bg-stone-100 text-stone-500 text-xs font-semibold text-center">
                        Reservation Cancelled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* Section: Donate Surplus Food & NGO Rescue Management (Stage 3) */}
    {activeVendorTab === 'donations' && (
      <div className="space-y-8 mb-8 animate-in fade-in duration-200">
        
        {/* Section Header */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3.5 rounded-2xl bg-rose-600 text-white shadow-xs shrink-0">
              <HeartHandshake className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-stone-900 tracking-tight">
                  Food Donation & NGO Rescue Hub
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                  Stage 3 Food Rescue
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                Publish confirmed, safe leftover meals for pickup by registered student volunteers and certified food rescue NGOs. Quantities are atomically deducted from menu stock to prevent double-selling.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
              Active Vendor: {vendorProfile?.name}
            </span>
          </div>
        </div>

        {/* Food Safety Compliance Banner */}
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-stone-800 flex items-start gap-3.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="font-bold text-amber-950 block">
              Food Safety & Integrity Assurance Policy:
            </strong>
            <p className="text-stone-700 text-[11px] leading-relaxed">
              Only freshly prepared, hygienic, unexpired food suitable for safe human consumption may be offered for donation. As the preparing kitchen, you specify accurate preparation times, storage temperatures, and allergen disclosures. <em>Tastely facilitates rescue coordination and verified chain-of-custody logging; food safety compliance and proper handling remain the mutual responsibility of donating kitchens and receiving rescue partners.</em>
            </p>
          </div>
        </div>

        {/* Aggregate Rescue Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Donations Listed</span>
            <div className="text-2xl font-black text-stone-900 mt-1">{vendorDonations.length}</div>
            <span className="text-[10px] text-stone-500">Batches offered</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Portions Available</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {vendorDonations.reduce((sum, d) => sum + (d.availableQuantity || 0), 0)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Open for NGO claim</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Allocated to NGOs</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {vendorDonations.reduce((sum, d) => sum + (d.allocatedQuantity || 0), 0)}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">In prep / awaiting pickup</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rescued & Diverted</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {vendorDonations.reduce((sum, d) => sum + (d.collectedQuantity || 0), 0)}
            </div>
            <span className="text-[10px] text-rose-600 font-semibold">Verified collections</span>
          </div>
        </div>

        {/* Two-Column: Publish Donation Form & Active Listings / Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form: Publish Food Donation from Inventory */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-stone-900">Publish Leftover Donation</h4>
                <p className="text-[11px] text-stone-500">Atomic allocation from your active menu inventory</p>
              </div>
            </div>

            <form onSubmit={handleLaunchDonation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Select Menu Item *
                </label>
                <select
                  value={donationSelectedItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setDonationSelectedItemId(id);
                    const item = inventory.find(i => i.id === id);
                    if (item) {
                      setSelectedItem(item);
                      setDonationPortions(Math.min(item.remainingQty, 10));
                    }
                  }}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="">-- Choose an item with remaining stock --</option>
                  {inventory.filter(i => i.remainingQty > 0).map(item => {
                    const batchLabel = item.batchIdentifier || `Batch #${item.id.replace('inv_', '').slice(-4)}`;
                    return (
                      <option key={item.id} value={item.id}>
                        {item.dishName} — [{batchLabel}] — ({item.remainingQty} portions available)
                      </option>
                    );
                  })}
                </select>
                {inventory.filter(i => i.remainingQty > 0).length === 0 && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    No items currently have unsold remaining stock. Prepare or add inventory first.
                  </p>
                )}
              </div>

              {selectedItem && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900">{selectedItem.dishName}</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {selectedItem.batchIdentifier || `Batch #${selectedItem.id.replace('inv_', '').slice(-4)}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1 flex items-center gap-3 flex-wrap">
                    <span>Prepared: <strong>{selectedItem.preparedQty}</strong></span>
                    <span>Sold: <strong>{selectedItem.soldQty}</strong></span>
                    {selectedItem.reservedQty > 0 && <span>Reserved: <strong>{selectedItem.reservedQty}</strong></span>}
                    {selectedItem.donationAllocatedQty !== undefined && selectedItem.donationAllocatedQty > 0 && (
                      <span>Donated: <strong>{selectedItem.donationAllocatedQty}</strong></span>
                    )}
                    <span className="text-emerald-700 font-bold">Remaining Available: {selectedItem.remainingQty} portions</span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Portions to Donate *
                  </label>
                  {selectedItem && (
                    <span className="text-[11px] text-stone-500">
                      Max: {selectedItem.remainingQty} portions
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedItem?.remainingQty || 100}
                  required
                  value={donationPortions}
                  onChange={(e) => setDonationPortions(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Once published, these portions cannot be sold to regular customers.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Preparation Time / Batch Notes
                </label>
                <input
                  type="text"
                  value={donationPrepTime}
                  onChange={(e) => setDonationPrepTime(e.target.value)}
                  placeholder="e.g. Freshly prepared today at 18:30"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Pickup Deadline *
                </label>
                <input
                  type="text"
                  required
                  value={donationDeadline}
                  onChange={(e) => setDonationDeadline(e.target.value)}
                  placeholder="e.g. Today before 22:30"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Pickup Location & Dispatch Instructions
                </label>
                <input
                  type="text"
                  value={donationLocation}
                  onChange={(e) => setDonationLocation(e.target.value)}
                  placeholder="e.g. Back kitchen service alley, Stall #14"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1.5">
                  Packaging, Allergens & Food Handling Notes
                </label>
                <textarea
                  rows={2}
                  value={donationHandlingNotes}
                  onChange={(e) => setDonationHandlingNotes(e.target.value)}
                  placeholder="e.g. Hygienically packed in heat-sealed aluminum containers. Keep chilled under 4°C. Contains gluten & dairy."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              {/* Food Safety Confirmation */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="vendor-publish-safety"
                    checked={donationConfirmedSuitable}
                    onChange={(e) => setDonationConfirmedSuitable(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    required
                  />
                  <label htmlFor="vendor-publish-safety" className="text-[11px] font-bold cursor-pointer leading-tight">
                    I verify that this food is freshly prepared, unexpired, hygienically packaged, and fully safe for human consumption.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedItem || selectedItem.remainingQty <= 0 || !donationConfirmedSuitable}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-99"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Publish Food for NGO Rescue</span>
              </button>
            </form>
          </div>

          {/* Right Column: Manage Listings & Requests */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Sub-Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <button
                type="button"
                onClick={() => setDonationsSubTab('listings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  donationsSubTab === 'listings'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Published Batches ({vendorDonations.length})
              </button>

              <button
                type="button"
                onClick={() => setDonationsSubTab('requests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  donationsSubTab === 'requests'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>NGO Rescue Requests ({vendorRequests.length})</span>
                {vendorRequests.filter(r => r.status === 'requested').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white text-rose-600">
                    {vendorRequests.filter(r => r.status === 'requested').length} New
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: Published Listings */}
            {donationsSubTab === 'listings' && (
              <div className="space-y-4">
                {vendorDonations.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-dashed border-stone-300 text-center space-y-2">
                    <HeartHandshake className="w-10 h-10 text-stone-300 mx-auto" />
                    <div className="font-bold text-stone-800 text-sm">No food donations listed yet</div>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use the form on the left or click "Donate" on any menu dish to offer safe unsold food to community rescue NGOs.
                    </p>
                  </div>
                ) : (
                  vendorDonations.map(donation => {
                    const isCollected = donation.status === 'collected';
                    const isCancelled = donation.status === 'cancelled';
                    const isFullyAllocated = donation.availableQuantity === 0;

                    return (
                      <div
                        key={donation.id}
                        className={`p-5 rounded-3xl border bg-white shadow-xs space-y-3.5 transition-all ${
                          isCancelled ? 'opacity-60 border-stone-200 bg-stone-50' : 'border-stone-200'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-black text-stone-900">{donation.dishName}</h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                {donation.batchIdentifier || `Batch #${donation.id.replace('don_', '').slice(-4)}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                donation.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : donation.status === 'requested'
                                  ? 'bg-amber-100 text-amber-800'
                                  : donation.status === 'approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : donation.status === 'ready_for_pickup'
                                  ? 'bg-purple-100 text-purple-800'
                                  : donation.status === 'collected'
                                  ? 'bg-stone-100 text-stone-700'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {donation.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">{donation.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-stone-800 block">
                              {donation.availableQuantity} of {donation.initialQuantity} portions left
                            </span>
                            {donation.allocatedQuantity > 0 && (
                              <span className="text-[10px] font-semibold text-amber-700 block">
                                {donation.allocatedQuantity} allocated to NGOs
                              </span>
                            )}
                            {donation.collectedQuantity > 0 && (
                              <span className="text-[10px] font-semibold text-emerald-700 block">
                                {donation.collectedQuantity} collected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>Deadline: <strong>{donation.pickupDeadline}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">Pickup: <strong>{donation.pickupLocation}</strong></span>
                          </div>
                          {donation.prepTime && (
                            <div className="flex items-center gap-1.5 col-span-2">
                              <ChefHat className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>Prep Time: {donation.prepTime}</span>
                            </div>
                          )}
                          {donation.handlingNotes && (
                            <div className="col-span-2 text-[11px] text-stone-500 italic">
                              "{donation.handlingNotes}"
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isCollected && !isCancelled && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDonation(donation);
                                setEditDonationDeadline(donation.pickupDeadline);
                                setEditDonationLocation(donation.pickupLocation);
                                setEditDonationNotes(donation.handlingNotes || '');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
                            >
                              Edit Details
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancelDonationListing(donation)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
                            >
                              Cancel Listing & Restore Stock
                            </button>
                          </div>
                        )}

                        {isCollected && (
                          <div className="pt-2 border-t border-stone-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Collection verified by volunteer coordinator and recorded in Impact statistics.</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: Incoming Requests */}
            {donationsSubTab === 'requests' && (
              <div className="space-y-4">
                {vendorRequests.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-dashed border-stone-300 text-center space-y-2">
                    <Truck className="w-10 h-10 text-stone-300 mx-auto" />
                    <div className="font-bold text-stone-800 text-sm">No rescue requests yet</div>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      When registered NGOs or student volunteers claim portions from your published donations, their requests will appear here for your review and approval.
                    </p>
                  </div>
                ) : (
                  vendorRequests.map(req => {
                    const isPending = req.status === 'requested';
                    const isApproved = req.status === 'approved';
                    const isReady = req.status === 'ready_for_pickup';
                    const isCollected = req.status === 'collected';
                    const isRejected = req.status === 'rejected';
                    const isCancelled = req.status === 'cancelled';

                    return (
                      <div
                        key={req.id}
                        className={`p-5 rounded-3xl border bg-white shadow-xs space-y-3.5 transition-all ${
                          isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-stone-200'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-stone-900">{req.dishName}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isPending
                                  ? 'bg-amber-100 text-amber-900'
                                  : isApproved
                                  ? 'bg-blue-100 text-blue-900'
                                  : isReady
                                  ? 'bg-purple-100 text-purple-900'
                                  : isCollected
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}>
                                {req.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Claimed by: <strong>{req.ngoName}</strong> • Volunteer: {req.volunteerName}
                              {req.volunteerPhone ? ` (${req.volunteerPhone})` : ''}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-rose-600">
                              {req.requestedQuantity} portion(s)
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Notes / Transport info */}
                        {req.notes && (
                          <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                            <strong>Pickup Notes:</strong> "{req.notes}"
                          </div>
                        )}

                        {isRejected && req.rejectionReason && (
                          <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                            <strong>Rejection Note:</strong> {req.rejectionReason} (Portions returned to available pool)
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveDonationRequest(req)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Approve Request</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectingRequest(req)}
                                className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handleMarkDonationReadyForPickup(req)}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Mark Ready for Pickup</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              type="button"
                              onClick={() => handleConfirmDonationCollected(req)}
                              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Confirm Volunteer Collection</span>
                            </button>
                          )}

                          {isCollected && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                              <span>Food Successfully Rescued & Collected</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    )}

    {/* Section: UPI Payment Settings */}
    {activeVendorTab === 'payments' && (
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 sm:p-8 space-y-8 mb-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
                <span>UPI QR Code & Payment Settings</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800">
                  Direct Merchant Payout
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure your UPI ID and Payee Name. Encoded into customer QR codes for direct, fee-free bank settlements in INR (₹).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 font-medium">
              Establishment: <strong>{vendorProfile?.name}</strong>
            </span>
          </div>
        </div>

        {/* Zero-Credential Safety Box */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-emerald-900">Zero-Credential Secure Direct Flow</div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Tastely never asks for your UPI PIN, banking passwords, or merchant private keys. Customers pay directly to your specified UPI ID using their standard UPI apps (Google Pay, PhonePe, Paytm, etc.). You verify payments using the 12-digit UTR reference against your actual bank account.
            </p>
          </div>
        </div>

        {/* Two-Column: Settings Form & Dynamic QR Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSaveUpiSettings} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Merchant / Vendor UPI ID (VPA) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value.trim().toLowerCase())}
                    placeholder="e.g. pattylab@upi, vendor@okhdfcbank, canteen@sbi"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  {upiIdInput && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(upiIdInput);
                        setCopiedUpiId(true);
                        setTimeout(() => setCopiedUpiId(false), 2000);
                      }}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                      title="Copy UPI ID"
                    >
                      {copiedUpiId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Must be a valid UPI format: <code className="font-mono bg-stone-100 px-1 rounded">username@bankhandle</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Payee Display Name *
                </label>
                <input
                  type="text"
                  value={upiPayeeNameInput}
                  onChange={(e) => setUpiPayeeNameInput(e.target.value)}
                  placeholder="e.g. The Urban Patty Lab, Fest Stall #14"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  This is the business or stall name displayed to customers in their UPI app when scanning the QR code.
                </p>
              </div>

              {/* Preset quick test buttons */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Quick Suggestions for this Establishment:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const base = (vendorProfile?.name || 'vendor').toLowerCase().replace(/[^a-z0-9]/g, '');
                      setUpiIdInput(`${base}@upi`);
                      setUpiPayeeNameInput(vendorProfile?.name || 'Tastely Vendor');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium cursor-pointer"
                  >
                    Auto-generate from Name
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiIdInput('pattylab@upi');
                      setUpiPayeeNameInput('The Urban Patty Lab');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium cursor-pointer"
                  >
                    @upi Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiIdInput('feststall14@paytm');
                      setUpiPayeeNameInput('Spicy Fiesta Stall #14');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium cursor-pointer"
                  >
                    @paytm Fest Stall
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  Changes are stored persistently in the database.
                </span>

                <button
                  type="submit"
                  disabled={isSavingUpiSettings || !upiIdInput.trim() || !upiPayeeNameInput.trim()}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2"
                >
                  {isSavingUpiSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Settings...</span>
                    </>
                  ) : (
                    <span>Save UPI Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-stone-50 border-2 border-dashed border-stone-300 text-center space-y-4">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Customer QR Code Preview
            </span>

            <div className="inline-block p-4 rounded-2xl bg-white shadow-md border border-stone-200 mx-auto">
              {upiPreviewQrUrl ? (
                <img
                  src={upiPreviewQrUrl}
                  alt="UPI QR Code Preview"
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-stone-400 text-xs">
                  Enter a valid UPI ID to generate preview
                </div>
              )}
            </div>

            <div className="text-xs space-y-1">
              <div className="font-black text-stone-900">
                {upiPayeeNameInput || 'Vendor Display Name'}
              </div>
              <div className="font-mono text-orange-700 font-bold text-[11px]">
                {upiIdInput || 'yourname@upi'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-stone-200 text-[11px] text-stone-600 text-left space-y-1">
              <div className="font-bold text-stone-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>How customer payment works:</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                When a customer orders, Tastely generates a dynamic QR with their exact total in ₹ and Order reference. The customer completes payment in their UPI app, submits their 12-digit UTR, and you verify it on the Live Orders tab.
              </p>
            </div>
          </div>

        </div>
      </div>
    )}

    {/* Section: Storefront & Restaurant Profile */}
    {activeVendorTab === 'profile' && (
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 sm:p-8 space-y-8 mb-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Store className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
                <span>Storefront Profile & Kitchen Info</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-800">
                  {vendorProfile?.businessType || 'Restaurant'}
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Update your restaurant's name, culinary description, banner image, and contact details shown on customer discovery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBusinessTypeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Change Business Type</span>
            </button>
          </div>
        </div>

        {/* Profile Form & Image Preview */}
        <form onSubmit={handleSaveRestaurantProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Fields Column */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Establishment Name *
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Forno Di Napoli"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Cuisine Specialization *
                  </label>
                  <input
                    type="text"
                    value={profileCuisine}
                    onChange={(e) => setProfileCuisine(e.target.value)}
                    placeholder="e.g. Italian & Artisan Pizza"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Price Range
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['₹', '₹₹', '₹₹₹'] as const).map(pr => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => setProfilePriceRange(pr)}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          profilePriceRange === pr
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Kitchen Address / Location *
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="e.g. 88 Piazza Bella, Arts Quarter"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    City / Campus Area
                  </label>
                  <input
                    type="text"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="e.g. Campus Hub"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Estimated Delivery / Prep Time
                  </label>
                  <input
                    type="text"
                    value={profileDeliveryTime}
                    onChange={(e) => setProfileDeliveryTime(e.target.value)}
                    placeholder="e.g. 20-30 min"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Kitchen Story / Description
                </label>
                <textarea
                  rows={3}
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  placeholder="e.g. Traditional wood-fired Neapolitan pizza, 48-hour fermented sourdough, San Marzano tomatoes and fresh mozzarella."
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Culinary Tags (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={profileTags}
                  onChange={(e) => setProfileTags(e.target.value)}
                  placeholder="e.g. Wood-Fired, Sourdough, Mozzarella, Late Night"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
                />
              </div>
            </div>

            {/* Banner Live Preview & Presets Column */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-stone-50 border border-stone-200 space-y-4">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Storefront Banner Preview
              </span>

              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-stone-900 shadow-md">
                <img
                  src={profileImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'}
                  alt="Storefront Preview"
                  onError={(e) => {
                    const fallback = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-base font-black truncate">{profileName || 'Your Restaurant'}</h4>
                  <p className="text-[11px] text-stone-200">{profileCuisine || 'Cuisine Type'} • {profilePriceRange}</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Select a Curated Image Preset:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Ramen & Noodles', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Healthy Bowls', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Street Bites', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80' },
                    { label: 'Cafe & Bistro', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setProfileImage(preset.url)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold text-left truncate transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              Changes persist in backend database and will be visible across customer discovery.
            </span>

            <button
              type="submit"
              disabled={isSavingProfile || !profileName.trim()}
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Storefront Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    )}

    {/* Modal: Business Type Selector */}
    {showBusinessTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in">
              <h3 className="text-lg font-black text-stone-900 mb-1">
                Select Business Type
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Tailor your dashboard and customer tags for your specific food venue.
              </p>

              <form onSubmit={handleSaveBusinessType} className="space-y-4">
                {/* 3 Business Types as Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Restaurant', icon: <Store className="w-5 h-5 text-orange-600" />, label: 'Restaurant', desc: 'Commercial restaurant, cafe, or dining kitchen' },
                    { id: 'College Canteen', icon: <Building className="w-5 h-5 text-emerald-600" />, label: 'College Canteen', desc: 'On-campus mess, cafeteria, or daily meal hub' },
                    { id: 'College Fest Stall', icon: <Tent className="w-5 h-5 text-amber-600" />, label: 'College Fest Stall', desc: 'Student-run food stall at annual college festivals' }
                  ].map(bt => (
                    <div
                      key={bt.id}
                      onClick={() => setSelectedBusinessType(bt.id as BusinessType)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedBusinessType === bt.id
                          ? 'border-orange-500 bg-orange-50/60 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                      }`}
                    >
                      <div className="mb-2">{bt.icon}</div>
                      <div className="font-bold text-xs text-stone-900">{bt.label}</div>
                      <p className="text-[10px] text-stone-500 mt-1 leading-snug">{bt.desc}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Venue / Stall Name</label>
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Sizzling Bites Stall #14"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {selectedBusinessType !== 'Restaurant' && (
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">College / University Name</label>
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g. National Institute of Technology"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                )}

                {selectedBusinessType === 'College Fest Stall' && (
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Stall Number / Location</label>
                    <input
                      type="text"
                      value={stallNumber}
                      onChange={(e) => setStallNumber(e.target.value)}
                      placeholder="e.g. Stall #14, Main Quad Grounds"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowBusinessTypeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black cursor-pointer shadow-md"
                  >
                    Save Business Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Food Item */}
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-black text-stone-900 mb-1">Add Food Item</h3>
              <p className="text-xs text-stone-500 mb-4">
                List a dish on your menu. Stock and price in Indian Rupees (₹) are saved permanently.
              </p>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Food Item Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Paneer Tikka Smash Roll"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  {addName.trim() && inventory.some(i => i.dishName.trim().toLowerCase() === addName.trim().toLowerCase()) && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1">
                      ⚠️ Item already exists. Set a distinct batch identifier below to create a separate batch.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Batch Identifier <span className="text-stone-400 font-normal">(Required if creating separate batch)</span>
                  </label>
                  <input
                    type="text"
                    value={addBatchIdentifier}
                    onChange={(e) => setAddBatchIdentifier(e.target.value)}
                    placeholder="e.g. Batch 101, Evening Prep"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="Freshly grilled cottage cheese, spiced mint chutney, wrapped in flaky parotta."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                    <select
                      value={addCategory}
                      onChange={(e) => setAddCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      <option value="Burgers">Burgers & Rolls</option>
                      <option value="Pizza">Pizza & Breads</option>
                      <option value="Asian & Noodles">Asian & Noodles</option>
                      <option value="Desserts & Sweets">Desserts & Sweets</option>
                      <option value="Healthy & Bowls">Healthy & Bowls</option>
                      <option value="Mexican">Mexican & Snacks</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Selling Price in ₹ *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">₹</span>
                      <input
                        type="number"
                        min="10"
                        required
                        value={addPrice}
                        onChange={(e) => setAddPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Quantity Prepared *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={addPreparedQty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAddPreparedQty(val);
                        setAddRemainingQty(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Quantity Available (Initial) *</label>
                    <input
                      type="number"
                      min="0"
                      max={addPreparedQty}
                      required
                      value={addRemainingQty}
                      onChange={(e) => setAddRemainingQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* Image Upload or Preset Picker */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                      Food Image (Presets, Upload or URL)
                    </span>
                    <label className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'add')}
                      />
                    </label>
                  </label>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {PRESET_FOOD_IMAGES.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setAddImage(preset.url)}
                        className={`p-1.5 rounded-xl border text-center cursor-pointer transition-all ${
                          addImage === preset.url ? 'border-orange-500 ring-2 ring-orange-200' : 'border-stone-200'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-12 rounded-lg object-cover mb-1" />
                        <span className="text-[10px] font-bold text-stone-700 block truncate">{preset.label}</span>
                      </div>
                    ))}
                  </div>

                  <input
                    type="url"
                    value={addImage}
                    onChange={(e) => setAddImage(e.target.value)}
                    placeholder="Or enter custom image URL"
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] font-mono"
                  />
                </div>

                {/* Stall/Restaurant & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Stall / Restaurant Name</label>
                    <input
                      type="text"
                      value={addRestaurantName}
                      onChange={(e) => setAddRestaurantName(e.target.value)}
                      placeholder="e.g. Sizzling Bites Stall #14"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Location / Fest Quad</label>
                    <input
                      type="text"
                      value={addLocation}
                      onChange={(e) => setAddLocation(e.target.value)}
                      placeholder="e.g. Main Quad, Food Court"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* Optional Surplus & Donation settings */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Surplus Deals & NGO Food Rescue Options
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Surplus Discount % (Optional)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={addDiscountPercentage}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            setAddDiscountPercentage(pct);
                            setAddSurplusDiscountPrice(Math.round(addPrice * (1 - pct / 100)));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Offer Expiry Time</label>
                      <input
                        type="time"
                        value={addOfferExpiryTime}
                        onChange={(e) => setAddOfferExpiryTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-700 font-medium">Calculated Discount Price:</span>
                    <span className="font-extrabold text-amber-900 text-sm">₹{addSurplusDiscountPrice} ({addDiscountPercentage}% OFF)</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                    <input
                      type="checkbox"
                      id="modalDonationOpt"
                      checked={addIsDonationEligible}
                      onChange={(e) => setAddIsDonationEligible(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="modalDonationOpt" className="text-xs font-bold text-stone-800 cursor-pointer flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                      Mark surplus food as available for NGO Food Rescue
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black cursor-pointer shadow-md"
                  >
                    Save Food Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Food Item (with sold recording and auto remaining calculation) */}
        {showEditItemModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-black text-stone-900 mb-1">Edit Listing & Record Sales</h3>
              <p className="text-xs text-stone-500 mb-4">
                Update item name, price in ₹, or adjust prepared & sold counts with auto-calculated remaining stock.
              </p>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Food Item Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Batch Identifier</label>
                    <input
                      type="text"
                      value={editBatchIdentifier}
                      onChange={(e) => setEditBatchIdentifier(e.target.value)}
                      placeholder="e.g. Batch 101, Evening Prep"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      <option value="Burgers">Burgers & Rolls</option>
                      <option value="Pizza">Pizza & Breads</option>
                      <option value="Asian & Noodles">Asian & Noodles</option>
                      <option value="Desserts & Sweets">Desserts & Sweets</option>
                      <option value="Healthy & Bowls">Healthy & Bowls</option>
                      <option value="Mexican">Mexican & Snacks</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Price in ₹</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500 text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Accounting: Prepared, Sold, and Auto-Calculated Remaining */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-orange-600" />
                    Batch Accounting & Sales Tracker
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Quantity Prepared</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editPreparedQty}
                        onChange={(e) => setEditPreparedQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Quantity Sold</label>
                      <input
                        type="number"
                        min="0"
                        max={editPreparedQty}
                        required
                        value={editSoldQty}
                        onChange={(e) => setEditSoldQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>

                  {/* Dynamic calculation banner */}
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-950 flex items-center justify-between">
                    <span>Automatically Calculated Remaining:</span>
                    <strong className="text-sm font-black text-emerald-800">
                      {editCalculatedRemaining} Units
                    </strong>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Formula: {editPreparedQty} prepared − {editSoldQty} sold − {selectedItem.reservedQty || 0} reserved − {selectedItem.donationAllocatedQty || 0} donated = {editCalculatedRemaining} remaining
                  </div>
                </div>

                {/* Image URL / Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">Image</label>
                    <label className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'edit')}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowEditItemModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Explicit Vendor-Controlled Surplus Deal Release */}
        {showSurplusModal && (() => {
          const activeItem = selectedItem || inventory.find(i => i.id === surplusSelectedItemId) || inventory[0];
          const hasItem = !!activeItem;
          const isSoldOut = hasItem && activeItem.remainingQty <= 0;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl animate-in fade-in max-h-[92vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-xs">
                    <Tag className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-stone-900 leading-tight">
                      Release Surplus Deal
                    </h3>
                    <p className="text-xs text-stone-500">
                      Publish a discounted surplus deal for evening customer pickup.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLaunchSurplus} className="space-y-4 mt-4">
                  {/* Step 1: Select Existing Food Item */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      1. Select Existing Food Item *
                    </label>
                    <select
                      value={activeItem?.id || ''}
                      onChange={(e) => {
                        const chosen = inventory.find(i => i.id === e.target.value);
                        if (chosen) {
                          setSelectedItem(chosen);
                          setSurplusSelectedItemId(chosen.id);
                          const dPrice = chosen.surplusDiscountPrice || Math.round(chosen.price * 0.5);
                          setSurplusPrice(dPrice);
                          setSurplusDiscountPct(Math.round(((chosen.price - dPrice) / chosen.price) * 100));
                          setSurplusQty(Math.min(chosen.remainingQty, 4) || 1);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      {inventory.length === 0 ? (
                        <option value="">No food items found in inventory</option>
                      ) : (
                        inventory.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.dishName} {inv.batchIdentifier ? `(${inv.batchIdentifier})` : ''} — Regular ₹{inv.price} ({inv.remainingQty} available)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {hasItem && (
                    <>
                      {/* Step 2: Review and Confirm Actual Available Quantity */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                            2. Current Stock Breakdown
                          </span>
                          <span className="text-xs font-black text-stone-900">
                            Regular Price: ₹{activeItem.price}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-white border border-amber-100">
                            <span className="text-[10px] text-stone-400 font-bold block">Prepared</span>
                            <strong className="text-stone-800">{activeItem.preparedQty}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-amber-100">
                            <span className="text-[10px] text-blue-500 font-bold block">Sold</span>
                            <strong className="text-blue-700">{activeItem.soldQty}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-amber-100">
                            <span className="text-[10px] text-purple-500 font-bold block">Reserved</span>
                            <strong className="text-purple-700">{activeItem.reservedQty}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-100/90 border border-amber-300">
                            <span className="text-[10px] text-amber-900 font-black block">Available</span>
                            <strong className="text-amber-950 font-black">{activeItem.remainingQty}</strong>
                          </div>
                        </div>
                        {isSoldOut ? (
                          <p className="text-[11px] text-rose-700 font-bold mt-1">
                            ⚠️ This item has 0 available portions remaining. Prepare a new batch before releasing surplus deals.
                          </p>
                        ) : (
                          <p className="text-[11px] text-amber-800 font-medium">
                            ✓ {activeItem.remainingQty} portion(s) currently eligible for discounted sale or regular ordering.
                          </p>
                        )}
                      </div>

                      {/* Step 3: Enter Quantity to Release as Surplus */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-stone-800">
                            3. Quantity to Release as Surplus *
                          </label>
                          <span className="text-[11px] text-stone-500 font-medium">
                            Max available: {activeItem.remainingQty}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max={activeItem.remainingQty}
                          required
                          value={surplusQty}
                          onChange={(e) => setSurplusQty(Number(e.target.value))}
                          disabled={isSoldOut}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-stone-900"
                        />
                        <div className="text-[11px] text-stone-500 mt-1">
                          Releasing <strong>{surplusQty}</strong> portion(s) leaves <strong>{Math.max(0, activeItem.remainingQty - surplusQty)}</strong> portion(s) available on your regular menu at full price (₹{activeItem.price}).
                        </div>
                      </div>

                      {/* Step 4: Set Discount Percentage or Deal Price */}
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                        <label className="text-xs font-bold text-stone-800 block">
                          4. Set Discount Percentage or Deal Price in ₹ *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">Discount %</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="5"
                                max="95"
                                value={surplusDiscountPct}
                                onChange={(e) => {
                                  const pct = Math.min(95, Math.max(1, Number(e.target.value)));
                                  setSurplusDiscountPct(pct);
                                  setSurplusPrice(Math.round(activeItem.price * (1 - pct / 100)));
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-900"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">%</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-600 block mb-1">Deal Price (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-stone-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                max={activeItem.price - 1}
                                required
                                value={surplusPrice}
                                onChange={(e) => {
                                  const p = Number(e.target.value);
                                  setSurplusPrice(p);
                                  if (activeItem.price > 0) {
                                    setSurplusDiscountPct(Math.round(((activeItem.price - p) / activeItem.price) * 100));
                                  }
                                }}
                                className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick preset discount buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase">Presets:</span>
                          {[30, 40, 50, 60, 70].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setSurplusDiscountPct(pct);
                                setSurplusPrice(Math.round(activeItem.price * (1 - pct / 100)));
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                surplusDiscountPct === pct
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium flex items-center justify-between">
                          <span>Calculated Savings:</span>
                          <strong className="text-emerald-800 font-bold">
                            ₹{activeItem.price} → ₹{surplusPrice} (Save ₹{activeItem.price - surplusPrice} / portion)
                          </strong>
                        </div>
                      </div>

                      {/* Step 5: Set Expiry Time */}
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">
                          5. Set Expiry Time *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            required
                            value={surplusPickupEnd}
                            onChange={(e) => setSurplusPickupEnd(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-stone-400 uppercase">Quick Times:</span>
                          {['20:30', '21:00', '21:30', '22:00', '22:30', '23:00'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSurplusPickupEnd(t)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                                surplusPickupEnd === t
                                  ? 'bg-stone-900 text-white'
                                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          After this time, unsold surplus portions expire automatically and stop appearing on customer feeds.
                        </p>
                      </div>

                      {/* Step 6: Confirm Food is Suitable for Discounted Sale */}
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                        <label className="text-xs font-bold text-stone-800 block mb-2">
                          6. Food Safety & Freshness Confirmation *
                        </label>
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id="surplusSuitabilityCheck"
                            checked={surplusSuitabilityConfirmed}
                            onChange={(e) => setSurplusSuitabilityConfirmed(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <label htmlFor="surplusSuitabilityCheck" className="text-xs text-stone-700 cursor-pointer leading-relaxed">
                            <strong>I explicitly confirm</strong> that this food was prepared fresh today, has been kept in hygienic conditions, is unexpired, and is suitable for discounted consumer sale.
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 7: Clear "Release Surplus Deal" Submit Action */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSurplusModal(false);
                        setSelectedItem(null);
                        setSurplusSelectedItemId('');
                        setSurplusSuitabilityConfirmed(false);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isReleasingSurplus || !hasItem || isSoldOut || !surplusSuitabilityConfirmed || surplusQty > (activeItem?.remainingQty || 0) || surplusQty <= 0}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      {isReleasingSurplus ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing Surplus Deal...</span>
                        </>
                      ) : (
                        <>
                          <Tag className="w-4 h-4 stroke-[2.5]" />
                          <span>Release Surplus Deal</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Modal: Mark for NGO Food Donation */}
        {showDonationModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in">
              <h3 className="text-lg font-black text-stone-900 mb-1">
                Mark Surplus for Donation
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Safely offer surplus batches for pickup by registered student volunteers & food rescue NGOs.
              </p>

              <form onSubmit={handleLaunchDonation} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900 text-sm">{selectedItem.dishName}</div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {selectedItem.batchIdentifier || `Batch #${selectedItem.id.replace('inv_', '').slice(-4)}`}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Currently Available: {selectedItem.remainingQty} portions
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Portions to Donate *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.remainingQty}
                    required
                    value={donationPortions}
                    onChange={(e) => setDonationPortions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Packaging & Safety Notes</label>
                  <textarea
                    rows={2}
                    value={donationHandlingNotes}
                    onChange={(e) => setDonationHandlingNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Pickup Deadline *</label>
                  <input
                    type="text"
                    required
                    value={donationDeadline}
                    onChange={(e) => setDonationDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="quick-confirm-safety"
                      checked={donationConfirmedSuitable}
                      onChange={(e) => setDonationConfirmedSuitable(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                      required
                    />
                    <label htmlFor="quick-confirm-safety" className="text-[11px] leading-snug cursor-pointer font-bold">
                      I verify this food is freshly prepared, unexpired, hygienically stored, and fully suitable for safe human consumption.
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowDonationModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    Commit Food Donation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Donation Listing */}
        {editingDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
              <div>
                <h3 className="text-lg font-black text-stone-900">Edit Donation Listing</h3>
                <p className="text-xs text-stone-500">Update pickup timing, location, or food handling notes.</p>
              </div>

              <form onSubmit={handleSaveEditDonation} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="font-bold text-stone-900 text-sm">{editingDonation.dishName}</div>
                  <div className="text-stone-500 mt-0.5">
                    Portions: {editingDonation.availableQuantity} available ({editingDonation.allocatedQuantity || 0} allocated to NGOs)
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Pickup Deadline *</label>
                  <input
                    type="text"
                    required
                    value={editDonationDeadline}
                    onChange={(e) => setEditDonationDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Pickup Location & Instructions *</label>
                  <input
                    type="text"
                    required
                    value={editDonationLocation}
                    onChange={(e) => setEditDonationLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Food Handling & Packaging Notes</label>
                  <textarea
                    rows={2}
                    value={editDonationNotes}
                    onChange={(e) => setEditDonationNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingDonation(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reject Donation Request */}
        {rejectingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
              <div>
                <h3 className="text-lg font-black text-stone-900">Decline Rescue Request</h3>
                <p className="text-xs text-stone-500">
                  Declining returns {rejectingRequest.requestedQuantity} portion(s) back to your available donation pool for other volunteers.
                </p>
              </div>

              <form onSubmit={handleRejectDonationRequest} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
                  <div className="font-bold text-sm">{rejectingRequest.dishName}</div>
                  <div className="text-rose-800 mt-1">
                    Request from: <strong>{rejectingRequest.ngoName}</strong> ({rejectingRequest.volunteerName})
                  </div>
                  <div className="text-rose-700 font-semibold mt-0.5">
                    Quantity: {rejectingRequest.requestedQuantity} portion(s)
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Reason for Declining *</label>
                  <textarea
                    rows={2}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Kitchen closing early, unable to prepare packaging in time."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setRejectingRequest(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Vendor Cancel Order & Restore Stock */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">Cancel Order & Restore Stock</h3>
                    <p className="text-xs text-stone-500">
                      Order #{cancellingOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order details summary */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-stone-800">
                  <span>Customer: {cancellingOrder.customerName}</span>
                  <span className="text-stone-900">₹{cancellingOrder.totalAmount}</span>
                </div>

                <div className="text-[11px] text-stone-600">
                  <span>Payment: </span>
                  <span className="font-semibold uppercase">
                    {(cancellingOrder.isDemoPayment || cancellingOrder.paymentMethod === 'demo')
                      ? cancellingOrder.paymentStatus === 'demo_completed'
                        ? 'Demo Success'
                        : cancellingOrder.paymentStatus === 'demo_failed'
                        ? 'Demo Failed'
                        : 'Demo Pending'
                      : cancellingOrder.paymentStatus.replace(/_/g, ' ')}
                  </span>
                  {cancellingOrder.demoFailureReason && (
                    <span className="text-rose-700 block mt-0.5 font-medium">
                      Decline Reason: {cancellingOrder.demoFailureReason}
                    </span>
                  )}
                </div>

                {/* Items to restore */}
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-[11px] font-bold text-stone-700 block mb-1">Stock to be restored:</span>
                  <div className="space-y-1">
                    {cancellingOrder.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-stone-600">
                        <span>{it.quantity}x {it.dishName}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{it.quantity} stock
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Stock Restoration:</strong> Cancelling will set this order to <strong>Cancelled</strong> and restore all ordered quantities directly back to your active kitchen inventory. This action cannot be reversed.
                </span>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const orderToCancel = cancellingOrder;
                const reasonToUse = cancellationReasonInput.trim() || 'Cancelled by vendor';
                setCancellingOrder(null);
                await handleUpdateOrderStatus(orderToCancel.id, 'cancelled', reasonToUse);
              }} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Reason for Cancellation</label>
                  <input
                    type="text"
                    value={cancellationReasonInput}
                    onChange={(e) => setCancellationReasonInput(e.target.value)}
                    placeholder="e.g. Demo payment failed, kitchen closing early"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    disabled={updatingOrderId === cancellingOrder.id}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>Confirm & Restore Stock</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
