import mongoose, { Schema } from 'mongoose';

// Define subcategories for each category
const SUB_CATEGORIES = {
  'Chairs': [
    'Low Back Chair',
    'W/O Arm Chair',
    'Premium Chair Glossy',
    'Premium Chair Matt Glossy',
    'Warranty Chair Premium',
    'Mid Back Chair',
    'High Back Chair',
    'Square Back Chair',
    'Double Color Back Chair'
  ],
  'Tables': [
    'FixTable',
    'FoldingTable'
  ],
  'Kids Tange': [
    'Chair',
    'Table'
  ],
  'Stools': [],
  'Set of Chair & Table': []
};

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
    enum: Object.keys(SUB_CATEGORIES)
  },
  subCategory: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // If no subcategory is provided
        if (!v) {
          // Check if category requires subcategory
          const categorySubCategories = SUB_CATEGORIES[this.category];
          return !categorySubCategories || categorySubCategories.length === 0;
        }
        // If subcategory is provided, validate it belongs to the category
        const categorySubCategories = SUB_CATEGORIES[this.category];
        return categorySubCategories && categorySubCategories.includes(v);
      },
      message: 'Invalid subcategory for the selected category'
    }
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
productSchema.index({ category: 1, subCategory: 1, isActive: 1 });
productSchema.index({ productName: 'text' });

export { SUB_CATEGORIES };
export default mongoose.model('Product', productSchema);