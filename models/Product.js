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
      'Chairs',
      'Tables', 
      'Kids Tange',
      'Stools',
      'Set of Chair & Table',
    ]
  },
  subCategory: {
    type: String,
    enum: [
      'Low Back Chair','W/O Arm Chair','Premium Chair Glossy','Premium Chair Matt Glossy','Warranty Chair Premium',
      'Mid Back Chair', 'High Back Chair','Square Back Chair','Square Back Chair','Double Color Back Chair',
      'Chair','Table','FixTable','FoldingTable',
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
productSchema.index({ productName: 'text' });

export default mongoose.model('Product', productSchema);
