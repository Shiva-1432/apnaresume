'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

const supportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['Bug', 'Feature Request', 'Account', 'Other']),
  description: z.string().min(20, 'Please describe the issue in more detail'),
  attachment: z.instanceof(File).optional(),
});

type SupportFormValues = z.infer<typeof supportTicketSchema>;

type SupportTicket = {
  _id: string;
  ticket_number?: string;
  subject: string;
  status: string;
  priority?: string;
  created_at: string;
  updated_at?: string;
};

const CATEGORY_TO_API_CATEGORY: Record<SupportFormValues['category'], string> = {
  Bug: 'bug-report',
  'Feature Request': 'feature-request',
  Account: 'account',
  Other: 'other',
};

const SUPPORT_CATEGORIES: Array<SupportFormValues['category']> = [
  'Bug',
  'Feature Request',
  'Account',
  'Other',
];

export default function SupportPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'my-tickets'>('create');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: '',
      category: 'Other',
      description: '',
      attachment: undefined,
    },
    mode: 'onBlur',
  });

  const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.get(`${API_BASE_URL}/support/my-tickets`, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(response.data.tickets || []);
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (activeTab === 'my-tickets') fetchTickets();
  }, [activeTab, fetchTickets]);

  const onSubmit = async (values: SupportFormValues) => {
    const sanitizedFormData = {
      subject: stripHtml(values.subject),
      description: stripHtml(values.description),
      category: CATEGORY_TO_API_CATEGORY[values.category],
    };

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.post(`${API_BASE_URL}/support/create-ticket`, sanitizedFormData, { headers: { Authorization: `Bearer ${token}` } });
      reset({
        subject: '',
        category: 'Other',
        description: '',
        attachment: undefined,
      });
      setAttachmentInputKey((current) => current + 1);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      setActiveTab('my-tickets');
      fetchTickets();
    } catch (err) {
      console.error('Create Error:', err);
    }
  };

  const selectedAttachment = watch('attachment');

  return (
    <div className="min-h-screen bg-mesh py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="motion-fade-up">
          <h1 className="text-5xl font-black text-neutral-900 tracking-tight leading-tight">Contact Support</h1>
          <p className="text-neutral-500 font-bold mt-2">Reach out to our support team. We typically respond within 24 hours.</p>
        </div>

        <div className="flex gap-2 bg-white/40 p-1.5 rounded-2xl backdrop-blur-3xl border border-white/40 shadow-xl w-fit">
          {[
            { id: 'create', label: 'New Ticket' },
            { id: 'my-tickets', label: `My Tickets (${tickets.length})` }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-neutral-500 hover:bg-white/60 hover:text-neutral-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="motion-fade-up">
          {activeTab === 'create' && (
            <div className="bg-glass p-12 rounded-[3.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl" />
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Subject</label>
                    <input
                      type="text"
                      placeholder="Brief issue identification"
                      className="w-full px-6 py-4 bg-white/60 rounded-2xl border border-neutral-200 focus:outline-none focus:border-indigo-500 font-bold text-neutral-800"
                      {...register('subject')}
                    />
                    {errors.subject && <p className="px-2 text-xs font-bold text-red-600">{errors.subject.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Category</label>
                    <select
                      className="w-full px-6 py-4 bg-white/60 rounded-2xl border border-neutral-200 focus:outline-none focus:border-indigo-500 font-bold text-neutral-800 appearance-none"
                      {...register('category')}
                    >
                      {SUPPORT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="px-2 text-xs font-bold text-red-600">{errors.category.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Description</label>
                  <textarea
                    placeholder="Describe your issue in detail..."
                    rows={6}
                    className="w-full px-6 py-4 bg-white/60 rounded-2xl border border-neutral-200 focus:outline-none focus:border-indigo-500 font-bold text-neutral-800 resize-none"
                    {...register('description')}
                  />
                  {errors.description && <p className="px-2 text-xs font-bold text-red-600">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Attachment</label>
                  <Controller
                    control={control}
                    name="attachment"
                    render={({ field }) => (
                      <input
                        key={attachmentInputKey}
                        ref={(element) => {
                          field.ref(element);
                          attachmentInputRef.current = element;
                        }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="w-full px-6 py-4 bg-white/60 rounded-2xl border border-neutral-200 focus:outline-none focus:border-indigo-500 font-bold text-neutral-800 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white file:font-black"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          field.onChange(file);
                        }}
                      />
                    )}
                  />
                  {selectedAttachment && (
                    <p className="px-2 text-xs font-bold text-neutral-500">Selected: {selectedAttachment.name}</p>
                  )}
                  {errors.attachment && <p className="px-2 text-xs font-bold text-red-600">{errors.attachment.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-neutral-900 shadow-2xl shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>

              <div className="mt-10 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-600">⚡</div>
                <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                  We typically respond within <span className="font-black">24 business hours</span>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'my-tickets' && (
            <div className="space-y-6">
              {loading ? (
                <div className="p-20 text-center font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">Loading your tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="bg-glass p-20 rounded-[3.5rem] border border-white/40 text-center shadow-xl">
                  <p className="text-neutral-400 font-bold italic mb-8 text-xl">You have no open support tickets.</p>
                  <button onClick={() => setActiveTab('create')} className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-neutral-900 shadow-xl transition-all">Create Your First Ticket</button>
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t._id} className="bg-glass p-8 rounded-[2.5rem] border border-white/40 shadow-xl hover:bg-white/60 transition-all group flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                       <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner ${
                        t.status === 'open' ? 'bg-indigo-600/10 text-indigo-600' :
                        t.status === 'resolved' ? 'bg-emerald-600/10 text-emerald-600' :
                        'bg-neutral-600/10 text-neutral-400'
                      }`}>
                         {t.status === 'open' ? '📡' : t.status === 'resolved' ? '✅' : '⚙️'}
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-3">
                             <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">#{t.ticket_number || t._id.slice(-6)}</p>
                             <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                               t.status === 'open' ? 'bg-indigo-600 text-white' :
                               t.status === 'resolved' ? 'bg-emerald-600 text-white' :
                               'bg-neutral-400 text-white'
                             }`}>
                                {t.status}
                             </span>
                          </div>
                          <h3 className="text-xl font-black text-neutral-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{t.subject}</h3>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest opacity-60">Created: {new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                       </div>
                    </div>
                    <button onClick={() => window.location.href = `/support/tickets/${t._id}`} className="px-8 py-4 bg-white/60 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-white hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Inspect</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
