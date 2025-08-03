import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Cart, CartItem, Product } from '../types';
import { api } from '../utils/api';
import { useAuth } from './useAuth';

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load cart on mount and authentication change
  useEffect(() => {
    loadCart();
  }, [isAuthenticated, token]);

  // Handle cart migration when authentication state changes
  useEffect(() => {
    if (isAuthenticated && token) {
      // User just logged in - migrate local cart to server
      migrateLocalCartToServer();
    } else {
      // User logged out - load local cart
      loadLocalCart();
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      
      // Always try to load from server first (supports both authenticated users and guest sessions)
      try {
        const response = await api.get('/cart');
        const cartData = response.data.data;
        setCart({
          items: cartData.items || [],
          totalItems: cartData.items?.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) || 0,
          totalPrice: cartData.items?.reduce((sum: number, item: CartItem) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0) || 0,
        });
      } catch (error) {
        // console.error('Failed to load cart from server:', error);
        // Fallback to local cart if server fails
        loadLocalCart();
      }
    } catch (error) {
      // console.error('Failed to load cart:', error);
      // Final fallback
      loadLocalCart();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCart(cartData);
      } else {
        setCart({ items: [], totalItems: 0, totalPrice: 0 });
      }
    } catch (error) {
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    }
  };

  const migrateLocalCartToServer = async () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const localCart = JSON.parse(savedCart);
        if (localCart.items && localCart.items.length > 0) {
          // Add each local cart item to server
          for (const item of localCart.items) {
            try {
              await api.post('/cart/items', {
                productId: item.productId,
                quantity: item.quantity
              });
            } catch (error) {
              // Continue with other items if one fails
              console.error('Failed to migrate cart item:', error);
            }
          }
          // Clear local cart after migration
          localStorage.removeItem('cart');
          // Reload server cart
          await loadCart();
        }
      }
    } catch (error) {
      console.error('Failed to migrate local cart:', error);
    }
  };



  const saveLocalCart = (cartData: Cart) => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartData));
    } catch (error) {
      // console.error('Failed to save cart to localStorage:', error);
    }
  };

  const calculateTotals = (items: CartItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    
    return { totalItems, totalPrice };
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      setIsLoading(true);
      
      // Always try to add to server cart first (supports both authenticated users and guest sessions)
      try {
        await api.post('/cart/items', 
          { productId, quantity }
        );
        
        // Reload cart after adding item
        await loadCart();
        return;
      } catch (serverError) {
        // If server fails and user is not authenticated, fallback to local cart
        if (!isAuthenticated) {
          console.warn('Server cart failed, falling back to local cart:', serverError);
          
          // Add to local cart as fallback
          const productResponse = await api.get(`/products/${productId}`);
          const product: Product = productResponse.data.data || productResponse.data;
          
          setCart(prevCart => {
            const existingItem = prevCart.items.find(item => item.product.id === productId);
            let newItems: CartItem[];
            
            if (existingItem) {
              newItems = prevCart.items.map(item =>
                item.product.id === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              );
            } else {
              const newItem: CartItem = {
                id: Date.now(), // Temporary ID for local cart
                userId: 0,
                productId,
                product,
                quantity,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              newItems = [...prevCart.items, newItem];
            }
            
            const totals = calculateTotals(newItems);
            const newCart = { items: newItems, ...totals };
            
            saveLocalCart(newCart);
            return newCart;
          });
        } else {
          // Re-throw error for authenticated users
          throw serverError;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Failed to add item to cart';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      setIsLoading(true);
      
      // Always try server first (supports both authenticated users and guest sessions)
      try {
        await api.delete(`/cart/items/${itemId}`);
        
        // Reload cart after removing item
        await loadCart();
      } catch (serverError) {
        // If server fails and user is not authenticated, fallback to local cart
        if (!isAuthenticated) {
          console.warn('Server cart removal failed, falling back to local cart:', serverError);
          
          setCart(prevCart => {
            const newItems = prevCart.items.filter(item => item.id !== itemId);
            const totals = calculateTotals(newItems);
            const newCart = { items: newItems, ...totals };
            
            saveLocalCart(newCart);
            return newCart;
          });
        } else {
          // Re-throw error for authenticated users
          throw serverError;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Failed to remove item from cart';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Always try server first (supports both authenticated users and guest sessions)
      try {
        await api.put(`/cart/items/${itemId}`, 
          { quantity }
        );
        
        // Reload cart after updating item
        await loadCart();
      } catch (serverError) {
        // If server fails and user is not authenticated, fallback to local cart
        if (!isAuthenticated) {
          console.warn('Server cart update failed, falling back to local cart:', serverError);
          
          setCart(prevCart => {
            const newItems = prevCart.items.map(item =>
              item.id === itemId ? { ...item, quantity } : item
            );
            const totals = calculateTotals(newItems);
            const newCart = { items: newItems, ...totals };
            
            saveLocalCart(newCart);
            return newCart;
          });
        } else {
          // Re-throw error for authenticated users
          throw serverError;
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Failed to update cart item';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      
      // Always try server first (supports both authenticated users and guest sessions)
      try {
        await api.delete('/cart/clear');
      } catch (serverError) {
        // If server fails and user is not authenticated, fallback to local cart
        if (!isAuthenticated) {
          console.warn('Server cart clear failed, falling back to local cart:', serverError);
          localStorage.removeItem('cart');
        } else {
          // Re-throw error for authenticated users
          throw serverError;
        }
      }
      
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Failed to clear cart';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: CartContextType = {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default useCart;