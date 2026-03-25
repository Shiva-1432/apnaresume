'use client';

import { useState } from 'react';
import axios from 'axios';
import { useScript } from '@/hooks/useScript';

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => Promise<void>;
  prefill: {
    email: string;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function PaymentModal({ onSuccess }: { onSuccess: () => void }) {
  const [amount, setAmount] = useState(199);
  const [loading, setLoading] = useState(false);

  useScript('https://checkout.razorpay.com/v1/checkout.js');

  const handlePayment = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');

      // Create order
      const orderResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/create-order`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order_id, key_id, user_email } = orderResponse.data;

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: key_id,
        amount: amount * 100,
        currency: 'INR',
        name: 'ResumePro',
        description: 'Resume Analysis Credits',
        order_id,
        handler: async (response: RazorpayHandlerResponse) => {
          // Verify payment
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/payments/verify-payment`,
            {
              razorpay_order_id: order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount * 100
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          onSuccess();
        },
        prefill: {
          email: user_email
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Buy Credits</h2>

      <div className="space-y-4 mb-6">
        <label className="block">
          <input
            type="radio"
            name="plan"
            value="199"
            checked={amount === 199}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          />
          <span className="ml-2">₹199 - 50 Credits</span>
        </label>

        <label className="block">
          <input
            type="radio"
            name="plan"
            value="499"
            checked={amount === 499}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          />
          <span className="ml-2">₹499 - 150 Credits</span>
        </label>

        <label className="block">
          <input
            type="radio"
            name="plan"
            value="999"
            checked={amount === 999}
            onChange={(e) => setAmount(parseInt(e.target.value))}
          />
          <span className="ml-2">₹999 - 300 Credits</span>
        </label>
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </button>
    </div>
  );
}
