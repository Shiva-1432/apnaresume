const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const { sendEmail } = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const supportCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many support requests. Please try again later.' }
});

const VALID_CATEGORIES = new Set([
  'billing',
  'technical',
  'feature-request',
  'bug-report',
  'account',
  'data-deletion',
  'other'
]);

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

async function createTicket(req, res) {
  try {
    const subject = String(req.body?.subject || '').trim();
    const description = String(req.body?.description || req.body?.message || '').trim();
    const category = String(req.body?.category || 'other').trim();
    const priority = String(req.body?.priority || 'medium').trim().toLowerCase();

    if (!subject || !description || !category) {
      return res.status(400).json({
        error: 'Validation failed',
        details: 'Subject, description, and category are required'
      });
    }

    if (description.length < 20) {
      return res.status(400).json({
        error: 'Description too short',
        details: 'Please provide at least 20 characters'
      });
    }

    if (subject.length > 160) {
      return res.status(400).json({ error: 'Subject is too long (max 160 chars)' });
    }

    if (description.length > 5000) {
      return res.status(400).json({ error: 'Description is too long (max 5000 chars)' });
    }

    if (!VALID_CATEGORIES.has(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        details: 'Please choose a valid support category'
      });
    }

    if (!VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({
        error: 'Invalid priority',
        details: 'Priority must be one of: low, medium, high, critical'
      });
    }

    const user = await User.findById(req.user.user_id).select('email name');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ticket = new SupportTicket({
      _id: new mongoose.Types.ObjectId(),
      user_id: req.user.user_id,
      email: user.email,
      name: user.name,
      category,
      subject,
      description,
      message: description,
      priority,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    });

    await ticket.save();

    await sendEmail('supportTicketConfirmation', {
      email: user.email,
      userName: user.name,
      ticketId: ticket.ticket_number
    });

    return res.json({
      success: true,
      message: '✓ Support ticket created',
      ticket: {
        _id: ticket._id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        created_at: ticket.created_at
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
}

router.post('/create-ticket', authenticateToken, supportCreateLimiter, createTicket);

// Backward-compatible alias for existing frontend integrations.
router.post('/tickets', authenticateToken, supportCreateLimiter, createTicket);

router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .select('_id ticket_number subject category description status priority created_at updated_at responses attachments');

    return res.json({
      tickets
    });
  } catch (error) {
    console.error('Support tickets list error:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch support tickets',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .select('_id ticket_number subject status priority created_at updated_at');

    return res.json({
      success: true,
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('List tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Backward-compatible alias for existing frontend integrations.
router.get('/tickets/me', authenticateToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .limit(20)
      .select('subject category status created_at updated_at ticket_number');

    return res.json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Support ticket list error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

router.get('/ticket/:ticketId', authenticateToken, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (String(ticket.user_id) !== String(req.user.user_id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

router.post('/ticket/:ticketId/add-response', authenticateToken, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (String(ticket.user_id) !== String(req.user.user_id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.responses.push({
      _id: new mongoose.Types.ObjectId(),
      responder_id: req.user.user_id,
      message,
      created_at: new Date()
    });

    ticket.status = 'open';
    await ticket.save();

    return res.json({
      success: true,
      message: '✓ Response added',
      ticket
    });
  } catch (error) {
    console.error('Add response error:', error);
    return res.status(500).json({ error: 'Failed to add response' });
  }
});

router.post('/ticket/:ticketId/close', authenticateToken, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (String(ticket.user_id) !== String(req.user.user_id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.status = 'closed';
    ticket.resolved_at = new Date();
    await ticket.save();

    return res.json({
      success: true,
      message: '✓ Ticket closed'
    });
  } catch (error) {
    console.error('Close ticket error:', error);
    return res.status(500).json({ error: 'Failed to close ticket' });
  }
});

module.exports = router;
