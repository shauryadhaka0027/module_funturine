import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const dealerSchema = new Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  contactPersonName: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  gst: {
    type: String,
    required: [true, 'GST number is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isFirstTimeUser: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  // OTP verification fields
  mobileOtp: {
    type: String
  },
  mobileOtpExpires: {
    type: Date
  },
  isMobileVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String
  },
  emailOtpExpires: {
    type: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hash password before saving
dealerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
dealerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
dealerSchema.methods.getPublicProfile = function() {
  const dealerObject = this.toObject();
  delete dealerObject.password;
  return dealerObject;
};

export default mongoose.model('Dealer', dealerSchema);
