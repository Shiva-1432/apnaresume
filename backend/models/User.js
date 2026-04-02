const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  clerk_user_id: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Basic info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  password: {
    type: String,
    required: function () {
      return !this.clerk_user_id;
    },
    minlength: 8
  },
  
  // Credits system
  credits: {
    type: Number,
    default: 20 // Free tier
  },
  
  // Verification
  verification: {
    email_verified: { type: Boolean, default: false },
    verification_token: String,
    verification_sent_at: Date
  },

  // Password reset
  password_reset: {
    reset_token: String,
    reset_sent_at: Date
  },
  
  // Security
  created_at: { type: Date, default: Date.now },
  last_login_at: Date,
  last_login_ip: String,

  // Session tracking
  sessions: [{
    session_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    last_activity_at: { type: Date, default: Date.now },
    ip: String,
    user_agent: String,
    is_active: { type: Boolean, default: true }
  }],
  
  // Account status
  account_locked: { type: Boolean, default: false },
  locked_until: Date,
  failed_login_attempts: { type: Number, default: 0 }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.verifyPassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
