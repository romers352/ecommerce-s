import React from 'react';
import { RefreshCw } from 'lucide-react';

interface MaintenanceModeProps {
  onRetry?: () => void;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ onRetry }) => {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔧</div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Site Under Maintenance
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          We're currently performing scheduled maintenance to improve your experience. 
          Please check back in a few minutes.
        </p>
        
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default MaintenanceMode;