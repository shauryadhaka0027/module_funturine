import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Dealer from '../models/Dealer.js';
import Admin from '../models/Admin.js';
import { generateToken } from '../utils/jwt.js';
import { sendDealerRegistrationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { generateOTPWithExpiration, sendSMSOTP, sendEmailOTP, verifyOTP } from '../services/otpService.js';

// Dealer Registration (Simplified - no OTP)
export const registerDealer = async (req, res) => {
  try {
    const { companyName, contactPersonName, mobile, email, address, gst, password } = req.body;

    // Check if dealer already exists
    const existingDealer = await Dealer.findOne({ 
      $or: [{ email }, { mobile }, { gst }] 
    });

    if (existingDealer) {
      res.status(400).json({ 
        message: 'Dealer with this email, mobile, or GST already exists' 
      });
      return;
    }

    // Create new dealer without OTP verification
    const dealer = new Dealer({
      companyName,
      contactPersonName,
      mobile,
      email,
      address,
      gst,
      password,
      status: 'pending',
      isMobileVerified: true, // Skip verification for testing
      isEmailVerified: true,  // Skip verification for testing
      isFirstTimeUser: true
    });

    await dealer.save();

    res.status(201).json({
      message: 'Registration submitted successfully. Please wait for admin approval.',
      dealerId: dealer._id,
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Dealer registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dealer Registration Step 1 - Send OTPs
export const registerDealerStep1 = async (req, res) => {
  try {
    const { companyName, contactPersonName, mobile, email, address, gst, password } = req.body;

    // Check if dealer already exists
    const existingDealer = await Dealer.findOne({ 
      $or: [{ email }, { mobile }, { gst }] 
    });

    if (existingDealer) {
      res.status(400).json({ 
        message: 'Dealer with this email, mobile, or GST already exists' 
      });
      return;
    }

    // Generate OTPs
    const mobileOtpData = generateOTPWithExpiration();
    const emailOtpData = generateOTPWithExpiration();

    // Create new dealer with OTPs
    const dealer = new Dealer({
      companyName,
      contactPersonName,
      mobile,
      email,
      address,
      gst,
      password,
      mobileOtp: mobileOtpData.otp,
      mobileOtpExpires: mobileOtpData.expiresAt,
      emailOtp: emailOtpData.otp,
      emailOtpExpires: emailOtpData.expiresAt
    });

    await dealer.save();

    // Send OTPs
    const smsSent = await sendSMSOTP(mobile, mobileOtpData.otp);
    const emailSent = await sendEmailOTP(email, emailOtpData.otp, companyName);

    if (!smsSent || !emailSent) {
      await Dealer.findByIdAndDelete(dealer._id);
      res.status(500).json({ 
        message: 'Failed to send OTP. Please try again.' 
      });
      return;
    }

    res.status(201).json({
      message: 'OTPs sent successfully. Please check your email and mobile.',
      dealerId: dealer._id
    });

  } catch (error) {
    console.error('Dealer registration step 1 error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dealer Registration Step 2 - Verify OTPs
export const registerDealerStep2 = async (req, res) => {
  try {
    const { dealerId, mobileOtp, emailOtp } = req.body;

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    // Verify OTPs
    const mobileVerified = await verifyOTP(mobileOtp, dealer.mobileOtp, dealer.mobileOtpExpires);
    const emailVerified = await verifyOTP(emailOtp, dealer.emailOtp, dealer.emailOtpExpires);

    if (!mobileVerified || !emailVerified) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    // Update dealer status
    dealer.isMobileVerified = true;
    dealer.isEmailVerified = true;
    dealer.status = 'pending';
    dealer.mobileOtp = undefined;
    dealer.mobileOtpExpires = undefined;
    dealer.emailOtp = undefined;
    dealer.emailOtpExpires = undefined;

    await dealer.save();

    res.json({
      message: 'Registration completed successfully. Please wait for admin approval.',
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Dealer registration step 2 error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { dealerId, type } = req.body; // type: 'mobile' or 'email'

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    const otpData = generateOTPWithExpiration();

    if (type === 'mobile') {
      dealer.mobileOtp = otpData.otp;
      dealer.mobileOtpExpires = otpData.expiresAt;
      await dealer.save();
      
      const smsSent = await sendSMSOTP(dealer.mobile, otpData.otp);
      if (!smsSent) {
        res.status(500).json({ message: 'Failed to send SMS OTP' });
        return;
      }
    } else if (type === 'email') {
      dealer.emailOtp = otpData.otp;
      dealer.emailOtpExpires = otpData.expiresAt;
      await dealer.save();
      
      const emailSent = await sendEmailOTP(dealer.email, otpData.otp, dealer.companyName);
      if (!emailSent) {
        res.status(500).json({ message: 'Failed to send email OTP' });
        return;
      }
    }

    res.json({ message: 'OTP resent successfully' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dealer Login
export const loginDealer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const dealer = await Dealer.findOne({ email }).select('+password');
    if (!dealer) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await dealer.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (dealer.status !== 'approved') {
      res.status(403).json({ 
        message: 'Account not approved. Please wait for admin approval.',
        status: dealer.status
      });
      return;
    }

    if (!dealer.isMobileVerified || !dealer.isEmailVerified) {
      res.status(403).json({ 
        message: 'Please complete OTP verification first.',
        needsVerification: true,
        dealerId: dealer._id
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: dealer._id,
      email: dealer.email,
      role: 'dealer'
    });

    res.json({
      message: 'Login successful',
      token,
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Dealer login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: 'admin'
    });

    res.json({
      message: 'Login successful',
      token,
      admin: admin.getPublicProfile()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const dealer = await Dealer.findOne({ email });
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    dealer.resetPasswordToken = resetToken;
    dealer.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await dealer.save();

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken, dealer.companyName);
    if (!emailSent) {
      res.status(500).json({ message: 'Failed to send reset email' });
      return;
    }

    res.json({ message: 'Password reset email sent successfully' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const dealer = await Dealer.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!dealer) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    dealer.password = newPassword;
    dealer.resetPasswordToken = undefined;
    dealer.resetPasswordExpires = undefined;

    await dealer.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'dealer') {
      const dealer = await Dealer.findById(decoded.id);
      if (!dealer) {
        res.status(404).json({ message: 'Dealer not found' });
        return;
      }
      res.json({ dealer: dealer.getPublicProfile() });
    } else if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        res.status(404).json({ message: 'Admin not found' });
        return;
      }
      res.json({ admin: admin.getPublicProfile() });
    } else {
      res.status(401).json({ message: 'Invalid token' });
    }

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
