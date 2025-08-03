import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../utils/helpers';

const Wishlist: React.FC = () => {
  const { wishlistItems, isLoading, error, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  // Debug logging
  console.log('🛒 Wishlist component render:');
  console.log('  - isAuthenticated:', isAuthenticated);
  console.log('  - current user:', user);
  console.log('  - wishlistItems:', wishlistItems);
  console.log('  - wishlistItems.length:', wishlistItems.length);
  console.log('  - isLoading:', isLoading);
  console.log('  - error:', error);
  console.log('  - localStorage token:', localStorage.getItem('token') ? 'exists' : 'missing');
  
  // Additional debug: Check if we're getting the right user
  if (user) {
    console.log('👤 Current logged in user ID:', user.id, 'Email:', user.email);
  }
  
  // Debug logs
  console.log('🔍 Wishlist Debug - isAuthenticated:', isAuthenticated);
  console.log('🔍 Wishlist Debug - user:', user);
  console.log('🔍 Wishlist Debug - wishlistItems:', wishlistItems);
  console.log('🔍 Wishlist Debug - isLoading:', isLoading);
  console.log('🔍 Wishlist Debug - error:', error);
  console.log('🔍 Wishlist Debug - localStorage token:', localStorage.getItem('token'));
  console.log('🔍 Wishlist Debug - wishlistItems length:', wishlistItems?.length);
  

  
  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Item removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item from wishlist');
    }
  };
  
  const handleAddToCart = async (product: any) => {
    try {
      const productId = Number(product.id);
      if (!productId || productId <= 0) {
        throw new Error('Invalid product ID');
      }
      await addToCart(productId, 1);
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">Please log in to view your wishlist</h2>
            <p className="mt-2 text-sm text-gray-500">
              You need to be logged in to access your wishlist. If you already have an account, please log in to see your saved items.
            </p>
            <div className="mt-6 space-x-4">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your wishlist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-red-500 mb-6">
                <HeartIcon className="mx-auto h-24 w-24" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Error loading wishlist</h2>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-gray-500 mb-6">
                <HeartIcon className="mx-auto h-24 w-24 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8">Save items you love to your wishlist and shop them later.</p>
              <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 ease-out transform hover:scale-105"
                >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist ({wishlistItems.length} items)</h1>
          <Link
            to="/products"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Continue Shopping
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={getImageUrl(item.product.images?.[0] || '/placeholder-product.jpg')}
                  alt={item.product.name}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => handleRemoveFromWishlist(item.productId || item.product.id)}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                >
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                </button>
                {item.product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <Link to={`/products/${String(item.product.slug)}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">{item.product.name}</h3>
                </Link>
                <p className="text-gray-600 text-sm mb-3">{item.product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-indigo-600">${Number(item.product.salePrice || item.product.price).toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    disabled={item.product.stock <= 0}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {item.product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Wishlist;