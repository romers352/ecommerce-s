import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: EyeIcon,
      content: [
        {
          subtitle: 'Personal Information',
          text: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, phone number, billing and shipping addresses, and payment information.',
        },
        {
          subtitle: 'Usage Information',
          text: 'We automatically collect certain information about your use of our services, including your IP address, browser type, operating system, referring URLs, access times, and pages viewed.',
        },
        {
          subtitle: 'Cookies and Tracking',
          text: 'We use cookies and similar tracking technologies to collect information about your browsing activities and to provide personalized experiences.',
        },
      ],
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      icon: DocumentTextIcon,
      content: [
        {
          subtitle: 'Service Provision',
          text: 'We use your information to provide, maintain, and improve our services, process transactions, and deliver products to you.',
        },
        {
          subtitle: 'Communication',
          text: 'We may use your information to send you technical notices, updates, security alerts, and support messages, as well as marketing communications (with your consent).',
        },
        {
          subtitle: 'Analytics and Improvement',
          text: 'We use information to understand how our services are used and to improve our platform, develop new features, and enhance user experience.',
        },
      ],
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      icon: ShieldCheckIcon,
      content: [
        {
          subtitle: 'Service Providers',
          text: 'We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, and customer service.',
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required to do so by law or in response to valid requests by public authorities.',
        },
        {
          subtitle: 'Business Transfers',
          text: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.',
        },
      ],
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: LockClosedIcon,
      content: [
        {
          subtitle: 'Security Measures',
          text: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
        },
        {
          subtitle: 'Encryption',
          text: 'All sensitive information is encrypted during transmission using SSL technology and stored using industry-standard encryption methods.',
        },
        {
          subtitle: 'Access Controls',
          text: 'We limit access to your personal information to employees and contractors who need it to perform their job functions.',
        },
      ],
    },
  ];

  const rights = [
    {
      title: 'Access',
      description: 'You have the right to access the personal information we hold about you.',
    },
    {
      title: 'Correction',
      description: 'You can request correction of inaccurate or incomplete personal information.',
    },
    {
      title: 'Deletion',
      description: 'You can request deletion of your personal information, subject to certain exceptions.',
    },
    {
      title: 'Portability',
      description: 'You can request a copy of your personal information in a structured, machine-readable format.',
    },
    {
      title: 'Objection',
      description: 'You can object to the processing of your personal information for certain purposes.',
    },
    {
      title: 'Restriction',
      description: 'You can request restriction of processing of your personal information in certain circumstances.',
    },
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
            <ShieldCheckIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We are committed to protecting your privacy and ensuring the security of your personal information.
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
                This Privacy Policy describes how we collect, use, and protect your information when you use our e-commerce platform. 
                We respect your privacy and are committed to protecting your personal data.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                This policy applies to all users of our website and services. By using our platform, you agree to the collection 
                and use of information in accordance with this policy.
              </p>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us using the information provided at the end of this document.
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
                
                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.subtitle}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Rights
            </h2>
            <p className="text-xl text-gray-600">
              You have certain rights regarding your personal information under applicable data protection laws.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rights.map((right, index) => (
              <motion.div
                key={right.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-gray-50 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {right.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {right.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Sections */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Cookies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cookies and Tracking Technologies
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We use cookies and similar tracking technologies to enhance your experience on our platform. 
                  Cookies are small data files stored on your device that help us remember your preferences and improve our services.
                </p>
                <p>
                  You can control cookie settings through your browser preferences. However, disabling certain cookies 
                  may affect the functionality of our website.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Types of Cookies We Use:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Essential cookies for website functionality</li>
                    <li>Analytics cookies to understand usage patterns</li>
                    <li>Preference cookies to remember your settings</li>
                    <li>Marketing cookies for personalized advertising (with consent)</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Data Retention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Data Retention
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, 
                  comply with legal obligations, resolve disputes, and enforce our agreements.
                </p>
                <p>
                  When we no longer need your personal information, we will securely delete or anonymize it in accordance with our 
                  data retention policies and applicable laws.
                </p>
              </div>
            </motion.div>

            {/* International Transfers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                International Data Transfers
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure that such transfers are conducted in accordance with applicable data protection laws 
                  and with appropriate safeguards in place.
                </p>
                <p>
                  We use standard contractual clauses and other legal mechanisms to ensure your data receives 
                  adequate protection regardless of where it is processed.
                </p>
              </div>
            </motion.div>

            {/* Changes to Policy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Changes to This Privacy Policy
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. 
                  We will notify you of any material changes by posting the updated policy on our website and updating the 
                  "Last Updated" date.
                </p>
                <p>
                  We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
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
              Questions About This Policy?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              If you have any questions about this Privacy Policy or our data practices, please contact us.
            </p>
            <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> privacy@ecommerce.com</p>
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

export default PrivacyPolicy;