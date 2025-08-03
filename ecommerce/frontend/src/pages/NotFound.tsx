import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  const popularPages = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: MagnifyingGlassIcon },
    { name: 'Categories', href: '/categories', icon: MagnifyingGlassIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* 404 Illustration */}
          <div className="mx-auto w-32 h-32 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center"
            >
              <ExclamationTriangleIcon className="w-16 h-16 text-white" />
            </motion.div>
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center"
          >
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 ease-out transform hover:scale-105 font-medium"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Popular Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-16 max-w-md mx-auto px-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          Popular Pages
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {popularPages.map((page, index) => (
            <motion.div
              key={page.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <Link
                to={page.href}
                className="block p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <page.icon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {page.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Search Suggestion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 text-center px-4"
      >
        <p className="text-gray-600 mb-4">
          Looking for something specific?
        </p>
        <Link
          to="/search"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-all duration-200 ease-out font-medium"
        >
          <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
          Search our products
        </Link>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="mt-8 text-center px-4"
      >
        <p className="text-sm text-gray-500 mb-2">
          Still need help?
        </p>
        <Link
          to="/contact"
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Contact our support team
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;