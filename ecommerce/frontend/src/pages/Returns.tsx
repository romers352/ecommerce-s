import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUturnLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Returns: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('policy');

  const handleStartReturn = () => {
    navigate('/orders');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  const returnReasons = [
    {
      icon: XCircleIcon,
      title: 'Defective Product',
      description: 'Item arrived damaged or not working properly',
      eligible: true,
      timeframe: '30 days',
    },
    {
      icon: ArrowUturnLeftIcon,
      title: 'Changed Mind',
      description: 'No longer need the item or found a better alternative',
      eligible: true,
      timeframe: '14 days',
    },
    {
      icon: ExclamationTriangleIcon,
      title: 'Wrong Item',
      description: 'Received different product than ordered',
      eligible: true,
      timeframe: '30 days',
    },
    {
      icon: CheckCircleIcon,
      title: 'Not as Described',
      description: 'Product doesn\'t match the description or images',
      eligible: true,
      timeframe: '30 days',
    },
  ];

  const returnProcess = [
    {
      step: '1',
      title: 'Initiate Return',
      description: 'Log into your account and go to "My Orders" to start a return request.',
      time: '2 minutes',
    },
    {
      step: '2',
      title: 'Select Items',
      description: 'Choose the items you want to return and specify the reason.',
      time: '3 minutes',
    },
    {
      step: '3',
      title: 'Print Label',
      description: 'Download and print the prepaid return shipping label.',
      time: '1 minute',
    },
    {
      step: '4',
      title: 'Package Items',
      description: 'Securely package items in original packaging if possible.',
      time: '5 minutes',
    },
    {
      step: '5',
      title: 'Ship Package',
      description: 'Drop off at any authorized shipping location or schedule pickup.',
      time: 'Same day',
    },
    {
      step: '6',
      title: 'Processing',
      description: 'We\'ll inspect the items and process your refund or exchange.',
      time: '3-5 business days',
    },
  ];

  const eligibleItems = [
    'Physical products in original condition',
    'Items with original packaging and tags',
    'Products purchased within return window',
    'Non-personalized items',
    'Items not marked as final sale',
  ];

  const nonEligibleItems = [
    'Digital products (software, licenses, downloads)',
    'Personalized or customized items',
    'Items damaged by misuse',
    'Products past the return window',
    'Final sale or clearance items',
    'Opened software or media',
  ];

  const refundMethods = [
    {
      method: 'Original Payment Method',
      timeframe: '3-5 business days',
      description: 'Refund to the original credit card or payment method used',
      preferred: true,
    },
    {
      method: 'Store Credit',
      timeframe: 'Immediate',
      description: 'Credit applied to your account for future purchases',
      preferred: false,
    },
    {
      method: 'Exchange',
      timeframe: '5-7 business days',
      description: 'Replace with same or different item of equal value',
      preferred: false,
    },
  ];

  const tabs = [
    { id: 'policy', label: 'Return Policy', icon: DocumentTextIcon },
    { id: 'process', label: 'Return Process', icon: ArrowUturnLeftIcon },
    { id: 'refunds', label: 'Refunds & Exchanges', icon: CurrencyDollarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <ArrowUturnLeftIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Returns & Refunds
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We want you to be completely satisfied with your purchase. Learn about our return policy and how to return items.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Return Window', value: '30 Days', icon: ClockIcon },
              { label: 'Free Returns', value: 'Yes', icon: CheckCircleIcon },
              { label: 'Refund Time', value: '3-5 Days', icon: CurrencyDollarIcon },
              { label: 'Customer Satisfaction', value: '99%', icon: ShieldCheckIcon },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-lg p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-2">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Return Policy Tab */}
          {activeTab === 'policy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Return Reasons */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Valid Return Reasons
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {returnReasons.map((reason, index) => (
                    <motion.div
                      key={reason.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index }}
                      className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <reason.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {reason.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {reason.description}
                        </p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {reason.timeframe} return window
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Eligible vs Non-Eligible Items */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="flex items-center mb-6">
                    <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Eligible for Return
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {eligibleItems.map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 * index }}
                        className="flex items-start space-x-3"
                      >
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="flex items-center mb-6">
                    <XCircleIcon className="w-8 h-8 text-red-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">
                      Not Eligible for Return
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {nonEligibleItems.map((item, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 * index }}
                        className="flex items-start space-x-3"
                      >
                        <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Return Process Tab */}
          {activeTab === 'process' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                How to Return an Item
              </h2>
              <div className="space-y-8">
                {returnProcess.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="flex items-start space-x-6"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {step.title}
                        </h3>
                        <span className="text-sm text-blue-600 font-medium">
                          {step.time}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-blue-800 text-sm">
                  If you need assistance with your return, our customer service team is available 24/7 to help guide you through the process.
                </p>
              </div>
            </motion.div>
          )}

          {/* Refunds & Exchanges Tab */}
          {activeTab === 'refunds' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Refund Methods
                </h2>
                <div className="space-y-4">
                  {refundMethods.map((method, index) => (
                    <motion.div
                      key={method.method}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * index }}
                      className={`p-6 border-2 rounded-lg ${
                        method.preferred
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {method.method}
                        </h3>
                        {method.preferred && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">
                        {method.description}
                      </p>
                      <div className="flex items-center text-sm">
                        <ClockIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-gray-500">
                          Processing time: {method.timeframe}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Important Refund Information
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>Processing Time:</strong> Once we receive your returned item, we'll inspect it and notify you of the approval or rejection of your refund.
                  </p>
                  <p>
                    <strong>Refund Timeline:</strong> If approved, your refund will be processed and a credit will automatically be applied to your original method of payment within 3-5 business days.
                  </p>
                  <p>
                    <strong>Partial Refunds:</strong> We may offer partial refunds for items that are returned in less than perfect condition, or if more than 30 days have passed since purchase.
                  </p>
                  <p>
                    <strong>Shipping Costs:</strong> Original shipping costs are non-refundable. You'll also be responsible for paying your own shipping costs for returning items unless the return is due to our error.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Need Help with a Return?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our customer service team is here to make your return process as smooth as possible.
            </p>
            <div className="space-x-4">
              <button 
                onClick={handleStartReturn}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 ease-out transform hover:scale-105"
              >
                Start Return
              </button>
              <button 
                onClick={handleContactSupport}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 ease-out transform hover:scale-105"
              >
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Returns;