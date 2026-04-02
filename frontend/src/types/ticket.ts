export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  ticketNumber: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}
