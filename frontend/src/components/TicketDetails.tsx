'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL } from '@/lib/apiBaseUrl';
import { useRouter } from 'next/navigation';

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
  const { getToken } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const statusInfo = useMemo(() => {
    if (!ticket) return { label: 'Unknown', color: 'text-neutral-400 border-neutral-400 bg-neutral-400/10' };
    switch (ticket.status) {
      case 'open': return { label: 'Open', color: 'text-indigo-400 border-indigo-400/50 bg-indigo-400/10' };
      case 'in-progress': return { label: 'In Progress', color: 'text-amber-400 border-amber-400/50 bg-amber-400/10' };
      case 'resolved': return { label: 'Resolved', color: 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' };
      default: return { label: 'Closed', color: 'text-neutral-400 border-neutral-400/50 bg-neutral-400/10' };
    }
  }, [ticket]);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.get(
        `${API_BASE_URL}/support/ticket/${ticketId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTicket(response.data.ticket || null);
    } catch (error: any) {
      setStatusMessage(error.response?.data?.error || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  }, [getToken, ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleAddResponse = async () => {
    if (!responseMessage.trim()) return;
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      await axios.post(
        `${API_BASE_URL}/support/ticket/${ticketId}/add-response`,
        { message: responseMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponseMessage('');
      await fetchTicket();
      setStatusMessage('Response transmitted.');
    } catch (error: any) {
      setStatusMessage(error.response?.data?.error || 'Failed to transmit response');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      await axios.post(
        `${API_BASE_URL}/support/ticket/${ticketId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTicket();
      setStatusMessage('Ticket closed successfully.');
    } catch (error: any) {
      setStatusMessage(error.response?.data?.error || 'Termination failure');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/support');
  };

  if (loading) return <div className="py-20 text-center text-neutral-400 font-black uppercase tracking-[0.2em] animate-pulse">Initializing Data Stream...</div>;
  if (!ticket) return <div className="py-20 text-center text-rose-500 font-black uppercase tracking-[0.2em]">Data Link Severed.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4">
      {/* 📡 System Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 motion-fade-up">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="text-neutral-500 font-black text-[10px] uppercase tracking-[0.2em]">ID: {ticket.ticket_number || ticket._id}</span>
          </div>
          <h1 className="text-4xl font-black text-neutral-900 tracking-tighter leading-none">{ticket.subject}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="px-6 py-3 bg-white/40 border border-white/60 text-neutral-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl">Back</button>
          {ticket.status !== 'closed' && (
            <button
              onClick={handleCloseTicket}
              disabled={saving}
              className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl disabled:opacity-50"
            >
              Close Ticket
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 🗨️ Transmission Log */}
        <div className="lg:col-span-2 space-y-6 motion-fade-up stagger-1">
          <div className="bg-glass rounded-[2.5rem] p-8 md:p-12 border border-white/40 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-10 border-b border-white/20 pb-6 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Original Message
            </h3>
            <p className="text-xl font-bold text-neutral-800 leading-relaxed whitespace-pre-wrap">
              {ticket.description || ticket.message || 'No description provided.'}
            </p>
            <div className="mt-12 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-300">Timestamp</span>
                <span className="text-neutral-900">{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-300">Category</span>
                <span className="text-neutral-900">{ticket.category}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 ml-4 mb-4">Response Archive</h3>
            {(ticket.responses || []).length === 0 ? (
              <div className="bg-glass rounded-[2rem] p-10 text-center border border-white/40 border-dashed">
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Awaiting Signal...</span>
              </div>
            ) : (
              (ticket.responses || []).map((entry, idx) => (
                <div key={entry._id} className={`bg-glass rounded-[2.5rem] p-8 border backdrop-blur-3xl shadow-xl transition-all hover:scale-[1.01] ${entry.responder_id ? 'border-indigo-400/30 ml-8 md:ml-12' : 'border-white/40'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${entry.responder_id ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-white'}`}>
                      {entry.responder_id ? 'S' : 'U'}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      {entry.responder_id ? 'System Response' : 'User Broadcast'} • {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-neutral-800 leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                </div>
              ))
            )}
          </div>

          {ticket.status !== 'closed' && (
            <div className="bg-glass rounded-[2.5rem] p-8 md:p-10 border border-white/40 shadow-2xl backdrop-blur-3xl ring-2 ring-indigo-500/10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6">Add a Reply</h3>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={5}
                className="w-full bg-white/50 border border-white/40 rounded-3xl p-6 text-neutral-900 font-bold placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg mb-6"
                placeholder="Synchronize additional data or context..."
              />
              <button
                onClick={handleAddResponse}
                disabled={saving || !responseMessage.trim()}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all hover:bg-neutral-900 active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          )}
        </div>

        {/* 🛠️ System Overview */}
        <div className="space-y-6 motion-fade-up stagger-2">
          <div className="bg-glass rounded-[2.5rem] p-8 border border-white/40 shadow-2xl backdrop-blur-3xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-8 border-b border-white/20 pb-4">Ticket Info</h3>
            <div className="space-y-6">
              {[
                { label: 'Priority', value: ticket.priority, color: ticket.priority === 'high' ? 'text-amber-500' : 'text-neutral-900' },
                { label: 'Security', value: 'End-to-End Encrypted', color: 'text-emerald-500' },
                { label: 'Support Team', value: 'Customer Support', color: 'text-neutral-900' },
                { label: 'Ticket ID', value: ticket.ticket_number?.split('-')[0] || ticket._id.slice(0, 8) , color: 'text-indigo-600' }
              ].map((meta, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">{meta.label}</span>
                  <span className={`text-sm font-black uppercase tracking-widest ${meta.color}`}>{meta.value}</span>
                </div>
              ))}
            </div>
          </div>

          {statusMessage && (
            <div className="bg-glass rounded-3xl p-6 border border-white/40 shadow-xl backdrop-blur-3xl animate-in slide-in-from-bottom-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{statusMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
