import { 
  User, Restaurant, Dish, InventoryItem, SurplusOffer, 
  Reservation, DonationOffer, DonationRequest, DonationStatus, DishRating, Recommendation, 
  TasteTwin, ImpactStats, Role, BusinessType,
  VerificationRequest, PlatformReport, AdminOverviewStats,
  Order, OrderItem, OrderStatus, PaymentMethod,
  TasteProfile, DishReviewsResponse,
  FoodieRequest, FoodieConnection, DirectMessage, ConversationSummary
} from '../types';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('tastely_user_id');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth & System
  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return data.user;
  },

  async switchDemoUser(role: Role): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('Failed to switch demo user');
    const data = await res.json();
    localStorage.setItem('tastely_user_id', data.user.id);
    return data.user;
  },

  async login(credentials: { email: string; password: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sign in. Please check your credentials.');
    }
    const data = await res.json();
    localStorage.setItem('tastely_user_id', data.user.id);
    return data.user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('tastely_user_id');
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
  },

  async registerUser(userData: {
    name: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    role: Role;
    businessType?: BusinessType;
    organizationName?: string;
    collegeName?: string;
    stallNumber?: string;
    festTheme?: string;
    dietaryRestrictions?: string[];
    favoriteCuisines?: string[];
    spiceTolerance?: string;
  }): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    const data = await res.json();
    localStorage.setItem('tastely_user_id', data.user.id);
    return data.user;
  },

  async updateTasteProfile(profileData: Partial<User['tasteProfile']>): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/taste-profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader() 
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error('Failed to update taste profile');
    const data = await res.json();
    return data.user;
  },

  async getStorageStatus(): Promise<{ status: string; storageEngine: string; dbFilePath: string; persisted: boolean }> {
    const res = await fetch(`${BASE_URL}/system/storage-status`);
    return await res.json();
  },

  // Vendor Profile & Business Type
  async getVendorProfile(): Promise<Restaurant> {
    const res = await fetch(`${BASE_URL}/vendor/profile`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load vendor profile');
    const data = await res.json();
    return data.restaurant;
  },

  async updateVendorProfile(data: Partial<Restaurant>): Promise<{ success: boolean; restaurant: Restaurant; message: string }> {
    const res = await fetch(`${BASE_URL}/vendor/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update vendor profile');
    }
    return await res.json();
  },

  async updateVendorBusinessType(data: {
    businessType: BusinessType;
    collegeName?: string;
    stallNumber?: string;
    restaurantName?: string;
  }): Promise<{ success: boolean; restaurant: Restaurant }> {
    const res = await fetch(`${BASE_URL}/vendor/business-type`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update business type');
    }
    return await res.json();
  },

  async getVendorPaymentSettings(): Promise<{
    restaurantId: string;
    restaurantName: string;
    upiId: string;
    upiPayeeName: string;
    businessType: string;
  }> {
    const res = await fetch(`${BASE_URL}/vendor/payment-settings`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch vendor payment settings');
    }
    return await res.json();
  },

  async updateVendorPaymentSettings(settings: {
    upiId: string;
    upiPayeeName: string;
  }): Promise<{
    success: boolean;
    message: string;
    settings: {
      restaurantId: string;
      restaurantName: string;
      upiId: string;
      upiPayeeName: string;
    };
  }> {
    const res = await fetch(`${BASE_URL}/vendor/payment-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update UPI payment settings');
    }
    return await res.json();
  },

  // Restaurants & Dishes
  async getRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${BASE_URL}/restaurants`);
    const data = await res.json();
    return data.restaurants;
  },

  async getDishes(params?: { category?: string; search?: string; dietary?: string; businessType?: string }): Promise<Dish[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.dietary) query.append('dietary', params.dietary);
    if (params?.businessType) query.append('businessType', params.businessType);

    const res = await fetch(`${BASE_URL}/dishes?${query.toString()}`);
    const data = await res.json();
    return data.dishes;
  },

  // Inventory Management
  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load inventory');
    const data = await res.json();
    return data.inventory;
  },

  async createInventoryItem(item: {
    dishName: string;
    batchIdentifier?: string;
    description?: string;
    category: string;
    image?: string;
    price: number;
    cost?: number;
    preparedQty: number;
    remainingQty?: number;
    surplusDiscountPrice?: number;
    isSurplusEligible?: boolean;
    isDonationEligible?: boolean;
    restaurantName?: string;
    location?: string;
    discountPercentage?: number;
    offerExpiryTime?: string;
  }): Promise<{ item: InventoryItem; dish: Dish }> {
    const res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(item)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create inventory item');
    }
    return await res.json();
  },

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update inventory item');
    }
    const data = await res.json();
    return data.item;
  },

  async deleteInventoryItem(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete listing');
    }
    return await res.json();
  },

  async markItemSoldOut(id: string): Promise<{ success: boolean; item: InventoryItem }> {
    const res = await fetch(`${BASE_URL}/inventory/${id}/mark-sold-out`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to mark sold out');
    }
    return await res.json();
  },

  async quickSurplusDiscount(id: string, data: {
    surplusPrice: number;
    surplusQty?: number;
    pickupEnd?: string;
  }): Promise<{ success: boolean; offer: SurplusOffer; item: InventoryItem }> {
    const res = await fetch(`${BASE_URL}/inventory/${id}/surplus-discount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to set surplus discount');
    }
    return await res.json();
  },

  async quickDonationMark(id: string, data: {
    donationPortions: number;
    notes?: string;
    pickupDeadline?: string;
  }): Promise<{ success: boolean; donation: DonationOffer; item: InventoryItem }> {
    const res = await fetch(`${BASE_URL}/inventory/${id}/donation-mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to mark donation');
    }
    return await res.json();
  },

  // Surplus Offers
  async getSurplusOffers(): Promise<SurplusOffer[]> {
    const res = await fetch(`${BASE_URL}/surplus`);
    const data = await res.json();
    return data.offers;
  },

  async getAllSurplusOffers(): Promise<SurplusOffer[]> {
    const res = await fetch(`${BASE_URL}/surplus?includeAll=true`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    return data.offers;
  },

  async releaseSurplusDeal(data: {
    inventoryId: string;
    surplusQty: number;
    surplusPrice?: number;
    discountPercentage?: number;
    expiryTime: string;
    suitabilityConfirmed: boolean;
  }): Promise<{ success: boolean; offer: SurplusOffer; item: InventoryItem }> {
    const res = await fetch(`${BASE_URL}/surplus/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to release surplus deal');
    }
    return await res.json();
  },

  async unpublishSurplusDeal(offerId: string): Promise<{ success: boolean; offer: SurplusOffer; item?: InventoryItem }> {
    const res = await fetch(`${BASE_URL}/surplus/${offerId}/unpublish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to unpublish surplus deal');
    }
    return await res.json();
  },

  async createSurplusOffer(offerData: {
    dishId?: string;
    title: string;
    description: string;
    originalPrice: number;
    discountPrice: number;
    availableQuantity: number;
    pickupStart: string;
    pickupEnd: string;
  }): Promise<SurplusOffer> {
    const res = await fetch(`${BASE_URL}/surplus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(offerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create surplus offer');
    }
    const data = await res.json();
    return data.offer;
  },

  async reserveSurplusOffer(id: string, quantity: number = 1): Promise<{ success: boolean; reservation: Reservation }> {
    const res = await fetch(`${BASE_URL}/surplus/${id}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Reservation failed');
    }
    return await res.json();
  },

  async getMyReservations(): Promise<Reservation[]> {
    const res = await fetch(`${BASE_URL}/reservations`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch reservations');
    }
    const data = await res.json();
    return data.reservations || [];
  },

  async getVendorReservations(params?: { status?: string; search?: string }): Promise<Reservation[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${BASE_URL}/vendor/reservations${query}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch vendor surplus reservations');
    }
    const data = await res.json();
    return data.reservations || [];
  },

  async verifyVoucher(voucherCode: string): Promise<{
    success: boolean;
    valid: boolean;
    voucherCode: string;
    reservation: Reservation;
    order: Order;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/reservations/verify-voucher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ voucherCode })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to verify voucher');
    }
    return await res.json();
  },

  async confirmHandover(data: { voucherCode?: string; reservationId?: string }): Promise<{
    success: boolean;
    reservation: Reservation;
    order: Order;
    message: string;
    alreadyConfirmed?: boolean;
  }> {
    const res = await fetch(`${BASE_URL}/reservations/confirm-handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm food handover');
    }
    return await res.json();
  },

  async confirmReservationPickup(reservationIdOrVoucher: string, voucherCode?: string): Promise<{
    success: boolean;
    reservation: Reservation;
    order?: Order;
    message: string;
    alreadyConfirmed?: boolean;
  }> {
    const res = await fetch(`${BASE_URL}/reservations/${encodeURIComponent(reservationIdOrVoucher)}/confirm-pickup`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ voucherCode })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm reservation pickup');
    }
    return await res.json();
  },

  // Customer Orders & Vendor Fulfillment
  async createOrder(orderData: {
    restaurantId: string;
    items: { dishId: string; quantity: number; specialInstructions?: string }[];
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    pickupNotes?: string;
    paymentMethod?: PaymentMethod;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; order: Order; message: string; duplicatePrevented?: boolean }> {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }
    return await res.json();
  },

  async getOrders(params?: { status?: string; restaurantId?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.restaurantId) query.append('restaurantId', params.restaurantId);

    const res = await fetch(`${BASE_URL}/orders?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch orders');
    }
    const data = await res.json();
    return data.orders || [];
  },

  async getOrderById(orderId: string): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch order details');
    }
    const data = await res.json();
    return data.order;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, cancellationReason?: string): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, cancellationReason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update order status');
    }
    return await res.json();
  },

  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel order');
    }
    return await res.json();
  },

  async submitOrderUtr(orderId: string, upiReference: string, notes?: string): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/submit-utr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ upiReference, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit UPI reference');
    }
    return await res.json();
  },

  async verifyOrderPayment(orderId: string, status: 'verified' | 'failed' | 'received', notes?: string): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/verify-payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, verificationNotes: notes, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to verify order payment');
    }
    return await res.json();
  },

  async recordPaymentReceived(orderId: string, notes?: string): Promise<{ success: boolean; order: Order; message: string }> {
    return this.verifyOrderPayment(orderId, 'verified', notes || 'In-person payment recorded as received by vendor');
  },

  async simulateDemoPayment(orderId: string, outcome: 'success' | 'failure', failureReason?: string): Promise<{ success: boolean; order: Order; message: string }> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ outcome, failureReason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to simulate demo payment');
    }
    return await res.json();
  },

  // Donations & Food Rescue
  async getDonations(params?: { restaurantId?: string; status?: string }): Promise<DonationOffer[]> {
    try {
      const query = new URLSearchParams();
      if (params?.restaurantId) query.set('restaurantId', params.restaurantId);
      if (params?.status) query.set('status', params.status);
      const queryString = query.toString() ? `?${query.toString()}` : '';

      const res = await fetch(`${BASE_URL}/donations${queryString}`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) {
        console.warn('Failed to fetch donations, status:', res.status);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data.donations) ? data.donations : [];
    } catch (err) {
      console.error('Error in getDonations:', err);
      return [];
    }
  },

  async getDonationById(id: string): Promise<{ donation: DonationOffer; requests: DonationRequest[] }> {
    const res = await fetch(`${BASE_URL}/donations/${id}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch donation details');
    return await res.json();
  },

  async createDonationListing(data: {
    inventoryId?: string;
    dishId?: string;
    quantity: number;
    pickupDeadline: string;
    pickupLocation?: string;
    prepTime?: string;
    handlingNotes?: string;
    confirmedSuitable: boolean;
  }): Promise<{ success: boolean; donation: DonationOffer; remainingStock: number; message: string }> {
    const res = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to publish donation listing');
    }
    return await res.json();
  },

  async updateDonationListing(id: string, updates: {
    pickupDeadline?: string;
    pickupLocation?: string;
    prepTime?: string;
    handlingNotes?: string;
  }): Promise<{ success: boolean; donation: DonationOffer; message: string }> {
    const res = await fetch(`${BASE_URL}/donations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update donation listing');
    }
    return await res.json();
  },

  async cancelDonationListing(id: string, reason?: string): Promise<{
    success: boolean;
    donation: DonationOffer;
    restoredPortions: number;
    remainingStock: number;
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/donations/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to cancel donation listing');
    }
    return await res.json();
  },

  async requestDonation(id: string, data: {
    requestedQuantity: number;
    volunteerName?: string;
    volunteerPhone?: string;
    notes?: string;
  }): Promise<{ success: boolean; request: DonationRequest; remainingAvailable: number; message: string }> {
    const res = await fetch(`${BASE_URL}/donations/${id}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit donation request');
    }
    return await res.json();
  },

  async getNGORequests(): Promise<DonationRequest[]> {
    const res = await fetch(`${BASE_URL}/ngo/requests`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load NGO requests');
    const data = await res.json();
    return data.requests;
  },

  async getVendorDonationRequests(): Promise<DonationRequest[]> {
    const res = await fetch(`${BASE_URL}/vendor/donation-requests`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to load vendor donation requests');
    const data = await res.json();
    return data.requests;
  },

  async approveDonationRequest(id: string): Promise<{ success: boolean; request: DonationRequest; message: string }> {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve donation request');
    }
    return await res.json();
  },

  async rejectDonationRequest(id: string, reason?: string): Promise<{ success: boolean; request: DonationRequest; message: string }> {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reject donation request');
    }
    return await res.json();
  },

  async markDonationReadyForPickup(id: string): Promise<{ success: boolean; request: DonationRequest; message: string }> {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}/ready-for-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to mark ready for pickup');
    }
    return await res.json();
  },

  async confirmDonationCollection(id: string): Promise<{ success: boolean; request: DonationRequest; message: string }> {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm donation collection');
    }
    return await res.json();
  },

  async cancelDonationRequest(id: string, reason?: string): Promise<{ success: boolean; request: DonationRequest; message: string }> {
    const res = await fetch(`${BASE_URL}/donation-requests/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to cancel donation request');
    }
    return await res.json();
  },

  async getClosingTimeCheck(): Promise<{
    closingTimePrompt: boolean;
    unsoldItemsCount: number;
    totalUnsoldPortions: number;
    unsoldItems: any[];
    message: string;
  }> {
    const res = await fetch(`${BASE_URL}/vendor/closing-time-check`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to check closing time inventory');
    return await res.json();
  },

  // Legacy wrappers for backward compatibility
  async createDonation(donationData: {
    dishName: string;
    description: string;
    quantityPortions: number;
    dietaryInfo: string[];
    pickupDeadline: string;
  }): Promise<DonationOffer> {
    const res = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        ...donationData,
        quantity: donationData.quantityPortions,
        confirmedSuitable: true
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create donation');
    }
    const data = await res.json();
    return data.donation;
  },

  async claimDonation(id: string, details: { volunteerName: string; notes?: string }): Promise<DonationOffer> {
    const res = await fetch(`${BASE_URL}/donations/${id}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(details)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to claim donation');
    }
    const data = await res.json();
    return data.donation;
  },

  async confirmDonationPickup(id: string): Promise<DonationOffer> {
    const res = await fetch(`${BASE_URL}/donations/${id}/pickup`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm pickup');
    }
    const data = await res.json();
    return data.donation;
  },

  // Ratings & Recommendations
  async submitRating(ratingData: {
    dishId: string;
    rating: number;
    reviewText: string;
    tasteTags?: string[];
  }): Promise<{ rating: DishRating; dishUpdatedRating: number }> {
    const res = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(ratingData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit rating');
    }
    return await res.json();
  },

  async getDishReviews(dishId: string): Promise<DishReviewsResponse> {
    const res = await fetch(`${BASE_URL}/dishes/${dishId}/reviews`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch dish reviews');
    }
    return await res.json();
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const res = await fetch(`${BASE_URL}/recommendations`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    return data.recommendations;
  },

  async getTasteTwins(): Promise<TasteTwin[]> {
    const res = await fetch(`${BASE_URL}/taste-twins`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    return data.twins || [];
  },

  async sendFriendRequest(targetUserId: string): Promise<FoodieRequest> {
    const res = await fetch(`${BASE_URL}/taste-twins/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ targetUserId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send connection request');
    }
    const data = await res.json();
    return data.request;
  },

  async acceptFriendRequest(requestId: string): Promise<FoodieRequest> {
    const res = await fetch(`${BASE_URL}/taste-twins/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to accept connection request');
    }
    const data = await res.json();
    return data.request;
  },

  async declineFriendRequest(requestId: string): Promise<FoodieRequest> {
    const res = await fetch(`${BASE_URL}/taste-twins/requests/${requestId}/decline`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to decline connection request');
    }
    const data = await res.json();
    return data.request;
  },

  async cancelFriendRequest(requestId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/taste-twins/requests/${requestId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel request');
    }
  },

  async getFoodieConnections(): Promise<{ connections: FoodieConnection[]; pendingReceived: FoodieRequest[]; pendingSent: FoodieRequest[] }> {
    const res = await fetch(`${BASE_URL}/taste-twins/connections`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch connections');
    }
    return res.json();
  },

  async getConversations(): Promise<ConversationSummary[]> {
    const res = await fetch(`${BASE_URL}/taste-twins/conversations`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch conversations');
    }
    const data = await res.json();
    return data.conversations || [];
  },

  async getConversationMessages(otherUserId: string): Promise<DirectMessage[]> {
    const res = await fetch(`${BASE_URL}/taste-twins/conversations/${otherUserId}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch messages');
    }
    const data = await res.json();
    return data.messages || [];
  },

  async sendMessage(receiverId: string, text: string): Promise<DirectMessage> {
    const res = await fetch(`${BASE_URL}/taste-twins/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ receiverId, text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send message');
    }
    const data = await res.json();
    return data.message;
  },

  // Impact
  async getImpactStats(): Promise<ImpactStats> {
    const res = await fetch(`${BASE_URL}/impact?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        ...getAuthHeader()
      }
    });
    const data = await res.json();
    return data.stats;
  },

  // Record Sale
  async recordSale(id: string, quantity: number = 1): Promise<{ success: boolean; item: InventoryItem; message: string }> {
    const res = await fetch(`${BASE_URL}/inventory/${id}/record-sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record sale');
    }
    return await res.json();
  },

  // Stalls Hub
  async getStalls(): Promise<{ stalls: any[] }> {
    const res = await fetch(`${BASE_URL}/stalls`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Failed to load college fest stalls (HTTP ${res.status})` }));
      throw new Error(err.error || 'Failed to load college fest stalls');
    }
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('Server returned unexpected non-JSON response while fetching stalls');
    }
    return await res.json();
  },

  async registerStall(stallData: {
    name: string;
    collegeName: string;
    stallNumber?: string;
    festTheme?: string;
    cuisine?: string;
    description?: string;
    image?: string;
  }): Promise<{ success: boolean; stall: Restaurant }> {
    const res = await fetch(`${BASE_URL}/stalls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(stallData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register fest stall');
    }
    return await res.json();
  },

  async updateStall(stallId: string, stallData: {
    name?: string;
    collegeName?: string;
    stallNumber?: string;
    festTheme?: string;
    cuisine?: string;
    description?: string;
    image?: string;
    deliveryTime?: string;
    upiId?: string;
    upiPayeeName?: string;
  }): Promise<{ success: boolean; stall: Restaurant; message: string }> {
    const res = await fetch(`${BASE_URL}/stalls/${encodeURIComponent(stallId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(stallData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update fest stall');
    }
    return await res.json();
  },

  async addStallDish(stallId: string, dishData: {
    name: string;
    description?: string;
    price: number;
    preparedQty: number;
    image?: string;
    category?: string;
  }): Promise<{ success: boolean; dish: Dish; inventory: InventoryItem }> {
    const res = await fetch(`${BASE_URL}/stalls/${encodeURIComponent(stallId)}/dishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(dishData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add dish to fest stall');
    }
    return await res.json();
  },

  async updateStallDish(stallId: string, dishId: string, dishData: {
    name?: string;
    description?: string;
    price?: number;
    preparedQty?: number;
    remainingQty?: number;
    image?: string;
    category?: string;
  }): Promise<{ success: boolean; dish: Dish; inventory?: InventoryItem; message: string }> {
    const res = await fetch(`${BASE_URL}/stalls/${encodeURIComponent(stallId)}/dishes/${encodeURIComponent(dishId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(dishData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update fest stall dish');
    }
    return await res.json();
  },

  async updateDish(dishId: string, dishData: {
    name?: string;
    description?: string;
    price?: number;
    preparedQty?: number;
    remainingQty?: number;
    image?: string;
    category?: string;
  }): Promise<{ success: boolean; dish: Dish; inventory?: InventoryItem; message: string }> {
    const res = await fetch(`${BASE_URL}/dishes/${encodeURIComponent(dishId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(dishData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update dish');
    }
    return await res.json();
  },

  // Admin APIs (Admin role only)
  async getAdminOverview(): Promise<{ stats: AdminOverviewStats }> {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch admin overview');
    }
    return await res.json();
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch admin users');
    }
    return await res.json();
  },

  async updateUserRole(userId: string, role: Role): Promise<{ success: boolean; user: User; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user role');
    }
    return await res.json();
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<{ success: boolean; user: User; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user status');
    }
    return await res.json();
  },

  async getAdminVerifications(): Promise<{ verifications: VerificationRequest[] }> {
    const res = await fetch(`${BASE_URL}/admin/verifications`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch verifications');
    }
    return await res.json();
  },

  async reviewVerification(id: string, status: 'verified' | 'rejected', notes?: string): Promise<{ success: boolean; verification: VerificationRequest; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/verifications/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to review verification application');
    }
    return await res.json();
  },

  async getAdminListings(): Promise<{ dishes: Dish[]; inventory: InventoryItem[]; surplusOffers: SurplusOffer[] }> {
    const res = await fetch(`${BASE_URL}/admin/listings`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch listings');
    }
    return await res.json();
  },

  async deleteListingAsAdmin(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/listings/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove listing');
    }
    return await res.json();
  },

  async getAdminReports(): Promise<{ reports: PlatformReport[] }> {
    const res = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch reports');
    }
    return await res.json();
  },

  async resolveReport(id: string, status: 'investigating' | 'resolved' | 'dismissed', resolutionNotes?: string): Promise<{ success: boolean; report: PlatformReport; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/reports/${id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status, resolutionNotes })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resolve report');
    }
    return await res.json();
  }
};
