import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../../utils/api';

interface PaymentMethod {
  id?: number;
  name: string;
  type: 'credit_card' | 'paypal' | 'stripe' | 'bank_transfer' | 'cash_on_delivery' | 'other';
  isActive: boolean;
  configuration: any;
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const paymentTypes = [
    { value: 'credit_card', label: 'Credit Card', icon: '💳' },
    { value: 'paypal', label: 'PayPal', icon: '🅿️' },
    { value: 'stripe', label: 'Stripe', icon: '💰' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: '💵' },
    { value: 'other', label: 'Other', icon: '🔧' },
  ];

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getPaymentMethods();
      setPaymentMethods(response.data.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to fetch payment methods' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMethod = async (methodData: Omit<PaymentMethod, 'id'>) => {
    try {
      setSaving(true);
      await settingsAPI.createPaymentMethod(methodData);
      setMessage({ type: 'success', text: 'Payment method created successfully!' });
      setShowAddModal(false);
      fetchPaymentMethods();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create payment method' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMethod = async (id: number, methodData: Partial<PaymentMethod>) => {
    try {
      setSaving(true);
      await settingsAPI.updatePaymentMethod(id, methodData);
      setMessage({ type: 'success', text: 'Payment method updated successfully!' });
      setEditingMethod(null);
      fetchPaymentMethods();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update payment method' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      await settingsAPI.deletePaymentMethod(id);
      setMessage({ type: 'success', text: 'Payment method deleted successfully!' });
      fetchPaymentMethods();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete payment method' });
    }
  };

  const renderConfigurationFields = (method: PaymentMethod, isEditing: boolean = false) => {
    const updateConfig = (key: string, value: any) => {
      if (isEditing && editingMethod) {
        setEditingMethod({
          ...editingMethod,
          configuration: {
            ...editingMethod.configuration,
            [key]: value
          }
        });
      }
    };

    const config = method.configuration || {};

    switch (method.type) {
      case 'stripe':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publishable Key
              </label>
              <input
                type="text"
                value={config.publishableKey || ''}
                onChange={(e) => updateConfig('publishableKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="pk_live_..."
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={config.secretKey || ''}
                onChange={(e) => updateConfig('secretKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk_live_..."
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret
              </label>
              <input
                type="password"
                value={config.webhookSecret || ''}
                onChange={(e) => updateConfig('webhookSecret', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="whsec_..."
                readOnly={!isEditing}
              />
            </div>
          </div>
        );
      
      case 'paypal':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={config.clientId || ''}
                onChange={(e) => updateConfig('clientId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={config.clientSecret || ''}
                onChange={(e) => updateConfig('clientSecret', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={!isEditing}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`sandbox-${method.id}`}
                checked={config.sandbox || false}
                onChange={(e) => updateConfig('sandbox', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={!isEditing}
              />
              <label htmlFor={`sandbox-${method.id}`} className="ml-2 block text-sm text-gray-900">
                Sandbox Mode
              </label>
            </div>
          </div>
        );
      
      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={config.bankName || ''}
                onChange={(e) => updateConfig('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={config.accountNumber || ''}
                onChange={(e) => updateConfig('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing Number
              </label>
              <input
                type="text"
                value={config.routingNumber || ''}
                onChange={(e) => updateConfig('routingNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={config.instructions || ''}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Instructions for customers on how to make bank transfers"
                readOnly={!isEditing}
              />
            </div>
          </div>
        );
      
      case 'cash_on_delivery':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Fee
              </label>
              <input
                type="number"
                step="0.01"
                value={config.additionalFee || ''}
                onChange={(e) => updateConfig('additionalFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                readOnly={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={config.instructions || ''}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Instructions for cash on delivery"
                readOnly={!isEditing}
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration (JSON)
            </label>
            <textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  const newConfig = JSON.parse(e.target.value);
                  if (isEditing && editingMethod) {
                    setEditingMethod({ ...editingMethod, configuration: newConfig });
                  }
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              readOnly={!isEditing}
            />
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
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          <p className="text-gray-600 text-sm mt-1">
            Configure payment methods available to your customers.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((method) => (
          <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {method.icon || paymentTypes.find(t => t.value === method.type)?.icon}
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">{method.displayName}</h4>
                  <p className="text-sm text-gray-500">{method.name}</p>
                  {method.description && (
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {method.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              {renderConfigurationFields(method)}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingMethod(method)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteMethod(method.id!)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {paymentMethods.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <p>No payment methods configured yet. Add your first payment method to get started.</p>
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const methodData = {
                name: formData.get('name') as string,
                type: formData.get('type') as PaymentMethod['type'],
                displayName: formData.get('displayName') as string,
                description: formData.get('description') as string,
                configuration: {},
                isActive: true,
                sortOrder: paymentMethods.length + 1
              };
              handleCreateMethod(methodData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., stripe_main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Credit Card"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description for customers"
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
                  {saving ? 'Creating...' : 'Create Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Payment Method</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateMethod(editingMethod.id!, editingMethod);
            }}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internal Name
                    </label>
                    <input
                      type="text"
                      value={editingMethod.name}
                      onChange={(e) => setEditingMethod({...editingMethod, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editingMethod.displayName}
                      onChange={(e) => setEditingMethod({...editingMethod, displayName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingMethod.description || ''}
                    onChange={(e) => setEditingMethod({...editingMethod, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingMethod.isActive}
                    onChange={(e) => setEditingMethod({...editingMethod, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (available to customers)
                  </label>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Configuration</h4>
                  {renderConfigurationFields(editingMethod, true)}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;