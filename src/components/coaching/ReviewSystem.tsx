// src/components/coaching/ReviewSystem.tsx
"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Review } from "@/types/coaching";

interface ReviewSystemProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  coachId: string;
  playerId?: string;
  onAddReview?: (review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function ReviewSystem({
  reviews,
  averageRating,
  totalReviews,
  coachId,
  playerId,
  onAddReview,
}: ReviewSystemProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState({
    expertise: 0,
    communication: 0,
    value: 0,
    punctuality: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0 || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        playerId: playerId || 'guest',
        playerName: 'Anonymous',
        sessionId: '',
        rating,
        comment,
        categories: {
          ...categories,
          overall: rating,
        },
        isVerified: !!playerId,
      };

      if (onAddReview) {
        onAddReview(reviewData);
      }

      setShowReviewForm(false);
      setRating(0);
      setComment("");
      setCategories({
        expertise: 0,
        communication: 0,
        value: 0,
        punctuality: 0,
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className="focus:outline-none"
            disabled={!interactive}
          >
            <Icons.Star
              className={`w-5 h-5 ${
                star <= (hoverRating || rating || value)
                  ? 'fill-[#f0b429] text-[#f0b429]'
                  : 'fill-gray-200 text-gray-200'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingPercentage = (score: number): number => {
    const count = reviews.filter(r => Math.floor(r.rating) === score).length;
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Overall Rating */}
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div>
                <p className="text-4xl font-black text-gray-900">{averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">out of 5.0</p>
              </div>
              <div>
                {renderStars(Math.round(averageRating))}
                <p className="text-xs text-gray-500 mt-1">{totalReviews} reviews</p>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((score) => (
              <div key={score} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-6">{score}</span>
                <Icons.Star className="w-3 h-3 fill-[#f0b429] text-[#f0b429]" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f0b429] rounded-full"
                    style={{ width: `${getRatingPercentage(score)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-10">
                  {Math.round(getRatingPercentage(score))}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Ratings */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries({
            expertise: 'Expertise',
            communication: 'Communication',
            value: 'Value',
            punctuality: 'Punctuality',
          }).map(([key, label]) => {
            const avg = reviews.reduce((sum, r) => sum + (r.categories?.[key as keyof typeof categories] || r.rating), 0) / (reviews.length || 1);
            return (
              <div key={key} className="text-center">
                <p className="text-sm font-bold text-gray-900">{avg.toFixed(1)}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#1a5c2a] rounded-full"
                    style={{ width: `${(avg / 5) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Reviews</h3>
          {playerId && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold hover:bg-[#1a5c2a]/90 transition-colors"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Write Your Review</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Overall Rating</p>
                <div className="flex items-center gap-2">
                  {renderStars(rating, true)}
                  <span className="text-sm font-bold text-gray-900">{rating}/5</span>
                </div>
              </div>

              {['expertise', 'communication', 'value', 'punctuality'].map((cat) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-gray-500 mb-1 capitalize">{cat}</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setCategories(prev => ({ ...prev, [cat]: star }))}
                        className="focus:outline-none"
                      >
                        <Icons.Star
                          className={`w-4 h-4 ${
                            star <= categories[cat as keyof typeof categories]
                              ? 'fill-[#f0b429] text-[#f0b429]'
                              : 'fill-gray-200 text-gray-200'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Comment</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this coach..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] min-h-[80px]"
                />
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || !comment.trim() || isSubmitting}
                className="w-full py-3 bg-[#1a5c2a] text-white rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* Review Cards */}
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a5c2a]/10 flex items-center justify-center text-lg font-bold text-[#1a5c2a]">
                  {review.playerName[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.playerName}</p>
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(review.rating))}
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {review.isVerified && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-3">{review.comment}</p>
            {review.coachResponse && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500">Coach Response</p>
                <p className="text-sm text-gray-700 mt-1">{review.coachResponse}</p>
              </div>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-8">
            <Icons.MessageCircle className="mx-auto text-gray-300" size={32} />
            <p className="text-gray-500 mt-2">No reviews yet</p>
            <p className="text-xs text-gray-400">Be the first to leave a review!</p>
          </div>
        )}
      </div>
    </div>
  );
}