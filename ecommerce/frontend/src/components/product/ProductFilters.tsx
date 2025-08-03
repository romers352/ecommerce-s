import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { ProductFilters as Filters, Category } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';

interface ProductFiltersProps {
  filters: Filters;
  categories: Category[];
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleCategoryChange = (categoryId: number) => {
    console.log('🏷️ handleCategoryChange called with categoryId:', categoryId);
    const currentCategories = filters.categoryIds || [];
    console.log('🏷️ currentCategories:', currentCategories);
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    console.log('🏷️ newCategories:', newCategories);
    console.log('🏷️ Calling handleFilterChange with categoryIds:', newCategories);
    
    handleFilterChange('categoryIds', newCategories);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleFilterChange('priceRange', {
      ...filters.priceRange,
      [type]: numValue,
    });
  };

  const FilterSection: React.FC<{
    title: string;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggleSection(sectionKey);
        }}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const filterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="small"
            onClick={(e) => {
              e?.preventDefault();
              onClearFilters();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <Input
          id="product-search"
          name="search"
          placeholder="Search products..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          fullWidth
        />
      </div>

      {/* Categories */}
      <FilterSection title="Categories" sectionKey="category">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                id={`category-${category.id}`}
                name="categoryIds"
                type="checkbox"
                checked={filters.categoryIds?.includes(category.id) || false}
                onChange={() => handleCategoryChange(category.id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" sectionKey="price">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="price-min"
              name="priceMin"
              type="number"
              placeholder="Min"
              value={filters.priceRange?.min?.toString() || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
            />
            <Input
              id="price-max"
              name="priceMax"
              type="number"
              placeholder="Max"
              value={filters.priceRange?.max?.toString() || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
            />
          </div>
          
          {/* Quick Price Filters */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Under $25', max: 25 },
              { label: '$25 - $50', min: 25, max: 50 },
              { label: '$50 - $100', min: 50, max: 100 },
              { label: 'Over $100', min: 100 },
            ].map((range, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleFilterChange('priceRange', range);
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer Rating" sectionKey="rating">
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center">
              <input
                id={`min-rating-${rating}`}
                name="rating"
                type="radio"
                checked={filters.minRating === rating}
                onChange={() => handleFilterChange('minRating', rating)}
                className="border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-2 flex items-center">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, index) => (
                    <svg
                      key={index}
                      className={`h-4 w-4 ${
                        index < rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-1 text-sm text-gray-600">& Up</span>
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" sectionKey="availability">
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              id="in-stock"
              name="inStock"
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
          </label>
          
          <label className="flex items-center">
            <input
              id="on-sale"
              name="onSale"
              type="checkbox"
              checked={filters.onSale || false}
              onChange={(e) => handleFilterChange('onSale', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">On Sale</span>
          </label>
        </div>
      </FilterSection>

      {/* Sort By */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Sort By</h3>
        <select
          id="sort-by"
          name="sortBy"
          value={filters.sortBy || 'featured'}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Customer Rating</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {filterContent}
        </div>
      </div>

      {/* Mobile Filters */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onToggle}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
            >
              <div className="p-6">{filterContent}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductFilters;