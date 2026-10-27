import React, { useState, useEffect } from 'react';
import { Restaurant, Dish, Order } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { 
  Tent, Sparkles, Plus, Search, MapPin, 
  Clock, CheckCircle2, AlertCircle, ShoppingBag, 
  Utensils, Store, Building, Tag, PackageCheck, RefreshCw,
  Edit3, Upload, Image as ImageIcon, X, CreditCard, QrCode, Loader2,
  Eye, ChevronRight, Phone, Mail, AlertTriangle, CheckSquare, ChefHat
} from 'lucide-react';

interface StallWithItems extends Restaurant {
  items: (Dish & { preparedQty: number; soldQty: number; remainingQty: number })[];
}

interface Props {
  onOrderDish?: (dish: Dish) => void;
  onNavigateToVendor?: () => void;
  onDishAdded?: () => void;
}

export const DEFAULT_STALL_IMAGE = 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80';
export const DEFAULT_DISH_IMAGE = 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80';

export function getValidStallImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return DEFAULT_STALL_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_STALL_IMAGE;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  return DEFAULT_STALL_IMAGE;
}

const PRESET_STALL_IMAGES = [
  'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80'
];

export const PRESET_DISH_IMAGES = [
  { label: 'Cookie Ice Cream & Waffle Cone', url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80' },
  { label: 'Artisan Cold Stone Sundae', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fest Nachos & Street Bites', url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Crispy Finger Food & Fries', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80' },
  { label: 'Craft Burger / Sandwich', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dessert Brownie & Pastry', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80' }
];

export const StallHubView: React.FC<Props> = ({ onOrderDish, onNavigateToVendor, onDishAdded }) => {
  const { user } = useAuth();
  const isVendorOrAdmin = Boolean(user && (user.role === 'vendor' || user.role === 'admin'));
  const [stalls, setStalls] = useState<StallWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Stall Modal
  const [showRegisterStallModal, setShowRegisterStallModal] = useState(false);
  const [stallName, setStallName] = useState('');
  const [collegeName, setCollegeName] = useState('Metro Institute of Technology');
  const [stallNumber, setStallNumber] = useState('Stall #7');
  const [festTheme, setFestTheme] = useState('Annual Cultural & Tech Fest');
  const [cuisine, setCuisine] = useState('Street Food & Fusion Bites');
  const [description, setDescription] = useState('Student-crafted sizzling street snacks and refreshing coolers.');
  const [stallImage, setStallImage] = useState(PRESET_STALL_IMAGES[0]);

  // Edit Stall Modal
  const [editingStall, setEditingStall] = useState<StallWithItems | null>(null);
  const [editStallName, setEditStallName] = useState('');
  const [editCollegeName, setEditCollegeName] = useState('');
  const [editStallNumber, setEditStallNumber] = useState('');
  const [editFestTheme, setEditFestTheme] = useState('');
  const [editCuisine, setEditCuisine] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editUpiPayeeName, setEditUpiPayeeName] = useState('');
  const [editStallImage, setEditStallImage] = useState('');
  const [isUpdatingStall, setIsUpdatingStall] = useState(false);

  // Add Dish to Stall Modal
  const [selectedStallForDish, setSelectedStallForDish] = useState<StallWithItems | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState<number>(99);
  const [dishPreparedQty, setDishPreparedQty] = useState<number>(30);
  const [dishCategory, setDishCategory] = useState('Fest Street Food & Snacks');
  const [dishDescription, setDishDescription] = useState('Freshly made festival special snack.');
  const [dishImage, setDishImage] = useState('https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=800&q=80');

  // Edit Dish Modal (Individual Dish Photo & Details)
  const [editingDish, setEditingDish] = useState<(Dish & { preparedQty: number; soldQty: number; remainingQty: number; stallId?: string }) | null>(null);
  const [editingDishStall, setEditingDishStall] = useState<StallWithItems | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [editDishPrice, setEditDishPrice] = useState<number>(0);
  const [editDishPreparedQty, setEditDishPreparedQty] = useState<number>(0);
  const [editDishRemainingQty, setEditDishRemainingQty] = useState<number>(0);
  const [editDishCategory, setEditDishCategory] = useState('');
  const [editDishDescription, setEditDishDescription] = useState('');
  const [editDishImage, setEditDishImage] = useState('');
  const [isUpdatingDish, setIsUpdatingDish] = useState(false);

  // Stall Orders & Activity Inspection state
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);
  const [inspectingStallOrders, setInspectingStallOrders] = useState<StallWithItems | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'confirmed_or_preparing' | 'ready_for_pickup' | 'completed' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Authorization check for editing stall
  const isAuthorizedToEdit = (stall: StallWithItems): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'vendor') {
      return stall.ownerId === user.id || user.organizationId === stall.id || !stall.ownerId;
    }
    return false;
  };

  // Strict ownership check for private stall order activity & customer data
  const isStallOwner = (stall: StallWithItems): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'vendor') {
      return stall.ownerId === user.id || Boolean(user.organizationId && user.organizationId === stall.id);
    }
    return false;
  };

  // Compute accurate order counts and verified / simulated revenue for a stall
  const computeStats = (orders: Order[]) => {
    const total = orders.length;
    const newOrders = orders.filter(o => o.orderStatus === 'pending').length;
    const inKitchen = orders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'preparing').length;
    const readyForPickup = orders.filter(o => o.orderStatus === 'ready_for_pickup').length;
    const completed = orders.filter(o => o.orderStatus === 'completed').length;
    const cancelled = orders.filter(o => o.orderStatus === 'cancelled').length;

    // Revenue calculation:
    // Exclude cancelled orders
    // Exclude orders whose payment has not succeeded
    const activeOrders = orders.filter(o => o.orderStatus !== 'cancelled');

    let simulatedDemoRevenue = 0;
    let realRevenue = 0;
    let simulatedPaidOrders = 0;
    let realPaidOrders = 0;

    for (const order of activeOrders) {
      const isDemo = order.isDemoPayment || order.paymentMethod === 'demo';
      if (isDemo) {
        if (order.paymentStatus === 'demo_completed') {
          simulatedDemoRevenue += order.totalAmount || 0;
          simulatedPaidOrders++;
        }
      } else if (order.paymentMethod === 'upi') {
        if (order.paymentStatus === 'verified') {
          realRevenue += order.totalAmount || 0;
          realPaidOrders++;
        }
      } else if (order.paymentMethod === 'pay_on_pickup') {
        if (['verified', 'received', 'paid'].includes(order.paymentStatus)) {
          realRevenue += order.totalAmount || 0;
          realPaidOrders++;
        }
      }
    }

    return {
      total,
      newOrders,
      inKitchen,
      readyForPickup,
      completed,
      cancelled,
      simulatedDemoRevenue,
      realRevenue,
      simulatedPaidOrders,
      realPaidOrders
    };
  };

  const handleOpenEditStallModal = (stall: StallWithItems) => {
    setEditingStall(stall);
    setEditStallName(stall.name || '');
    setEditCollegeName(stall.collegeName || 'Metro Institute of Technology');
    setEditStallNumber(stall.stallNumber || '');
    setEditFestTheme(stall.festTheme || 'Annual Cultural & Tech Fest');
    setEditCuisine(stall.cuisine || 'Fest Street Food & Fusion Bites');
    setEditDescription(stall.description || '');
    setEditDeliveryTime(stall.deliveryTime || '5-10 min prep');
    setEditUpiId(stall.upiId || '');
    setEditUpiPayeeName(stall.upiPayeeName || stall.name || '');
    setEditStallImage(getValidStallImageUrl(stall.image));
    setErrorMsg('');
  };

  const handleCancelEditStall = () => {
    // Discard unsaved changes
    setEditingStall(null);
    setErrorMsg('');
  };

  const handleSaveEditStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStall) return;

    if (!editStallName.trim()) {
      setErrorMsg('Stall Name cannot be blank');
      return;
    }
    if (!editCollegeName.trim()) {
      setErrorMsg('College/University Name cannot be blank');
      return;
    }

    try {
      setIsUpdatingStall(true);
      setErrorMsg('');

      const res = await api.updateStall(editingStall.id, {
        name: editStallName.trim(),
        collegeName: editCollegeName.trim(),
        stallNumber: editStallNumber.trim(),
        festTheme: editFestTheme.trim(),
        cuisine: editCuisine.trim(),
        description: editDescription.trim(),
        deliveryTime: editDeliveryTime.trim(),
        upiId: editUpiId.trim() || undefined,
        upiPayeeName: editUpiPayeeName.trim() || undefined,
        image: editStallImage.trim() || DEFAULT_STALL_IMAGE
      });

      setSuccessMsg(`Stall "${res.stall.name}" updated successfully! Changes permanently saved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingStall(null);
      await loadStalls();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update stall details');
    } finally {
      setIsUpdatingStall(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'register' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Selected image is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (target === 'register') setStallImage(reader.result);
        if (target === 'edit') setEditStallImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadStalls = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const stallsPromise = api.getStalls();
      const ordersPromise = (user && (user.role === 'vendor' || user.role === 'admin'))
        ? api.getOrders().catch(() => [])
        : Promise.resolve([]);

      const [data, ordersData] = await Promise.all([stallsPromise, ordersPromise]);
      setStalls(data.stalls || []);
      setVendorOrders(ordersData || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load college fest stalls');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStalls();
  }, [user?.id, user?.role]);

  const handleRegisterStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stallName.trim() || !collegeName.trim()) {
      setErrorMsg('Stall Name and College Name are required');
      return;
    }
    try {
      setErrorMsg('');
      await api.registerStall({
        name: stallName.trim(),
        collegeName: collegeName.trim(),
        stallNumber: stallNumber.trim(),
        festTheme: festTheme.trim(),
        cuisine,
        description,
        image: stallImage || DEFAULT_STALL_IMAGE
      });
      setShowRegisterStallModal(false);
      setSuccessMsg(`Stall "${stallName}" registered successfully! Permanently saved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setStallName('');
      await loadStalls();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register stall');
    }
  };

  const handleAddDishToStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStallForDish || !dishName.trim()) return;
    try {
      setErrorMsg('');
      const effectiveCategory = dishCategory && dishCategory !== 'Mexican'
        ? dishCategory
        : (selectedStallForDish.cuisine || 'Fest Street Food & Snacks');
      await api.addStallDish(selectedStallForDish.id, {
        name: dishName.trim(),
        description: dishDescription.trim(),
        price: Number(dishPrice),
        preparedQty: Number(dishPreparedQty),
        image: dishImage,
        category: effectiveCategory
      });
      setSelectedStallForDish(null);
      setDishName('');
      setSuccessMsg(`Added "${dishName}" to ${selectedStallForDish.name}! Permanently saved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadStalls();
      onDishAdded?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add dish');
    }
  };

  const handleDishImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Selected image is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditDishImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEditDishModal = (stall: StallWithItems, dish: Dish & { preparedQty: number; soldQty: number; remainingQty: number }) => {
    setEditingDishStall(stall);
    setEditingDish({ ...dish, stallId: stall.id });
    setEditDishName(dish.name);
    setEditDishPrice(dish.price);
    setEditDishPreparedQty(dish.preparedQty);
    setEditDishRemainingQty(dish.remainingQty);
    setEditDishCategory(dish.category || stall.cuisine || 'Fest Street Food & Snacks');
    setEditDishDescription(dish.description || '');
    setEditDishImage(dish.image || DEFAULT_DISH_IMAGE);
    setErrorMsg('');
  };

  const handleSaveEditDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editingDishStall) return;
    try {
      setIsUpdatingDish(true);
      setErrorMsg('');

      const cleanImage = getValidStallImageUrl(editDishImage);

      await api.updateStallDish(editingDishStall.id, editingDish.id, {
        name: editDishName.trim(),
        price: Number(editDishPrice),
        description: editDishDescription.trim(),
        category: editDishCategory.trim(),
        image: cleanImage,
        preparedQty: Number(editDishPreparedQty),
        remainingQty: Number(editDishRemainingQty)
      });

      setSuccessMsg(`Updated "${editDishName}" successfully! Photo and details permanently saved.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingDish(null);
      setEditingDishStall(null);
      await loadStalls();
      onDishAdded?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update dish');
    } finally {
      setIsUpdatingDish(false);
    }
  };

  const handleOrder = (dish: Dish, remainingQty: number) => {
    if (remainingQty <= 0) {
      setErrorMsg(`"${dish.name}" is currently Sold Out!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    if (onOrderDish) {
      onOrderDish(dish);
    } else {
      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg(`Order placed for ${dish.name} (₹${dish.price})! Visit the fest stall to pick up.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Filtered stalls
  const collegesList = ['All', ...Array.from(new Set(stalls.map(s => s.collegeName || 'Campus Hub')))];
  const filteredStalls = stalls.filter(s => {
    const matchesCollege = selectedCollege === 'All' || s.collegeName === selectedCollege;
    const matchesSearch = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.festTheme && s.festTheme.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCollege && matchesSearch;
  });

  return (
    <div className="py-10 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hub Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-6 sm:p-10 mb-8 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider mb-3">
                <Tent className="w-3.5 h-3.5" />
                Campus Fest Stall Hub
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                COLLEGE FEST FOOD STALLS
              </h1>
              <p className="text-sm sm:text-base text-amber-100 mt-2 font-medium leading-relaxed">
                Discover vibrant student-run food stalls at college fests! View live prepared stock, selling prices in Indian Rupees (₹), and support campus culinary entrepreneurs.
              </p>
            </div>

            {isVendorOrAdmin && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setShowRegisterStallModal(true)}
                  className="px-5 py-3 rounded-2xl bg-white text-stone-900 font-black text-xs uppercase tracking-wider hover:bg-stone-100 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 text-orange-600 stroke-[3]" />
                  Register Fest Stall
                </button>

                {onNavigateToVendor && (
                  <button
                    onClick={onNavigateToVendor}
                    className="px-4 py-3 rounded-2xl bg-black/30 hover:bg-black/50 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Store className="w-4 h-4" />
                    Vendor Dashboard
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fest stalls, nachos, burgers, tacos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 shadow-2xs"
            />
          </div>

          {/* College Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {collegesList.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCollege(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCollege === c
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={loadStalls}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 cursor-pointer shrink-0"
              title="Refresh live stalls"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stall Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(n => (
              <div key={n} className="h-64 rounded-3xl bg-stone-200/60 animate-pulse" />
            ))}
          </div>
        ) : filteredStalls.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8">
            <Tent className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">No College Fest Stalls Found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? `No stalls match "${searchQuery}".` 
                : isVendorOrAdmin 
                ? 'Be the first student vendor to register a food stall for your campus festival!' 
                : 'No campus fest food stalls are currently listed. Please check back soon!'}
            </p>
            {isVendorOrAdmin && (
              <button
                onClick={() => setShowRegisterStallModal(true)}
                className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                + Register First Stall
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredStalls.map(stall => {
              const isOwner = isStallOwner(stall);
              const stallOrders = vendorOrders.filter(o => o.restaurantId === stall.id);
              const stats = computeStats(stallOrders);

              return (
                <div 
                  key={stall.id}
                  className="rounded-3xl bg-white border border-stone-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Stall Header */}
                <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-stone-50 via-white to-amber-50/40">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={getValidStallImageUrl(stall.image)}
                        alt={stall.name}
                        onError={(e) => {
                          if (e.currentTarget.src !== DEFAULT_STALL_IMAGE) {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_STALL_IMAGE;
                          }
                        }}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-stone-200/80 shadow-2xs"
                      />
                      {isAuthorizedToEdit(stall) && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditStallModal(stall)}
                          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-stone-900 hover:bg-black text-white shadow-xs cursor-pointer transition-transform hover:scale-110"
                          title="Edit Stall Image & Details"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-stone-900">
                          {stall.name}
                        </h2>
                        {isAuthorizedToEdit(stall) && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditStallModal(stall)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/80 transition-colors cursor-pointer"
                            title="Edit Stall Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 uppercase">
                          {stall.stallNumber || 'Stall #1'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700">
                          {stall.cuisine}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-stone-700">
                          <Building className="w-3.5 h-3.5 text-stone-400" />
                          {stall.collegeName || 'Campus Fest Ground'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          {stall.festTheme || 'Annual Festival'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {stall.deliveryTime || '5-10 min prep'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1 max-w-xl">
                        {stall.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this stall: Edit Stall (authorized owner) & Add Dish */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isAuthorizedToEdit(stall) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditStallModal(stall)}
                        className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs border border-stone-200/80 hover:border-stone-300"
                        title="Edit stall name, banner image, and festival details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Stall</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStallForDish(stall);
                        setDishName('');
                        setDishCategory(stall.cuisine || 'Fest Street Food & Snacks');
                        setDishDescription(`Freshly prepared fest special at ${stall.name}.`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>+ Add Dish to Stall</span>
                    </button>
                  </div>
                </div>

                {/* Stall-Specific Order Activity & Live Performance (Visible to Stall Owner / Admin) */}
                {isOwner && (
                  <div className="px-6 py-5 bg-gradient-to-b from-stone-50/80 to-white border-b border-stone-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <ShoppingBag className="w-4 h-4 text-orange-600 shrink-0" />
                          <h3 className="text-sm font-black text-stone-900 tracking-tight">
                            Live Stall Order Activity
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-900 text-white">
                            {stats.total} Total {stats.total === 1 ? 'Order' : 'Orders'}
                          </span>
                          {stats.inKitchen > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 animate-pulse">
                              {stats.inKitchen} In Prep
                            </span>
                          )}
                          {stats.readyForPickup > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                              {stats.readyForPickup} Ready for Counter Pickup
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Order volume, kitchen pipeline, and expo demo sales for {stall.name}.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingStallOrders(stall);
                            setOrderStatusFilter('all');
                            setOrderSearchQuery('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Orders ({stats.total})</span>
                        </button>
                      </div>
                    </div>

                    {/* Order Status Counts Grid (Requirement 1) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {/* Total Orders */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(stall);
                          setOrderStatusFilter('all');
                          setOrderSearchQuery('');
                        }}
                        className="p-3 rounded-2xl bg-white border border-stone-200 text-left hover:border-stone-400 transition-all cursor-pointer shadow-2xs group"
                      >
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Total Orders
                        </span>
                        <div className="text-xl font-black text-stone-900 mt-0.5 group-hover:text-orange-600 transition-colors">
                          {stats.total}
                        </div>
                        <span className="text-[10px] text-stone-500 flex items-center gap-0.5">
                          All orders <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </button>

                      {/* New / Received (pending) */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(stall);
                          setOrderStatusFilter('pending');
                          setOrderSearchQuery('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs group ${
                          stats.newOrders > 0
                            ? 'bg-blue-50/70 border-blue-200 hover:border-blue-400'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          New / Received
                        </span>
                        <div className="text-xl font-black text-blue-900 mt-0.5">
                          {stats.newOrders}
                        </div>
                        <span className="text-[10px] text-stone-500">
                          {stats.newOrders === 1 ? '1 pending' : `${stats.newOrders} pending`}
                        </span>
                      </button>

                      {/* Confirmed / In Kitchen Prep */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(stall);
                          setOrderStatusFilter('confirmed_or_preparing');
                          setOrderSearchQuery('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs group ${
                          stats.inKitchen > 0
                            ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                          In Kitchen
                        </span>
                        <div className={`text-xl font-black text-amber-900 mt-0.5 ${stats.inKitchen > 0 ? 'animate-pulse' : ''}`}>
                          {stats.inKitchen}
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Confirmed & Prep
                        </span>
                      </button>

                      {/* Ready for Pickup */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(stall);
                          setOrderStatusFilter('ready_for_pickup');
                          setOrderSearchQuery('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs group ${
                          stats.readyForPickup > 0
                            ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Ready for Pickup
                        </span>
                        <div className="text-xl font-black text-emerald-900 mt-0.5">
                          {stats.readyForPickup}
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Awaiting handover
                        </span>
                      </button>

                      {/* Completed */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(stall);
                          setOrderStatusFilter('completed');
                          setOrderSearchQuery('');
                        }}
                        className="p-3 rounded-2xl bg-white border border-stone-200 text-left hover:border-stone-300 transition-all cursor-pointer shadow-2xs group"
                      >
                        <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                          Completed
                        </span>
                        <div className="text-xl font-black text-stone-900 mt-0.5">
                          {stats.completed}
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Handed over
                        </span>
                      </button>

                      {/* Cancelled */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(stall);
                          setOrderStatusFilter('cancelled');
                          setOrderSearchQuery('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs group ${
                          stats.cancelled > 0
                            ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                          Cancelled
                        </span>
                        <div className="text-xl font-black text-rose-900 mt-0.5">
                          {stats.cancelled}
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Stock restored
                        </span>
                      </button>
                    </div>

                    {/* Revenue Summary (Requirement 4) */}
                    <div className="p-3 rounded-2xl bg-white border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                          Revenue Summary:
                        </span>

                        {stats.simulatedDemoRevenue > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-200">
                            <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span className="font-extrabold text-sm">₹{stats.simulatedDemoRevenue}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-white/80 px-1.5 py-0.5 rounded">
                              Simulated Demo Revenue
                            </span>
                          </div>
                        )}

                        {stats.realRevenue > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="font-extrabold text-sm">₹{stats.realRevenue}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/80 px-1.5 py-0.5 rounded">
                              Verified Real Revenue
                            </span>
                          </div>
                        )}

                        {stats.simulatedDemoRevenue === 0 && stats.realRevenue === 0 && (
                          <span className="text-stone-500 text-[11px] italic">
                            ₹0 recorded revenue (no successful payments recorded yet)
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-stone-400 font-medium">
                        Excludes {stats.cancelled} cancelled order(s) & unverified payments
                      </div>
                    </div>
                  </div>
                )}

                {/* Stall Menu & Inventory Items */}
                <div className="p-6">
                  <div className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    Available Fest Specials ({stall.items.length})
                  </div>

                  {stall.items.length === 0 ? (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                      <p className="text-xs text-stone-500">No dishes added to this stall yet.</p>
                      <button
                        onClick={() => setSelectedStallForDish(stall)}
                        className="mt-2 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                      >
                        + Add First Fest Dish
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stall.items.map(dish => {
                        const isSoldOut = dish.remainingQty === 0;
                        const isLowStock = !isSoldOut && dish.remainingQty <= 3;

                        return (
                          <div 
                            key={dish.id}
                            className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:bg-white hover:border-stone-300 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative mb-3 group">
                                <img
                                  src={dish.image || DEFAULT_DISH_IMAGE}
                                  alt={dish.name}
                                  onError={(e) => {
                                    if (e.currentTarget.src !== DEFAULT_DISH_IMAGE) {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = DEFAULT_DISH_IMAGE;
                                    }
                                  }}
                                  className="w-full h-32 rounded-xl object-cover"
                                />
                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                                  isSoldOut 
                                    ? 'bg-rose-600 text-white' 
                                    : isLowStock 
                                    ? 'bg-amber-500 text-stone-950' 
                                    : 'bg-emerald-600 text-white'
                                }`}>
                                  {isSoldOut ? 'Sold Out' : isLowStock ? `Only ${dish.remainingQty} Left` : `${dish.remainingQty} in Stock`}
                                </span>

                                {isAuthorizedToEdit(stall) && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDishModal(stall, dish)}
                                    className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-102"
                                    title={`Change image or details for ${dish.name}`}
                                  >
                                    <ImageIcon className="w-3 h-3 text-orange-400" />
                                    <span>Edit Dish / Photo</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-bold text-stone-900 text-sm">{dish.name}</h4>
                                    {isAuthorizedToEdit(stall) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditDishModal(stall, dish)}
                                        className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-200/80 transition-colors cursor-pointer"
                                        title={`Edit ${dish.name} photo and details`}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {dish.batchIdentifier && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                        {dish.batchIdentifier}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{dish.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-base font-black text-stone-900">₹{dish.price}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                              <div className="text-stone-500 font-mono">
                                Prep: <strong>{dish.preparedQty}</strong> | Rem: <strong className={isSoldOut ? 'text-rose-600' : 'text-emerald-700'}>{dish.remainingQty}</strong>
                              </div>

                              <button
                                onClick={() => handleOrder(dish, dish.remainingQty)}
                                disabled={isSoldOut}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  isSoldOut
                                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                    : 'bg-stone-900 hover:bg-black text-white shadow-2xs hover:scale-105 active:scale-95'
                                }`}
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>{isSoldOut ? 'Sold Out' : 'Order ₹' + dish.price}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Register New College Fest Stall */}
        {showRegisterStallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-black text-stone-900 mb-1">
                Register College Fest Stall
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                List your campus food stall so fest attendees can browse and order in Indian Rupees (₹).
              </p>

              <form onSubmit={handleRegisterStall} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Stall Name *</label>
                  <input
                    type="text"
                    required
                    value={stallName}
                    onChange={(e) => setStallName(e.target.value)}
                    placeholder="e.g. Sizzling Nachos & Loaded Fries"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">College / University *</label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g. Metro Institute of Technology"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Stall Number</label>
                    <input
                      type="text"
                      value={stallNumber}
                      onChange={(e) => setStallNumber(e.target.value)}
                      placeholder="e.g. Stall #14"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Festival Theme</label>
                    <input
                      type="text"
                      value={festTheme}
                      onChange={(e) => setFestTheme(e.target.value)}
                      placeholder="e.g. Annual Cultural Fest"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Cuisine / Specialties</label>
                    <input
                      type="text"
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                      placeholder="e.g. Street Food, Tacos & Wraps"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Stall Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell festival foodies what makes your stall irresistible..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* Preset image chooser */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Select Stall Banner Image</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {PRESET_STALL_IMAGES.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setStallImage(img)}
                        className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          stallImage === img ? 'border-orange-500 ring-2 ring-orange-200' : 'border-stone-200'
                        }`}
                      >
                        <img src={img} alt="Preset" className="w-full h-12 object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <label className="flex-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Banner Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'register')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={stallImage}
                    onChange={(e) => setStallImage(e.target.value)}
                    placeholder="Or enter custom stall image URL"
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowRegisterStallModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-black uppercase tracking-wider hover:bg-black cursor-pointer shadow-md"
                  >
                    Register Stall
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Stall Details */}
        {editingStall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
                      <Tent className="w-5 h-5" />
                    </span>
                    <h3 className="text-xl font-black text-stone-900">
                      Edit Stall: {editingStall.name}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Update your college festival stall details, banner image, preparation time, and UPI receiver info.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEditStall}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
                  title="Cancel and close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditStall} className="space-y-4">
                {/* Stall Name & Stall Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Stall Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editStallName}
                      onChange={(e) => setEditStallName(e.target.value)}
                      placeholder="e.g. My Food"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Stall Number
                    </label>
                    <input
                      type="text"
                      value={editStallNumber}
                      onChange={(e) => setEditStallNumber(e.target.value)}
                      placeholder="e.g. STALL#521"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* College & Festival/Event Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      College / University Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCollegeName}
                      onChange={(e) => setEditCollegeName(e.target.value)}
                      placeholder="e.g. Metro Institute of Technology"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Festival / Event Name
                    </label>
                    <input
                      type="text"
                      value={editFestTheme}
                      onChange={(e) => setEditFestTheme(e.target.value)}
                      placeholder="e.g. Annual Cultural & Tech Fest"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* Category / Cuisine & Preparation Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Stall Category or Cuisine
                    </label>
                    <input
                      type="text"
                      value={editCuisine}
                      onChange={(e) => setEditCuisine(e.target.value)}
                      placeholder="e.g. Street Food & Fusion Bites"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Pickup / Preparation Time
                    </label>
                    <input
                      type="text"
                      value={editDeliveryTime}
                      onChange={(e) => setEditDeliveryTime(e.target.value)}
                      placeholder="e.g. 5-10 min prep"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Stall Description
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Tell festival foodies about your stall's specialties..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* UPI Payment Details */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-stone-600" />
                    <span>UPI Payment Details (Customer QR Payments)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                        UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value)}
                        placeholder="e.g. myfood@upi, stall521@paytm"
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                        Payee / Merchant Display Name
                      </label>
                      <input
                        type="text"
                        value={editUpiPayeeName}
                        onChange={(e) => setEditUpiPayeeName(e.target.value)}
                        placeholder="e.g. My Food Stall #521"
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Stall Banner Image: Preview, Upload, Presets & URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">
                    Stall Image (Upload New Image or Select Preset)
                  </label>

                  {/* Current / Live Preview */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <img
                      src={getValidStallImageUrl(editStallImage)}
                      alt="Stall Preview"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_STALL_IMAGE) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_STALL_IMAGE;
                        }
                      }}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-stone-300 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-stone-800 block">
                        Live Banner Preview
                      </span>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {editStallImage.startsWith('data:image') 
                          ? 'Local image file uploaded (ready to save)' 
                          : editStallImage || 'Using default festival stall banner'}
                      </p>
                    </div>
                  </div>

                  {/* Upload file button & Preset choices */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-stone-700" />
                      <span>Upload New Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'edit')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditStallImage(DEFAULT_STALL_IMAGE)}
                      className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-medium cursor-pointer"
                      title="Reset to default fallback image"
                    >
                      Reset Default
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_STALL_IMAGES.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setEditStallImage(img)}
                        className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          editStallImage === img ? 'border-orange-500 ring-2 ring-orange-200' : 'border-stone-200'
                        }`}
                      >
                        <img src={img} alt="Preset" className="w-full h-12 object-cover" />
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={editStallImage}
                    onChange={(e) => setEditStallImage(e.target.value)}
                    placeholder="Or enter image URL"
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                {/* Cancel and Save Changes Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleCancelEditStall}
                    disabled={isUpdatingStall}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer border border-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStall}
                    className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98"
                  >
                    {isUpdatingStall ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Dish to Fest Stall */}
        {selectedStallForDish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-black text-stone-900 mb-1">
                Add Dish to {selectedStallForDish.name}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Add a festival food item with price in ₹ and prepared quantity.
              </p>

              <form onSubmit={handleAddDishToStall} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Masala Cheese Fries"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Price in ₹ *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-stone-500">₹</span>
                      <input
                        type="number"
                        min="10"
                        required
                        value={dishPrice}
                        onChange={(e) => setDishPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Prepared Batch Qty *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={dishPreparedQty}
                      onChange={(e) => setDishPreparedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold"
                  >
                    <option value={selectedStallForDish.cuisine || "Fest Street Food & Snacks"}>
                      {selectedStallForDish.cuisine || "Fest Street Food & Snacks"} (Stall Special)
                    </option>
                    <option value="Fest Street Food & Snacks">Fest Street Food & Snacks</option>
                    <option value="Desserts & Sweets">Desserts & Sweets</option>
                    <option value="Burgers">Burgers & Rolls</option>
                    <option value="Pizza">Pizza & Breads</option>
                    <option value="Asian & Noodles">Asian & Noodles</option>
                    <option value="Mexican">Mexican & Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={dishImage}
                    onChange={(e) => setDishImage(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setSelectedStallForDish(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-black uppercase tracking-wider hover:bg-black cursor-pointer shadow-md"
                  >
                    Add Dish to Stall
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Individual Dish & Photo */}
        {editingDish && editingDishStall && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
              <button
                type="button"
                onClick={() => {
                  setEditingDish(null);
                  setEditingDishStall(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Edit Dish & Photo
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Updating dish for <span className="font-bold text-amber-600">{editingDishStall.name}</span> ({editingDishStall.stallNumber})
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveEditDish} className="space-y-5">
                {/* Image Section */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      Dish Photo (Stall Card & Customer Menu)
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Live Customer View
                    </span>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-sm shrink-0 bg-stone-200 relative group">
                      <img
                        src={getValidStallImageUrl(editDishImage)}
                        alt={editDishName || 'Dish preview'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_DISH_IMAGE;
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-amber-500 text-stone-800 text-xs font-bold shadow-xs transition-all hover:bg-stone-50">
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Upload Device Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDishImageFileUpload}
                            className="hidden"
                          />
                        </label>
                        {editDishImage !== DEFAULT_DISH_IMAGE && (
                          <button
                            type="button"
                            onClick={() => setEditDishImage(DEFAULT_DISH_IMAGE)}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight">
                        Upload an image or paste a direct image URL. This updates both the vendor Stall Hub card and customer menu card.
                      </p>
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                      Quick Preset Photos
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {PRESET_DISH_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditDishImage(preset.url)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left truncate border transition-all cursor-pointer ${
                            editDishImage === preset.url
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                          }`}
                          title={preset.label}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image URL input */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      Direct Image URL
                    </label>
                    <input
                      type="url"
                      value={editDishImage}
                      onChange={(e) => setEditDishImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Dish Core Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editDishName}
                      onChange={(e) => setEditDishName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1}
                      value={editDishPrice}
                      onChange={(e) => setEditDishPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editDishCategory}
                      onChange={(e) => setEditDishCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Total Prepared
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editDishPreparedQty}
                      onChange={(e) => setEditDishPreparedQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Remaining Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editDishRemainingQty}
                      onChange={(e) => setEditDishRemainingQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editDishDescription}
                    onChange={(e) => setEditDishDescription(e.target.value)}
                    placeholder="Short description of this delicious fest item..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div className="text-[11px] text-stone-400 font-mono">
                    Dish ID: {editingDish.id}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDish(null);
                        setEditingDishStall(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingDish}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-black uppercase tracking-wider hover:from-amber-700 hover:to-orange-700 cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUpdatingDish ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Dish & Photo'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Stall-Specific Order Activity & Fulfillment Log */}
        {inspectingStallOrders && (() => {
          const stallOrders = vendorOrders.filter(o => o.restaurantId === inspectingStallOrders.id);
          const stats = computeStats(stallOrders);
          
          const filteredOrders = stallOrders.filter(order => {
            // Status filter
            if (orderStatusFilter === 'pending' && order.orderStatus !== 'pending') return false;
            if (orderStatusFilter === 'confirmed_or_preparing' && order.orderStatus !== 'confirmed' && order.orderStatus !== 'preparing') return false;
            if (orderStatusFilter === 'ready_for_pickup' && order.orderStatus !== 'ready_for_pickup') return false;
            if (orderStatusFilter === 'completed' && order.orderStatus !== 'completed') return false;
            if (orderStatusFilter === 'cancelled' && order.orderStatus !== 'cancelled') return false;

            // Search query filter
            if (orderSearchQuery.trim()) {
              const q = orderSearchQuery.toLowerCase().trim();
              const matchId = (order.orderNumber || '').toLowerCase().includes(q) || (order.id || '').toLowerCase().includes(q);
              const matchCustomer = (order.customerName || '').toLowerCase().includes(q) || (order.customerPhone || '').toLowerCase().includes(q);
              const matchDish = (order.items || []).some(item => (item.dishName || '').toLowerCase().includes(q));
              if (!matchId && !matchCustomer && !matchDish) return false;
            }

            return true;
          });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
              <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-black truncate text-white">
                          {inspectingStallOrders.name}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-stone-950 uppercase">
                          {inspectingStallOrders.stallNumber || 'Fest Stall'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 truncate mt-0.5">
                        {inspectingStallOrders.collegeName || 'Campus Fest Ground'} • Order Activity & Customer Records
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => loadStalls()}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-stone-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Refresh live orders from server"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>

                    {onNavigateToVendor && (
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingStallOrders(null);
                          onNavigateToVendor();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        title="Manage and fulfill orders in Vendor Dashboard"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Vendor Dashboard</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectingStallOrders(null)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Subheader / Summary bar */}
                <div className="p-4 bg-stone-50 border-b border-stone-200 shrink-0 space-y-3">
                  {/* Revenue banner */}
                  <div className="p-3 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                        Verified Revenue:
                      </span>
                      {stats.simulatedDemoRevenue > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-200 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span className="font-black text-sm">₹{stats.simulatedDemoRevenue}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-white/80 px-1.5 py-0.5 rounded">
                            Simulated Demo Revenue
                          </span>
                        </div>
                      )}
                      {stats.realRevenue > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-200 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="font-black text-sm">₹{stats.realRevenue}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/80 px-1.5 py-0.5 rounded">
                            Real Payment
                          </span>
                        </div>
                      )}
                      {stats.simulatedDemoRevenue === 0 && stats.realRevenue === 0 && (
                        <span className="text-xs text-stone-500 italic">
                          ₹0 (no orders with completed payments)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 font-medium">
                      Excludes {stats.cancelled} cancelled orders & unpaid / failed orders
                    </div>
                  </div>

                  {/* Filter tabs & Search */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === 'all'
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        All ({stats.total})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === 'pending'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-blue-50'
                        }`}
                      >
                        New / Received ({stats.newOrders})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('confirmed_or_preparing')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === 'confirmed_or_preparing'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-amber-50'
                        }`}
                      >
                        In Kitchen ({stats.inKitchen})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('ready_for_pickup')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === 'ready_for_pickup'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-emerald-50'
                        }`}
                      >
                        Ready for Pickup ({stats.readyForPickup})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('completed')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === 'completed'
                            ? 'bg-stone-700 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Completed ({stats.completed})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('cancelled')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                          orderStatusFilter === 'cancelled'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-rose-50'
                        }`}
                      >
                        Cancelled ({stats.cancelled})
                      </button>
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search order #, customer, dish..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Orders Content List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                      <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-stone-700">No orders found</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {orderStatusFilter !== 'all' || orderSearchQuery
                          ? 'Try clearing the search query or selecting a different status filter.'
                          : 'No customers have placed orders for this fest stall yet.'}
                      </p>
                    </div>
                  ) : (
                    filteredOrders.map(order => {
                      const isCancelled = order.orderStatus === 'cancelled';
                      const isPaid = order.paymentStatus === 'demo_completed' || ['verified', 'received', 'paid'].includes(order.paymentStatus);
                      const isHandoverBlocked = !isPaid && !isCancelled && order.orderStatus !== 'completed';

                      return (
                        <div
                          key={order.id}
                          className={`rounded-2xl border transition-all p-4 sm:p-5 ${
                            isCancelled
                              ? 'bg-stone-50/60 border-stone-200 opacity-90'
                              : 'bg-white border-stone-200 shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          {/* Order Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-stone-900">
                                  {order.orderNumber || `ORD-${order.id.slice(-6).toUpperCase()}`}
                                </span>
                                <span className="text-[11px] font-mono text-stone-400">
                                  ID: {order.id}
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Fulfillment Status */}
                              <span
                                className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                                  order.orderStatus === 'pending'
                                    ? 'bg-blue-100 text-blue-900'
                                    : order.orderStatus === 'confirmed' || order.orderStatus === 'preparing'
                                    ? 'bg-amber-100 text-amber-900'
                                    : order.orderStatus === 'ready_for_pickup'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : order.orderStatus === 'completed'
                                    ? 'bg-stone-900 text-white'
                                    : 'bg-rose-100 text-rose-900 line-through'
                                }`}
                              >
                                {order.orderStatus === 'pending' && 'New / Received'}
                                {order.orderStatus === 'confirmed' && 'Confirmed'}
                                {order.orderStatus === 'preparing' && 'Preparing in Kitchen'}
                                {order.orderStatus === 'ready_for_pickup' && 'Ready for Counter Pickup'}
                                {order.orderStatus === 'completed' && 'Completed / Handed Over'}
                                {order.orderStatus === 'cancelled' && 'Cancelled'}
                              </span>

                              {/* Payment Status */}
                              <span
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                  order.paymentStatus === 'demo_completed'
                                    ? 'bg-purple-100 text-purple-950 border border-purple-200'
                                    : order.paymentStatus === 'demo_failed'
                                    ? 'bg-rose-100 text-rose-950 border border-rose-200'
                                    : order.paymentStatus === 'demo_pending'
                                    ? 'bg-amber-100 text-amber-950 border border-amber-200'
                                    : ['verified', 'received', 'paid'].includes(order.paymentStatus)
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {order.paymentStatus === 'demo_completed' && 'Demo Completed (Simulated)'}
                                {order.paymentStatus === 'demo_failed' && 'Demo Payment Failed'}
                                {order.paymentStatus === 'demo_pending' && 'Demo Pending'}
                                {['verified', 'received', 'paid'].includes(order.paymentStatus) && 'Verified Paid'}
                                {!['demo_completed', 'demo_failed', 'demo_pending', 'verified', 'received', 'paid'].includes(order.paymentStatus) && `Payment: ${order.paymentStatus}`}
                              </span>
                            </div>
                          </div>

                          {/* Customer Information (Authorized Vendor Access) */}
                          <div className="py-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-600 bg-stone-50/70 px-3 rounded-xl my-3">
                            <span className="font-bold text-stone-900">
                              Customer: {order.customerName || 'Anonymous Attendee'}
                            </span>
                            {order.customerPhone && (
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 hover:underline"
                              >
                                <Phone className="w-3 h-3 text-stone-400" />
                                <span>{order.customerPhone}</span>
                              </a>
                            )}
                            {order.customerEmail && (
                              <a
                                href={`mailto:${order.customerEmail}`}
                                className="flex items-center gap-1 text-stone-600 hover:text-stone-900 hover:underline"
                              >
                                <Mail className="w-3 h-3 text-stone-400" />
                                <span>{order.customerEmail}</span>
                              </a>
                            )}
                          </div>

                          {/* Line Items List */}
                          <div className="space-y-1.5 mb-3">
                            <div className="text-[11px] font-black uppercase tracking-wider text-stone-400">
                              Ordered Items ({order.items.reduce((s, it) => s + it.quantity, 0)} total)
                            </div>
                            <div className="divide-y divide-stone-100">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-stone-900 w-6 text-right">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-semibold text-stone-800">
                                      {item.dishName}
                                    </span>
                                    {item.category && (
                                      <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono font-bold text-stone-800">
                                    ₹{item.itemTotal || item.price * item.quantity}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total and Safeguard Notices */}
                          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 text-xs">
                              {/* Cancellation Details */}
                              {isCancelled && (
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-0.5">
                                  <div className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Order Cancelled</span>
                                    {order.cancelledAt && (
                                      <span className="text-[10px] text-rose-700 font-normal">
                                        ({new Date(order.cancelledAt).toLocaleString()})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-rose-800 text-[11px]">
                                    Reason: <span className="font-semibold">{order.cancellationReason || 'Cancelled by vendor / customer'}</span>
                                  </p>
                                  <p className="text-[10px] text-rose-700 font-medium">
                                    Stock was restored to stall inventory upon cancellation.
                                  </p>
                                </div>
                              )}

                              {/* Demo Failure Reason */}
                              {order.paymentStatus === 'demo_failed' && !isCancelled && (
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-0.5">
                                  <div className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Demo Payment Failed:</span>
                                    <span className="font-semibold">{order.demoFailureReason || 'Card declined or timeout'}</span>
                                  </div>
                                  <p className="text-[10px] text-rose-700">
                                    Handover blocked. Customer may re-test demo payment from their order confirmation page.
                                  </p>
                                </div>
                              )}

                              {/* Handover Safeguard Info */}
                              {isHandoverBlocked && order.paymentStatus !== 'demo_failed' && (
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1.5 text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Handover Safeguard Active: Payment must complete before food pickup.</span>
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                Total Amount
                              </span>
                              <span className="text-lg font-black text-stone-900">
                                ₹{order.totalAmount}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
                  <span>
                    Showing {filteredOrders.length} of {stallOrders.length} order(s) for this stall
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectingStallOrders(null)}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-black cursor-pointer shadow-2xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
