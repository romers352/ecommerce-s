import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Product, Category, ProductFilters as Filters, PaginatedResponse } from '../types';
import { productsAPI } from '../utils/api';
import { debounce, updateQueryParams, getQueryParams } from '../utils/helpers';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import { ProductCardSkeleton } from '../components/common/Loading';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Products: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categoryIds: [],
    priceRange: {},
    minRating: undefined,
    inStock: false,
    onSale: false,
    sortBy: 'featured',
  });

  // Initialize filters from URL params
  useEffect(() => {
    const params = getQueryParams();
    const initialFilters: Filters = {
      search: params.search || '',
      categoryIds: params.categoryIds 
        ? params.categoryIds.split(',').map(id => parseInt(id.trim()))
        : params.categoryId 
        ? [parseInt(params.categoryId)] 
        : [],
      priceRange: {
        min: params.minPrice ? parseFloat(params.minPrice) : undefined,
        max: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      },
      minRating: params.minRating ? parseInt(params.minRating) : undefined,
      inStock: params.inStock === 'true',
      onSale: params.onSale === 'true',
      sortBy: (params.sortBy as 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rating' | 'newest' | null) || 'featured',
    };
    setFilters(initialFilters);
    setPagination(prev => ({
      ...prev,
      page: params.page ? parseInt(params.page) : 1,
    }));
  }, []);

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce((searchFilters: Filters, page?: number) => {
      fetchProducts(searchFilters, page || 1);
    }, 500),
    []
  );

  // Fetch products
  const fetchProducts = async (searchFilters: Filters, page: number = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

      // Convert frontend sortBy to backend format
      let backendSortBy = 'newest';
      let sortOrder = 'desc';
      
      switch (searchFilters.sortBy) {
        case 'price_asc':
          backendSortBy = 'price';
          sortOrder = 'asc';
          break;
        case 'price_desc':
          backendSortBy = 'price';
          sortOrder = 'desc';
          break;
        case 'name_asc':
          backendSortBy = 'name';
          sortOrder = 'asc';
          break;
        case 'name_desc':
          backendSortBy = 'name';
          sortOrder = 'desc';
          break;
        case 'rating':
          backendSortBy = 'rating';
          sortOrder = 'desc';
          break;
        case 'featured':
          backendSortBy = 'featured';
          sortOrder = 'desc';
          break;
        case 'newest':
        default:
          backendSortBy = 'newest';
          sortOrder = 'desc';
          break;
      }

      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: backendSortBy,
        sortOrder,
      };

      // Only add parameters if they have valid values
      if (searchFilters.search) {
        params.search = searchFilters.search;
      }
      if (searchFilters.categoryIds && searchFilters.categoryIds.length > 0) {
        // Send multiple category IDs as comma-separated string
        params.categoryIds = searchFilters.categoryIds.join(',');
      }
      if (searchFilters.priceRange?.min !== undefined) {
        params.minPrice = searchFilters.priceRange.min;
      }
      if (searchFilters.priceRange?.max !== undefined) {
        params.maxPrice = searchFilters.priceRange.max;
      }
      if (searchFilters.minRating) {
        params.minRating = searchFilters.minRating;
      }
      if (searchFilters.inStock) {
        params.inStock = searchFilters.inStock;
      }
      if (searchFilters.onSale) {
        params.onSale = searchFilters.onSale;
      }

      // Update URL params
      updateQueryParams({
        page: page.toString(),
        search: params.search || null,
        categoryIds: params.categoryIds || null,
        minPrice: params.minPrice?.toString() || null,
        maxPrice: params.maxPrice?.toString() || null,
        minRating: params.minRating?.toString() || null,
        inStock: params.inStock ? 'true' : null,
        onSale: params.onSale ? 'true' : null,
        sortBy: searchFilters.sortBy === 'featured' ? null : searchFilters.sortBy || null,
      });

      console.log('🔍 API Request params:', params);
      const response = await productsAPI.getAll(params);
      const data: PaginatedResponse<Product> = response.data;
      console.log('✅ API Response:', data);
      console.log('✅ Products found:', data.data.length);

      setProducts(data.data);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      });
    } catch (err) {
      setError('Failed to load products');
      // console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (err) {
      // console.error('Error fetching categories:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle category slug from URL
  useEffect(() => {
    if (categories.length > 0) {
      if (slug) {
        // If there's a slug, filter by that category
        const category = categories.find(cat => cat.slug === slug);
        if (category) {
          setFilters(prev => ({
            ...prev,
            categoryIds: [category.id]
          }));
        }
      } else {
        // If no slug (i.e., /products route), clear category filters
        setFilters(prev => ({
          ...prev,
          categoryIds: []
        }));
      }
    }
  }, [slug, categories]);

  // Fetch products when filters change
  useEffect(() => {
    // Reset to page 1 when filters change (except on initial load)
    setPagination(prev => ({ ...prev, page: 1 }));
    debouncedSearch(filters, 1);
  }, [filters, debouncedSearch]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: Filters) => {
    console.log('handleFiltersChange called with newFilters:', newFilters);
    setFilters(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters: Filters = {
      search: '',
      categoryIds: [],
      priceRange: {},
      minRating: undefined,
      inStock: false,
      onSale: false,
      sortBy: 'featured',
    };
    setFilters(clearedFilters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    // Use debounced search to maintain consistency with filter changes
    debouncedSearch(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render pagination
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            i === pagination.page
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100"
        >
          Next
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => debouncedSearch(filters)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 font-brand">Products</h1>
          
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search products..."
                value={filters.search || ''}
                onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                fullWidth
              />
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden"
                icon={<FunnelIcon className="h-4 w-4" />}
              >
                Filters
              </Button>
              
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 lg:flex-shrink-0">
            <ProductFilters
              filters={filters}
              categories={categories}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Info */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {loading ? (
                  'Loading...'
                ) : (
                  `Showing ${products.length} of ${pagination.total} products`
                )}
              </p>
            </div>

            {/* Products */}
            {loading ? (
              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}>
                {Array.from({ length: pagination.limit }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <Button onClick={handleClearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`grid gap-4 sm:gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard
                      product={product}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {!loading && renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;