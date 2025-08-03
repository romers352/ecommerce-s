import React from 'react';

// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  bio?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}



export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  categoryId: number;
  category?: Category;
  images: string[];
  reviews?: Review[];
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  children?: Category[];
  productCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// Review types
export interface Review {
  id: number;
  productId: number;
  userId: number;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  rating: number;
  title?: string;
  comment?: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Cart types
export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Order types
export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Filter types
export interface ProductFilters {
  category?: string;
  categoryIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  minRating?: number;
  brand?: string;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  search?: string;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating' | 'newest' | null;
  page?: number;
  limit?: number;
}

// Alias for compatibility
export type Filters = ProductFilters;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CheckoutForm {
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  sameAsShipping: boolean;
}

export interface ReviewForm {
  rating: number;
  title: string;
  comment: string;
}

// Component Props types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  onAddToCart?: (productId: number) => void;
  onWishlistToggle?: (productId: number) => void;
  onQuickView?: (product: Product) => void;
  isWishlisted?: boolean;
  showQuickView?: boolean;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type Theme = 'light' | 'dark';

export interface AppSettings {
  theme: Theme;
  currency: string;
  language: string;
}