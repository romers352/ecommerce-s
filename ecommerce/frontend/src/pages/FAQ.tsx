import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const faqData: FAQItem[] = [
    // General Questions
    {
      id: '1',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most digital products. Physical products can be returned within 14 days of delivery. Items must be in original condition. Digital products are generally non-refundable unless there are technical issues.',
      category: 'General',
    },
    {
      id: '2',
      question: 'How do I create an account?',
      answer: 'Click the "Register" button in the top right corner of our website. Fill in your email, create a password, and verify your email address. You can also sign up using your Google or Facebook account for faster registration.',
      category: 'General',
    },
    {
      id: '3',
      question: 'Is my personal information secure?',
      answer: 'Yes, we take security seriously. We use industry-standard SSL encryption, secure payment processing, and never store your payment information on our servers. Your personal data is protected according to GDPR and other privacy regulations.',
      category: 'General',
    },
    
    // Orders & Shipping
    {
      id: '4',
      question: 'How can I track my order?',
      answer: 'Once your order is processed, you\'ll receive a confirmation email with tracking information. You can also log into your account and visit the "My Orders" section to track all your purchases in real-time.',
      category: 'Orders & Shipping',
    },
    {
      id: '5',
      question: 'What shipping options do you offer?',
      answer: 'For digital products, delivery is instant via email. For physical products, we offer standard shipping (3-5 business days), express shipping (1-2 business days), and overnight delivery in select areas.',
      category: 'Orders & Shipping',
    },
    {
      id: '6',
      question: 'Can I change or cancel my order?',
      answer: 'You can modify or cancel your order within 1 hour of placing it, provided it hasn\'t been processed yet. For digital products, cancellation may not be possible once the download link is sent.',
      category: 'Orders & Shipping',
    },
    
    // Payment & Billing
    {
      id: '7',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through our encrypted payment gateway.',
      category: 'Payment & Billing',
    },
    {
      id: '8',
      question: 'Why was my payment declined?',
      answer: 'Payment declines can happen for various reasons: insufficient funds, incorrect card details, expired card, or bank security measures. Please check your information and try again, or contact your bank if the issue persists.',
      category: 'Payment & Billing',
    },
    {
      id: '9',
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer refunds according to our return policy. Digital products are refunded if there are technical issues or if the product doesn\'t match the description. Physical products can be refunded within 14 days.',
      category: 'Payment & Billing',
    },
    
    // Technical Support
    {
      id: '10',
      question: 'I\'m having trouble downloading my digital product',
      answer: 'Check your email for the download link, including spam folders. Links are valid for 30 days. If you\'re still having issues, try a different browser or device. Contact support if the problem persists.',
      category: 'Technical Support',
    },
    {
      id: '11',
      question: 'The website is not working properly',
      answer: 'Try clearing your browser cache and cookies, disable browser extensions, or try a different browser. Make sure you have a stable internet connection. If issues persist, please contact our technical support team.',
      category: 'Technical Support',
    },
    {
      id: '12',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a reset link. Check your spam folder if you don\'t see the email within a few minutes.',
      category: 'Technical Support',
    },
    
    // Account & Profile
    {
      id: '13',
      question: 'How do I update my profile information?',
      answer: 'Log into your account and go to "Profile Settings". You can update your name, email, phone number, and address. Some changes may require email verification for security.',
      category: 'Account & Profile',
    },
    {
      id: '14',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from the Profile Settings page. Please note that this action is permanent and will remove all your order history and saved information.',
      category: 'Account & Profile',
    },
    {
      id: '15',
      question: 'How do I change my email preferences?',
      answer: 'Go to your Profile Settings and click on "Email Preferences". You can choose which types of emails you want to receive, including order updates, promotions, and newsletters.',
      category: 'Account & Profile',
    },
  ];

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
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
            <QuestionMarkCircleIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about our products, services, and policies.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            {/* Search Bar */}
            <div className="relative mb-6">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="faq-search"
                name="search"
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <QuestionMarkCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or category filter.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200 ease-out"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">
                        {item.question}
                      </h3>
                    </div>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openItems.has(item.id) ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <AnimatePresence>
                    {openItems.has(item.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 border-t border-gray-100">
                          <p className="text-gray-600 pt-4 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
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
              Still have questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 ease-out transform hover:scale-105">
                Contact Support
              </button>
              <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 ease-out transform hover:scale-105">
                Live Chat
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">{faqData.length}</div>
              <div className="text-gray-600">Questions Answered</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">&lt;1hr</div>
              <div className="text-gray-600">Average Response Time</div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;