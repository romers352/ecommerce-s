import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const RefundPolicy: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const refundTypes = [
    {
      type: 'Full Refund',
      icon: CurrencyDollarIcon,
      conditions: [
        'Item returned within 30 days',
        'Item in original condition',
        'Original packaging included',
        'All accessories included',
      ],
      timeframe: '3-5 business days',
      color: 'green',
    },
    {
      type: 'Partial Refund',
      icon: BanknotesIcon,
      conditions: [
        'Item shows signs of use',
        'Missing original packaging',
        'Returned after 30 days (up to 60 days)',
        'Missing accessories',
      ],
      timeframe: '3-5 business days',
      color: 'yellow',
    },
    {
      type: 'Store Credit',
      icon: CreditCardIcon,
      conditions: [
        'Final sale items',
        'Items past return window',
        'Damaged by customer use',
        'Customer preference',
      ],
      timeframe: 'Immediate',
      color: 'blue',
    },
  ];

  const refundTimeline = [
    {
      step: 'Return Initiated',
      description: 'Customer starts return process online',
      timeframe: 'Day 0',
    },
    {
      step: 'Item Shipped',
      description: 'Customer ships item back to us',
      timeframe: 'Day 1-3',
    },
    {
      step: 'Item Received',
      description: 'We receive and log the returned item',
      timeframe: 'Day 4-7',
    },
    {
      step: 'Quality Check',
      description: 'Item is inspected for condition and completeness',
      timeframe: 'Day 8-10',
    },
    {
      step: 'Refund Approved',
      description: 'Refund is approved and processed',
      timeframe: 'Day 11',
    },
    {
      step: 'Refund Issued',
      description: 'Money is returned to original payment method',
      timeframe: 'Day 12-16',
    },
  ];

  const paymentMethods = [
    {
      method: 'Credit Card',
      timeframe: '3-5 business days',
      description: 'Refund appears on your statement within 1-2 billing cycles',
      icon: CreditCardIcon,
    },
    {
      method: 'Debit Card',
      timeframe: '3-5 business days',
      description: 'Refund appears in your account balance',
      icon: CreditCardIcon,
    },
    {
      method: 'PayPal',
      timeframe: '1-2 business days',
      description: 'Refund appears in your PayPal account',
      icon: CurrencyDollarIcon,
    },
    {
      method: 'Bank Transfer',
      timeframe: '5-7 business days',
      description: 'Refund appears in your bank account',
      icon: BanknotesIcon,
    },
  ];

  const specialCases = [
    {
      title: 'Defective Products',
      description: 'Items that arrive damaged or defective are eligible for full refund plus return shipping costs.',
      icon: ExclamationTriangleIcon,
      color: 'red',
    },
    {
      title: 'Wrong Item Sent',
      description: 'If we send the wrong item, we\'ll provide a full refund and cover all shipping costs.',
      icon: XCircleIcon,
      color: 'orange',
    },
    {
      title: 'Late Delivery',
      description: 'Items delivered significantly late may be eligible for partial refund or compensation.',
      icon: ClockIcon,
      color: 'yellow',
    },
    {
      title: 'Promotional Items',
      description: 'Items purchased with promotional codes follow standard refund policy unless otherwise stated.',
      icon: CheckCircleIcon,
      color: 'green',
    },
  ];

  const faqItems = [
    {
      question: 'How long do I have to request a refund?',
      answer: 'You have 30 days from the delivery date to request a refund for most items. Some categories may have different timeframes.',
    },
    {
      question: 'Can I get a refund if I used a discount code?',
      answer: 'Yes, but the refund amount will be the actual amount paid after the discount was applied.',
    },
    {
      question: 'What if my refund doesn\'t appear?',
      answer: 'Contact your bank or payment provider first. If the issue persists after 10 business days, contact our support team.',
    },
    {
      question: 'Can I get a refund for digital products?',
      answer: 'Digital products are generally non-refundable unless there\'s a technical issue preventing use.',
    },
    {
      question: 'Do you refund shipping costs?',
      answer: 'Original shipping costs are refunded only if the return is due to our error (wrong item, defective product).',
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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
            <CurrencyDollarIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Refund Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We stand behind our products and want you to be completely satisfied. Learn about our comprehensive refund policy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Refund Window', value: '30 Days', icon: ClockIcon },
              { label: 'Processing Time', value: '3-5 Days', icon: CurrencyDollarIcon },
              { label: 'Success Rate', value: '98%', icon: CheckCircleIcon },
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

      {/* Refund Types */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Types of Refunds
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer different types of refunds based on the condition of returned items and circumstances.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {refundTypes.map((refund, index) => (
              <motion.div
                key={refund.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className={`w-12 h-12 bg-${refund.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <refund.icon className={`w-6 h-6 text-${refund.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {refund.type}
                </h3>
                <ul className="space-y-2 mb-4">
                  {refund.conditions.map((condition, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                      <CheckCircleIcon className={`w-4 h-4 text-${refund.color}-600 mt-0.5 flex-shrink-0`} />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
                <div className={`text-sm bg-${refund.color}-50 text-${refund.color}-800 px-3 py-2 rounded`}>
                  Processing: {refund.timeframe}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Refund Timeline */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Refund Process Timeline
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Here's what happens from the moment you initiate a return to when you receive your refund.
            </p>
          </motion.div>

          <div className="space-y-8">
            {refundTimeline.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="flex items-center space-x-6"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {step.step}
                    </h3>
                    <span className="text-sm text-blue-600 font-medium">
                      {step.timeframe}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Refund by Payment Method
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Refund processing times vary depending on your original payment method.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.method}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-lg p-6 text-center"
              >
                <method.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {method.method}
                </h3>
                <div className="text-sm text-blue-600 font-medium mb-2">
                  {method.timeframe}
                </div>
                <p className="text-xs text-gray-600">
                  {method.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Cases */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Special Circumstances
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Some situations may qualify for expedited processing or additional compensation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialCases.map((case_, index) => (
              <motion.div
                key={case_.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className={`w-10 h-10 bg-${case_.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <case_.icon className={`w-5 h-5 text-${case_.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {case_.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {case_.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Common questions about our refund policy.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-lg"
              >
                <button
                  onClick={() => toggleSection(`faq-${index}`)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg"
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                </button>
                {expandedSection === `faq-${index}` && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
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
              Questions About Refunds?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our customer service team is ready to help with any refund-related questions.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Contact Support
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Check Refund Status
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default RefundPolicy;