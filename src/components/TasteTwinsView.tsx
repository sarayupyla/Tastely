import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TasteTwin, FoodieRequest, FoodieConnection, DirectMessage, ConversationSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Sparkles, Shield, Lock, Eye, Star, 
  ArrowRight, Heart, Utensils, CheckCircle2, UserCheck,
  MessageSquareQuote, Sliders, ChevronRight, Compass,
  Flame, HelpCircle, UserPlus, MessageCircle, Send,
  Clock, X, Check, RefreshCw
} from 'lucide-react';

interface Props {
  onDiscoverDish: (dishName: string) => void;
  onOpenTasteProfile?: () => void;
}

export const TasteTwinsView: React.FC<Props> = ({ onDiscoverDish, onOpenTasteProfile }) => {
  const { user, updateTasteProfile } = useAuth();
  
  // Data states
  const [twins, setTwins] = useState<TasteTwin[]>([]);
  const [connections, setConnections] = useState<FoodieConnection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FoodieRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<FoodieRequest[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationUserId, setActiveConversationUserId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  
  // Loading & action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'twins' | 'requests' | 'connections' | 'messages' | 'reviews'>('twins');

  // Privacy toggles
  const [isDiscoverable, setIsDiscoverable] = useState(user?.tasteProfile?.isTasteTwinDiscoverable ?? true);
  const [alias, setAlias] = useState(user?.tasteProfile?.tasteTwinAlias || '');
  const [allowFriendRequests, setAllowFriendRequests] = useState(user?.tasteProfile?.allowFriendRequests ?? true);
  const [allowDirectMessages, setAllowDirectMessages] = useState(user?.tasteProfile?.allowDirectMessages ?? true);
  const [showFlavorPrefs, setShowFlavorPrefs] = useState(user?.tasteProfile?.showFlavorPreferences ?? true);
  const [showTexturePrefs, setShowTexturePrefs] = useState(user?.tasteProfile?.showTexturePreferences ?? true);
  const [showSpiceTol, setShowSpiceTol] = useState(user?.tasteProfile?.showSpiceTolerance ?? true);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [privacySuccessMsg, setPrivacySuccessMsg] = useState('');
  const [showPrivacySettings, setShowPrivacySettings] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize privacy settings when user data updates
  useEffect(() => {
    if (user?.tasteProfile) {
      if (user.tasteProfile.isTasteTwinDiscoverable !== undefined) {
        setIsDiscoverable(user.tasteProfile.isTasteTwinDiscoverable);
      }
      if (user.tasteProfile.tasteTwinAlias !== undefined) {
        setAlias(user.tasteProfile.tasteTwinAlias);
      }
      if (user.tasteProfile.allowFriendRequests !== undefined) {
        setAllowFriendRequests(user.tasteProfile.allowFriendRequests);
      }
      if (user.tasteProfile.allowDirectMessages !== undefined) {
        setAllowDirectMessages(user.tasteProfile.allowDirectMessages);
      }
      if (user.tasteProfile.showFlavorPreferences !== undefined) {
        setShowFlavorPrefs(user.tasteProfile.showFlavorPreferences);
      }
      if (user.tasteProfile.showTexturePreferences !== undefined) {
        setShowTexturePrefs(user.tasteProfile.showTexturePreferences);
      }
      if (user.tasteProfile.showSpiceTolerance !== undefined) {
        setShowSpiceTol(user.tasteProfile.showSpiceTolerance);
      }
    }
  }, [user]);

  // Load all social & connection data
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [twinsData, connData, convData] = await Promise.all([
        api.getTasteTwins().catch(() => []),
        api.getFoodieConnections().catch(() => ({ connections: [], pendingReceived: [], pendingSent: [] })),
        api.getConversations().catch(() => [])
      ]);

      setTwins(twinsData || []);
      setConnections(connData.connections || []);
      setPendingReceived(connData.pendingReceived || []);
      setPendingSent(connData.pendingSent || []);
      setConversations(convData || []);
    } catch (err) {
      console.error('Failed to load taste twins social data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Load active conversation messages when selected
  const loadMessages = async (targetUserId: string) => {
    try {
      const msgs = await api.getConversationMessages(targetUserId);
      setActiveMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      console.error('Failed to load messages', err);
      setActionFeedback({ text: err.message || 'Could not load conversation', isError: true });
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  useEffect(() => {
    if (activeConversationUserId) {
      loadMessages(activeConversationUserId);
      // Optional polling for live messages
      const interval = setInterval(() => {
        loadMessages(activeConversationUserId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConversationUserId]);

  const showFeedback = (text: string, isError = false) => {
    setActionFeedback({ text, isError });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Connection Request Handlers
  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      setActionLoadingId(targetUserId);
      const req = await api.sendFriendRequest(targetUserId);
      showFeedback(`Friend request sent to ${req.receiverName}!`);
      await loadAllData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to send request', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.acceptFriendRequest(requestId);
      showFeedback(`Connected with ${res.senderAlias || res.senderName}!`);
      await loadAllData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to accept request', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setActionLoadingId(requestId);
      await api.declineFriendRequest(requestId);
      showFeedback('Request declined');
      await loadAllData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to decline request', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSentRequest = async (requestId: string) => {
    try {
      setActionLoadingId(requestId);
      await api.cancelFriendRequest(requestId);
      showFeedback('Request cancelled');
      await loadAllData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to cancel request', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Messaging Handlers
  const handleStartMessageWithUser = (targetUserId: string) => {
    setActiveConversationUserId(targetUserId);
    setActiveSubTab('messages');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationUserId || !messageInput.trim() || isSendingMessage) return;

    try {
      setIsSendingMessage(true);
      const newMsg = await api.sendMessage(activeConversationUserId, messageInput.trim());
      setActiveMessages(prev => [...prev, newMsg]);
      setMessageInput('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      // Refresh conversations list
      api.getConversations().then(data => setConversations(data)).catch(() => {});
    } catch (err: any) {
      showFeedback(err.message || 'Failed to send message', true);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Privacy Handlers
  const handleSavePrivacy = async () => {
    try {
      setIsSavingPrivacy(true);
      await updateTasteProfile({
        isTasteTwinDiscoverable: isDiscoverable,
        tasteTwinAlias: alias.trim(),
        allowFriendRequests,
        allowDirectMessages,
        showFlavorPreferences: showFlavorPrefs,
        showTexturePreferences: showTexturePrefs,
        showSpiceTolerance: showSpiceTol
      });
      setPrivacySuccessMsg('Privacy preferences updated successfully!');
      setTimeout(() => setPrivacySuccessMsg(''), 3000);
      await loadAllData();
    } catch (err) {
      console.error('Failed to update privacy settings', err);
      showFeedback('Failed to update settings', true);
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  // Aggregated reviews from twins
  const aggregatedTwinReviews = useMemo(() => {
    const list: Array<{
      id: string;
      dishId: string;
      dishName: string;
      restaurantName: string;
      rating: number;
      reviewText: string;
      tasteTags: string[];
      createdAt: string;
      twinName: string;
      twinAvatar: string;
      twinSimilarity: number;
    }> = [];

    twins.forEach(twin => {
      if (twin.twinReviews && twin.twinReviews.length > 0) {
        twin.twinReviews.forEach(rev => {
          list.push({
            ...rev,
            twinName: twin.user.displayName,
            twinAvatar: twin.user.avatar,
            twinSimilarity: twin.similarityPercentage
          });
        });
      }
    });

    return list.sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [twins]);

  const hasProfile = Boolean(
    user?.tasteProfile &&
    ((user.tasteProfile.favoriteCuisines && user.tasteProfile.favoriteCuisines.length > 0) ||
     (user.tasteProfile.flavorPreferences && user.tasteProfile.flavorPreferences.length > 0))
  );

  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const activeFriend = useMemo(() => {
    if (!activeConversationUserId) return null;
    const fromConn = connections.find(c => c.user.id === activeConversationUserId);
    if (fromConn) return fromConn.user;
    const fromConv = conversations.find(c => c.otherUser.id === activeConversationUserId);
    if (fromConv) return fromConv.otherUser;
    const fromTwin = twins.find(t => t.user.id === activeConversationUserId);
    if (fromTwin) return { id: fromTwin.user.id, name: fromTwin.user.displayName, avatar: fromTwin.user.avatar };
    return null;
  }, [activeConversationUserId, connections, conversations, twins]);

  return (
    <div className="py-8 bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumbs & Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              Social Taste Discovery & Foodie Network
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 tracking-tight">
              Taste Twins
            </h1>
            <p className="text-sm md:text-base text-stone-600 max-w-2xl mt-1.5 font-sans">
              Discover verified registered foodies who share your palate. Connect, swap dish recommendations, and chat privately about your favorite flavors.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-xs text-xs font-bold transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Privacy Controls</span>
            </button>

            {onOpenTasteProfile && (
              <button
                onClick={onOpenTasteProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#173829] hover:bg-[#12281D] text-white shadow-xs text-xs font-bold transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-emerald-300" />
                <span>{hasProfile ? 'Tune Palate' : 'Set Taste Profile'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              </button>
            )}
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in ${
            actionFeedback.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionFeedback.isError ? <HelpCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{actionFeedback.text}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="cursor-pointer text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Palate Status Bar */}
        <div className="mb-6 p-4 rounded-3xl bg-white border border-stone-200/90 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#173829] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900">
                    {alias ? `${alias} (${user?.name})` : (user?.name || 'Your Profile')}
                  </span>
                  {hasProfile ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Palate
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      <HelpCircle className="w-3 h-3" />
                      Profile Incomplete
                    </span>
                  )}
                  {isDiscoverable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                      <Eye className="w-3 h-3 text-emerald-600" />
                      Discoverable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-medium">
                      <Lock className="w-3 h-3 text-stone-500" />
                      Hidden
                    </span>
                  )}
                </div>

                {hasProfile ? (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {user?.tasteProfile?.favoriteCuisines?.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                    {user?.tasteProfile?.spiceTolerance && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-medium border border-red-100">
                        <Flame className="w-3 h-3 text-red-500" />
                        {user.tasteProfile.spiceTolerance.charAt(0).toUpperCase() + user.tasteProfile.spiceTolerance.slice(1)}
                      </span>
                    )}
                    {user?.tasteProfile?.flavorPreferences?.slice(0, 3).map((f: string) => (
                      <span key={f} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 mt-0.5">
                    Complete your Food Personality to calculate authentic match scores with other foodies.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={loadAllData}
              title="Refresh social data"
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer self-end md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Privacy Controls Drawer/Panel */}
        {showPrivacySettings && (
          <div className="mb-6 p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Profile & Social Privacy Controls
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Customize your public foodie presence, discoverability, and messaging permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePrivacy}
                  disabled={isSavingPrivacy}
                  className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {isSavingPrivacy ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setShowPrivacySettings(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Discoverability */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/70 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-stone-800">Taste Twin Discoverability</div>
                  <div className="text-[11px] text-stone-500">Allow other foodies to match with your palate</div>
                </div>
                <input
                  type="checkbox"
                  checked={isDiscoverable}
                  onChange={(e) => setIsDiscoverable(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </label>

              {/* Public Alias */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-800">Public Foodie Alias</div>
                  <div className="text-[11px] text-stone-500 truncate">Show alias instead of full name</div>
                </div>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. SamosaFan"
                  className="px-2.5 py-1 rounded-xl bg-white border border-stone-300 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Allow Friend Requests */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/70 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-stone-800">Accept Friend Requests</div>
                  <div className="text-[11px] text-stone-500">Let foodies send connection invites</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowFriendRequests}
                  onChange={(e) => setAllowFriendRequests(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </label>

              {/* Allow Direct Messages */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/70 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-stone-800">Allow Direct Messages</div>
                  <div className="text-[11px] text-stone-500">Permit accepted connections to message you</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowDirectMessages}
                  onChange={(e) => setAllowDirectMessages(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </label>

              {/* Show Flavors */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/70 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-stone-800">Display Flavor Preferences</div>
                  <div className="text-[11px] text-stone-500">Visible on public Taste Twin card</div>
                </div>
                <input
                  type="checkbox"
                  checked={showFlavorPrefs}
                  onChange={(e) => setShowFlavorPrefs(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </label>

              {/* Show Spice Tolerance */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/70 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-stone-800">Display Spice Tolerance</div>
                  <div className="text-[11px] text-stone-500">Visible on public Taste Twin card</div>
                </div>
                <input
                  type="checkbox"
                  checked={showSpiceTol}
                  onChange={(e) => setShowSpiceTol(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </label>
            </div>

            {privacySuccessMsg && (
              <div className="mt-3 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {privacySuccessMsg}
              </div>
            )}
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-stone-200/80 pb-3">
          {/* Tab 1: Discover */}
          <button
            onClick={() => setActiveSubTab('twins')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'twins'
                ? 'bg-[#173829] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover Taste Twins</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'twins' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
              {twins.length}
            </span>
          </button>

          {/* Tab 2: Requests */}
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-[#173829] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Friend Requests</span>
            {(pendingReceived.length > 0 || pendingSent.length > 0) && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                pendingReceived.length > 0 
                  ? 'bg-rose-500 text-white font-black' 
                  : activeSubTab === 'requests' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {pendingReceived.length + pendingSent.length}
              </span>
            )}
          </button>

          {/* Tab 3: My Connections */}
          <button
            onClick={() => setActiveSubTab('connections')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'connections'
                ? 'bg-[#173829] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-700" />
            <span>My Connections</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'connections' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
              {connections.length}
            </span>
          </button>

          {/* Tab 4: Messages */}
          <button
            onClick={() => setActiveSubTab('messages')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'messages'
                ? 'bg-[#173829] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <span>Private Messages</span>
            {totalUnreadMessages > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          {/* Tab 5: Reviews */}
          <button
            onClick={() => setActiveSubTab('reviews')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'reviews'
                ? 'bg-[#173829] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4 text-[#E06A4E]" />
            <span>Reviews from People Like You</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'reviews' ? 'bg-[#E06A4E] text-white' : 'bg-stone-100 text-stone-600'
            }`}>
              {aggregatedTwinReviews.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Discover Taste Twins */}
        {activeSubTab === 'twins' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(n => (
                  <div key={n} className="h-80 rounded-3xl bg-stone-200/60 animate-pulse" />
                ))}
              </div>
            ) : twins.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-black text-stone-900">
                  No Discoverable Foodie Profiles Found Yet
                </h3>
                <p className="text-xs md:text-sm text-stone-600 mt-2 max-w-lg mx-auto leading-relaxed">
                  You are currently the only active foodie in this discovery network, or other foodies have not completed their profiles yet. Complete your taste profile, rate dishes, and invite friends to test real taste matching!
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {onOpenTasteProfile && (
                    <button
                      onClick={onOpenTasteProfile}
                      className="px-5 py-2.5 rounded-xl bg-[#173829] hover:bg-[#12281D] text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>Complete Food Personality Quiz</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDiscoverDish('')}
                    className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Browse Dishes & Submit Reviews</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {twins.map(twin => {
                  const isPendingSent = twin.connectionStatus === 'pending_sent';
                  const isPendingReceived = twin.connectionStatus === 'pending_received';
                  const isAccepted = twin.connectionStatus === 'accepted';
                  const isActionLoading = actionLoadingId === twin.user.id || actionLoadingId === twin.requestId;

                  return (
                    <div
                      key={twin.user.id}
                      className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all p-6 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Avatar, Name & Match Score */}
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={twin.user.avatar}
                              alt={twin.user.displayName}
                              className="w-14 h-14 rounded-full object-cover ring-4 ring-emerald-50 shadow-xs"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-stone-900">
                                  {twin.user.displayName}
                                </h3>
                                <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700" title="Registered Foodie">
                                  <UserCheck className="w-3.5 h-3.5" />
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-stone-400 mt-0.5">
                                {twin.user.favoriteCuisines.length > 0
                                  ? twin.user.favoriteCuisines.join(' • ')
                                  : 'Palate setup in progress'}
                              </p>
                            </div>
                          </div>

                          {/* Match Pill */}
                          <div className="text-right">
                            {twin.hasSufficientData ? (
                              <>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500 text-stone-950 text-sm font-black shadow-xs">
                                  <Sparkles className="w-4 h-4 fill-stone-950" />
                                  {twin.similarityPercentage}% Match
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-1">
                                  Palate Overlap
                                </div>
                              </>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 text-[11px] font-bold">
                                <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                                Incomplete Palate
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Truthful Match Explanation */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-stone-700 leading-relaxed mb-4">
                          <strong className="text-emerald-950 font-bold block mb-0.5 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            Palate Alignment:
                          </strong>
                          {twin.matchReason}
                        </div>

                        {/* Shared Preferences tags if available */}
                        {(twin.user.flavorPreferences || twin.user.spiceTolerance) && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-4">
                            {twin.user.spiceTolerance && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-semibold border border-red-100">
                                <Flame className="w-3 h-3 text-red-500" />
                                {twin.user.spiceTolerance} spice
                              </span>
                            )}
                            {twin.user.flavorPreferences?.map(f => (
                              <span key={f} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium">
                                #{f}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Shared dishes if any */}
                        {twin.sharedFavoriteDishes.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              Dishes You Both Rated
                            </h4>
                            <div className="space-y-1.5">
                              {twin.sharedFavoriteDishes.map((dish, dIdx) => (
                                <div
                                  key={dIdx}
                                  onClick={() => onDiscoverDish(dish.dishName)}
                                  className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/70 flex items-center justify-between cursor-pointer text-xs"
                                >
                                  <span className="font-bold text-stone-800">{dish.dishName}</span>
                                  <span className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                                    <Star className="w-3 h-3 fill-amber-500" />
                                    {dish.rating}★
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Twin Recommendations */}
                        {twin.recommendedForYouFromTwin.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-orange-500" />
                              Recommended by this Twin
                            </h4>
                            <div className="space-y-1.5">
                              {twin.recommendedForYouFromTwin.map((rec, rIdx) => (
                                <div
                                  key={rIdx}
                                  onClick={() => onDiscoverDish(rec.dishName)}
                                  className="p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 flex items-center justify-between cursor-pointer group text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                                      {rec.dishName}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block">
                                      at {rec.restaurantName} • Rated {rec.twinRating}★
                                    </span>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Connection Action Bar */}
                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                        {isAccepted ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Connected Foodie
                            </span>
                            <button
                              onClick={() => handleStartMessageWithUser(twin.user.id)}
                              className="px-4 py-2 rounded-xl bg-[#173829] hover:bg-[#12281D] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Message</span>
                            </button>
                          </div>
                        ) : isPendingSent ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              Request Pending
                            </span>
                            {twin.requestId && (
                              <button
                                onClick={() => handleCancelSentRequest(twin.requestId!)}
                                disabled={isActionLoading}
                                className="text-xs font-semibold text-stone-500 hover:text-rose-600 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : isPendingReceived ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-800">
                              Sent you a request
                            </span>
                            <div className="flex items-center gap-2">
                              {twin.requestId && (
                                <>
                                  <button
                                    onClick={() => handleAcceptRequest(twin.requestId!)}
                                    disabled={isActionLoading}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineRequest(twin.requestId!)}
                                    disabled={isActionLoading}
                                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(twin.user.id)}
                            disabled={isActionLoading}
                            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs group"
                          >
                            <UserPlus className="w-4 h-4 text-emerald-400" />
                            <span>{isActionLoading ? 'Sending...' : 'Send Friend Request'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Friend Requests */}
        {activeSubTab === 'requests' && (
          <div className="space-y-8">
            {/* Incoming Requests */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Received Requests ({pendingReceived.length})
                </h3>
              </div>

              {pendingReceived.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center">
                  <UserPlus className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-stone-600">
                    No pending friend requests
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    When other foodies discover your palate and send an invite, it will show up here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReceived.map(req => (
                    <div key={req.id} className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={req.senderAvatar}
                          alt={req.senderName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-50 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {req.senderAlias || req.senderName}
                          </h4>
                          <p className="text-[11px] text-stone-400 truncate">
                            {req.senderCuisines?.slice(0, 2).join(' • ') || 'Foodie enthusiast'}
                          </p>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            Received {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-3.5 py-1.5 rounded-xl bg-[#173829] hover:bg-[#12281D] text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Sent Requests Pending Approval ({pendingSent.length})
                </h3>
              </div>

              {pendingSent.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-stone-200/70 text-center">
                  <p className="text-xs text-stone-500">
                    You have no outstanding sent requests.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingSent.map(req => (
                    <div key={req.id} className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={req.receiverAvatar}
                          alt={req.receiverName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-stone-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {req.receiverName}
                          </h4>
                          <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Awaiting response
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelSentRequest(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: My Connections */}
        {activeSubTab === 'connections' && (
          <div>
            {connections.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-serif font-black text-stone-900">
                  No Foodie Connections Yet
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Connect with Taste Twins to build your personal culinary circle, swap reviews, and message each other directly.
                </p>
                <button
                  onClick={() => setActiveSubTab('twins')}
                  className="mt-5 px-4 py-2.5 rounded-xl bg-[#173829] hover:bg-[#12281D] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Taste Twins</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {connections.map(conn => (
                  <div
                    key={conn.id}
                    className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 mb-3.5">
                        <img
                          src={conn.user.avatar}
                          alt={conn.user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-100"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {conn.user.tasteTwinAlias || conn.user.name}
                          </h4>
                          <span className="text-[11px] text-stone-400 block truncate">
                            {conn.user.favoriteCuisines.join(' • ') || 'Foodie Explorer'}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                            Connected since {new Date(conn.connectedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {conn.user.similarityPercentage !== undefined && (
                        <div className="p-2.5 rounded-xl bg-stone-50 text-[11px] text-stone-600 flex items-center justify-between mb-4">
                          <span>Palate Similarity:</span>
                          <span className="font-bold text-emerald-800">{conn.user.similarityPercentage}% Match</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartMessageWithUser(conn.user.id)}
                      className="w-full py-2 rounded-xl bg-[#173829] hover:bg-[#12281D] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message {conn.user.tasteTwinAlias || conn.user.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Private Messages */}
        {activeSubTab === 'messages' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden min-h-[520px] flex flex-col md:flex-row">
            {/* Conversation sidebar */}
            <div className="w-full md:w-80 border-r border-stone-200/90 flex flex-col shrink-0 bg-stone-50/50">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Foodie Chats ({conversations.length})
                </h3>
                {connections.length > 0 && (
                  <span className="text-[10px] text-stone-500 font-medium">
                    {connections.length} Friends
                  </span>
                )}
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
                {connections.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500">
                    <p className="font-semibold text-stone-700 mb-1">No connections yet</p>
                    <p className="text-[11px]">Connect with Taste Twins to unlock private direct messaging.</p>
                  </div>
                ) : (
                  connections.map(conn => {
                    const isSelected = activeConversationUserId === conn.user.id;
                    const convSummary = conversations.find(c => c.otherUser.id === conn.user.id);

                    return (
                      <div
                        key={conn.id}
                        onClick={() => setActiveConversationUserId(conn.user.id)}
                        className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/80 border-l-4 border-[#173829]' : 'hover:bg-white'
                        }`}
                      >
                        <img
                          src={conn.user.avatar}
                          alt={conn.user.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-stone-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-stone-900 truncate">
                              {conn.user.tasteTwinAlias || conn.user.name}
                            </h4>
                            {convSummary?.lastMessage && (
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {new Date(convSummary.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {convSummary?.lastMessage?.text || 'Start a conversation about food...'}
                          </p>
                        </div>
                        {convSummary && convSummary.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                            {convSummary.unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat conversation area */}
            <div className="flex-1 flex flex-col bg-white">
              {activeFriend ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50/30">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeFriend.avatar}
                        alt={activeFriend.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-50"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">
                          {activeFriend.tasteTwinAlias || activeFriend.name}
                        </h4>
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Accepted Foodie Connection • Private Chat
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message scroll container */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[460px]">
                    {activeMessages.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 text-xs">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                        <p className="font-semibold text-stone-600">No messages yet</p>
                        <p className="text-[11px]">Say hello and ask for their top culinary recommendations!</p>
                      </div>
                    ) : (
                      activeMessages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-xs sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                isMe
                                  ? 'bg-[#173829] text-white rounded-br-none'
                                  : 'bg-stone-100 text-stone-900 rounded-bl-none border border-stone-200/80'
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-stone-400 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message compose form */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-200 flex items-center gap-2 bg-stone-50/50">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${activeFriend.tasteTwinAlias || activeFriend.name}...`}
                      maxLength={2000}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#173829]"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !messageInput.trim()}
                      className="px-4 py-2 rounded-xl bg-[#173829] hover:bg-[#12281D] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingMessage ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
                  <MessageCircle className="w-12 h-12 text-stone-300 mb-2" />
                  <h4 className="text-sm font-bold text-stone-700">Select a Foodie Friend</h4>
                  <p className="text-xs text-stone-500 max-w-xs mt-1">
                    Pick a connection from the left to start a private food conversation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Reviews from People Like You */}
        {activeSubTab === 'reviews' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    Curated Reviews from Palate Matched Foodies
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                    Real Taste Twins
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1 max-w-xl">
                  These reviews are written by real discoverable foodies who have rated dishes across Tastely.
                </p>
              </div>

              <div className="text-xs font-bold text-stone-700">
                {aggregatedTwinReviews.length} Review{aggregatedTwinReviews.length !== 1 ? 's' : ''} Found
              </div>
            </div>

            {aggregatedTwinReviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
                <MessageSquareQuote className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-lg font-serif font-black text-stone-900">
                  No Twin Reviews Available Yet
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                  As foodies with matching palates submit dish ratings and reviews on Tastely, their recommendations will appear here automatically.
                </p>
                <div className="mt-5">
                  <button
                    onClick={() => onDiscoverDish('')}
                    className="px-4 py-2 rounded-xl bg-[#173829] hover:bg-[#12281D] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Explore Menus & Submit Your Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aggregatedTwinReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Reviewer Header */}
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={rev.twinAvatar}
                            alt={rev.twinName}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-100"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-900">
                                {rev.twinName}
                              </span>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <div className="text-[11px] text-stone-400">
                              {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Palate Match Badge */}
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
                          <Sparkles className="w-3 h-3 text-emerald-700" />
                          <span>{rev.twinSimilarity}% Palate Match</span>
                        </div>
                      </div>

                      {/* Dish & Restaurant Target */}
                      <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 mb-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-stone-900 truncate">
                              {rev.dishName}
                            </h4>
                            <p className="text-[11px] text-stone-500 truncate">
                              at {rev.restaurantName}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{rev.rating}.0</span>
                          </div>
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="relative pl-3 border-l-2 border-emerald-400 mb-4">
                        <p className="text-xs text-stone-700 italic leading-relaxed">
                          "{rev.reviewText}"
                        </p>
                      </div>

                      {/* Taste Tags */}
                      {rev.tasteTags && rev.tasteTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {rev.tasteTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-semibold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onDiscoverDish(rev.dishName)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 group"
                    >
                      <span>Find & Order "{rev.dishName}"</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
