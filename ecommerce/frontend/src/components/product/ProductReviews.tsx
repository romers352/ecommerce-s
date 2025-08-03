import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon,
  HandThumbUpIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { Review } from '../../types';
import { reviewsAPI } from '../../utils/api';
import { formatDate, getImageUrl } from '../../utils/helpers';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

interface ProductReviewsProps {
  productId: number;
  averageRating: number;
  reviewCount: number;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  averageRating,
  reviewCount,
}) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [productId, currentPage, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewsAPI.getProductReviews(productId, {
        page: currentPage,
        limit: 10,
        sortBy,
      });
      
      const reviewData = response.data.data || response.data;
      setReviews(reviewData.data || reviewData);
      
      if (reviewData.pagination) {
        setTotalPages(reviewData.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to submit a review');
      return;
    }

    try {
      setSubmitting(true);
      await reviewsAPI.createReview({
        productId,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      
      // Reset form and refresh reviews
      setReviewForm({ rating: 5, title: '', comment: '' });
      setShowReviewForm(false);
      setCurrentPage(1);
      await fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    if (!isAuthenticated) {
      alert('Please login to mark reviews as helpful');
      return;
    }

    try {
      await reviewsAPI.markHelpful(reviewId);
      // Refresh reviews to show updated helpful count
      await fetchReviews();
    } catch (err: any) {
      console.error('Failed to mark review as helpful:', err);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, index) => {
      const filled = index < Math.floor(rating);
      const StarComponent = filled ? StarSolidIcon : StarIcon;
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => interactive && onRatingChange && onRatingChange(index + 1)}
          className={`h-5 w-5 ${
            filled ? 'text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
          disabled={!interactive}
        >
          <StarComponent className="h-full w-full" />
        </button>
      );
    });
  };

  const renderRatingDistribution = () => {
    // This would ideally come from the API, but for now we'll calculate it from current reviews
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = reviews.filter(review => review.rating === rating).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { rating, count, percentage };
    });

    return (
      <div className="space-y-2">
        {distribution.map(({ rating, count, percentage }) => (
          <div key={rating} className="flex items-center space-x-2 text-sm">
            <span className="w-3">{rating}</span>
            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-gray-600">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Reviews Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
        {isAuthenticated && (
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant="outline"
            size="small"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(averageRating)}
          </div>
          <p className="text-gray-600">
            Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Rating Distribution</h4>
          {renderRatingDistribution()}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-gray-200 rounded-lg p-6 mb-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Write Your Review</h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {renderStars(reviewForm.rating, true, (rating) =>
                  setReviewForm({ ...reviewForm, rating })
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title (Optional)
              </label>
              <input
                id="review-title"
                name="title"
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Summarize your review"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
              </label>
              <textarea
                id="review-comment"
                name="comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Share your thoughts about this product"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <Button type="submit" loading={submitting}>
                Submit Review
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-gray-900">Reviews ({reviewCount})</h4>
        <select
          id="review-sort"
          name="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[140px] flex-shrink-0"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No reviews yet</p>
          <p className="text-gray-400">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b border-gray-200 pb-6 last:border-b-0"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.user.avatar ? (
                    <img
                      src={getImageUrl(review.user.avatar)}
                      alt={`${review.user.firstName} ${review.user.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {review.user.firstName?.[0]}{review.user.lastName?.[0]}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h5 className="font-medium text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </h5>
                    {review.verifiedPurchase && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckBadgeIcon className="h-4 w-4" />
                        <span className="text-xs">Verified Purchase</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  
                  {review.title && (
                    <h6 className="font-medium text-gray-900 mb-2">{review.title}</h6>
                  )}
                  
                  {review.comment && (
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleMarkHelpful(review.id)}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <HandThumbUpIcon className="h-4 w-4" />
                      <span>Helpful ({review.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="small"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="small"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;