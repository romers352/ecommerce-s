import React, { useState } from 'react';
import SiteSettings from './settings/SiteSettings';
import HomePageEditor from './settings/HomePageEditor';
import PaymentMethods from './settings/PaymentMethods';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('site');

  const tabs = [
    { id: 'site', name: 'Site Settings', icon: '⚙️' },
    { id: 'homepage', name: 'Home Page', icon: '🏠' },
    { id: 'payments', name: 'Payment Methods', icon: '💳' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'site':
        return <SiteSettings />;
      case 'homepage':
        return <HomePageEditor />;
      case 'payments':
        return <PaymentMethods />;
      default:
        return <SiteSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your site settings, home page content, and payment methods.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;