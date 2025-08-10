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
        message: "Dealer with this email, mobile, or GST already exists" 
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
      status: "pending",
      isMobileVerified: true, // Skip verification for testing
      isEmailVerified: true,  // Skip verification for testing
      isFirstTimeUser: true
    });

    await dealer.save();

    res.status(201).json({
      message: "Operation successful",
      dealerId: dealer._id,
      dealer
    });

  } catch (error) {
    console.error('Dealer registration error:', error);
    res.status(500).json({ message: "Internal server error" });
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
        message: "Dealer with this email, mobile, or GST already exists" 
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
      res.status(500).json({ message: "Failed to send OTP" });
      return;
    }

    res.status(201).json({
      message: "Operation successful",
      dealerId: dealer._id
    });

  } catch (error) {
    console.error('Dealer registration step 1 error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Dealer Registration Step 2 - Verify OTPs
export const registerDealerStep2 = async (req, res) => {
  try {
    const { dealerId, mobileOtp, emailOtp } = req.body;

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      res.status(404).json({ message: "Dealer not found" });
      return;
    }

    // Verify mobile OTP
    const isMobileOtpValid = verifyOTP(dealer.mobileOtp, mobileOtp, dealer.mobileOtpExpires);
    if (!isMobileOtpValid) {
      res.status(400).json({ message: "Invalid mobile OTP" });
      return;
    }

    // Verify email OTP
    const isEmailOtpValid = verifyOTP(dealer.emailOtp, emailOtp, dealer.emailOtpExpires);
    if (!isEmailOtpValid) {
      res.status(400).json({ message: "Invalid email OTP" });
      return;
    }

    // Mark as verified
    dealer.isMobileVerified = true;
    dealer.isEmailVerified = true;
    dealer.mobileOtp = undefined;
    dealer.mobileOtpExpires = undefined;
    dealer.emailOtp = undefined;
    dealer.emailOtpExpires = undefined;

    await dealer.save();

    // Send registration confirmation email
    await sendDealerRegistrationEmail(dealer);

    res.json({
      message: "Operation successful",
      dealer
    });

  } catch (error) {
    console.error('Dealer registration step 2 error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { dealerId, type } = req.body;
    
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      res.status(404).json({ message: "Dealer not found" });
      return;
    }

    const otpData = generateOTPWithExpiration();

    if (type === 'mobile') {
      dealer.mobileOtp = otpData.otp;
      dealer.mobileOtpExpires = otpData.expiresAt;
      await dealer.save();

      const smsSent = await sendSMSOTP(dealer.mobile, otpData.otp);
      if (!smsSent) {
        res.status(500).json({ message: "Failed to send SMS OTP" });
        return;
      }
    } else if (type === 'email') {
      dealer.emailOtp = otpData.otp;
      dealer.emailOtpExpires = otpData.expiresAt;
      await dealer.save();

      const emailSent = await sendEmailOTP(dealer.email, otpData.otp, dealer.companyName);
      if (!emailSent) {
        res.status(500).json({ message: "Failed to send email OTP" });
        return;
      }
    }

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Dealer Login
export const loginDealer = async (req, res) => {
  try {
    const { gst, password } = req.body;

    if (!gst || !password) {
      res.status(400).json({ message: "GST and password are required" });
      return;
    }

    // Find dealer by GST
    const dealer = await Dealer.findOne({ gst });

    if (!dealer) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if account is approved
    if (dealer.status !== 'approved') {
      res.status(403).json({ 
        message: "Account not approved",
        status: dealer.status
      });
      return;
    }

    // Check if account is active
    if (!dealer.isActive) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Check if mobile and email are verified
    if (!dealer.isMobileVerified || !dealer.isEmailVerified) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Verify password
    const isPasswordValid = await dealer.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Generate token
    const token = generateToken(dealer._id);

    // Update first time user status
    if (dealer.isFirstTimeUser === true) {
      dealer.isFirstTimeUser = false;
      await dealer.save();
    }

    res.json({
      message: "Operation successful",
      token,
      dealer
    });

  } catch (error) {
    console.error('Dealer login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "Bad request" });
      return;
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });

    if (!admin) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if account is active
    if (!admin.isActive) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      message: "Operation successful",
      token,
      admin
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { gst } = req.body;

    const dealer = await Dealer.findOne({ gst });
    if (!dealer) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    dealer.resetPasswordToken = resetToken;
    dealer.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await dealer.save();

    // Send password reset email
    await sendPasswordResetEmail(dealer.email, resetToken);

    res.json({ message: "Success" });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const dealer = await Dealer.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!dealer) {
      res.status(400).json({ message: "Bad request" });
      return;
    }

    // Update password
    dealer.password = newPassword;
    dealer.resetPasswordToken = undefined;
    dealer.resetPasswordExpires = undefined;
    await dealer.save();

    res.json({ message: "Success" });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace("Bearer ", '');
    
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Dealer.findById(decoded.userId) || await Admin.findById(decoded.userId);

    if (!user) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error, error');
    res.status(500).json({ message: "Internal server error" });
  }
};
