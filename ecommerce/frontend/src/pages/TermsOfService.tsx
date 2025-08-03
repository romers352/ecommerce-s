import React from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const TermsOfService: React.FC = () => {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: DocumentTextIcon,
      content: [
        'By accessing and using this website and our services, you accept and agree to be bound by the terms and provision of this agreement.',
        'If you do not agree to abide by the above, please do not use this service.',
        'These terms apply to all visitors, users, and others who access or use the service.',
      ],
    },
    {
      id: 'definitions',
      title: 'Definitions',
      icon: DocumentTextIcon,
      content: [
        '"Service" refers to the e-commerce platform, website, and all related services provided by our company.',
        '"User" or "You" refers to any individual or entity that accesses or uses our service.',
        '"Content" refers to all text, graphics, images, music, software, audio, video, information, or other materials.',
        '"Products" refers to all digital and physical goods available for purchase through our platform.',
      ],
    },
    {
      id: 'user-accounts',
      title: 'User Accounts',
      icon: ShieldCheckIcon,
      content: [
        'You must create an account to access certain features of our service.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You agree to provide accurate, current, and complete information during registration.',
        'You are responsible for all activities that occur under your account.',
        'You must notify us immediately of any unauthorized use of your account.',
      ],
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use Policy',
      icon: ScaleIcon,
      content: [
        'You agree not to use the service for any unlawful purpose or in any way that could damage our service.',
        'You will not attempt to gain unauthorized access to any part of the service.',
        'You will not transmit any viruses, malware, or other harmful code.',
        'You will not engage in any activity that interferes with or disrupts the service.',
        'You will not use the service to harass, abuse, or harm others.',
      ],
    },
  ];

  const prohibitedActivities = [
    'Violating any applicable laws or regulations',
    'Infringing on intellectual property rights',
    'Transmitting spam or unsolicited communications',
    'Attempting to reverse engineer our software',
    'Using automated systems to access the service',
    'Collecting user information without consent',
    'Impersonating others or providing false information',
    'Engaging in fraudulent activities',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <ScaleIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Please read these terms carefully before using our service. By using our platform, you agree to these terms.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Last Updated:</strong> January 1, 2024
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Introduction
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to our e-commerce platform. These Terms of Service ("Terms") govern your use of our website 
                and services. These Terms constitute a legally binding agreement between you and our company.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                By accessing or using our service, you signify that you have read, understood, and agree to be bound 
                by these Terms. If you do not agree to these Terms, you may not access or use our service.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon 
                posting on our website. Your continued use of the service after changes are posted constitutes 
                acceptance of the modified Terms.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Sections */}
      <section className="pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-lg p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {section.content.map((item, itemIndex) => (
                    <p key={itemIndex} className="text-gray-600 leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prohibited Activities */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <ExclamationTriangleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Prohibited Activities
            </h2>
            <p className="text-xl text-gray-600">
              The following activities are strictly prohibited when using our service:
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prohibitedActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.05 * index }}
                className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{activity}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Terms */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Purchases and Payments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Purchases and Payments
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  All purchases are subject to product availability. We reserve the right to refuse or cancel orders 
                  at our discretion, including orders that appear fraudulent or violate these Terms.
                </p>
                <p>
                  Prices are subject to change without notice. All payments must be made in full before products 
                  are delivered. We accept various payment methods as displayed during checkout.
                </p>
                <p>
                  For digital products, access is typically granted immediately upon successful payment. 
                  For physical products, delivery times vary based on location and shipping method selected.
                </p>
              </div>
            </motion.div>

            {/* Intellectual Property */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Intellectual Property Rights
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  The service and its original content, features, and functionality are owned by our company and are 
                  protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, 
                  republish, download, store, or transmit any of our content without prior written consent.
                </p>
                <p>
                  Our trademarks and trade dress may not be used in connection with any product or service without 
                  our prior written consent.
                </p>
              </div>
            </motion.div>

            {/* Disclaimers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Disclaimers and Limitation of Liability
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  The service is provided on an "as is" and "as available" basis. We make no representations or warranties 
                  of any kind, express or implied, regarding the operation of the service or the information, content, 
                  materials, or products included on the service.
                </p>
                <p>
                  To the full extent permissible by applicable law, we disclaim all warranties, express or implied, 
                  including but not limited to implied warranties of merchantability and fitness for a particular purpose.
                </p>
                <p>
                  We will not be liable for any damages of any kind arising from the use of the service, including but not 
                  limited to direct, indirect, incidental, punitive, and consequential damages.
                </p>
              </div>
            </motion.div>

            {/* Termination */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Termination
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may terminate or suspend your account and bar access to the service immediately, without prior notice 
                  or liability, under our sole discretion, for any reason whatsoever, including but not limited to a 
                  breach of the Terms.
                </p>
                <p>
                  If you wish to terminate your account, you may simply discontinue using the service or contact us 
                  to request account deletion.
                </p>
                <p>
                  Upon termination, your right to use the service will cease immediately. All provisions of the Terms 
                  which by their nature should survive termination shall survive termination.
                </p>
              </div>
            </motion.div>

            {/* Governing Law */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Governing Law and Dispute Resolution
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which our company 
                  is incorporated, without regard to its conflict of law provisions.
                </p>
                <p>
                  Any disputes arising from these Terms or your use of the service shall be resolved through binding 
                  arbitration in accordance with the rules of the relevant arbitration association.
                </p>
                <p>
                  You agree to waive any right to a jury trial and to participate in class action lawsuits or 
                  class-wide arbitration.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Questions About These Terms?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              If you have any questions about these Terms of Service, please contact us.
            </p>
            <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> legal@ecommerce.com</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Address:</strong> 123 Digital Street, Tech City, TC 12345</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;