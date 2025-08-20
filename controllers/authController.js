import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Dealer from '../models/Dealer.js';
import Admin from '../models/Admin.js';
import { generateToken } from '../utils/jwt.js';
import { sendDealerRegistrationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { generateOTP, sendSMSOTP, sendEmailOTP, verifyOTP } from '../services/otpService.js';

// Dealer Registration (Simplified - no OTP)
export const registerDealer = async (req, res) => {
  const { companyName, contactPersonName, mobile, email, address, pinCode, gst, password } = req.body;

  console.log("=== DEALER REGISTRATION DEBUG ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Required fields check:");
  console.log("- companyName:", companyName ? "✓" : "✗ MISSING");
  console.log("- contactPersonName:", contactPersonName ? "✓" : "✗ MISSING");
  console.log("- mobile:", mobile ? "✓" : "✗ MISSING");
  console.log("- email:", email ? "✓" : "✗ MISSING");
  console.log("- address:", address ? "✓" : "✗ MISSING");
  console.log("- pinCode:", pinCode ? "✓" : "✗ MISSING");
  console.log("- gst:", gst ? "✓" : "✗ MISSING");
  console.log("- password:", password ? "✓" : "✗ MISSING");
  
  try {
    // Validate required fields
    const missingFields = [];
    if (!companyName) missingFields.push('companyName');
    if (!contactPersonName) missingFields.push('contactPersonName');
    if (!mobile) missingFields.push('mobile');
    if (!email) missingFields.push('email');
    if (!address) missingFields.push('address');
    if (!pinCode) missingFields.push('pinCode');
    if (!gst) missingFields.push('gst');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      console.log("✗ Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        data: null,
        errors: {
          missingFields: missingFields
        },
        errorCode: 'VALIDATION_ERROR'
      });
    }

    // Check if dealer already exists
    console.log("Checking for existing dealer...");
    const existingDealer = await Dealer.findOne({ 
      $or: [{ email }, { mobile }, { gst }] 
    });

    if (existingDealer) {
      console.log("✗ Dealer already exists:", {
        email: existingDealer.email === email,
        mobile: existingDealer.mobile === mobile,
        gst: existingDealer.gst === gst
      });
      return res.status(400).json({ 
        success: false,
        message: 'Dealer with this email, mobile, or GST already exists',
        data: null,
        errors: {
          conflictFields: {
            email: existingDealer.email === email,
            mobile: existingDealer.mobile === mobile,
            gst: existingDealer.gst === gst
          }
        },
        errorCode: 'DUPLICATE_DEALER'
      });
    }

    console.log("✓ No existing dealer found. Creating new dealer...");

    // Create new dealer without OTP verification
    const dealer = new Dealer({
      companyName,
      contactPersonName,
      mobile,
      email,
      address,
      pinCode,
      gst,
      password,
      status: 'pending',
      isMobileVerified: true, // Skip verification for testing
      isEmailVerified: true,  // Skip verification for testing
      isFirstTimeUser: true
    });

    await dealer.save();
    console.log("✓ Dealer created successfully with ID:", dealer._id);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Please wait for admin approval.',
      data: {
        dealerId: dealer._id,
        dealer: dealer.getPublicProfile()
      },
      errors: null
    });

  } catch (error) {
    console.error('✗ Dealer registration error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        data: null,
        errors: validationErrors,
        errorCode: 'MONGOOSE_VALIDATION_ERROR'
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A dealer with this ${duplicateField} already exists`,
        data: null,
        errors: {
          field: duplicateField
        },
        errorCode: 'DUPLICATE_KEY_ERROR'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      data: null,
      errors: {
        message: error.message,
        type: error.name
      },
      errorCode: 'SERVER_ERROR'
    });
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
    const mobileOtp = generateOTP();
    const emailOtp = generateOTP();

    // Create new dealer with OTPs
    const dealer = new Dealer({
      companyName,
      contactPersonName,
      mobile,
      email,
      address,
      gst,
      password,
      mobileOtp: mobileOtp,
      emailOtp: emailOtp
    });

    await dealer.save();

    // Send OTPs
    const smsSent = await sendSMSOTP(mobile, mobileOtp);
    const emailSent = await sendEmailOTP(email, emailOtp, companyName);

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
    const mobileResult = verifyOTP(dealer.mobile, mobileOtp);
    const emailResult = verifyOTP(dealer.email, emailOtp);
    
    const mobileVerified = mobileResult.valid;
    const emailVerified = emailResult.valid;

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

    const otp = generateOTP();

    if (type === 'mobile') {
      dealer.mobileOtp = otp;
      dealer.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await dealer.save();
      
      const smsSent = await sendSMSOTP(dealer.mobile, otp);
      if (!smsSent) {
        res.status(500).json({ message: 'Failed to send SMS OTP' });
        return;
      }
    } else if (type === 'email') {
      dealer.emailOtp = otp;
      dealer.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await dealer.save();
      
      const emailSent = await sendEmailOTP(dealer.email, otp, dealer.companyName);
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
    const { gst, password } = req.body;

    const dealer = await Dealer.findOne({ gst: gst.toUpperCase() }).select('+password');
    if (!dealer) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid GST number',
        data: null,
        errors: null,
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const isPasswordValid = await dealer.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false,
        message: 'Incorrect password',
        data: null,
        errors: null,
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    if (dealer.status !== 'approved') {
      res.status(403).json({ 
        success: false,
        message: 'Account not approved. Please wait for admin approval.',
        data: {
          status: dealer.status
        },
        errors: null,
        errorCode: 'ACCOUNT_NOT_APPROVED'
      });
      return;
    }

    if (!dealer.isMobileVerified || !dealer.isEmailVerified) {
      res.status(403).json({ 
        success: false,
        message: 'Please complete OTP verification first.',
        data: {
          needsVerification: true,
          dealerId: dealer._id
        },
        errors: null,
        errorCode: 'VERIFICATION_REQUIRED'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: dealer._id,
      gst: dealer.gst,
      role: 'dealer'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        dealer: dealer.getPublicProfile()
      },
      errors: null
    });

  } catch (error) {
    console.error('Dealer login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      data: null,
      errors: {
        message: error.message
      },
      errorCode: 'SERVER_ERROR'
    });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        data: null,
        errors: null,
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        data: null,
        errors: null,
        errorCode: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: admin._id,
      email: admin.email,
      role: 'admin'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: admin.getPublicProfile()
      },
      errors: null
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      data: null,
      errors: {
        message: error.message
      },
      errorCode: 'SERVER_ERROR'
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { gst } = req.body;

    const dealer = await Dealer.findOne({ gst: gst.toUpperCase() });
    if (!dealer) {
      res.status(404).json({ 
        success: false,
        message: 'Dealer not found',
        data: null,
        errors: null,
        errorCode: 'DEALER_NOT_FOUND'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    dealer.resetPasswordToken = resetToken;
    dealer.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await dealer.save();

    // Send reset email (using dealer's email from the found record)
    const emailSent = await sendPasswordResetEmail(dealer.email, resetToken, dealer.companyName);
    if (!emailSent) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send reset email',
        data: null,
        errors: null,
        errorCode: 'EMAIL_SEND_FAILED'
      });
      return;
    }

    res.json({ 
      success: true,
      message: 'Password reset email sent successfully to your registered email address',
      data: null,
      errors: null
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      data: null,
      errors: {
        message: error.message
      },
      errorCode: 'SERVER_ERROR'
    });
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
      res.status(400).json({ 
        success: false,
        message: 'Invalid or expired reset token',
        data: null,
        errors: null,
        errorCode: 'INVALID_RESET_TOKEN'
      });
      return;
    }

    dealer.password = newPassword;
    dealer.resetPasswordToken = undefined;
    dealer.resetPasswordExpires = undefined;

    await dealer.save();

    res.json({ 
      success: true,
      message: 'Password reset successfully',
      data: null,
      errors: null
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      data: null,
      errors: {
        message: error.message
      },
      errorCode: 'SERVER_ERROR'
    });
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
