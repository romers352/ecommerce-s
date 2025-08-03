import axios, { type AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3006/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate or get session ID for guest users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Request interceptor to add auth token and session ID
api.interceptors.request.use(
  (config) => {
    // Check for admin token first (for admin routes)
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');
    
    console.log('[API] Request interceptor:', {
      url: config.url,
      method: config.method,
      hasAdminToken: !!adminToken,
      hasUserToken: !!userToken,
      userTokenLength: userToken?.length,
      adminTokenLength: adminToken?.length,
      hasExistingAuth: !!config.headers?.Authorization
    });
    
    config.headers = config.headers || {};
    
    // Only set Authorization header if it's not already set (respect explicit headers)
    if (!config.headers.Authorization) {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
        console.log('[API] Using admin token for request');
      } else if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
        console.log('[API] Using user token for request');
      } else {
        console.log('[API] Using session ID for guest request');
      }
    } else {
      console.log('[API] Using explicit Authorization header');
    }
    
    // Always add session ID as fallback for cart operations
    config.headers['x-session-id'] = getSessionId();
    
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[API] Response success:', {
      url: response.config.url,
      status: response.status,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    console.error('[API] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      method: error.config?.method,
      message: error.response?.data?.message,
      hasAuthHeader: !!error.config?.headers?.Authorization
    });
    
    // Handle 503 Service Unavailable (Maintenance Mode)
    if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
      // Let the maintenance mode hook handle this
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - let auth context handle this
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized detected:', {
        url: error.config?.url,
        pathname: window.location.pathname,
        hasToken: !!localStorage.getItem('token'),
        hasAdminToken: !!localStorage.getItem('adminToken')
      });
      
      // Check if this is an admin route
      const isAdminRoute = error.config?.url?.includes('/admin') || window.location.pathname.startsWith('/admin');

      
      if (isAdminRoute) {
        console.log('[API] Clearing admin authentication due to 401');
        // Clear admin authentication
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        // Admin auth context will handle redirect

      } else {
        // Only remove user token and redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          console.log('[API] Clearing user authentication due to 401');
          localStorage.removeItem('token');
          // Use React Router navigation instead of window.location
          // This will be handled by the auth context
        }
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('[API] 403 Forbidden:', error.config?.url);
    }
    
    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('[API] 500 Server Error:', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: Record<string, unknown>) => api.put('/auth/profile', userData),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/password-reset/request', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/password-reset/confirm', { token, newPassword }),
};

export const productsAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  
  getById: (id: number | string) => api.get(`/products/${id}`),
  
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  
  search: (query: string, filters?: Record<string, unknown>) =>
    api.get('/products/search', { params: { q: query, ...filters } }),
  
  getSuggestions: (query: string, limit?: number) => api.get('/products/suggestions', { params: { q: query, limit } }),
  
  getCategories: () => api.get('/categories'),
  
  getCategoryProducts: (categorySlug: string, params?: Record<string, unknown>) =>
    api.get(`/categories/${categorySlug}/products`, { params }),
  
  getFeatured: () => api.get('/products/featured'),
  
  getReviews: (productId: number, params?: Record<string, unknown>) =>
    api.get(`/products/${productId}/reviews`, { params }),
  
  addReview: (productId: number, reviewData: Record<string, unknown>) =>
    api.post(`/products/${productId}/reviews`, reviewData),
};

export const cartAPI = {
  get: () => api.get('/cart'),

  add: (productId: number, quantity: number = 1) =>
    api.post('/cart/items', { productId, quantity }),

  update: (itemId: number, quantity: number) =>
    api.put(`/cart/items/${itemId}`, { quantity }),

  remove: (itemId: number) => api.delete(`/cart/items/${itemId}`),

  clear: () => api.delete('/cart/clear'),
};

export const ordersAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  
  getById: (id: number) => api.get(`/orders/${id}`),
  
  create: (orderData: Record<string, unknown>) => api.post('/orders', orderData),
  
  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  
  cancel: (id: number) => api.put(`/orders/${id}/cancel`),
  
  downloadInvoice: (orderNumber: string) => 
    api.get(`/orders/invoice/${orderNumber}`, { responseType: 'blob' }),
};

export const paymentAPI = {
  createIntent: (amount: number, currency: string = 'usd') =>
    api.post('/payments/create-intent', { amount, currency }),
  
  confirmPayment: (paymentIntentId: string, paymentMethodId: string) =>
    api.post('/payments/confirm', { paymentIntentId, paymentMethodId }),
  
  getPaymentMethods: () => api.get('/payments/methods'),
};

export const reviewsAPI = {
  getProductReviews: (productId: number, params?: Record<string, unknown>) =>
    api.get(`/reviews/product/${productId}`, { params }),
  
  getReview: (id: number) => api.get(`/reviews/${id}`),
  
  createReview: (reviewData: Record<string, unknown>) =>
    api.post('/reviews', reviewData),
  
  updateReview: (id: number, reviewData: Record<string, unknown>) =>
    api.put(`/reviews/${id}`, reviewData),
  
  deleteReview: (id: number) => api.delete(`/reviews/${id}`),
  
  markHelpful: (id: number) => api.patch(`/reviews/${id}/helpful`),
  
  getUserReviews: (params?: Record<string, unknown>) =>
    api.get('/reviews/user/my-reviews', { params }),
};

export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  
  addToWishlist: (productId: number) =>
    api.post('/wishlist', { productId }),
  
  removeFromWishlist: (productId: number) =>
    api.delete(`/wishlist/${productId}`),
  
  toggleWishlist: (productId: number) =>
    api.post('/wishlist/toggle', { productId }),
  
  checkWishlistStatus: (productId: number) =>
    api.get(`/wishlist/check/${productId}`),
  
  getWishlistCount: () => api.get('/wishlist/count'),
};



export const adminAPI = {
  // Products
  getAllProducts: (params?: Record<string, unknown>) => api.get('/products/admin/all', { params }),
  
  createProduct: (productData: FormData | Record<string, unknown>) => {
    const config = productData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post('/products', productData, config);
  },

  updateProduct: (id: number, productData: FormData | Record<string, unknown>) => {
    const config = productData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put(`/products/${id}`, productData, config);
  },
  
  deleteProduct: (id: number) => api.delete(`/products/${id}`),
  
  // Orders
  getAllOrders: (params?: Record<string, unknown>) => api.get('/orders/admin/all', { params }),
  
  updateOrderStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  
  getOrderStats: () => api.get('/orders/admin/stats'),
  
  // Users
  getAllUsers: (params?: Record<string, unknown>) => api.get('/users/admin/all', { params }),
  
  createUser: (userData: Record<string, unknown>) => api.post('/users/admin/create', userData),
  
  updateUser: (id: number, userData: Record<string, unknown>) =>
    api.put(`/users/${id}`, userData),
  
  deleteUser: (id: number) => api.delete(`/users/${id}?force=true`),
  
  getUserStats: () => api.get('/users/admin/stats'),
  
  // Reviews
  getAllReviews: (params?: Record<string, unknown>) => api.get('/reviews/admin/all', { params }),
  
  updateReviewStatus: (id: number, action: string) =>
    api.patch(`/reviews/${id}/moderate`, { action }),
  
  deleteReview: (id: number) => api.delete(`/reviews/${id}`),
  
  getReviewStats: () => api.get('/reviews/admin/stats'),
  
  // Categories
  getAllCategories: (params?: Record<string, unknown>) => api.get('/categories', { params }),
  
  getMainCategories: () => api.get('/categories/main'),
  
  getCategoryHierarchy: () => api.get('/categories/hierarchy'),
  
  getSubcategories: (parentId: number) => api.get(`/categories/${parentId}/subcategories`),
  
  createCategory: (categoryData: FormData | Record<string, unknown>) => {
    const config = categoryData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post('/categories', categoryData, config);
  },
  
  updateCategory: (id: number, categoryData: FormData | Record<string, unknown>) => {
    const config = categoryData instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put(`/categories/${id}`, categoryData, config);
  },
  
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
  
  getCategoryStats: () => api.get('/categories/admin/stats'),
  
  // Analytics
  getDashboardStats: () => api.get('/admin/analytics/dashboard'),
  
  getSalesData: (period: string) =>
    api.get(`/admin/analytics/sales?period=${period}`),
  
  getAnalyticsData: () => api.get('/admin/analytics/data'),

  // Bulk operations
  exportProducts: () => {
    return api.get('/products/admin/export', {
      responseType: 'blob',
    });
  },

  exportProductsCSV: () => {
    return api.get('/products/admin/export-csv', {
      responseType: 'blob',
    });
  },

  exportProductsPDF: () => {
    return api.get('/products/admin/export-pdf', {
      responseType: 'blob',
    });
  },

  downloadBulkTemplate: () => {
    return api.get('/products/admin/bulk-template', {
      responseType: 'blob',
    });
  },

  bulkUploadProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/admin/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  bulkUploadProductsCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/admin/bulk-upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },


};

// Contact API
export const contactAPI = {
  create: (contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => api.post('/contact', contactData),
  
  getAll: (params?: Record<string, unknown>) => api.get('/contact/admin/all', { params }),
  
  getById: (id: number) => api.get(`/contact/admin/${id}`),
  
  updateStatus: (id: number, status: string) => api.put(`/contact/admin/${id}`, { status }),
  
  delete: (id: number) => api.delete(`/contact/admin/${id}`),
  
  getStats: () => api.get('/contact/admin/stats'),
  
  bulkUpdate: (data: Record<string, unknown>) => api.put('/contact/admin/bulk-update', data),
  
  respond: (id: number, responseData: { message: string; subject: string }) => 
    api.post(`/contact/admin/${id}/respond`, responseData),
};

// Newsletter API
export const newsletterAPI = {
  subscribe: (data: { email: string }) => api.post('/newsletter/subscribe', data),

  unsubscribe: (id: number) => api.post('/newsletter/unsubscribe', { id }),

  getSubscribers: (params?: Record<string, unknown>) => api.get('/newsletter/subscribers', { params }),

  getStats: () => api.get('/newsletter/stats'),

  deleteSubscriber: (id: number) => api.delete(`/newsletter/subscribers/${id}`),

  exportSubscribers: () => api.get('/newsletter/export', { responseType: 'blob' }),
};

// Settings API
export const settingsAPI = {
  // Site Settings
  getSiteSettings: () => {
    // Add cache-busting parameter to prevent caching issues between different ports
    const timestamp = Date.now();
    const port = window.location.port;
    return api.get('/settings/site', { 
      params: { 
        _t: timestamp,
        _port: port
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  
  updateSiteSettings: (settingsData: Record<string, unknown>) => 
    api.put('/settings/site', settingsData),
  
  uploadSiteAsset: (type: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/settings/site/upload/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Home Page Sections
  getHomePageSections: () => api.get('/settings/home-sections'),
  
  getActiveHomePageSections: () => api.get('/settings/home-sections/active'),
  
  createHomePageSection: (sectionData: Record<string, unknown>) => 
    api.post('/settings/home-sections', sectionData),
  
  updateHomePageSection: (id: number, sectionData: Record<string, unknown>) => 
    api.put(`/settings/home-sections/${id}`, sectionData),
  
  deleteHomePageSection: (id: number) => api.delete(`/settings/home-sections/${id}`),
  
  reorderHomePageSections: (sections: Array<{ id: number; sortOrder: number }>) => 
    api.put('/settings/home-sections/reorder', { sections }),

  // Payment Methods
  getPaymentMethods: () => api.get('/settings/payment-methods'),
  
  getActivePaymentMethods: () => api.get('/settings/payment-methods/active'),
  
  createPaymentMethod: (methodData: Record<string, unknown>) => 
    api.post('/settings/payment-methods', methodData),
  
  updatePaymentMethod: (id: number, methodData: Record<string, unknown>) => 
    api.put(`/settings/payment-methods/${id}`, methodData),
  
  deletePaymentMethod: (id: number) => api.delete(`/settings/payment-methods/${id}`),


};

// Utility functions
export const uploadFile = async (file: File, endpoint: string = '/upload') => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const downloadFile = async (url: string, filename?: string) => {
  const response = await api.get(url, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

export { api };
export default api;