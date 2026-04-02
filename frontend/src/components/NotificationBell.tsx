'use client';

import { useState, useRef, useEffect } from 'react';

type Notification = {
  id: string;
  type: 'ticket' | 'resume' | 'credit' | 'tip';
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'resume',
    title: 'Resume Analyzed',
    body: 'Your latest resume scored 78/100. See your improvement tips.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'ticket',
    title: 'Support Reply',
    body: 'Our team replied to your ticket #SUP-004.',
    time: '1 hr ago',
    read: false,
  },
  {
    id: '3',
    type: 'credit',
    title: 'Credits Low',
    body: 'You have 2 credits remaining. Top up to continue analyzing.',
    time: '3 hr ago',
    read: true,
  },
  {
    id: '4',
    type: 'tip',
    title: 'Pro Tip',
    body: 'Add measurable impact metrics to your experience section to boost your score.',
    time: 'Yesterday',
    read: true,
  },
];

const ICONS: Record<Notification['type'], string> = {
  resume: '📄',
  ticket: '💬',
  credit: '⚡',
  tip: '💡',
};

const COLORS: Record<Notification['type'], string> = {
  resume: 'bg-indigo-100 text-indigo-600',
  ticket: 'bg-violet-100 text-violet-600',
  credit: 'bg-amber-100 text-amber-600',
  tip: 'bg-emerald-100 text-emerald-600',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-white/60 border border-white/40 shadow-sm hover:bg-white hover:shadow-md transition-all"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 w-80 bg-glass rounded-[2rem] shadow-2xl border border-white/40 backdrop-blur-3xl overflow-hidden z-50 motion-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/20">
            <div>
              <h3 className="font-black text-neutral-900 text-sm">Notifications</h3>
              {unread > 0 && (
                <p className="text-[10px] font-bold text-neutral-400 mt-0.5">{unread} unread</p>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-6 py-4 flex items-start gap-4 hover:bg-white/40 transition-all ${!n.read ? 'bg-indigo-50/50' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${COLORS[n.type]}`}>
                  {ICONS[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-black text-neutral-900 truncate ${!n.read ? '' : 'opacity-70'}`}>{n.title}</p>
                    {!n.read && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-[11px] font-medium text-neutral-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] font-bold text-neutral-300 mt-1">{n.time}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/20">
            <button className="w-full text-center text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
