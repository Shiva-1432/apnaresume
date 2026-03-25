const sgMail = require('@sendgrid/mail');

// Initialize when needed
function initSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SendGrid API key not configured. Emails will be logged only.');
    return null;
  }
  sgMail.setApiKey(apiKey);
  return sgMail;
}

const sendGrid = initSendGrid();

// Email templates
const emailTemplates = {
  verifyEmail: (email, token, userName) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@apnaresume.com',
    subject: '✉️ Verify your ApnaResume email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to ApnaResume! 🎉</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for signing up! Please verify your email address to get started.</p>
              <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}" class="button">
                Verify Email
              </a>
              <p style="color: #6b7280; font-size: 14px;">
                This link expires in 24 hours.
              </p>
              <p>If you didn't create this account, please ignore this email.</p>
              <div class="footer">
                <p>ApnaResume AI - Your Resume, Optimized</p>
                <p>© 2026 ApnaResume. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  paymentConfirmation: (email, userName, amount, credits) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@apnaresume.com',
    subject: '✓ Payment Received - Credits Added',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .stat-box { background: white; padding: 15px; border-radius: 6px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #22c55e; }
            .stat-label { color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Payment Successful! 💳</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for your purchase! We've received your payment.</p>
              
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-value">₹${amount}</div>
                  <div class="stat-label">Amount Paid</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">+${credits}</div>
                  <div class="stat-label">Credits Added</div>
                </div>
              </div>

              <h3>You can now:</h3>
              <ul>
                <li>Analyze more resumes (5 credits each)</li>
                <li>Match more jobs (3 credits each)</li>
                <li>Analyze skill gaps (8 credits each)</li>
                <li>Create resume versions</li>
              </ul>

              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">
                Go to Dashboard
              </a>

              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Need help? Visit our <a href="${process.env.FRONTEND_URL}/support">support page</a>.
              </p>

              <div class="footer">
                <p>ApnaResume AI - Your Resume, Optimized</p>
                <p>© 2026 ApnaResume. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (email, userName, resetToken) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@apnaresume.com',
    subject: '🔑 Reset Your ApnaResume Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
            .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request 🔐</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We received a request to reset your password. Click the button below to set a new password.</p>
              
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" class="button">
                Reset Password
              </a>

              <div class="warning">
                <strong>⚠️ Important:</strong> This link expires in 15 minutes. If you didn't request this, please ignore this email.
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                For security, never share this link with anyone.
              </p>

              <div class="footer">
                <p>ApnaResume AI - Your Resume, Optimized</p>
                <p>© 2026 ApnaResume. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  supportTicketConfirmation: (email, userName, ticketId) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@apnaresume.com',
    subject: `✓ Support Ticket #${ticketId} Created`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .ticket-box { background: white; border-left: 4px solid #0284c7; padding: 15px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Support Ticket Created ✓</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for reaching out. We've received your support request.</p>
              
              <div class="ticket-box">
                <p><strong>Ticket ID:</strong> #${ticketId}</p>
                <p><strong>Status:</strong> Open</p>
                <p>Our support team will respond within 24 hours.</p>
              </div>

              <a href="${process.env.FRONTEND_URL}/support/tickets/${ticketId}" class="button">
                View Ticket Status
              </a>

              <p style="color: #6b7280; font-size: 14px;">
                You can check the status of your ticket anytime from your account dashboard.
              </p>

              <div class="footer">
                <p>ApnaResume AI - Your Resume, Optimized</p>
                <p>© 2026 ApnaResume. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send email function
async function sendEmail(templateName, templateData) {
  try {
    if (!emailTemplates[templateName]) {
      return { success: false, error: `Unknown email template: ${templateName}` };
    }

    if (!sendGrid) {
      // If SendGrid not configured, log email instead
      console.log(`📧 [EMAIL] ${templateName}:`, templateData);
      return { success: true, logged: true };
    }

    const message = emailTemplates[templateName](...Object.values(templateData));
    
    await sendGrid.send(message);
    
    console.log(`✓ Email sent: ${templateName} to ${message.to}`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Email send failed (${templateName}):`, error.message);
    // Don't throw - let app continue even if email fails
    return { success: false, error: error.message };
  }
}

// Backward-compatible helpers used by current routes.
async function sendVerificationEmail(email, token, userName = 'there') {
  return sendEmail('verifyEmail', { email, token, userName });
}

async function sendPasswordResetEmail(email, resetToken, userName = 'there') {
  return sendEmail('passwordReset', { email, userName, resetToken });
}

async function sendPaymentConfirmation(email, user, amount, credits) {
  return sendEmail('paymentConfirmation', {
    email,
    userName: user?.name || 'there',
    amount,
    credits
  });
}

module.exports = {
  sendEmail,
  emailTemplates,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmation
};
