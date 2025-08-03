import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  GiftIcon,
  PlayIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { Category } from '../types';
import { productsAPI } from '../utils/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

interface CategoryFilters {
  search: string;
  sortBy: 'name' | 'newest' | 'products';
  sortOrder: 'asc' | 'desc';
  showInactive: boolean;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    showInactive: false,
  });

  const categoryIcons = {
    'Gift Cards': GiftIcon,
    'Subscriptions': PlayIcon,
    'Game Top-ups': CpuChipIcon,
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getCategories();
        setCategories(response.data.data || []);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = [...categories];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'newest':
          comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          break;
        case 'products':
          comparison = (b.productCount || 0) - (a.productCount || 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredCategories(filtered);
  }, [categories, filters]);

  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      showInactive: false,
    });
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                All Categories
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${filteredCategories.length} categories found`}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar - Desktop */}
              <div className="hidden lg:block">
                <Input
                  placeholder="Search categories..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-64"
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                />
              </div>
              
              {/* Sort Dropdown */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm w-full sm:min-w-[160px] sm:flex-shrink-0"
              >
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="newest-desc">Newest First</option>
                <option value="products-desc">Most Products</option>
              </select>
              
              {/* View Mode Toggle */}
              <div className="hidden sm:flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FunnelIcon className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Search */}
          <div className="lg:hidden mt-4">
            <Input
              placeholder="Search categories..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              fullWidth
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {(isFilterOpen || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:w-64 lg:flex-shrink-0"
              >
                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FunnelIcon className="h-5 w-5 mr-2" />
                      Filters
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={clearFilters}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Clear All
                      </Button>
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
                    <div className="space-y-2">
                      {[
                        { value: 'name', label: 'Name' },
                        { value: 'newest', label: 'Newest' },
                        { value: 'products', label: 'Product Count' },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="sortBy"
                            checked={filters.sortBy === option.value}
                            onChange={() => handleFilterChange('sortBy', option.value)}
                            className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sortOrder"
                          checked={filters.sortOrder === 'asc'}
                          onChange={() => handleFilterChange('sortOrder', 'asc')}
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ascending</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sortOrder"
                          checked={filters.sortOrder === 'desc'}
                          onChange={() => handleFilterChange('sortOrder', 'desc')}
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Descending</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories Grid/List */}
          <div className="flex-1">
            {loading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-md animate-pulse">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search terms or filters.</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}
              >
                {filteredCategories.map((category) => {
                  const IconComponent = categoryIcons[category.name as keyof typeof categoryIcons] || GiftIcon;
                  
                  return (
                    <motion.div
                      key={category.id}
                      variants={itemVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group ${
                        viewMode === 'list' ? 'flex items-center p-6' : 'p-6'
                      }`}
                    >
                      <Link to={`/products?category=${category.id}`} className="block w-full">
                        <div className={`flex ${viewMode === 'list' ? 'items-center space-x-4' : 'flex-col'}`}>
                          <div className={`flex items-center justify-center bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors duration-300 ${
                            viewMode === 'list' ? 'w-12 h-12 flex-shrink-0' : 'w-12 h-12 mb-4'
                          }`}>
                            <IconComponent className="h-6 w-6 text-primary-600" />
                          </div>
                          
                          <div className={viewMode === 'list' ? 'flex-1' : ''}>
                            <h3 className={`font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 ${
                              viewMode === 'list' ? 'text-lg' : 'text-xl mb-2'
                            }`}>
                              {category.name}
                            </h3>
                            
                            {category.description && (
                              <p className={`text-gray-600 ${
                                viewMode === 'list' ? 'text-sm' : 'mb-4'
                              }`}>
                                {category.description}
                              </p>
                            )}
                            
                            {category.productCount !== undefined && (
                              <p className={`text-sm text-gray-500 ${
                                viewMode === 'list' ? 'mt-1' : 'mb-4'
                              }`}>
                                {category.productCount} products
                              </p>
                            )}
                            
                            <div className={`flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-all duration-200 ease-out ${
                              viewMode === 'list' ? 'mt-2' : ''
                            }`}>
                              Shop Now
                              <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;