import React, { useState, useEffect } from 'react';
import { Dish, DishRating, DishReviewsResponse } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Star, X, Sparkles, UserCheck, MessageSquare, 
  ThumbsUp, Send, CheckCircle2, ShieldCheck, Heart 
} from 'lucide-react';

interface Props {
  dish: Dish | null;
  onClose: () => void;
  onDishUpdated?: (updatedDish: Dish) => void;
}

export const DishReviewsModal: React.FC<Props> = ({ dish, onClose, onDishUpdated }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DishReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'people_like_you' | 'all' | 'write'>('people_like_you');

  // Form states for writing a review
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadReviews = async (dishId: string) => {
    try {
      setIsLoading(true);
      const res = await api.getDishReviews(dishId);
      setData(res);
      if (res.reviewsFromPeopleLikeYou.length === 0 && res.reviews.length > 0) {
        setActiveTab('all');
      }
    } catch (err: any) {
      console.error('Failed to load reviews', err);
      setErrorMessage(err.message || 'Could not load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dish) {
      loadReviews(dish.id);
      setSelectedTags(dish.flavorProfile || ['savory', 'crispy']);
    }
  }, [dish]);

  if (!dish) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setErrorMessage('Please write a short review sharing what you tasted.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const res = await api.submitRating({
        dishId: dish.id,
        rating,
        reviewText: reviewText.trim(),
        tasteTags: selectedTags
      });

      setSubmitSuccess(true);
      setReviewText('');
      await loadReviews(dish.id);

      if (onDishUpdated) {
        onDishUpdated({
          ...dish,
          rating: res.dishUpdatedRating,
          ratingCount: (dish.ratingCount || 0) + 1
        });
      }

      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('all');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const reviewsList = activeTab === 'people_like_you' 
    ? (data?.reviewsFromPeopleLikeYou || [])
    : (data?.reviews || []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-start justify-between bg-stone-50/70">
          <div className="flex items-center gap-3.5">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-16 h-16 rounded-2xl object-cover ring-1 ring-stone-200 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  {dish.restaurantName}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-[11px] font-semibold text-stone-500">
                  {dish.category}
                </span>
              </div>
              <h3 className="text-lg font-black text-stone-900 leading-tight mt-0.5">
                {dish.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 font-extrabold text-amber-600 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{(data?.averageRating || dish.rating || 5.0).toFixed(1)}</span>
                </div>
                <span className="text-xs text-stone-400 font-medium">
                  ({data?.totalCount ?? dish.ratingCount ?? 0} reviews)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-stone-200 flex items-center gap-2 bg-white">
          <button
            onClick={() => setActiveTab('people_like_you')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'people_like_you'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Reviews from People Like You ({data?.reviewsFromPeopleLikeYou?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            All Community Reviews ({data?.totalCount || 0})
          </button>

          <button
            onClick={() => setActiveTab('write')}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'write'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            Write Review
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 py-8">
              {[1, 2].map(n => (
                <div key={n} className="h-24 rounded-2xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'write' ? (
            /* Write Review Form */
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-stone-700">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  Written Feedback
                </label>
                <p className="text-[11px] text-stone-400 mb-2">
                  Describe the flavors, textures, temperature, and what stood out.
                </p>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="e.g. Perfectly crispy lacy edges with a rich savory glaze. Melts in your mouth!"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
                  Flavor & Texture Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['savory', 'umami', 'crispy', 'crunchy', 'cheesy', 'spicy', 'sweet', 'silky', 'tender'].map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white font-bold'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your review has been saved and shared with your taste twins!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Post Dish Review'}
                </button>
              </div>
            </form>
          ) : reviewsList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-700">No written reviews yet</h4>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'people_like_you'
                  ? 'No members with matching taste profiles have reviewed this dish yet. Be the first!'
                  : 'Be the first to share your thoughts on this dish!'}
              </p>
              <button
                onClick={() => setActiveTab('write')}
                className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
              >
                Write First Review
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'people_like_you' && (
                <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center gap-2.5 text-xs text-orange-950 font-medium mb-3">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    These reviews come from foodies whose palate closely matches yours (60%+ taste compatibility).
                  </span>
                </div>
              )}

              {reviewsList.map(review => (
                <div
                  key={review.id}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2.5 transition-all hover:border-stone-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={review.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                        alt={review.userName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            {review.userName}
                          </span>
                          {review.isTasteTwin && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                              <UserCheck className="w-2.5 h-2.5" />
                              Taste Twin
                            </span>
                          )}
                        </div>
                        {review.similarityScore !== undefined && (
                          <div className="text-[10px] font-semibold text-orange-700">
                            {review.similarityScore}% Taste Palate Match
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200 text-amber-600 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{review.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed pl-10">
                    "{review.reviewText}"
                  </p>

                  <div className="flex items-center justify-between pl-10 pt-1">
                    <div className="flex flex-wrap gap-1">
                      {(review.tasteTags || []).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
