import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'customer' | 'admin';
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  isActive?: boolean;
  role?: 'customer' | 'admin';
}



// Category Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: number;
  isMainCategory: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category;
  children?: Category[];
}

export interface CategoryCreateInput {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: number;
  isMainCategory?: boolean;
}

export interface CategoryCreationAttributes extends Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'parent' | 'children'> {}
export interface CategoryUpdateAttributes extends Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'parent' | 'children'>> {}

// Product Types
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
  images: string[];
  categoryId: number;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  reviews?: Review[];
}

export interface ProductCreateInput {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  images?: string[];
  categoryId: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  salePrice?: number;
  sku?: string;
  stock?: number;
  images?: string[];
  categoryId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDigital?: boolean;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

// Review Types
export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  product?: Product;
}

export interface ReviewCreateInput {
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
}

// Cart Types
export interface CartItem {
  id: number;
  userId?: number;
  sessionId?: string;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export interface CartItemCreateInput {
  productId: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Order Types
export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentIntentId?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export interface OrderCreateInput {
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  paymentMethod: string;
  notes?: string;
}

// Address Types
export interface Address {
  id?: number;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface AddressInput {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'customer' | 'admin';
  };
  sessionID?: string;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isSuperAdmin: boolean;
    permissions: string[];
    isActive: boolean;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

// Filter Types
export interface ProductFilters {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'featured';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Analytics Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: Product[];
  salesData: SalesData[];
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

// Email Types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Webhook Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// Database Model Attributes
export interface ModelTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;
}

// Configuration Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: string;
  logging: boolean | ((_sql: string) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  define: {
    timestamps: boolean;
    underscored: boolean;
    freezeTableName: boolean;
  };
  dialectOptions?: any;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
}

// Contact Types
export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high';
  adminNotes?: string;
  repliedAt?: Date;
  repliedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactCreateInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ContactUpdateInput {
  status?: 'new' | 'read' | 'replied' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  adminNotes?: string;
  repliedAt?: Date;
  repliedBy?: number;
}

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};
export type Required<T> = {
  [P in keyof T]-?: T[P];
};