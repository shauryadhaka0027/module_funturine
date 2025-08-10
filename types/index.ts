import { Request } from 'express';
import { Document, Types } from 'mongoose';

// Base User Interface
export interface IUser extends Document {
  _id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dealer Interface
export interface IDealer extends IUser {
  companyName: string;
  contactPersonName: string;
  mobile: string;
  email: string;
  address: string;
  gst: string;
  password: string;
  status: 'pending' | 'approved' | 'rejected';
  isFirstTimeUser: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // OTP verification fields
  mobileOtp?: string;
  mobileOtpExpires?: Date;
  isMobileVerified: boolean;
  emailOtp?: string;
  emailOtpExpires?: Date;
  isEmailVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): Omit<IDealer, 'password'>;
}

// Admin Interface
export interface IAdmin extends IUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'super_admin';
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): Omit<IAdmin, 'password'>;
}

// Product Interface
export interface IProduct extends IUser {
  productCode: string;
  productName: string;
  category: 'Chair' | 'Table' | 'Kids Chair & Table' | 'Set of Table & Chair' | '3 Year Warranty Chair';
  description?: string;
  price: number;
  colors: string[];
  images: string[];
  specifications: Map<string, string>;
  warranty: string;
  stockQuantity: number;
  createdBy: Types.ObjectId;
}

// Enquiry Interface
export interface IEnquiry extends IUser {
  dealer: Types.ObjectId;
  product: Types.ObjectId;
  productCode: string;
  productName: string;
  productColor: string;
  quantity: number;
  price: number;
  totalAmount: number;
  remarks?: string;
  status: 'pending' | 'under_process' | 'approved' | 'rejected' | 'closed';
  dealerInfo: {
    companyName: string;
    contactPersonName: string;
    mobile: string;
    email: string;
    address: string;
    gst: string;
  };
  adminNotes?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
}

// Request Interfaces
export interface AuthRequest extends Request {
  user?: IDealer | IAdmin;
  userType?: 'dealer' | 'admin';
  dealer?: IDealer;
  admin?: IAdmin;
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// Dashboard Types
export interface DashboardStats {
  dealers: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
  };
  enquiries: {
    total: number;
    pending: number;
    underProcess: number;
    approved: number;
    rejected: number;
    closed: number;
  };
  recentDealers?: Partial<IDealer>[];
  recentEnquiries?: Partial<IEnquiry>[];
}

// Email Types
export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// JWT Types
export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// Query Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ProductQuery extends PaginationQuery {
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: boolean;
}

export interface DealerQuery extends PaginationQuery {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EnquiryQuery extends PaginationQuery {
  status?: string;
  dealerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Statistics Types
export interface DealerStatistics {
  totalDealers: number;
  pendingDealers: number;
  approvedDealers: number;
  rejectedDealers: number;
  dealersByMonth: Array<{
    _id: {
      year: number;
      month: number;
    };
    count: number;
  }>;
}

export interface EnquiryStatistics {
  totalEnquiries: number;
  pendingEnquiries: number;
  underProcessEnquiries: number;
  approvedEnquiries: number;
  rejectedEnquiries: number;
  closedEnquiries: number;
  enquiriesByCategory: Array<{
    _id: string;
    count: number;
  }>;
}
