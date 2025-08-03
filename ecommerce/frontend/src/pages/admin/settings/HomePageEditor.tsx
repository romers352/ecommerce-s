import React, { useState, useEffect } from 'react';
import { settingsAPI, productsAPI } from '../../../utils/api';
import { Product } from '../../../types';

interface HomePageSection {
  id?: number;
  type: 'hero' | 'banner_carousel' | 'featured_products' | 'testimonials' | 'newsletter';
  title: string;
  subtitle?: string;
  content: any;
  isActive: boolean;
  sortOrder: number;
}

const HomePageEditor: React.FC = () => {
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingSection, setEditingSection] = useState<HomePageSection | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'edit'>('split');

  const sectionTypes = [
    { value: 'hero', label: 'Hero Section', icon: '🎬' },
    { value: 'banner_carousel', label: 'Banner Carousel', icon: '🎠' },
    { value: 'featured_products', label: 'Featured Products', icon: '⭐' },
    { value: 'testimonials', label: 'Testimonials', icon: '💬' },
    { value: 'newsletter', label: 'Newsletter Signup', icon: '📧' },
  ];

  useEffect(() => {
    console.log('🚀 HomePageEditor component mounted, fetching data...');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching home page data...');
      
      const [sectionsResponse, productsResponse] = await Promise.all([
        settingsAPI.getHomePageSections(),
        productsAPI.getFeatured()
      ]);
      
      console.log('✅ Sections response:', sectionsResponse.data);
      console.log('✅ Products response:', productsResponse.data);
      
      setSections(sectionsResponse.data.data);
      setFeaturedProducts(productsResponse.data.data);
      setMessage({ type: 'success', text: 'Data loaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch data';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (id: number, sectionData: Partial<HomePageSection>) => {
    try {
      setSaving(true);
      await settingsAPI.updateHomePageSection(id, sectionData);
      setMessage({ type: 'success', text: 'Section updated successfully!' });
      
      // Update local state immediately for real-time preview
      setSections(prev => prev.map(section => 
        section.id === id ? { ...section, ...sectionData } : section
      ));
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update section' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSection = async (sectionData: Omit<HomePageSection, 'id'>) => {
    try {
      setSaving(true);
      await settingsAPI.createHomePageSection(sectionData);
      setMessage({ type: 'success', text: 'Section created successfully!' });
      setShowAddModal(false);
      fetchData(); // Refresh to get the new section with ID
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create section' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
      await settingsAPI.deleteHomePageSection(id);
      setMessage({ type: 'success', text: 'Section deleted successfully!' });
      setSections(prev => prev.filter(section => section.id !== id));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete section' });
    }
  };

  const handleReorderSections = async (newOrder: HomePageSection[]) => {
    try {
      const reorderData = newOrder.map((section, index) => ({
        id: section.id!,
        sortOrder: index + 1
      }));
      
      await settingsAPI.reorderHomePageSections(reorderData);
      setSections(newOrder);
      setMessage({ type: 'success', text: 'Sections reordered successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reorder sections' });
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      handleReorderSections(newSections);
    }
  };

  // Real-time preview components
  const renderLiveSection = (section: HomePageSection, isEditing: boolean = false) => {
    const handleQuickEdit = (field: string, value: any) => {
      if (section.id) {
        const updatedContent = field.startsWith('content.') 
          ? { ...section.content, [field.split('.')[1]]: value }
          : value;
        
        const updateData = field.startsWith('content.') 
          ? { content: updatedContent }
          : { [field]: value };
        
        handleUpdateSection(section.id, updateData);
      }
    };

    switch (section.type) {
      case 'hero':
        return (
          <div className="relative bg-gray-900 text-white min-h-[500px] flex items-center justify-center overflow-hidden">
            {section.content?.videoUrl && (
              <div className="absolute inset-0 bg-black bg-opacity-50" />
            )}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
              {isEditing ? (
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleQuickEdit('title', e.target.value)}
                  className="text-5xl font-bold mb-6 bg-transparent border-b-2 border-white text-center w-full text-white placeholder-gray-300"
                  placeholder="Hero Title"
                />
              ) : (
                <h1 className="text-5xl font-bold mb-6">{section.title}</h1>
              )}
              
              {isEditing ? (
                <input
                  type="text"
                  value={section.subtitle || ''}
                  onChange={(e) => handleQuickEdit('subtitle', e.target.value)}
                  className="text-xl mb-8 bg-transparent border-b border-white text-center w-full text-white placeholder-gray-300"
                  placeholder="Hero Subtitle"
                />
              ) : (
                section.subtitle && <p className="text-xl mb-8 opacity-90">{section.subtitle}</p>
              )}
              
              {section.content?.overlayText && (
                <p className="text-lg mb-8 opacity-80">{section.content.overlayText}</p>
              )}
              
              {section.content?.ctaText && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 ease-out transform hover:scale-105">
                  {section.content.ctaText}
                </button>
              )}
            </div>
            
            {isEditing && (
              <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded-lg">
                <div className="space-y-2 text-black text-sm">
                  <input
                    type="url"
                    value={section.content?.videoUrl || ''}
                    onChange={(e) => handleQuickEdit('content.videoUrl', e.target.value)}
                    placeholder="Video URL"
                    className="w-full px-2 py-1 border rounded"
                  />
                  <input
                    type="text"
                    value={section.content?.ctaText || ''}
                    onChange={(e) => handleQuickEdit('content.ctaText', e.target.value)}
                    placeholder="Button Text"
                    className="w-full px-2 py-1 border rounded"
                  />
                  <input
                    type="text"
                    value={section.content?.ctaLink || ''}
                    onChange={(e) => handleQuickEdit('content.ctaLink', e.target.value)}
                    placeholder="Button Link"
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
        );
      
      case 'featured_products':
        return (
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12">
                {isEditing ? (
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleQuickEdit('title', e.target.value)}
                    className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 text-center w-full"
                    placeholder="Section Title"
                  />
                ) : (
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
                )}
                
                {isEditing ? (
                  <input
                    type="text"
                    value={section.subtitle || ''}
                    onChange={(e) => handleQuickEdit('subtitle', e.target.value)}
                    className="text-gray-600 border-b border-gray-300 text-center w-full"
                    placeholder="Section Subtitle"
                  />
                ) : (
                  section.subtitle && <p className="text-gray-600">{section.subtitle}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-blue-600 font-bold">${product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'newsletter':
        return (
          <div className="bg-blue-50 py-16">
            <div className="max-w-4xl mx-auto text-center px-6">
              {isEditing ? (
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => handleQuickEdit('title', e.target.value)}
                  className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 text-center w-full bg-transparent"
                  placeholder="Newsletter Title"
                />
              ) : (
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
              )}
              
              {isEditing ? (
                <input
                  type="text"
                  value={section.subtitle || ''}
                  onChange={(e) => handleQuickEdit('subtitle', e.target.value)}
                  className="text-gray-600 mb-8 border-b border-gray-300 text-center w-full bg-transparent"
                  placeholder="Newsletter Subtitle"
                />
              ) : (
                section.subtitle && <p className="text-gray-600 mb-8">{section.subtitle}</p>
              )}
              
              <div className="max-w-md mx-auto flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 ease-out transform hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="py-16 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center px-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
              {section.subtitle && <p className="text-gray-600">{section.subtitle}</p>}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Home Page Editor</h3>
            <p className="text-gray-600 text-sm mt-1">
              Live preview with direct editing capabilities
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ease-out ${
                  viewMode === 'split' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ease-out ${
                  viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Preview Only
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Edit Only
              </button>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Section
            </button>
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Live Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'w-2/3' : 'w-full'} overflow-y-auto bg-gray-50`}>
            <div className="bg-white">
              {sections
                .filter(section => section.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((section) => (
                  <div key={section.id} className="relative group">
                    {renderLiveSection(section, editingSection?.id === section.id)}
                    
                    {/* Edit Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSection(editingSection?.id === section.id ? null : section)}
                          className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ease-out ${
                            editingSection?.id === section.id
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          } shadow-sm border`}
                        >
                          {editingSection?.id === section.id ? 'Stop Editing' : 'Quick Edit'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
              
              {sections.filter(s => s.isActive).length === 0 && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No active sections</p>
                    <p className="text-sm">Add sections to see your home page preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Sections Management */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className={`${viewMode === 'split' ? 'w-1/3 border-l' : 'w-full'} border-gray-200 bg-white overflow-y-auto`}>
            <div className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Sections Management</h4>
              
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className={`border rounded-lg p-4 ${
                    editingSection?.id === section.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {sectionTypes.find(t => t.value === section.type)?.icon}
                        </span>
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">{section.title}</h5>
                          <p className="text-xs text-gray-500">
                            {sectionTypes.find(t => t.value === section.type)?.label}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-xs"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-xs"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          section.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {section.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateSection(section.id!, { isActive: !section.isActive })}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {section.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id!)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No sections created yet.</p>
                    <p className="text-xs mt-1">Add your first section to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Section</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const sectionData = {
                type: formData.get('type') as HomePageSection['type'],
                title: formData.get('title') as string,
                subtitle: formData.get('subtitle') as string,
                content: {},
                isActive: true,
                sortOrder: sections.length + 1
              };
              handleCreateSection(sectionData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Type
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sectionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle (optional)
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePageEditor;