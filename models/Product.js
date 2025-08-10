import mongoose, { Schema } from 'mongoose';


const productSchema = new Schema({
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'Chair',
      'Table', 
      'Kids Chair & Table',
      'Set of Table & Chair',
      '3 Year Warranty Chair'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  colors: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String
  }],
  specifications: {
    type: Map,
    of: String
  },
  warranty: {
    type: String,
    default: '3 Year Warranty'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ productCode: 1 });
productSchema.index({ productName: 'text' });

export default mongoose.model('Product', productSchema);
