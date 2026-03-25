const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { authenticateToken } = require('../middleware/auth');
const { createUserRateLimit } = require('../middleware/userRateLimit');
const { sendEmail } = require('../utils/emailService');
const router = express.Router();

const PAYMENT_PLANS = {
  199: 50,
  499: 150,
  999: 300
};

const createOrderUserLimiter = createUserRateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many order attempts. Please wait a minute and try again.'
});

const verifyPaymentUserLimiter = createUserRateLimit({
  windowMs: 60 * 1000,
  max: 8,
  message: 'Too many payment verification attempts. Please wait a minute and try again.'
});

function transactionNotSupported(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('transaction numbers are only allowed')
    || message.includes('replica set member')
    || message.includes('nosuchtransaction');
}

async function grantCreditsWithRecovery({ userId, razorpayOrderId, razorpayPaymentId, amountRupees, creditsAdded }) {
  const paymentId = new mongoose.Types.ObjectId();
  const paymentPayload = {
    _id: paymentId,
    user_id: userId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_order_id: razorpayOrderId,
    amount: amountRupees,
    credits_added: creditsAdded,
    status: 'success'
  };

  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    const payments = await Payment.create([paymentPayload], { session });
    const payment = payments[0];

    user.credits += creditsAdded;
    await user.save({ session });
    await session.commitTransaction();

    return {
      payment,
      user
    };
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    if (!transactionNotSupported(error)) {
      throw error;
    }

    // Fallback path for standalone MongoDB without transaction support.
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const payment = new Payment(paymentPayload);
    await payment.save();

    try {
      user.credits += creditsAdded;
      await user.save();
    } catch (saveError) {
      await Payment.deleteOne({ _id: payment._id });
      throw saveError;
    }

    return {
      payment,
      user
    };
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// Initialize Razorpay lazily to avoid crashing the server when keys are missing.
let razorpay = null;

function getRazorpay() {
  if (!razorpay) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpay;
}

const validateRazorpayConfig = (req, res, next) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({
      error: 'Payment service not configured',
      message: 'Razorpay keys are missing. Contact admin.'
    });
  }

  next();
};

// CREATE ORDER
router.post('/create-order', validateRazorpayConfig, authenticateToken, createOrderUserLimiter, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);

    if (!PAYMENT_PLANS[amount]) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const razorpayClient = getRazorpay();

    const order = await razorpayClient.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: req.user.user_id.toString()
      }
    });

    res.json({
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: amount * 100,
      user_email: req.user.email
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

// VERIFY PAYMENT
router.post('/verify-payment', validateRazorpayConfig, authenticateToken, verifyPaymentUserLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const amountPaisa = Number(req.body?.amount);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !Number.isFinite(amountPaisa)) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const amountRupees = amountPaisa / 100;
    const creditsToAdd = PAYMENT_PLANS[amountRupees];
    if (!creditsToAdd) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const message = razorpay_order_id + '|' + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(message)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const existingPayment = await Payment.findOne({ razorpay_payment_id, status: 'success' });
    if (existingPayment) {
      const existingUser = await User.findById(req.user.user_id);
      return res.json({
        success: true,
        message: 'Payment already verified',
        credits: existingUser?.credits ?? 0
      });
    }

    const { payment, user } = await grantCreditsWithRecovery({
      userId: req.user.user_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountRupees,
      creditsAdded: creditsToAdd
    });

    try {
      await sendEmail('paymentConfirmation', {
        email: user.email,
        userName: user.name,
        amount: payment.amount,
        credits: payment.credits_added
      });
    } catch (mailError) {
      console.error('Payment email failed:', mailError.message || mailError);
    }

    res.json({
      success: true,
      message: '✓ Payment successful! Check your email for confirmation.',
      credits: user.credits
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
