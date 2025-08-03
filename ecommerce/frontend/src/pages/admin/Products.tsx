import React, { useState, useEffect } from 'react';
import { adminAPI, productsAPI } from '../../utils/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  sku: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    stock: '',
    sku: '',
    categoryId: '',
    weight: '',
    dimensions: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    isActive: true,
    isFeatured: false,
    isDigital: false
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchTerm, statusFilter, categoryFilter, currentPage]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Reset to first page when filters change (except currentPage)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (categoryFilter) {
        params.categoryId = categoryFilter;
      }

      const response = await adminAPI.getAllProducts(params);
      setProducts(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      
      // Prepare form data for multipart upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (formData.shortDescription) formDataToSend.append('shortDescription', formData.shortDescription);
      formDataToSend.append('price', formData.price);
      if (formData.salePrice) formDataToSend.append('salePrice', formData.salePrice);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('categoryId', formData.categoryId);
      if (formData.weight) formDataToSend.append('weight', formData.weight);
      if (formData.dimensions) formDataToSend.append('dimensions', formData.dimensions);
      if (formData.tags) formDataToSend.append('tags', formData.tags);
      if (formData.metaTitle) formDataToSend.append('metaTitle', formData.metaTitle);
      if (formData.metaDescription) formDataToSend.append('metaDescription', formData.metaDescription);
      formDataToSend.append('isActive', formData.isActive.toString());
      formDataToSend.append('isFeatured', formData.isFeatured.toString());
      formDataToSend.append('isDigital', formData.isDigital.toString());
      
      // Add images
      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, formDataToSend);
      } else {
        await adminAPI.createProduct(formDataToSend);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      setCurrentPage(1);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      shortDescription: (product as any).shortDescription || '',
      price: product.price.toString(),
      salePrice: product.salePrice?.toString() || '',
      stock: product.stock.toString(),
      sku: product.sku,
      categoryId: product.categoryId.toString(),
      weight: (product as any).weight?.toString() || '',
      dimensions: (product as any).dimensions || '',
      tags: Array.isArray((product as any).tags) ? (product as any).tags.join(', ') : (product as any).tags || '',
      metaTitle: (product as any).metaTitle || '',
      metaDescription: (product as any).metaDescription || '',
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isDigital: (product as any).isDigital || false
    });
    setSelectedImages([]);
    setImagePreview(product.images || []);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminAPI.deleteProduct(id);
        // If we're on the last page and it becomes empty, go to previous page
        const remainingProducts = products.length - 1;
        if (remainingProducts === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        fetchProducts();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      price: '',
      salePrice: '',
      stock: '',
      sku: '',
      categoryId: '',
      weight: '',
      dimensions: '',
      tags: '',
      metaTitle: '',
      metaDescription: '',
      isActive: true,
      isFeatured: false,
      isDigital: false
    });
    setSelectedImages([]);
    setImagePreview([]);
    setEditingProduct(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PRD-${timestamp}-${randomStr}`;
  };

  const autoGenerateSKU = () => {
    if (!formData.sku) {
      setFormData({ ...formData, sku: generateSKU() });
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const handleExportProducts = async (format: 'excel' | 'csv' | 'pdf' = 'excel') => {
    try {
      let response;
      let mimeType;
      let fileExtension;
      
      switch (format) {
        case 'csv':
          response = await adminAPI.exportProductsCSV();
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'pdf':
          response = await adminAPI.exportProductsPDF();
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        case 'excel':
        default:
          response = await adminAPI.exportProducts();
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export products');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await adminAPI.downloadBulkTemplate();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products-bulk-upload-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download template');
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setBulkFile(file);
      setBulkResults(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setBulkUploading(true);
      const fileExtension = bulkFile.name.split('.').pop()?.toLowerCase();
      let response;
      
      if (fileExtension === 'csv') {
        response = await adminAPI.bulkUploadProductsCSV(bulkFile);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        response = await adminAPI.bulkUploadProducts(bulkFile);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }
      
      setBulkResults(response.data.data);
      fetchProducts(); // Refresh the products list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload products');
    } finally {
      setBulkUploading(false);
    }
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkFile(null);
    setBulkResults(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <div className="flex space-x-3">
          <div className="relative export-dropdown">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all duration-200 ease-out transform hover:scale-105 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={() => { handleExportProducts('excel'); setShowExportDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <span className="mr-2">📊</span>
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => { handleExportProducts('csv'); setShowExportDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <span className="mr-2">📄</span>
                  CSV (.csv)
                </button>
                <button
                  onClick={() => { handleExportProducts('pdf'); setShowExportDropdown(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <span className="mr-2">📋</span>
                  PDF (.pdf)
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-all duration-200 ease-out transform hover:scale-105 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload
          </button>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all duration-200 ease-out transform hover:scale-105"
          >
            Add New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, description, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-all duration-200 ease-out transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category?.name || 'No Category'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <span className="font-medium">${product.price}</span>
                    {product.salePrice && (
                      <span className="ml-2 text-red-600">${product.salePrice}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {product.isFeatured && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border max-w-4xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      id="product-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      id="product-description"
                      name="description"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Enter detailed product description"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="product-short-description" className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <textarea
                      id="product-short-description"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Brief product summary (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product-sale-price" className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                    <input
                      id="product-sale-price"
                      name="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00 (optional)"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                    <input
                      id="product-stock"
                      name="stock"
                      type="number"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product-sku" className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <div className="flex">
                      <input
                        id="product-sku"
                        name="sku"
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Product SKU"
                      />
                      <button
                        type="button"
                        onClick={autoGenerateSKU}
                        className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 text-sm"
                        title="Auto-generate SKU"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      id="product-category"
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Physical Properties */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Physical Properties</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      id="product-weight"
                      name="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="product-dimensions" className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                    <input
                      id="product-dimensions"
                      name="dimensions"
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="L x W x H (e.g., 10 x 5 x 3 cm)"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="product-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      id="product-tags"
                      name="tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Comma-separated tags (e.g., electronics, smartphone, mobile)"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Product Images</h4>
                <div>
                  <label htmlFor="product-images" className="block text-sm font-medium text-gray-700 mb-2">Upload Images (Max 10)</label>
                  <input
                    id="product-images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  {/* Image Preview */}
                  {imagePreview.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">SEO & Meta Information</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="product-meta-title" className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      id="product-meta-title"
                      name="metaTitle"
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SEO title for search engines"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60 characters</p>
                  </div>
                  
                  <div>
                    <label htmlFor="product-meta-description" className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      id="product-meta-description"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="SEO description for search engines"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160 characters</p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Product Settings</h4>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center">
                    <input
                      id="product-active"
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active (visible to customers)</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      id="product-featured"
                      name="isFeatured"
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured product</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      id="product-digital"
                      name="isDigital"
                      type="checkbox"
                      checked={formData.isDigital}
                      onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Digital product (no shipping)</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-all duration-200 ease-out transform hover:scale-105"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {uploading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Bulk Upload Products</h3>
              <button
                onClick={closeBulkModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the template file to see the required format</li>
                  <li>Fill in your product data following the template structure</li>
                  <li>Save your file as Excel (.xlsx) or CSV (.csv) format</li>
                  <li>Upload the file using the form below</li>
                </ol>
              </div>

              {/* Template Download */}
              <div>
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-all duration-200 ease-out transform hover:scale-105 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="bulk-file" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel or CSV File
                </label>
                <input
                  id="bulk-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleBulkFileChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {bulkFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {bulkFile.name}
                  </p>
                )}
              </div>

              {/* Upload Results */}
              {bulkResults && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Results:</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{bulkResults.success}</div>
                      <div className="text-sm text-gray-600">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{bulkResults.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>
                  {bulkResults.errors && bulkResults.errors.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-red-900 mb-2">Errors:</h5>
                      <div className="max-h-32 overflow-y-auto">
                        {bulkResults.errors.map((error: string, index: number) => (
                          <p key={index} className="text-sm text-red-800 mb-1">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeBulkModal}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-all duration-200 ease-out transform hover:scale-105"
                  disabled={bulkUploading}
                >
                  {bulkResults ? 'Close' : 'Cancel'}
                </button>
                {!bulkResults && (
                  <button
                    onClick={handleBulkUpload}
                    disabled={!bulkFile || bulkUploading}
                    className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {bulkUploading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {bulkUploading ? 'Uploading...' : 'Upload Products'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;