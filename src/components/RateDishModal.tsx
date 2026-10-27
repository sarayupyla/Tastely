import React, { useState } from 'react';
import { Dish } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Star, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  dish: Dish | null;
  onClose: () => void;
  onSuccess: (updatedRating: number) => void;
}

const AVAILABLE_TAGS = [
  'Savory',
  'Umami',
  'Crispy',
  'Cheesy',
  'Sweet',
  'Spicy',
  'Fresh Herbs',
  'Smoky',
  'Comfort Food'
];

export const RateDishModal: React.FC<Props> = ({ dish, onClose, onSuccess }) => {
  const { refreshUser } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(dish?.flavorProfile || ['Savory', 'Umami']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!dish) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await api.submitRating({
        dishId: dish.id,
        rating,
        reviewText,
        tasteTags: selectedTags
      });

      await refreshUser();
      onSuccess(res.dishUpdatedRating);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
        
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900">
                Rate & Review
              </h3>
              <p className="text-xs text-stone-500">
                Helps refine your personalized taste matches.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dish Info */}
        <div className="flex gap-3.5 p-3 rounded-2xl bg-stone-50 border border-stone-200 mb-5">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-stone-900 truncate">{dish.name}</h4>
            <div className="text-[11px] text-stone-500">{dish.restaurantName}</div>
            <div className="text-[11px] font-semibold text-stone-400 mt-0.5">{dish.category}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Picker */}
          <div className="text-center py-2">
            <label className="text-xs font-bold text-stone-700 block mb-2">
              Your Overall Rating
            </label>
            <div className="inline-flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-extrabold text-amber-700 mt-1">
              {rating === 5 ? 'Mind-Blowing 5★' : rating === 4 ? 'Delicious 4★' : rating === 3 ? 'Good 3★' : `${rating}★`}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Review Notes (What stood out about the flavor?)
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="e.g. Rich umami broth, incredibly tender pork, and perfect chew on the noodles!"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          {/* Flavor Tags */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              Select Flavor Characteristics:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
