export type Role = 'customer' | 'vendor' | 'ngo' | 'admin';

export type BusinessType = 'Restaurant' | 'College Canteen' | 'College Fest Stall';

export interface TasteProfile {
  favoriteCuisines: string[];
  dietaryRestrictions: string[];
  spiceTolerance: 'mild' | 'medium' | 'hot' | 'extra-hot';
  flavorPreferences: string[]; // e.g. 'savory', 'sweet', 'umami', 'crispy'
  texturePreferences?: string[]; // e.g. 'crispy', 'crunchy', 'creamy', 'chewy', 'tender', 'silky'
  foodsToExplore?: string[]; // e.g. 'Cold Stone Ice Creams', 'Tandoori Dum Biryani'
  isTasteTwinDiscoverable: boolean;
  tasteTwinAlias?: string;
  allowFriendRequests?: boolean;
  allowDirectMessages?: boolean;
  showFlavorPreferences?: boolean;
  showTexturePreferences?: boolean;
  showSpiceTolerance?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  organizationId?: string; // For vendor or NGO
  status?: 'active' | 'suspended';
  verified?: boolean;
  passwordHash?: string;
  salt?: string;
  tasteProfile: TasteProfile;
}


export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  city: string;
  phone: string;
  rating: number;
  ratingCount: number;
  deliveryTime: string;
  priceRange: '₹' | '₹₹' | '₹₹₹';
  image: string;
  description: string;
  tags: string[];
  ownerId: string;
  businessType: BusinessType;
  collegeName?: string;
  stallNumber?: string;
  festTheme?: string;
  upiId?: string; // e.g. merchant@upi
  upiPayeeName?: string; // Merchant Display Name on UPI
}

export interface Dish {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  price: number; // in INR (₹)
  image: string;
  category: string;
  cuisine: string;
  tags: string[];
  dietary: ('Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Halal')[];
  isVegetarian?: boolean;
  rating: number;
  ratingCount: number;
  flavorProfile: string[]; // e.g., ['savory', 'cheesy', 'umami']
  textureProfile?: string[]; // e.g., ['crispy', 'creamy', 'chewy', 'crunchy', 'tender']
  spiceLevel: number; // 0 to 3
  remainingQty?: number; // live available stock from inventory
  isSoldOut?: boolean; // whether remainingQty === 0
  inventoryId?: string;
  batchIdentifier?: string; // Optional batch identifier (e.g. Batch 101, Morning Prep)
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled';
export type PaymentMethod = 'pay_on_pickup' | 'upi' | 'demo';
export type PaymentStatus = 'pending' | 'payment_submitted' | 'verified' | 'failed' | 'pay_on_pickup' | 'received' | 'paid' | 'demo_pending' | 'demo_completed' | 'demo_failed';

export interface OrderItem {
  dishId: string;
  dishName: string;
  image: string;
  price: number; // in INR (₹)
  quantity: number;
  itemTotal: number; // in INR (₹)
  category?: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-83921
  idempotencyKey?: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  businessType?: BusinessType;
  items: OrderItem[];
  subtotal: number; // in INR (₹)
  discount: number; // in INR (₹)
  totalAmount: number; // in INR (₹)
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  pickupNotes?: string;
  estimatedPrepTime?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  // UPI Payment Details
  upiId?: string;
  upiPayeeName?: string;
  upiReference?: string; // 12-digit UTR reference submitted by customer or DEMO-SIM-XXXXXX
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  paymentVerificationNotes?: string;
  // Demo Payment Details (College Expo Mode)
  isDemoPayment?: boolean;
  demoPaymentOutcome?: 'success' | 'failure';
  demoFailureReason?: string;
  demoSimulatedAt?: string;
  // Surplus & Food Rescue Voucher Link
  orderType?: 'standard' | 'surplus_pickup';
  voucherCode?: string;
  reservationId?: string;
  completedAt?: string;
  completedByUserId?: string;
  completedByUserName?: string;
  completedByRole?: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  specialInstructions?: string;
}

export interface InventoryItem {
  id: string;
  restaurantId: string;
  dishId: string;
  dishName: string;
  batchIdentifier?: string; // Optional batch identifier (e.g. Batch 101, Morning Prep)
  description?: string;
  image?: string;
  category: string;
  preparedQty: number;
  soldQty: number;
  reservedQty: number; // Reserved for surplus deals
  donationAllocatedQty?: number; // Allocated to donation listings or requests
  remainingQty: number; // calculated: preparedQty - soldQty - reservedQty - (donationAllocatedQty || 0)
  price: number; // in INR (₹)
  cost: number; // in INR (₹)
  surplusDiscountPrice?: number; // in INR (₹)
  isSurplusEligible?: boolean;
  isDonationEligible?: boolean;
  minSellingPrice?: number; // in INR (₹) - minimum price vendor accepts for surplus
  status: 'in_stock' | 'low_stock' | 'sold_out' | 'paused';
  updatedAt: string;
}

export interface SurplusOffer {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  dishId: string;
  inventoryId?: string;
  title: string;
  description: string;
  image: string;
  originalPrice: number; // in INR (₹)
  discountPrice: number; // in INR (₹)
  discountPercentage: number;
  minSellingPrice?: number; // in INR (₹)
  availableQuantity: number;
  pickupStart: string;
  pickupEnd: string;
  expiryTime?: string;
  status: 'active' | 'sold_out' | 'expired' | 'unreleased';
  isExplicitlyReleased?: boolean;
  suitabilityConfirmed?: boolean;
  dietary: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string;
  voucherCode: string;
  userId: string;
  userName: string;
  surplusOfferId: string;
  restaurantName: string;
  restaurantAddress: string;
  dishTitle: string;
  quantity: number;
  totalPrice: number; // in INR (₹)
  pickupEnd: string;
  status: 'reserved' | 'picked_up' | 'cancelled';
  reservedAt: string;
  pickedUpAt?: string;
  confirmedByUserId?: string;
  confirmedByUserName?: string;
  orderId?: string;
}

export type DonationStatus = 
  | 'available' 
  | 'requested' 
  | 'approved' 
  | 'ready_for_pickup' 
  | 'collected' 
  | 'cancelled' 
  | 'rejected'
  | 'claimed' 
  | 'in_transit' 
  | 'completed'; // Backward-compatible aliases

export interface DonationOffer {
  id: string;
  inventoryId?: string;
  dishId?: string;
  dishName: string;
  batchIdentifier?: string; // Batch identifier associated with the donated inventory item
  description: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  pickupLocation: string; // Specific location (e.g. Back door kitchen entrance)
  prepTime?: string; // e.g. "Today 6:00 PM"
  pickupDeadline: string; // e.g. "Today before 22:30"
  handlingNotes?: string; // e.g. "Chilled under 4°C, packaged in food-grade foil containers"
  confirmedSuitable: boolean; // Vendor verified food is safe and suitable
  initialQuantity: number; // Original portions offered
  availableQuantity: number; // Portions remaining available for request
  allocatedQuantity: number; // Portions allocated to NGO requests
  collectedQuantity: number; // Portions collected
  quantityPortions: number; // Total / current portions
  dietaryInfo: string[];
  image?: string;
  status: DonationStatus;
  claimedByNGOId?: string;
  claimedByNGOName?: string;
  claimedByVolunteerName?: string;
  claimedAt?: string;
  readyAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  notes?: string;
  requestsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DonationRequest {
  id: string;
  donationId: string;
  inventoryId?: string;
  dishId?: string;
  dishName: string;
  batchIdentifier?: string; // Batch identifier for clear NGO and volunteer traceability
  restaurantId: string;
  restaurantName: string;
  pickupLocation: string;
  pickupDeadline: string;
  ngoId: string;
  ngoName: string;
  volunteerName: string;
  volunteerPhone?: string;
  requestedQuantity: number;
  status: DonationStatus; // 'requested' | 'approved' | 'ready_for_pickup' | 'collected' | 'cancelled' | 'rejected'
  notes?: string;
  handlingNotes?: string;
  prepTime?: string;
  createdAt: string;
  approvedAt?: string;
  readyAt?: string;
  collectedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface DishRating {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reviewerTasteProfile?: TasteProfile;
  similarityScore?: number; // 0-100% computed relative to current viewer
  isTasteTwin?: boolean;
  dishId: string;
  dishName: string;
  restaurantId: string;
  rating: number; // 1 to 5
  reviewText: string;
  tasteTags: string[];
  createdAt: string;
}

export interface DishReviewsResponse {
  dish: Dish;
  reviews: DishRating[];
  reviewsFromPeopleLikeYou: DishRating[];
  averageRating: number;
  totalCount: number;
}


export interface Recommendation {
  dish: Dish;
  score: number;
  matchReasons: string[];
  explanation: string;
}

export interface TasteTwin {
  user: {
    id: string;
    displayName: string;
    avatar: string;
    favoriteCuisines: string[];
    sharedDietary: string[];
    flavorPreferences?: string[];
    texturePreferences?: string[];
    spiceTolerance?: string;
  };
  similarityPercentage: number;
  matchReason: string;
  hasSufficientData?: boolean;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  requestId?: string;
  sharedFavoriteDishes: {
    dishName: string;
    dishImage: string;
    rating: number;
  }[];
  recommendedForYouFromTwin: {
    dishId: string;
    dishName: string;
    restaurantName: string;
    twinRating: number;
  }[];
  twinReviews?: {
    id: string;
    dishId: string;
    dishName: string;
    restaurantName: string;
    rating: number;
    reviewText: string;
    tasteTags: string[];
    createdAt: string;
  }[];
}

export interface FoodieRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderAlias?: string;
  senderCuisines?: string[];
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface FoodieConnection {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    tasteTwinAlias?: string;
    favoriteCuisines: string[];
    similarityPercentage?: number;
  };
  connectedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ConversationSummary {
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    tasteTwinAlias?: string;
  };
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface ImpactStats {
  totalMealsRescued: number; // combined total: surplus meals + donated portions
  surplusMealsRescued: number; // meals sold through surplus discounts/reservations
  donationsCompleted: number; // completed collections count
  donatedPortions: number; // meals donated and collected
  totalFoodWeightKg: number; // verified portion weight (total meals * 0.42 kg)
  co2eAvoidedKg: number; // 2.5 kg CO2e per kg food waste avoided
  dollarsSavedByCommunity: number; // in INR (₹)
  activeNGOsCount: number;
  participatingRestaurantsCount: number;
}

export interface VerificationRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  entityType: 'restaurant' | 'canteen' | 'fest_stall' | 'ngo';
  applicantName: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface PlatformReport {
  id: string;
  reportedBy: string;
  reporterName: string;
  targetType: 'dish' | 'restaurant' | 'stall' | 'user' | 'donation';
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolutionNotes?: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeVendors: number;
  verifiedNGOs: number;
  totalListings: number;
  activeSurplusDeals: number;
  totalDonations: number;
  pendingVerifications: number;
  openReports: number;
  totalCommunitySavingsInRupees: number;
  totalMealsRescued: number;
}
