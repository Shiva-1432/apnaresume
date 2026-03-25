const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  razorpay_payment_id: String,
  razorpay_order_id: String,

  amount: Number,
  credits_added: Number,

  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
