import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { productsAPI } from '../utils/api';
import { getImageUrl } from '../utils/helpers';


interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
}

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [allResults, setAllResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await productsAPI.getSuggestions(query, 5);
      if (response.data.success) {
        setSuggestions(response.data.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const performSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await productsAPI.search(query, { limit: 50 });
      
      if (response.data.success) {
        const products = response.data.data || [];
        // Transform the API response to match our Product interface
        const transformedProducts = products.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          image: getImageUrl(product.images?.[0] || '/placeholder-product.jpg'),
          category: product.category?.name || 'Uncategorized',
          rating: product.averageRating || 0,
          reviews: product.reviewCount || 0
        }));
        setAllResults(transformedProducts);
      } else {
        setAllResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setAllResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load search results if query exists
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    } else {
      setAllResults([]);
    }
  }, [searchParams, performSearch]);

  // Handle search input change with debounced suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setActiveSuggestionIndex(-1);
    
    // Debounce suggestions
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      performSearch(searchQuery);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSearchParams({ q: suggestion });
    performSearch(suggestion);
    setShowSuggestions(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use search results directly without additional filtering
  const displayResults = allResults;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                ref={searchInputRef}
                id="search-query"
                name="searchQuery"
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search for products..."
                className="w-full px-4 py-3 pl-12 pr-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-out"
                autoComplete="off"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 ease-out hover:scale-105"
              >
                Search
              </button>
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-all duration-150 ease-out ${
                        index === activeSuggestionIndex ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                      } ${index === 0 ? 'rounded-t-lg' : ''} ${
                        index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-3" />
                        <span>{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Search Products'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Searching...' : searchQuery ? `${displayResults.length} products found` : 'Enter a search term to find products'}
          </p>
        </div>

        {/* Results Grid */}
        <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-300 h-4 rounded mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : displayResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayResults.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ease-out transform hover:scale-105"
                  >
                    <Link to={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-indigo-600">${product.price.toFixed(2)}</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600">{product.rating} ({product.reviews})</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try searching for different keywords.</p>
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 ease-out transform hover:scale-105"
                >
                  Browse All Products
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
                <p className="text-gray-600">Enter a product name in the search box above to find what you're looking for.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Search;