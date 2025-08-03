import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { contactAPI } from '../../utils/api';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface ContactStats {
  total: number;
  new: number;
  read: number;
  replied: number;
  closed: number;
}

const AdminContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats>({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Calculate stats from loaded contacts
  const calculateStatsFromContacts = () => {
    // For now, just calculate from current page contacts
    // This is a limitation but better than no stats at all
    const calculatedStats = {
      total: contacts.length,
      new: contacts.filter(c => c.status === 'new').length,
      read: contacts.filter(c => c.status === 'read').length,
      replied: contacts.filter(c => c.status === 'replied').length,
      closed: contacts.filter(c => c.status === 'closed').length
    };
    setStats(calculatedStats);
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPage, filter]);

  // Initial stats fetch on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Calculate stats whenever contacts change
  useEffect(() => {
    calculateStatsFromContacts();
  }, [contacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(filter !== 'all' && { status: filter }),
      };
      const response = await contactAPI.getAll(params);
      // Handle different response structures
      if (response.data.data && Array.isArray(response.data.data)) {
        // Direct array in data field
        setContacts(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (response.data.data?.contacts) {
        // Nested contacts structure
        setContacts(response.data.data.contacts);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        // Fallback
        setContacts([]);
        setTotalPages(1);
      }
      // Calculate stats from loaded contacts
      calculateStatsFromContacts();
      // Also try to fetch stats from API
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await contactAPI.getStats();
      const statsData = response.data.data;
      
      // Map the backend response structure to the frontend stats structure
      setStats({
        total: statsData.total || 0,
        new: statsData.byStatus?.new || 0, // Use 0 as fallback for new contacts
        read: statsData.byStatus?.read || 0, // Use 0 as fallback for read contacts
        replied: statsData.byStatus?.replied || 0,
        closed: statsData.byStatus?.closed || 0
      });
    } catch (err) {
      // Fallback: calculate stats from loaded contacts if API fails
      calculateStatsFromContacts();
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await contactAPI.updateStatus(id, status);
      fetchContacts();
      await fetchStats();
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update contact status');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactAPI.delete(id);
        fetchContacts();
        await fetchStats();
        setShowModal(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete contact');
      }
    }
  };

  const handleSendResponse = async () => {
    if (!selectedContact || !responseMessage.trim()) {
      setError('Please enter a response message');
      return;
    }

    setSendingResponse(true);
    try {
      await contactAPI.respond(selectedContact.id, {
        message: responseMessage,
        subject: `Re: ${selectedContact.subject}`
      });
      
      // Update contact status to replied
      await handleStatusUpdate(selectedContact.id, 'replied');
      
      setResponseMessage('');
      setShowResponseForm(false);
      setError(null);
      alert('Response sent successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send response');
    } finally {
      setSendingResponse(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Contact Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || "0"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.new || "0"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.read || "0"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.replied || "0"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.closed || "0"}</p>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm min-w-[120px] flex-shrink-0"
          >
            <option value="all">All Contacts</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts && contacts.length > 0 ? contacts.map((contact) => (
                <motion.tr
                  key={contact.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                      {contact.phone && (
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {contact.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusColor(contact.status)
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading contacts...' : 'No contacts found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Contact Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.email}</p>
                </div>

                {selectedContact.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContact.phone}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedContact.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(selectedContact.status)
                  }`}>
                    {selectedContact.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Received</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedContact.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Response Form */}
              {showResponseForm && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Send Response</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Message
                      </label>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={6}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your response here..."
                        disabled={sendingResponse}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSendResponse}
                        disabled={sendingResponse || !responseMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingResponse ? 'Sending...' : 'Send Response'}
                      </button>
                      <button
                        onClick={() => {
                          setShowResponseForm(false);
                          setResponseMessage('');
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                        disabled={sendingResponse}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                {!showResponseForm && (
                  <>
                    <button
                      onClick={() => setShowResponseForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Respond
                    </button>
                    {selectedContact.status === 'new' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedContact.id, 'read')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        Mark as Read
                      </button>
                    )}
                    {(selectedContact.status === 'read' || selectedContact.status === 'replied') && (
                      <button
                        onClick={() => handleStatusUpdate(selectedContact.id, 'closed')}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                      >
                        Mark as Closed
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowResponseForm(false);
                    setResponseMessage('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;