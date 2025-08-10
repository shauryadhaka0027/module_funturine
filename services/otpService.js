import crypto from 'crypto';
import { sendDealerRegistrationEmail } from './emailService.js';

// Generate OTP
export const generateOTP = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};

// Store OTP in memory (in production, use Redis or database)
const otpStore = new Map();

// Send SMS OTP
export const sendSMSOTP = async (mobile, otp) => {
  try {
    // In a real application, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS OTP ${otp} sent to ${mobile}`);
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(mobile, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    return true;
  } catch (error) {
    console.error('SMS OTP sending failed:', error);
    return false;
  }
};

// Send Email OTP
export const sendEmailOTP = async (email, otp, companyName) => {
  try {
    // In a real application, send email with OTP
    console.log(`Email OTP ${otp} sent to ${email} for ${companyName}`);
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    return true;
  } catch (error) {
    console.error('Email OTP sending failed:', error);
    return false;
  }
};

// Verify OTP
export const verifyOTP = (identifier, otp) => {
  const storedData = otpStore.get(identifier);
  
  if (!storedData) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, message: 'OTP expired' };
  }
  
  if (storedData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  // Remove OTP after successful verification
  otpStore.delete(identifier);
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store password reset token
const passwordResetTokens = new Map();

// Send password reset OTP
export const sendPasswordResetOTP = async (email, dealerName) => {
  try {
    const otp = generateOTP(6);
    const resetToken = generatePasswordResetToken();
    
    // Store reset token with expiration (1 hour)
    passwordResetTokens.set(resetToken, {
      email,
      otp,
      expiresAt: Date.now() + 60 * 60 * 1000
    });
    
    // Send email with OTP
    console.log(`Password reset OTP ${otp} sent to ${email} for ${dealerName}`);
    
    return resetToken;
  } catch (error) {
    console.error('Password reset OTP sending failed:', error);
    return null;
  }
};

// Verify password reset token
export const verifyPasswordResetToken = (token, otp) => {
  const storedData = passwordResetTokens.get(token);
  
  if (!storedData) {
    return { valid: false, message: 'Invalid or expired reset token' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    passwordResetTokens.delete(token);
    return { valid: false, message: 'Reset token expired' };
  }
  
  if (storedData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  return { 
    valid: true, 
    message: 'Token verified successfully',
    email: storedData.email
  };
};

// Clean up expired tokens (run periodically)
export const cleanupExpiredTokens = () => {
  const now = Date.now();
  
  // Clean up OTP store
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
  
  // Clean up password reset tokens
  for (const [key, value] of passwordResetTokens.entries()) {
    if (now > value.expiresAt) {
      passwordResetTokens.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
