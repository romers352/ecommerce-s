import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, settingsAPI, adminAPI } from '../../utils/api';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [siteName, setSiteName] = useState('E-Commerce');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [contactEmail, setContactEmail] = useState('support@digitalgifts.com');
  const [contactPhone, setContactPhone] = useState('+1 (555) 123-4567');
  const [address, setAddress] = useState('123 Digital Street, Tech City, TC 12345');
  const [siteDescription, setSiteDescription] = useState('Your trusted destination for digital gift cards, subscriptions, and game top-ups. Instant delivery, secure payments, and 24/7 customer support.');
  const [mainCategories, setMainCategories] = useState<any[]>([]);

  // Load site settings
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await settingsAPI.getSiteSettings();
        const settings = response.data.data;
        if (settings.siteName) {
          setSiteName(settings.siteName);
        }
        if (settings.footerLogo) {
          setLogoUrl(`http://localhost:3006/uploads/assets/${settings.footerLogo}?t=${Date.now()}`);
        }
        if (settings.socialLinks) {
          setSocialLinks(settings.socialLinks);
        }
        if (settings.contactEmail) {
          setContactEmail(settings.contactEmail);
        }
        if (settings.contactPhone) {
          setContactPhone(settings.contactPhone);
        }
        if (settings.address) {
          setAddress(settings.address);
        }
        if (settings.siteDescription) {
          setSiteDescription(settings.siteDescription);
        }
      } catch (error) {
        console.error('Failed to load site settings:', error);
      }
    };

    const loadMainCategories = async () => {
      try {
        const response = await adminAPI.getMainCategories();
        setMainCategories(response.data.data || []);
      } catch (error) {
        console.error('Failed to load main categories:', error);
       }
     };
 
     loadSiteSettings();
     loadMainCategories();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      await api.post('/newsletter/subscribe', { email: email.trim() });
      setMessage('Successfully subscribed to newsletter!');
      setMessageType('success');
      setEmail('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Shipping Info', href: '/shipping' },
      { name: 'Returns', href: '/returns' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Refund Policy', href: '/refund' },
    ],
    categories: [
      ...mainCategories.map(category => ({
        name: category.name,
        href: `/categories/${category.slug}`
      })),
      { name: 'All Products', href: '/products' },
    ],
  };

  // Generate social links from settings
  const getSocialLinksArray = () => {
    const socialIcons = {
      facebook: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
      instagram: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z" />
        </svg>
      ),
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      youtube: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    };

    return Object.entries(socialLinks)
      .filter(([, url]) => url && typeof url === 'string' && url.trim() !== '')
      .map(([platform, url]) => ({
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        href: url as string,
        icon: socialIcons[platform as keyof typeof socialIcons] || null,
      }))
      .filter(link => link.icon !== null);
  };

  const dynamicSocialLinks = getSocialLinksArray();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="w-8 h-8 object-contain"
                  onError={() => setLogoUrl(null)}
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {siteName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="navbar-brand text-xl">
                {siteName}
              </span>
            </div>
            <p className="text-gray-400 mb-4 sm:mb-6 max-w-md font-body text-sm sm:text-base">
              {siteDescription}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-3 text-gray-400">
                <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-body text-sm sm:text-base">{contactEmail}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-body text-sm sm:text-base">{contactPhone}</span>
              </div>
              <div className="flex items-start space-x-3 text-gray-400">
                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <span className="font-body text-sm sm:text-base">{address}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-ui font-semibold text-base sm:text-lg mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors font-body text-sm sm:text-base"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-ui font-semibold text-base sm:text-lg mb-3 sm:mb-4">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors font-body"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-ui font-semibold text-base sm:text-lg mb-3 sm:mb-4">Categories</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors font-body"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="mb-4 md:mb-0">
              <h3 className="font-ui font-semibold text-base sm:text-lg mb-2">Stay Updated</h3>
              <p className="text-gray-400 font-body text-sm sm:text-base">Get the latest deals and offers delivered to your inbox.</p>
            </div>
            <div className="w-full md:w-auto">
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row w-full md:w-auto gap-2 sm:gap-0">
                <input
                  type="email"
                  id="newsletter-email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 md:w-64 px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-body text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none transition-colors font-ui font-medium text-sm sm:text-base"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              {message && (
                <p className={`mt-2 text-sm font-body ${
                  messageType === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6 text-center sm:text-left">
              <p className="text-gray-400 font-body text-sm">
                © {currentYear} E-Commerce. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 md:gap-6">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-body"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-3 sm:space-x-4 mt-2 md:mt-0">
              {dynamicSocialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label={social.name}
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5">
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>


      </div>
    </footer>
  );
};

export default Footer;