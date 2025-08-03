import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  GiftIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { Product, Category } from '../types';
import { productsAPI, settingsAPI } from '../utils/api';
import { getImageUrl } from '../utils/helpers';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loading';
import Button from '../components/common/Button';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsResponse, categoriesResponse, settingsResponse] = await Promise.all([
          productsAPI.getFeatured(),
          productsAPI.getCategories(),
          settingsAPI.getSiteSettings(),
        ]);
        
        setFeaturedProducts(productsResponse.data.data || []);
        setCategories(categoriesResponse.data.data || []);
        setSiteSettings(settingsResponse.data.data || {});
      } catch (err: unknown) {
        setError('Failed to load data');
        // console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const categoryIcons = {
    'Gift Cards': GiftIcon,
    'Subscriptions': GiftIcon,
    'Game Top-ups': CpuChipIcon,
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-accent-600 text-white">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full z-0">
          {siteSettings && (siteSettings.heroVideoMobile || siteSettings.heroVideoDesktop) ? (
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/hero-video-placeholder.svg"
            >
              {/* Desktop video for large screens */}
              {siteSettings.heroVideoDesktop && (
                <source 
                  src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${siteSettings.heroVideoDesktop}`} 
                  type="video/mp4" 
                  media="(min-width: 1024px)"
                />
              )}
              {/* Mobile video for small screens */}
              {siteSettings.heroVideoMobile && (
                <source 
                  src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${siteSettings.heroVideoMobile}`} 
                  type="video/mp4" 
                  media="(max-width: 1023px)"
                />
              )}
              {/* Fallback to desktop video if mobile not available */}
              {!siteSettings.heroVideoMobile && siteSettings.heroVideoDesktop && (
                <source 
                  src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${siteSettings.heroVideoDesktop}`} 
                  type="video/mp4"
                />
              )}
              {/* Fallback to mobile video if desktop not available */}
              {!siteSettings.heroVideoDesktop && siteSettings.heroVideoMobile && (
                <source 
                  src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${siteSettings.heroVideoMobile}`} 
                  type="video/mp4"
                />
              )}
            </video>
          ) : (
            /* SVG Fallback when no videos are uploaded */
            <img 
              src="/hero-video-placeholder.svg" 
              alt="Hero background animation"
              className="w-full h-full object-cover"
            />
          )}
        </div>

      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-brand"
            >
              Shop by Category
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Explore our wide range of digital products tailored to your needs
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-md animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
            >
              {categories.slice(0, 3).map((category) => {
                const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || GiftIcon;
                return (
                  <motion.div
                    key={category.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300 group"
                  >
                    <Link to={`/categories/${category.slug}`}>
                      <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4 group-hover:bg-primary-200 transition-colors duration-300 overflow-hidden">
                        {category.image ? (
                           <img
                             src={getImageUrl(category.image)}
                             alt={category.name}
                             className="w-full h-full object-cover rounded-lg"
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                               const fallback = target.nextElementSibling as HTMLElement;
                               if (fallback) fallback.style.display = 'flex';
                             }}
                           />
                         ) : null}
                        <div 
                          className={`w-full h-full flex items-center justify-center ${category.image ? 'hidden' : 'flex'}`}
                          style={{ display: category.image ? 'none' : 'flex' }}
                        >
                          <IconComponent className="h-6 w-6 text-primary-600" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                        Shop Now
                        <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-brand"
            >
              Featured Products
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-600 max-w-2xl mx-auto"
            >
              Handpicked products that our customers love the most
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {featuredProducts.slice(0, 8).map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} variant="default" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && featuredProducts.length > 8 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button size="large">
                <Link to="/products">View All Products</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {[
              {
                title: 'Instant Delivery',
                description: 'Get your digital products delivered instantly to your email',
                icon: '⚡',
              },
              {
                title: 'Secure Payments',
                description: 'Your transactions are protected with bank-level security',
                icon: '🔒',
              },
              {
                title: '24/7 Support',
                description: 'Our customer support team is always here to help you',
                icon: '💬',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;