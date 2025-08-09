import mongoose, { Schema } from 'mongoose';
import { IEnquiry } from '../types/index';

const enquirySchema = new Schema<IEnquiry>({
  dealer: {
    type: Schema.Types.ObjectId,
    ref: 'Dealer',
    required: [true, 'Dealer is required']
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  productCode: {
    type: String,
    required: [true, 'Product code is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  productColor: {
    type: String,
    required: [true, 'Product color is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  remarks: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_process', 'approved', 'rejected', 'closed'],
    default: 'pending'
  },
  dealerInfo: {
    companyName: {
      type: String,
      required: true
    },
    contactPersonName: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    gst: {
      type: String,
      required: true
    }
  },
  adminNotes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  processedAt: {
    type: Date
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
enquirySchema.pre('save', function(next) {
  if (this.quantity && this.price) {
    this.totalAmount = this.quantity * this.price;
  }
  next();
});

// Index for better query performance
enquirySchema.index({ dealer: 1, status: 1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ product: 1 });

export default mongoose.model<IEnquiry>('Enquiry', enquirySchema);
