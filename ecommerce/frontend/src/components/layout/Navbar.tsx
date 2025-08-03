import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { settingsAPI, adminAPI, productsAPI } from '../../utils/api';
import { getImageUrl } from '../../utils/helpers';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('DigitalGifts');
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const navigate = useNavigate();

  // Load site settings and main categories
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const response = await settingsAPI.getSiteSettings();
        const settings = response.data.data;
        if (settings.logo) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3006/api/v1';
          const baseUrl = apiUrl.replace('/api/v1', '');
          setLogoUrl(`${baseUrl}/uploads/assets/${settings.logo}?t=${Date.now()}`);
        }
        if (settings.siteName) {
          setSiteName(settings.siteName);
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

    // Listen for logo updates
    const handleLogoUpdate = () => {
      loadSiteSettings();
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  // Fetch suggestions from API
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await productsAPI.getSuggestions(query);
      setSuggestions(response.data.data || []);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input change with debounced suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout for debounced suggestions
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
       document.removeEventListener('mousedown', handleClickOutside);
       // Clear timeout on unmount
       if (debounceTimeoutRef.current) {
         clearTimeout(debounceTimeoutRef.current);
       }
     };
   }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    ...mainCategories.map(category => ({
      name: category.name,
      href: `/categories/${category.slug}`
    })),
    { name: 'All Products', href: '/products' },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - All Screen Sizes */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm lg:text-base">
                  {siteName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="navbar-brand text-white hover:text-blue-300 transition-colors text-sm sm:text-base lg:text-lg">
              <span className="hidden xs:inline">{siteName}</span>
              <span className="xs:hidden">{siteName.substring(0, 2).toUpperCase()}</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-300 hover:text-white font-ui font-medium transition-colors duration-200 relative group text-sm xl:text-base whitespace-nowrap"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Desktop Search Bar */}
            <div className="hidden lg:flex items-center relative">
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-300 hover:text-white transition-colors p-1"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full right-0 mt-2 w-96 z-50"
                    >
                      <div className="relative">
                        <form onSubmit={handleSearch} className="relative">
                          <div className="relative">
                            <input
                               ref={searchInputRef}
                               id="navbar-search-desktop"
                               name="search"
                               type="text"
                               value={searchQuery}
                               onChange={handleInputChange}
                               onKeyDown={handleKeyDown}
                               onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                               placeholder="Search for products..."
                               className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white shadow-lg transition-all duration-300 ease-out"
                               autoFocus
                               autoComplete="off"
                             />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                               <button
                                 type="button"
                                 onClick={() => {
                                   setIsSearchOpen(false);
                                   setShowSuggestions(false);
                                   setSearchQuery('');
                                 }}
                                 className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 ease-out"
                               >
                                 <XMarkIcon className="w-4 h-4" />
                               </button>
                               <button
                                 type="submit"
                                 className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200 ease-out"
                               >
                                 <MagnifyingGlassIcon className="w-4 h-4" />
                               </button>
                             </div>
                           </div>
                         </form>
                        
                        {/* Desktop Suggestions */}
                         {showSuggestions && suggestions.length > 0 && (
                           <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                             <div className="text-xs font-medium text-gray-500 mb-2 px-1">SUGGESTIONS</div>
                             <div className="max-h-48 overflow-y-auto space-y-1">
                               {suggestions.map((suggestion, index) => (
                                 <div
                                   key={index}
                                   onClick={() => handleSuggestionClick(suggestion)}
                                   className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 text-gray-900 rounded-lg transition-all duration-150 ease-out transform hover:translate-x-1 ${
                                     index === activeSuggestionIndex ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''
                                   }`}
                                 >
                                   <div className="flex items-center">
                                     <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                                     <span className="text-sm font-medium">{suggestion}</span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>
             </div>
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white transition-colors p-1"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="hidden sm:block text-gray-300 hover:text-white transition-colors relative p-1"
            >
              <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center font-medium text-[9px] sm:text-[10px]">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="text-gray-300 hover:text-white transition-colors relative p-1"
            >
              <ShoppingCartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center font-medium text-[9px] sm:text-[10px]">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                  {user?.avatar ? (
                    <img
                      src={getImageUrl(user.avatar)}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                  <span className="hidden lg:block font-ui text-sm">
                    {user?.firstName}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white font-ui font-medium transition-colors text-xs sm:text-sm lg:text-base"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-lg font-ui font-medium transition-colors text-xs sm:text-sm lg:text-base"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-gray-300 hover:text-white transition-colors ml-1 sm:ml-2"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-gray-800 border-t border-gray-700"
          >
            <div className="px-3 sm:px-4 py-3 sm:py-4 relative">
              <form onSubmit={handleSearch} className="flex">
                <input
                  ref={searchInputRef}
                  id="navbar-search-mobile"
                  name="search"
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search products..."
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setShowSuggestions(false);
                    setSearchQuery('');
                  }}
                  className="px-3 sm:px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
              
              {/* Mobile Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-3 right-3 sm:left-4 sm:right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1 max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-900 ${
                        index === activeSuggestionIndex ? 'bg-blue-50 text-blue-600' : ''
                      } ${
                        index === 0 ? 'rounded-t-lg' : ''
                      } ${
                        index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-sm sm:text-base">{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-gray-800 border-t border-gray-700"
          >
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1 sm:space-y-2">
              {/* Mobile Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-gray-300 hover:text-white font-ui font-medium py-2 sm:py-3 transition-colors text-sm sm:text-base border-b border-gray-700 last:border-b-0"
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Wishlist Link */}
              <Link
                to="/wishlist"
                onClick={() => setIsMenuOpen(false)}
                className="sm:hidden flex items-center justify-between text-gray-300 hover:text-white font-ui font-medium py-2 sm:py-3 transition-colors text-sm border-b border-gray-700"
              >
                <div className="flex items-center space-x-2">
                  <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Wishlist</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;