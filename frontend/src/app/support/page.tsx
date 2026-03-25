'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormInput from '@/components/ui/FormInput';

type SupportTicket = {
  _id: string;
  ticket_number?: string;
  subject: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at?: string;
};

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'my-tickets'>('create');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'other'
  });

  useEffect(() => {
    if (activeTab === 'my-tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/support/my-tickets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/support/create-ticket`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✓ Support ticket created!');
      setFormData({ subject: '', description: '', category: 'other' });
      setActiveTab('my-tickets');
      fetchTickets();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || 'Failed to create ticket');
      } else {
        alert('Failed to create ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">Get help from our support team</p>
        </div>

        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Ticket
          </button>
          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'my-tickets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Tickets ({tickets.length})
          </button>
        </div>

        {activeTab === 'create' && (
          <Card variant="elevated" padding="lg" className="mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief subject of your issue"
                required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="billing">Billing & Payments</option>
                  <option value="technical">Technical Issue</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="bug-report">Bug Report</option>
                  <option value="account">Account Issue</option>
                  <option value="data-deletion">Data Deletion</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed description (minimum 20 characters)"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                  minLength={20}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Support Ticket'}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Response time:</strong> Our support team typically responds within 24 hours during business days.
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'my-tickets' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <Card variant="filled" padding="lg" className="text-center">
                <p className="text-gray-600 mb-4">No support tickets yet</p>
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('create')}
                >
                  Create Your First Ticket
                </Button>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket._id} variant="outlined" padding="md">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{ticket.ticket_number || ticket._id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                          ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-gray-700 font-semibold">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/support/tickets/${ticket._id}`;
                      }}
                    >
                      View →
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
