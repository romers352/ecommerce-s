import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { wishlistAPI } from '../utils/api';
import { Product } from '../types';

interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  totalItems: number;
  isLoading: boolean;
  error: string | null;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  loadWishlist: () => Promise<void>;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Load wishlist when user is authenticated
  useEffect(() => {
    console.log('🔄 useWishlist useEffect - isAuthenticated:', isAuthenticated, 'user:', user?.id);
    if (isAuthenticated && user) {
      console.log('✅ Loading wishlist for authenticated user');
      loadWishlist();
    } else {
      console.log('❌ User not authenticated, clearing wishlist');
      clearWishlist();
    }
  }, [isAuthenticated, user?.id]);

  const loadWishlist = async (): Promise<void> => {
    console.log('📡 loadWishlist called - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, clearing wishlist');
      clearWishlist();
      return;
    }

    // Verify token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[useWishlist] No token found in localStorage');
      clearWishlist();
      return;
    }

    try {
      console.log('🚀 Making API call to get wishlist...');
      setIsLoading(true);
      setError(null);
      const response = await wishlistAPI.getWishlist();
      console.log('✅ Wishlist API response:', response.data);
      const wishlistData = response.data.data || response.data;
      setWishlistItems(wishlistData.items || []);
      setTotalItems(wishlistData.totalItems || 0);
      console.log('📝 Set wishlist items count:', wishlistData.items?.length || 0);
    } catch (err: any) {
      console.error('❌ Error loading wishlist:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.message,
        hasAuthHeader: !!err.config?.headers?.Authorization
      });
      
      if (err.response?.status === 401) {
        console.warn('[useWishlist] 401 error - clearing auth and wishlist');
        // Clear potentially invalid token
        localStorage.removeItem('token');
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to load wishlist');
      }
      setWishlistItems([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (productId: number): Promise<void> => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your wishlist');
      return;
    }

    try {
      setError(null);
      await wishlistAPI.addToWishlist(productId);
      await loadWishlist(); // Reload to get updated data
    } catch (err: any) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to add item to wishlist');
      }
      throw err;
    }
  };

  const removeFromWishlist = async (productId: number): Promise<void> => {
    if (!isAuthenticated) {
      setError('Please log in to manage your wishlist');
      return;
    }

    try {
      setError(null);
      await wishlistAPI.removeFromWishlist(productId);
      await loadWishlist(); // Reload to get updated data
    } catch (err: any) {
      console.error('Error removing from wishlist:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to remove item from wishlist');
      }
      throw err;
    }
  };

  const toggleWishlist = async (productId: number): Promise<void> => {
    if (!isAuthenticated) {
      setError('Please log in to manage your wishlist');
      return;
    }

    try {
      setError(null);
      await wishlistAPI.toggleWishlist(productId);
      await loadWishlist(); // Reload to get updated data
    } catch (err: any) {
      console.error('Error toggling wishlist:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to update wishlist');
      }
      throw err;
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const clearWishlist = (): void => {
    setWishlistItems([]);
    setTotalItems(0);
    setError(null);
  };

  const value: WishlistContextType = {
    wishlistItems,
    totalItems,
    isLoading,
    error,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    loadWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};