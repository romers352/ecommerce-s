import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TruckIcon,
  ClockIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const Shipping: React.FC = () => {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    navigate('/contact');
  };

  const handleTrackOrder = () => {
    navigate('/orders');
  };
  const shippingOptions = [
    {
      icon: TruckIcon,
      name: 'Standard Shipping',
      description: 'Reliable delivery for most orders',
      timeframe: '3-5 business days',
      cost: 'Free on orders over $50',
      features: ['Tracking included', 'Insurance up to $100', 'Signature not required'],
    },
    {
      icon: ClockIcon,
      name: 'Express Shipping',
      description: 'Faster delivery when you need it quickly',
      timeframe: '1-2 business days',
      cost: '$9.99',
      features: ['Priority handling', 'Tracking included', 'Insurance up to $500'],
    },
    {
      icon: ShieldCheckIcon,
      name: 'Overnight Delivery',
      description: 'Next business day delivery',
      timeframe: 'Next business day',
      cost: '$19.99',
      features: ['Guaranteed delivery', 'Signature required', 'Full insurance coverage'],
    },
    {
      icon: GlobeAltIcon,
      name: 'International Shipping',
      description: 'Worldwide delivery available',
      timeframe: '7-14 business days',
      cost: 'Varies by destination',
      features: ['Customs handling', 'Tracking included', 'Duty and tax handling'],
    },
  ];

  const digitalDelivery = {
    icon: MapPinIcon,
    name: 'Digital Products',
    description: 'Instant delivery via email',
    timeframe: 'Immediate',
    cost: 'Free',
    features: ['Instant access', 'Download links', 'License keys included'],
  };

  const shippingZones = [
    {
      zone: 'Zone 1 - Local',
      regions: ['Same city/state'],
      standardCost: 'Free over $25',
      expressCost: '$5.99',
      timeframe: '1-2 days',
    },
    {
      zone: 'Zone 2 - National',
      regions: ['Within country'],
      standardCost: 'Free over $50',
      expressCost: '$9.99',
      timeframe: '3-5 days',
    },
    {
      zone: 'Zone 3 - International',
      regions: ['North America', 'Europe'],
      standardCost: '$15.99',
      expressCost: '$29.99',
      timeframe: '7-10 days',
    },
    {
      zone: 'Zone 4 - Worldwide',
      regions: ['Asia', 'Australia', 'Other'],
      standardCost: '$24.99',
      expressCost: '$39.99',
      timeframe: '10-14 days',
    },
  ];

  const restrictions = [
    'Some products may have shipping restrictions based on local laws',
    'Hazardous materials cannot be shipped internationally',
    'Large items may require special handling and additional fees',
    'Remote areas may have extended delivery times',
    'Digital products are not subject to shipping restrictions',
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
            <TruckIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Shipping Information
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn about our shipping options, delivery times, and costs to get your orders delivered safely and on time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Digital Delivery Highlight */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white"
          >
            <div className="flex items-center mb-4">
              <digitalDelivery.icon className="w-12 h-12 mr-4" />
              <div>
                <h2 className="text-2xl font-bold">{digitalDelivery.name}</h2>
                <p className="text-blue-100">{digitalDelivery.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{digitalDelivery.timeframe}</div>
                <div className="text-blue-100">Delivery Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{digitalDelivery.cost}</div>
                <div className="text-blue-100">Shipping Cost</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-blue-100">Availability</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Physical Product Shipping Options
            </h2>
            <p className="text-xl text-gray-600">
              Choose the shipping method that best fits your needs and timeline
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingOptions.map((option, index) => (
              <motion.div
                key={option.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <option.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {option.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {option.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Delivery:</span>
                    <span className="text-sm font-medium">{option.timeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Cost:</span>
                    <span className="text-sm font-medium">{option.cost}</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {option.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <div className="w-1 h-1 bg-blue-600 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Zones */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shipping Zones & Rates
            </h2>
            <p className="text-xl text-gray-600">
              Shipping costs and delivery times vary by destination
            </p>
          </motion.div>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Zone</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Regions</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Standard</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Express</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Timeframe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shippingZones.map((zone, index) => (
                  <motion.tr
                    key={zone.zone}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {zone.zone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.regions.join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.standardCost}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.expressCost}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {zone.timeframe}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Shipping Process */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Shipping Works
            </h2>
            <p className="text-xl text-gray-600">
              From order to delivery, here's what happens to your package
            </p>
          </motion.div>
          
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Order Processing',
                description: 'Your order is received and processed within 1-2 business days. You\'ll receive a confirmation email with order details.',
                time: '1-2 business days',
              },
              {
                step: '2',
                title: 'Package Preparation',
                description: 'Items are carefully packaged and prepared for shipment. A tracking number is generated and sent to you.',
                time: 'Same day',
              },
              {
                step: '3',
                title: 'In Transit',
                description: 'Your package is picked up by our shipping partner and begins its journey to you. Track progress with your tracking number.',
                time: 'Varies by method',
              },
              {
                step: '4',
                title: 'Out for Delivery',
                description: 'Your package arrives at the local facility and is loaded for final delivery to your address.',
                time: 'Delivery day',
              },
              {
                step: '5',
                title: 'Delivered',
                description: 'Package is delivered to your specified address. You\'ll receive a delivery confirmation notification.',
                time: 'Complete',
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
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
        </div>
      </section>

      {/* Restrictions & Policies */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shipping Restrictions & Policies
            </h2>
            <p className="text-xl text-gray-600">
              Important information about shipping limitations and policies
            </p>
          </motion.div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Please Note:
            </h3>
            <ul className="space-y-3">
              {restrictions.map((restriction, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{restriction}</span>
                </motion.li>
              ))}
            </ul>
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
              Questions About Shipping?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our customer service team is here to help with any shipping questions or concerns.
            </p>
            <div className="space-x-4">
              <button 
                onClick={handleContactSupport}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </button>
              <button 
                onClick={handleTrackOrder}
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Track Order
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Shipping;