import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Store, HeartHandshake, UtensilsCrossed, 
  AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw, 
  SlidersHorizontal, Sparkles, Clock, MapPin, Tag, 
  Trash2, ShieldCheck, FileText, ChevronRight, Check,
  BarChart3, Eye, Ban, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, VerificationRequest, PlatformReport, 
  AdminOverviewStats, Role, Dish, InventoryItem, SurplusOffer 
} from '../types';
import confetti from 'canvas-confetti';

export const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verifications' | 'listings' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [listings, setListings] = useState<{ dishes: Dish[]; inventory: InventoryItem[]; surplusOffers: SurplusOffer[] }>({
    dishes: [],
    inventory: [],
    surplusOffers: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [listingSearch, setListingSearch] = useState('');

  // Action states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setErrorNotice('');

      const [overviewData, usersData, verifsData, reportsData, listingsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminVerifications(),
        api.getAdminReports(),
        api.getAdminListings()
      ]);

      setStats(overviewData.stats);
      setUsers(usersData.users);
      setVerifications(verifsData.verifications);
      setReports(reportsData.reports);
      setListings(listingsData);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to load administrative data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      setIsProcessing(true);
      setErrorNotice('');
      const res = await api.updateUserRole(userId, newRole);
      setSuccessNotice(`Updated role for ${res.user.name} to ${newRole.toUpperCase()}`);
      setTimeout(() => setSuccessNotice(''), 3000);
      await loadAdminData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update user role');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus?: string) => {
    try {
      setIsProcessing(true);
      setErrorNotice('');
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const res = await api.updateUserStatus(userId, newStatus);
      setSuccessNotice(`User account marked as ${newStatus}`);
      setTimeout(() => setSuccessNotice(''), 3000);
      await loadAdminData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewVerification = async (id: string, status: 'verified' | 'rejected') => {
    try {
      setIsProcessing(true);
      setErrorNotice('');
      await api.reviewVerification(id, status, actionNotes || undefined);
      
      if (status === 'verified') {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      setSuccessNotice(`Application marked as ${status.toUpperCase()}`);
      setActionNotes('');
      setTimeout(() => setSuccessNotice(''), 3000);
      await loadAdminData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to review verification application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteListing = async (id: string, dishName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${dishName}" from the platform? This cannot be undone.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrorNotice('');
      await api.deleteListingAsAdmin(id);
      setSuccessNotice(`Removed listing "${dishName}" from platform.`);
      setTimeout(() => setSuccessNotice(''), 3000);
      await loadAdminData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to remove listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveReport = async (id: string, status: 'investigating' | 'resolved' | 'dismissed') => {
    try {
      setIsProcessing(true);
      setErrorNotice('');
      await api.resolveReport(id, status, actionNotes || `Status updated to ${status} by administrator.`);
      setSuccessNotice(`Report marked as ${status}`);
      setActionNotes('');
      setTimeout(() => setSuccessNotice(''), 3000);
      await loadAdminData();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to resolve report');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const matchesQuery = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                         u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesQuery && matchesRole;
  });

  const filteredVerifications = verifications.filter(v => {
    if (verificationFilter === 'all') return true;
    return v.status === verificationFilter;
  });

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  const filteredDishes = listings.dishes.filter(d => {
    return d.name.toLowerCase().includes(listingSearch.toLowerCase()) || 
           d.restaurantName.toLowerCase().includes(listingSearch.toLowerCase()) ||
           d.category.toLowerCase().includes(listingSearch.toLowerCase());
  });

  return (
    <div className="py-8 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
              Authorized Administrator Access
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">
              Platform Administration
            </h1>
            <p className="text-sm md:text-base text-stone-600 max-w-2xl mt-1.5">
              Secure governance dashboard for Tastely. Manage user access, verify food vendors and NGOs, audit live menu listings, and review safety reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={isLoading || isProcessing}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
              title="Refresh administration data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>
          </div>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}
        {successNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Primary Admin Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-stone-200 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Platform Impact & Overview', icon: <BarChart3 className="w-4 h-4 text-indigo-600" /> },
            { id: 'users', label: `Users (${users.length})`, icon: <Users className="w-4 h-4 text-emerald-600" /> },
            { id: 'verifications', label: `Verifications (${verifications.filter(v => v.status === 'pending').length} Pending)`, icon: <ShieldCheck className="w-4 h-4 text-amber-600" /> },
            { id: 'listings', label: `Food Listings (${listings.dishes.length})`, icon: <UtensilsCrossed className="w-4 h-4 text-orange-600" /> },
            { id: 'reports', label: `Reports (${reports.filter(r => r.status === 'open').length} Open)`, icon: <AlertTriangle className="w-4 h-4 text-rose-600" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Registered Users</div>
                <div className="text-3xl font-black text-stone-900 mt-1">{stats.totalUsers}</div>
                <div className="text-[11px] text-stone-500 mt-1">Across Customers, Vendors & NGOs</div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Active Food Partners</div>
                <div className="text-3xl font-black text-orange-600 mt-1">{stats.activeVendors}</div>
                <div className="text-[11px] text-stone-500 mt-1">Restaurants, Canteens & Stalls</div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Verified NGOs</div>
                <div className="text-3xl font-black text-rose-600 mt-1">{stats.verifiedNGOs}</div>
                <div className="text-[11px] text-stone-500 mt-1">Certified Food Rescue Teams</div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs">
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Rescued Meals</div>
                <div className="text-3xl font-black text-emerald-600 mt-1">{stats.totalMealsRescued}</div>
                <div className="text-[11px] text-stone-500 mt-1">Surplus packs & community meals</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-2xs col-span-2">
                <h3 className="text-base font-black text-stone-900 mb-2">Platform Economic & Eco Impact</h3>
                <p className="text-xs text-stone-600 mb-6">
                  Real-time aggregation of food waste mitigation across partner kitchens and university fest grounds.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 uppercase">Community Savings</span>
                    <div className="text-2xl font-black text-amber-950 mt-1">
                      ₹{stats.totalCommunitySavingsInRupees.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">Saved on surplus dinner offers</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase">Pending Verifications</span>
                    <div className="text-2xl font-black text-emerald-950 mt-1">
                      {stats.pendingVerifications} Requests
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-1">Requires admin compliance review</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-900 uppercase">Open Safety Reports</span>
                    <div className="text-2xl font-black text-rose-950 mt-1">
                      {stats.openReports} Reports
                    </div>
                    <p className="text-[11px] text-rose-800 mt-1">Allergen & quality alerts</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-700/80 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                    <Shield className="w-3 h-3" /> System Governance
                  </div>
                  <h4 className="text-lg font-black tracking-tight">Administrative Controls</h4>
                  <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                    Protect customers and maintain high standards by auditing stalls, reviewing hygiene licenses, and monitoring verified volunteer pickups.
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => setActiveTab('verifications')}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>Review Pending Stalls & NGOs</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>Inspect Safety Reports</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap">Filter Role:</span>
                {['all', 'customer', 'vendor', 'ngo', 'admin'].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                      userRoleFilter === r
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Preferences / Alias</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200"
                            />
                            <div>
                              <div className="font-bold text-stone-900">{u.name}</div>
                              <div className="text-[11px] text-stone-500">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            disabled={isProcessing}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : u.role === 'vendor'
                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                : u.role === 'ngo'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <option value="customer">CUSTOMER</option>
                            <option value="vendor">VENDOR</option>
                            <option value="ngo">NGO VOLUNTEER</option>
                            <option value="admin">ADMINISTRATOR</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'suspended' ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                            {u.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-stone-600">
                          <span className="text-[11px] font-semibold">
                            {u.tasteProfile?.tasteTwinAlias || (u.tasteProfile?.favoriteCuisines?.slice(0, 2).join(', ') || 'Standard')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleStatusToggle(u.id, u.status)}
                            disabled={isProcessing || u.id === user?.id}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              u.status === 'suspended'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                            title={u.id === user?.id ? 'Cannot suspend self' : 'Toggle account access status'}
                          >
                            {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'verified', label: 'Verified Partners' },
                { id: 'rejected', label: 'Rejected' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setVerificationFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    verificationFilter === f.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Verifications List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVerifications.map(v => (
                <div key={v.id} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 mb-1.5">
                        {v.entityType === 'fest_stall' ? 'Fest Food Stall' : v.entityType.toUpperCase()}
                      </div>
                      <h3 className="text-base font-black text-stone-900">{v.organizationName}</h3>
                      <p className="text-xs text-stone-500">Applicant: <strong>{v.applicantName}</strong> ({v.email})</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      v.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 space-y-1">
                    <div>
                      <span className="font-bold text-stone-500">License / Permit:</span> {v.licenseNumber || 'Under Review'}
                    </div>
                    <div>
                      <span className="font-bold text-stone-500">Submitted:</span> {new Date(v.submittedAt).toLocaleDateString()}
                    </div>
                    {v.notes && (
                      <div>
                        <span className="font-bold text-stone-500">Notes:</span> {v.notes}
                      </div>
                    )}
                  </div>

                  {v.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleReviewVerification(v.id, 'verified')}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve & Verify</span>
                      </button>
                      <button
                        onClick={() => handleReviewVerification(v.id, 'rejected')}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. FOOD LISTINGS AUDIT TAB */}
        {activeTab === 'listings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search bar */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Search dishes or stalls to audit prices and descriptions..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Dishes grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishes.map(dish => (
                <div key={dish.id} className="p-4 rounded-3xl bg-white border border-stone-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-36 rounded-2xl overflow-hidden mb-3">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-black">
                        ₹{dish.price}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{dish.restaurantName}</div>
                    <h4 className="text-sm font-black text-stone-900 leading-snug mt-0.5">{dish.name}</h4>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-1">{dish.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                        {dish.category}
                      </span>
                      {dish.tags?.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-medium">Rating: {dish.rating}★ ({dish.ratingCount})</span>
                    <button
                      onClick={() => handleDeleteListing(dish.id, dish.name)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Remove dish listing from platform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Take Down</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'open', label: 'Open' },
                { id: 'investigating', label: 'Investigating' },
                { id: 'resolved', label: 'Resolved' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setReportFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === f.id
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map(rep => (
                <div key={rep.id} className="p-5 rounded-3xl bg-white border border-stone-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          rep.status === 'open' 
                            ? 'bg-rose-100 text-rose-800 animate-pulse' 
                            : rep.status === 'investigating' 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {rep.status}
                        </span>
                        <span className="text-xs text-stone-500">
                          Reported by <strong>{rep.reporterName}</strong> on {new Date(rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-stone-900 mt-1.5">
                        Target: {rep.targetTitle} ({rep.targetType})
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {rep.status === 'open' && (
                        <button
                          onClick={() => handleResolveReport(rep.id, 'investigating')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all cursor-pointer"
                        >
                          Mark Investigating
                        </button>
                      )}
                      {rep.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveReport(rep.id, 'resolved')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Resolve Issue
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                    {rep.reason}
                  </p>

                  {rep.resolutionNotes && (
                    <div className="mt-2 text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                      <strong>Admin Resolution:</strong> {rep.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
