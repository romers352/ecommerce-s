import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { settingsAPI } from '../../../utils/api';
import { triggerFaviconUpdate } from '../../../hooks/useFavicon';

interface SiteSettingsData {
  id?: number;
  siteName: string;
  siteDescription: string;
  favicon?: string;
  logo?: string;
  footerLogo?: string;
  heroVideoMobile?: string;
  heroVideoDesktop?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  maintenanceMode: boolean;
  [key: string]: any;
}

const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettingsData>({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    socialLinks: {},
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSiteSettings();
      setSettings(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsAPI.updateSiteSettings(settings);
      toast.success('Settings saved successfully!');
      
      // Trigger favicon update in case favicon was changed
      triggerFaviconUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: 'favicon' | 'logo' | 'footerLogo' | 'heroVideoMobile' | 'heroVideoDesktop', file: File) => {
    try {
      setUploadingAsset(type);
      const response = await settingsAPI.uploadSiteAsset(type, file);
      setSettings(prev => ({
        ...prev,
        [type]: response.data.data[type]
      }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
      
      // Trigger favicon update if favicon was uploaded
      if (type === 'favicon') {
        triggerFaviconUpdate();
      }
      
      // Trigger logo update if logo was uploaded
      if (type === 'logo') {
        window.dispatchEvent(new CustomEvent('logoUpdated'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={settings.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={settings.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Site Assets */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Site Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon
              </label>
              <div className="space-y-2">
                {settings.favicon && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${settings.favicon}?v=${Date.now()}`}
                      alt="Favicon"
                      className="h-8 w-8 object-contain border border-gray-200 rounded"
                    />
                    <span className="text-sm text-gray-600">Current favicon</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,.ico"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('favicon', file);
                  }}
                  disabled={uploadingAsset === 'favicon'}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingAsset === 'favicon' && (
                  <div className="text-sm text-blue-600">Uploading favicon...</div>
                )}
                <p className="text-xs text-gray-500">
                  Recommended: 32x32px or 16x16px .ico, .png, or .svg file
                </p>
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="space-y-2">
                {settings.logo && (
                  <img
                    src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${settings.logo}?v=${Date.now()}`}
                    alt="Logo"
                    className="h-12 object-contain"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('logo', file);
                  }}
                  disabled={uploadingAsset === 'logo'}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingAsset === 'logo' && (
                  <div className="text-sm text-blue-600">Uploading...</div>
                )}
              </div>
            </div>

            {/* Footer Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer Logo
              </label>
              <div className="space-y-2">
                {settings.footerLogo && (
                  <img
                    src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${settings.footerLogo}?v=${Date.now()}`}
                    alt="Footer Logo"
                    className="h-12 object-contain"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('footerLogo', file);
                  }}
                  disabled={uploadingAsset === 'footerLogo'}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingAsset === 'footerLogo' && (
                  <div className="text-sm text-blue-600">Uploading...</div>
                )}
              </div>
            </div>
          </div>

          {/* Hero Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Mobile Hero Video */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Video (Mobile)
              </label>
              <div className="space-y-2">
                {settings.heroVideoMobile && (
                  <div className="space-y-2">
                    <video
                      src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${settings.heroVideoMobile}?v=${Date.now()}`}
                      className="w-full h-32 object-cover rounded border border-gray-200"
                      controls
                      muted
                    />
                    <span className="text-sm text-gray-600">Current mobile hero video</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('heroVideoMobile', file);
                  }}
                  disabled={uploadingAsset === 'heroVideoMobile'}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingAsset === 'heroVideoMobile' && (
                  <div className="text-sm text-blue-600">Uploading mobile video...</div>
                )}
                <p className="text-xs text-gray-500">
                  Recommended: MP4 format, optimized for mobile viewing
                </p>
              </div>
            </div>

            {/* Desktop Hero Video */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Video (Desktop)
              </label>
              <div className="space-y-2">
                {settings.heroVideoDesktop && (
                  <div className="space-y-2">
                    <video
                      src={`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${settings.heroVideoDesktop}?v=${Date.now()}`}
                      className="w-full h-32 object-cover rounded border border-gray-200"
                      controls
                      muted
                    />
                    <span className="text-sm text-gray-600">Current desktop hero video</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('heroVideoDesktop', file);
                  }}
                  disabled={uploadingAsset === 'heroVideoDesktop'}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingAsset === 'heroVideoDesktop' && (
                  <div className="text-sm text-blue-600">Uploading desktop video...</div>
                )}
                <p className="text-xs text-gray-500">
                  Recommended: MP4 format, optimized for desktop viewing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((platform) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={settings.socialLinks[platform as keyof typeof settings.socialLinks] || ''}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  placeholder={`https://${platform}.com/yourpage`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={settings.seoTitle || ''}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Default page title for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description
              </label>
              <textarea
                value={settings.seoDescription || ''}
                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Default meta description for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Keywords
              </label>
              <input
                type="text"
                value={settings.seoKeywords || ''}
                onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comma-separated keywords"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Mode</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
              Enable maintenance mode (site will be temporarily unavailable to visitors)
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;