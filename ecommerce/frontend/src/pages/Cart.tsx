import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useCart } from '../hooks/useCart';
import { getImageUrl } from '../utils/helpers';

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const items = cart.items;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Shopping Cart</h1>
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-12">
              <div className="text-gray-500 mb-4 sm:mb-6">
                <svg className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Start shopping to add items to your cart.</p>
              <Link
                to="/products"
                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 ease-out transform hover:scale-105"
              >
                Continue Shopping
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Shopping Cart ({totalItems} items)</h1>
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          {/* Cart Items */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-md">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 sm:p-6 border-b border-gray-200 last:border-b-0"
                >
                  {/* Mobile Layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Product Image and Info */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{item.product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.product.shortDescription}</p>
                        <p className="text-base sm:text-lg font-bold text-indigo-600 mt-2">${Number(item.product.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Controls and Total */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                      {/* Quantity Controls and Remove Button */}
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <MinusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="px-2 sm:px-4 py-1.5 sm:py-2 font-medium text-sm sm:text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                          >
                            <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          ${(Number(item.product.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-5 order-1 lg:order-2 mb-6 lg:mb-0 lg:mt-0">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${Number(totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium">${(Number(totalPrice || 0) * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>${(Number(totalPrice || 0) * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <Link
                  to="/checkout"
                  className="block w-full text-center bg-indigo-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/products"
                  className="block w-full text-center bg-gray-200 text-gray-800 py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;