const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticket_number: {
    type: String,
    unique: true,
    required: true // Format: TICKET-20260324-001
  },
  // Kept for compatibility with current API payload and existing records.
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Kept for compatibility with current API payload and existing records.
  name: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  // Backward-compatible alias for existing route payload.
  message: {
    type: String,
    maxlength: 5000
  },
  category: {
    type: String,
    enum: [
      'billing',
      'technical',
      'feature-request',
      'bug-report',
      'account',
      'data-deletion',
      'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting-customer', 'resolved', 'closed'],
    default: 'open'
  },
  attachments: [
    {
      filename: String,
      url: String,
      uploaded_at: Date
    }
  ],
  responses: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      responder_id: mongoose.Schema.Types.ObjectId, // Admin ID
      message: String,
      created_at: {
        type: Date,
        default: Date.now
      }
    }
  ],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  resolved_at: Date,
  resolution_notes: String
});

// Generate unique ticket number
supportTicketSchema.pre('save', async function preSave(next) {
  if (this.isNew) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    this.ticket_number = `TICKET-${date}-${String(count + 1).padStart(3, '0')}`;
  }

  // Backfill description from legacy message field when needed.
  if (!this.description && this.message) {
    this.description = this.message;
  }

  // Keep legacy message updated for old consumers.
  if (!this.message && this.description) {
    this.message = this.description;
  }

  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
