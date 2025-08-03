import { useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../utils/api';

interface MaintenanceModeState {
  isMaintenanceMode: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useMaintenanceMode = (isAdmin: boolean = false) => {
  const [state, setState] = useState<MaintenanceModeState>({
    isMaintenanceMode: false,
    isLoading: true,
    error: null,
  });

  const checkMaintenanceMode = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Add debugging logs
      console.log('[MaintenanceMode] Checking maintenance mode...', {
        isAdmin,
        port: window.location.port,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      });
      
      // Force fresh request by adding timestamp to prevent caching
      const response = await settingsAPI.getSiteSettings();
      const maintenanceMode = response.data.data.maintenanceMode || false;
      
      console.log('[MaintenanceMode] Settings response:', {
        maintenanceMode,
        isAdmin,
        willShowMaintenance: maintenanceMode && !isAdmin,
        port: window.location.port
      });
      
      setState({
        isMaintenanceMode: maintenanceMode && !isAdmin, // Don't show maintenance mode for admins
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.log('[MaintenanceMode] Error checking maintenance mode:', {
        error: error.message,
        status: error.response?.status,
        isAdmin,
        port: window.location.port
      });
      
      // Check if the error is due to maintenance mode
      if (error.response?.status === 503 && error.response?.data?.maintenanceMode) {
        setState({
          isMaintenanceMode: !isAdmin, // Don't show maintenance mode for admins
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.response?.data?.message || 'Failed to check maintenance mode',
        }));
      }
    }
  }, [isAdmin]);

  const retryCheck = () => {
    checkMaintenanceMode();
  };

  useEffect(() => {
    checkMaintenanceMode();
    
    // Removed auto-refresh interval - only check once on mount
    // const interval = setInterval(checkMaintenanceMode, 30000);
    
    // return () => clearInterval(interval);
  }, [checkMaintenanceMode]); // Use memoized function dependency

  return {
    ...state,
    retryCheck,
  };
};