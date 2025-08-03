import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Product } from '../../types';
import { formatCurrency, calculateDiscountPercentage, getImageUrl } from '../../utils/helpers';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  variant?: 'default' | 'compact' | 'featured';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  variant = 'default',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCart, isLoading } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  
  const isWishlisted = isInWishlist(product.id);

  const discountPercentage = product.salePrice
    ? calculateDiscountPercentage(product.price, product.salePrice)
    : 0;

  const handleAddToCart = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      await addToCart(product.id, 1);
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const handleWishlistToggle = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please log in to manage your wishlist');
      return;
    }
    
    try {
      const wasWishlisted = isWishlisted;
      await toggleWishlist(product.id);
      toast.success(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleQuickView = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onQuickView?.(product);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -5, transition: { duration: 0.2 } },
  };

  const imageVariants = {
    hidden: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    hover: { opacity: 1, transition: { duration: 0.2 } },
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const cardClasses = {
    default: 'bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-lg',
    compact: 'bg-white rounded-lg shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-md',
    featured: 'bg-white rounded-2xl shadow-lg overflow-hidden group border border-primary-100 transition-all duration-300 hover:shadow-xl',
  };

  const imageClasses = {
    default: 'h-40 sm:h-48 md:h-52',
    compact: 'h-28 sm:h-32',
    featured: 'h-48 sm:h-56 md:h-64',
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={cardClasses[variant]}
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className={`relative ${imageClasses[variant]} overflow-hidden bg-gray-100`}>
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <motion.div
              className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              -{discountPercentage}%
            </motion.div>
          )}

          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
              Out of Stock
            </div>
          )}

          {/* Product Image */}
          <motion.div
            variants={imageVariants}
            className="h-full w-full"
          >
            {!imageError ? (
              <img
                src={getImageUrl(product.images?.[0] || '', 'medium')}
                alt={product.name}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
          </motion.div>

          {/* Hover Overlay */}
          <motion.div
            variants={overlayVariants}
            className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center space-x-2"
          >
            {/* Quick View Button */}
            {onQuickView && (
              <Button
                variant="secondary"
                size="small"
                onClick={handleQuickView}
                icon={<EyeIcon className="h-4 w-4" />}
                className="bg-white hover:bg-gray-100"
              >
                Quick View
              </Button>
            )}

            {/* Wishlist Button */}
            <motion.button
              onClick={handleWishlistToggle}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isWishlisted ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600" />
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className={`p-3 sm:p-4 ${variant === 'compact' ? 'p-2 sm:p-3' : variant === 'featured' ? 'p-4 sm:p-6' : ''}`}>
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.category.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 ${
            variant === 'compact' ? 'text-xs sm:text-sm' : variant === 'featured' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
          }`}>
            {product.name}
          </h3>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex">
                {renderStars(product.averageRating)}
              </div>
              <span className="text-sm text-gray-500">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2 mb-3">
            <span className={`font-bold text-gray-900 ${
              variant === 'compact' ? 'text-sm sm:text-base' : variant === 'featured' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            }`}>
              {formatCurrency(product.salePrice || product.price)}
            </span>
            {product.salePrice && (
              <span className={`text-gray-500 line-through ${
                variant === 'compact' ? 'text-xs sm:text-sm' : 'text-sm'
              }`}>
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size={variant === 'compact' ? 'small' : 'medium'}
            fullWidth
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isLoading}
            loading={isLoading}
            icon={<ShoppingCartIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
            className="text-xs sm:text-sm"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;