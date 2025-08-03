import { useEffect } from 'react';
import { settingsAPI } from '../utils/api';

export const useFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        console.log('[useFavicon] Fetching site settings...');
        const response = await settingsAPI.getSiteSettings();
        const settings = response.data.data;
        console.log('[useFavicon] Site settings:', settings);
        
        if (settings.favicon) {
          // Remove existing favicon links
          const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
          console.log('[useFavicon] Removing existing favicons:', existingFavicons.length);
          existingFavicons.forEach(link => link.remove());
          
          // Create new favicon link with cache busting
          const faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          faviconLink.type = 'image/x-icon';
          const faviconUrl = `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/uploads/assets/${settings.favicon}?v=${Date.now()}`;
          faviconLink.href = faviconUrl;
          console.log('[useFavicon] Setting favicon URL:', faviconUrl);
          
          // Add to document head
          document.head.appendChild(faviconLink);
          console.log('[useFavicon] Favicon updated successfully');
          
          // Also update the title if available
          if (settings.siteName) {
            document.title = settings.siteName;
            console.log('[useFavicon] Title updated to:', settings.siteName);
          }
        } else {
          console.log('[useFavicon] No favicon found in settings');
        }
      } catch (error) {
        console.error('[useFavicon] Failed to update favicon:', error);
      }
    };

    updateFavicon();
    
    // Listen for favicon updates (custom event)
    const handleFaviconUpdate = () => {
      updateFavicon();
    };
    
    window.addEventListener('faviconUpdated', handleFaviconUpdate);
    
    return () => {
      window.removeEventListener('faviconUpdated', handleFaviconUpdate);
    };
  }, []);
};

// Helper function to trigger favicon update
export const triggerFaviconUpdate = () => {
  window.dispatchEvent(new CustomEvent('faviconUpdated'));
};