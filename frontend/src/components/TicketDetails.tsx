'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type TicketResponse = {
  _id: string;
  responder_id?: string;
  message: string;
  created_at: string;
};

type Ticket = {
  _id: string;
  ticket_number?: string;
  subject: string;
  description?: string;
  message?: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string;
  responses?: TicketResponse[];
};

interface TicketDetailsProps {
  ticketId: string;
}

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const statusBadge = useMemo(() => {
    if (!ticket) return 'bg-gray-100 text-gray-700';
    if (ticket.status === 'open') return 'bg-blue-100 text-blue-700';
    if (ticket.status === 'in-progress') return 'bg-yellow-100 text-yellow-700';
    if (ticket.status === 'resolved') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  }, [ticket]);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/support/ticket/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTicket(response.data.ticket || null);
      setStatusMessage(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setStatusMessage(error.response?.data?.error || 'Failed to fetch ticket details');
      } else {
        setStatusMessage('Failed to fetch ticket details');
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleAddResponse = async () => {
    const trimmed = responseMessage.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/support/ticket/${ticketId}/add-response`,
        { message: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponseMessage('');
      await fetchTicket();
      setStatusMessage('Response added successfully.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setStatusMessage(error.response?.data?.error || 'Failed to add response');
      } else {
        setStatusMessage('Failed to add response');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTicket = async () => {
    const confirmed = window.confirm('Close this ticket?');
    if (!confirmed) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/support/ticket/${ticketId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTicket();
      setStatusMessage('Ticket closed successfully.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setStatusMessage(error.response?.data?.error || 'Failed to close ticket');
      } else {
        setStatusMessage('Failed to close ticket');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-600">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="py-10 text-center text-red-600">Ticket not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.ticket_number || ticket._id}</h1>
            <p className="text-gray-700 mt-1">{ticket.subject}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge}`}>
            {ticket.status}
          </span>
        </div>

        <p className="text-gray-700 whitespace-pre-wrap">
          {ticket.description || ticket.message || 'No description provided.'}
        </p>

        <div className="mt-5 text-sm text-gray-500">
          <p>Category: {ticket.category}</p>
          <p>Priority: {ticket.priority}</p>
          <p>Created: {new Date(ticket.created_at).toLocaleString()}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>Back</Button>
          {ticket.status !== 'closed' && (
            <Button variant="danger" onClick={handleCloseTicket} loading={saving} disabled={saving}>
              Close Ticket
            </Button>
          )}
        </div>
      </Card>

      <Card variant="outlined" padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Responses</h2>

        <div className="space-y-3 mb-5">
          {(ticket.responses || []).length === 0 ? (
            <p className="text-gray-600">No responses yet.</p>
          ) : (
            (ticket.responses || []).map((entry) => (
              <div key={entry._id} className="rounded-lg border border-gray-200 p-3">
                <p className="text-gray-800 whitespace-pre-wrap">{entry.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Add more context or follow-up details"
          />
          <Button
            variant="primary"
            onClick={handleAddResponse}
            loading={saving}
            disabled={saving || !responseMessage.trim()}
          >
            Add Response
          </Button>
        </div>
      </Card>

      {statusMessage && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
