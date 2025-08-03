import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { getImageUrl } from '../../utils/helpers';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: number;
  isMainCategory: boolean;
  createdAt: string;
  productCount?: number;
  parent?: Category;
  children?: Category[];
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0,
    parentId: undefined as number | undefined,
    isMainCategory: false,
  });
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchMainCategories();
  }, []);

  const fetchMainCategories = async () => {
    try {
      const response = await adminAPI.getMainCategories();
      setMainCategories(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch main categories:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllCategories({ includeProductCount: 'true' });
      setCategories(response.data.data || response.data.categories || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('isActive', formData.isActive.toString());
      formDataToSend.append('sortOrder', formData.sortOrder.toString());
      formDataToSend.append('isMainCategory', formData.isMainCategory.toString());
      if (formData.parentId) {
        formDataToSend.append('parentId', formData.parentId.toString());
      } else {
        formDataToSend.append('parentId', '');
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, formDataToSend);
      } else {
        await adminAPI.createCategory(formDataToSend);
      }

      // Reset form and refresh categories
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
      parentId: category.parentId,
      isMainCategory: category.isMainCategory,
      sortOrder: category.sortOrder,
    });
    setImagePreview(category.image ? getImageUrl(category.image) : null);
    setShowForm(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteCategory(categoryId);

      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      sortOrder: 0,
      parentId: undefined,
      isMainCategory: false,
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingCategory(null);
    setShowForm(false);
  };

  const toggleCategoryStatus = async (categoryId: number, isActive: boolean) => {
    try {
      await adminAPI.updateCategory(categoryId, { isActive });
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category status');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              showHierarchy
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showHierarchy ? 'Show All' : 'Show Hierarchy'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 h-20 w-20 object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isMainCategory"
                    checked={formData.isMainCategory}
                    onChange={(e) => {
                      const isMain = e.target.checked;
                      setFormData({ 
                        ...formData, 
                        isMainCategory: isMain,
                        parentId: isMain ? undefined : formData.parentId
                      });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isMainCategory" className="ml-2 block text-sm text-gray-900">
                    Main Category (max 3)
                  </label>
                </div>

                {!formData.isMainCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Category
                    </label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a parent category</option>
                      {mainCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(showHierarchy ? categories.filter(cat => cat.isMainCategory) : categories).map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {category.image && (
              <img
                src={getImageUrl(category.image)}
                alt={category.name}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {category.isMainCategory ? (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Main Category
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        Subcategory
                      </span>
                    )}
                    {category.parent && (
                      <span className="text-xs text-gray-500">
                        → {category.parent.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleCategoryStatus(category.id, !category.isActive)}
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    category.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              
              {category.description && (
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>{category.productCount || 0} products</span>
                <span>Order: {category.sortOrder}</span>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {/* Show subcategories in hierarchy view */}
            {showHierarchy && category.children && category.children.length > 0 && (
              <div className="ml-6 mt-4 space-y-3">
                {category.children.map((subcategory) => (
                  <div key={subcategory.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{subcategory.name}</h4>
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full mt-1 inline-block">
                          Subcategory
                        </span>
                        {subcategory.description && (
                          <p className="text-gray-600 text-sm mt-1">{subcategory.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCategoryStatus(subcategory.id, !subcategory.isActive)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            subcategory.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subcategory.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories found. Create your first category to get started.</p>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;