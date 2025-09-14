import Enquiry from '../models/Enquiry.js';
import Dealer from '../models/Dealer.js';
import { generateOTP, sendEmailOTP, verifyOTP } from '../services/otpService.js';
import { sendOtpByEmail, sendPasswordResetEmail } from '../services/emailService.js';
import Otp from '../models/Otp.js';
import crypto from 'crypto';

// Get dealer profile
export const getDealerProfile = async (req, res) => {
  try {
    res.json({ dealer: req.dealer.getPublicProfile() });
  } catch (error) {
    console.error('Get dealer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update dealer profile
export const updateDealerProfile = async (req, res) => {
  try {
    const { companyName, contactPersonName, mobile, address } = req.body;
    const dealer = req.dealer;

    // Update allowed fields
    if (companyName) dealer.companyName = companyName;
    if (contactPersonName) dealer.contactPersonName = contactPersonName;
    if (mobile) dealer.mobile = mobile;
    if (address) dealer.address = address;

    await dealer.save();

    res.json({
      message: 'Profile updated successfully',
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Update dealer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
export const changeDealerPassword = async (req, res) => {
  try {
    console.log('[changeDealerPassword] Request body:', req.body);
    const { currentPassword, newPassword } = req.body;
    const dealer = req.dealer;
    console.log('[changeDealerPassword] Dealer from req:', dealer);

    if (!dealer) {
      console.error('[changeDealerPassword] Dealer not found on request object');
      res.status(400).json({ message: 'Dealer not found' });
      return;
    }

    // Extra log before password comparison
    console.log('[changeDealerPassword] About to compare current password...');
    let isCurrentPasswordValid;
    try {
      isCurrentPasswordValid = await dealer.comparePassword(currentPassword);
      console.log('[changeDealerPassword] isCurrentPasswordValid:', isCurrentPasswordValid);
    } catch (err) {
      console.error('[changeDealerPassword] Error during comparePassword:', err);
      res.status(500).json({ message: 'Error verifying current password', error: err.message });
      return;
    }
    // Extra log after password comparison
    console.log('[changeDealerPassword] Finished password comparison. Result:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password
    dealer.password = newPassword;
    try {
      await dealer.save();
      console.log('[changeDealerPassword] Password updated and saved successfully');
    } catch (err) {
      console.error('[changeDealerPassword] Error saving new password:', err);
      res.status(500).json({ message: 'Error saving new password' });
      return;
    }

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer dashboard stats
export const getDealerDashboard = async (req, res) => {
  const dealer = req.dealer;
  console.log("[Dealer Dashboard] Dealer object:", dealer);
  try {
    console.log("[Dealer Dashboard] Counting total enquiries...");
    const totalEnquiries = await Enquiry.countDocuments({ dealer: dealer.id });
    console.log("[Dealer Dashboard] Total enquiries counted:", totalEnquiries);

    console.log("[Dealer Dashboard] Counting pending enquiries...");
    const pendingEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer.id, 
      status: 'pending' 
    });
    console.log("[Dealer Dashboard] Pending enquiries counted:", pendingEnquiries);

    console.log("[Dealer Dashboard] Counting under process enquiries...");
    const underProcessEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer.id, 
      status: 'under_process' 
    });
    console.log("[Dealer Dashboard] Under process enquiries counted:", underProcessEnquiries);

    console.log("[Dealer Dashboard] Counting approved enquiries...");
    const approvedEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer.id, 
      status: 'approved' 
    });
    console.log("[Dealer Dashboard] Approved enquiries counted:", approvedEnquiries);

    console.log("[Dealer Dashboard] Counting rejected enquiries...");
    const rejectedEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer.id, 
      status: 'rejected' 
    });
    console.log("[Dealer Dashboard] Rejected enquiries counted:", rejectedEnquiries);

    // Fetch all enquiries for the dealer with required fields
    console.log("[Dealer Dashboard] Fetching all enquiry details for dealer...");
    const allEnquiries = await Enquiry.find({ dealer: dealer.id })
      .select('status quantity remarks productCode productName')
      .lean();
    const enquiryDetails = allEnquiries.map(e => ({
      status: e.status,
      quantity: e.quantity,
      remarks: e.remarks,
      productCode: e.productCode,
      productName: e.productName
    }));
    console.log("[Dealer Dashboard] Enquiry details count:", enquiryDetails.length);

    const dashboardStats = {
      totalEnquiries,
      pendingEnquiries,
      underProcessEnquiries,
      approvedEnquiries,
      rejectedEnquiries,
      accountStatus: dealer.status,
      isFirstTimeUser: dealer.isFirstTimeUser,
      enquiryDetails
    };
    console.log("[Dealer Dashboard] Sending response:", dashboardStats);
    res.json({ dashboardStats });
  } catch (error) {
    console.error('[Dealer Dashboard] Get dealer dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer enquiries
export const getDealerEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const dealer = req.dealer;
    
    const query = { dealer: dealer._id };
    if (status) {
      query.status = status;
    }

    const enquiries = await Enquiry.find(query)
      .populate('product', 'productCode productName category price')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Enquiry.countDocuments(query);

    res.json({
      enquiries,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Get dealer enquiries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer enquiry by ID
export const getDealerEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = req.dealer;
    
    const enquiry = await Enquiry.findOne({ _id: id, dealer: dealer._id })
      .populate('product', 'productCode productName category price colors images');

    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    res.json({ enquiry });

  } catch (error) {
    console.error('Get dealer enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request change email (send OTP to new email)
export const requestChangeEmail = async (req, res) => {
  try {
    const dealer = req.dealer;
    const dealerEmail = await Dealer.findOne({ _id: dealer.id });
    const {newEmail} = req.body;

  
    console.log("newEmailDatatata",newEmail,req.body);
 
    if (!dealerEmail?.email) {
      return res.status(400).json({ message: 'Dealer email is required' });
    }
    // Check if new email is already in use
    const existing = await Dealer.findOne({ email:newEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const otp = generateOTP(6);
    const otpData = {
      email: newEmail,
      otp: otp,
      userId: dealer.id
    }
    const findOtp = await Otp.findOne({ userId: dealer.id });
    if (findOtp) {
      await Otp.updateOne(
        { userId: dealer.id },
        { $set: { otp: otp, email: newEmail, expiresAt: new Date(Date.now() + 1 * 60 * 1000) } },
        { upsert: true }
      );
    }else{
      const optSchema = new Otp(otpData);
      await optSchema.save();

    }

    await sendOtpByEmail(dealerEmail?.email, otp, 'Your OTP Code for email change');

    // Optionally, store the new email in session or a temp field if needed
    return res.json({ message: 'OTP sent to new email' });
  } catch (error) {
    console.error('Request change email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP and update email
export const verifyChangeEmailOtp = async (req, res) => {
  try {
    const dealer = req.dealer;
    // const dealerEmail = await Dealer.findOne({ _id: dealer.id });
    const {otp} = req.body;
    const optSchema = await Otp.findOne({ userId: dealer.id, otp: otp });
    if (!optSchema) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (optSchema.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    // Verify OTP
    // const { valid, message } = verifyOTP(dealerEmail.email, otp);
    // if (!valid) {
    //   return res.status(400).json({ message });
    // }
    // Check if new email is already in use (again, for safety)
    const existing = await Dealer.findOne({ email: optSchema?.email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    dealer.email = optSchema?.email;
    dealer.isEmailVerified = true;
    await dealer.save();

    return res.json({ message: 'Email updated successfully', dealer: dealer.getPublicProfile() });
  } catch (error) {
    console.error('Verify change email OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout dealer
export const logoutDealer = async (req, res) => {
  try {
    // Since JWT tokens are stateless, we just return a success response
    // The client should remove the token from storage
    res.json({ 
      success: true,
      message: 'Logged out successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    console.error('Logout dealer error:', error);
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

// Forgot password - send OTP to dealer's email
export const forgotDealerPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        data: null,
        errors: null,
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const dealer = await Dealer.findOne({ email: email });
    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found with this email address',
        data: null,
        errors: null,
        errorCode: 'DEALER_NOT_FOUND'
      });
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpData = {
      email: dealer.email,
      otp: otp,
      userId: dealer._id,
      type: 'password_reset'
    };

    // Check if OTP already exists for this dealer
    const existingOtp = await Otp.findOne({ userId: dealer._id, type: 'password_reset' });
    if (existingOtp) {
      await Otp.updateOne(
        { userId: dealer._id, type: 'password_reset' },
        { 
          $set: { 
            otp: otp, 
            email: dealer.email, 
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          } 
        }
      );
    } else {
      const otpSchema = new Otp(otpData);
      otpSchema.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await otpSchema.save();
    }

    // Send OTP via email
    const emailSent = await sendOtpByEmail(dealer.email, otp, 'Password Reset OTP');
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        data: null,
        errors: null,
        errorCode: 'EMAIL_SEND_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your registered email address',
      data: {
        dealerId: dealer._id
      },
      errors: null
    });

  } catch (error) {
    console.error('Forgot dealer password error:', error);
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

// Verify OTP for password reset
export const verifyDealerOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
        data: null,
        errors: null,
        errorCode: 'VALIDATION_ERROR'
      });
    }
    const dealer = await Dealer.findOne({ email: email });
    if (!dealer) {
      return res.status(400).json({
        success: false,
        message: 'Dealer not found with this email address',
        data: null,
        errors: null,
        errorCode: 'DEALER_NOT_FOUND'
      });
    }

    const otpRecord = await Otp.findOne({ 
      userId: dealer._id, 
      otp: otp, 
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        data: null,
        errors: null,
        errorCode: 'INVALID_OTP'
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
        data: null,
        errors: null,
        errorCode: 'OTP_EXPIRED'
      });
    }

    // Generate reset token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Update dealer with reset token
    await Dealer.findByIdAndUpdate(dealer._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    // Delete the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken: resetToken
      },
      errors: null
    });

  } catch (error) {
    console.error('Verify dealer OTP error:', error);
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

// Reset password using token
export const resetDealerPassword = async (req, res) => {
  try {
    const { newPassword ,email} = req.body;

    if ( !newPassword) {
      return res.status(400).json({
        success: false,
        message: ' new password are required',
        data: null,
        errors: null,
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const dealer = await Dealer.findOne({
      email: email,
    });

    if (!dealer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        data: null,
        errors: null,
        errorCode: 'INVALID_RESET_TOKEN'
      });
    }

    // Update password
    dealer.password = newPassword;
  

    await dealer.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: null,
      errors: null
    });

  } catch (error) {
    console.error('Reset dealer password error:', error);
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
