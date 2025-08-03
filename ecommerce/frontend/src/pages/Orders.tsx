import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ordersAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { getImageUrl } from '../utils/helpers';

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: string | number;
  product: {
    id: number;
    name: string;
    slug: string;
    images: string[];
    sku: string;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  subtotal: string | number;
  tax: string | number;
  shipping: string | number;
  discount: string | number;
  total: string | number;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[Orders] Fetching orders - Auth state:', {
          isAuthenticated,
          userId: user?.id,
          userRole: user?.role,
          hasToken: !!localStorage.getItem('token')
        });
        
        // Check if user is authenticated
        if (!isAuthenticated) {
          console.warn('[Orders] User not authenticated, showing login message');
          setError('Please log in to view your orders');
          return;
        }
        
        // Verify token exists
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('[Orders] No token found in localStorage');
          setError('Authentication token missing. Please log in again.');
          return;
        }
        
        console.log('[Orders] Making API call to fetch orders...');
        // Always use regular orders API for user's own orders
        const response = await ordersAPI.getAll();
        
        console.log('[Orders] Orders API response:', {
          status: response.status,
          dataStructure: typeof response.data,
          hasData: !!response.data?.data
        });
          
        // Handle the nested response structure: response.data.data.data contains the orders array
        const ordersData = response.data.data?.data || response.data.data || [];
        console.log('[Orders] Processed orders data:', {
          isArray: Array.isArray(ordersData),
          length: Array.isArray(ordersData) ? ordersData.length : 'not array'
        });
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err: any) {
        console.error('[Orders] Error fetching orders:', {
          status: err.response?.status,
          message: err.response?.data?.message,
          error: err.message,
          hasAuthHeader: !!err.config?.headers?.Authorization
        });
        
        if (err.response?.status === 401) {
          console.warn('[Orders] 401 error - clearing auth and showing login message');
          // Clear potentially invalid token
          localStorage.removeItem('token');
          setError('Your session has expired. Please log in again to view your orders.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view orders.');
        } else {
          setError(err.response?.data?.message || 'Failed to load orders. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user?.role, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const downloadInvoice = async (orderNumber: string) => {
    try {
      const response = await ordersAPI.downloadInvoice(orderNumber);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      setError(error.response?.data?.message || 'Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-red-500 mb-6">
                <svg className="mx-auto h-24 w-24 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Error loading orders</h2>
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

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
            <div className="bg-white rounded-lg shadow-md p-12">
              <div className="text-gray-500 mb-6">
                <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No orders yet</h2>
              <p className="text-gray-600 mb-8">When you place your first order, it will appear here.</p>
              <a
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 ease-out transform hover:scale-105"
              >
                Start Shopping
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
          
          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:min-w-[180px] sm:flex-1 sm:max-w-xs"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Order {order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.user && (
                        <p className="text-sm text-gray-500">
                          Purchaser: {order.user.firstName} {order.user.lastName} ({order.user.email})
                        </p>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} whitespace-nowrap`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-bold text-gray-900">${parseFloat(String(order.total)).toFixed(2)}</span>
                      <p className="text-sm text-gray-500">{order.currency}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="flex items-center justify-center sm:justify-start space-x-2 text-indigo-600 hover:text-indigo-700 transition-all duration-200 ease-out px-3 py-2 rounded-lg hover:bg-indigo-50"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                        </span>
                      </button>
                      <button
                        onClick={() => downloadInvoice(order.orderNumber)}
                        className="flex items-center justify-center sm:justify-start space-x-2 text-gray-600 hover:text-gray-700 transition-all duration-200 ease-out px-3 py-2 rounded-lg hover:bg-gray-100"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              {selectedOrder === order.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 sm:px-6 py-4"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={getImageUrl(item.product.images[0] || '/placeholder-product.jpg')}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg mx-auto sm:mx-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                          <h5 className="font-semibold text-gray-900">{item.product.name}</h5>
                          <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="flex flex-row sm:flex-col justify-between sm:justify-end gap-4 sm:gap-0">
                          <div className="text-center sm:text-right">
                            <p className="font-semibold text-gray-900">${parseFloat(String(item.price)).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">each</p>
                          </div>
                          <div className="text-center sm:text-right">
                            <p className="font-bold text-indigo-600">${(parseFloat(String(item.price)) * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">total</p>
                          </div>
                        </div>
                      </div>
                    )) || []}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">${parseFloat(String(order.subtotal)).toFixed(2)}</span>
                      </div>
                      {parseFloat(String(order.tax)) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="text-gray-900">${parseFloat(String(order.tax)).toFixed(2)}</span>
                        </div>
                      )}
                      {parseFloat(String(order.shipping)) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="text-gray-900">${parseFloat(String(order.shipping)).toFixed(2)}</span>
                        </div>
                      )}
                      {parseFloat(String(order.discount)) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="text-green-600">-${parseFloat(String(order.discount)).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-indigo-600">${parseFloat(String(order.total)).toFixed(2)} {order.currency}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Order Info */}
                  {(order.trackingNumber || order.notes) && (
                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Additional Information</h5>
                      {order.trackingNumber && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {order.notes}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Order Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                    {order.status === 'delivered' && (
                      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 ease-out transform hover:scale-105 w-full sm:w-auto">
                        Reorder Items
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 ease-out transform hover:scale-105 w-full sm:w-auto">
                        Cancel Order
                      </button>
                    )}
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 ease-out transform hover:scale-105 w-full sm:w-auto">
                      Contact Support
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;