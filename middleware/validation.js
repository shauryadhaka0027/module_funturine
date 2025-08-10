import { body, validationResult } from 'express-validator';

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    res.status(400).json({
      message: "Validation failed",
      errors: formattedErrors
    });
    return;
  }
  
  next();
};

// Validation middleware for dealer registration
export const validateDealerRegistration = [
  body('companyName')
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('contactPersonName')
    .notEmpty()
    .withMessage('Contact person name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact person name must be between 2 and 50 characters'),
  
  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  
  body('gst')
    .notEmpty()
    .withMessage('GST number is required')
    .isLength({ min: 15, max: 15 })
    .withMessage('GST number must be 15 characters'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

// Validation middleware for dealer login
export const validateDealerLogin = [
  body('gst')
    .notEmpty()
    .withMessage('GST number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation middleware for admin login
export const validateAdminLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation middleware for product creation
export const validateProductCreation = [
  body('productCode')
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Product code must be between 3 and 20 characters'),
  
  body('productName')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Product category is required')
    .isIn(['Chair', 'Table', "Kids Chair & Table", "Set of Table & Chair", '3 Year Warranty Chair'])
    .withMessage('Please select a valid category'),
  
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),
  
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  handleValidationErrors
];

// Validation middleware for enquiry creation
export const validateEnquiryCreation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),
  
  handleValidationErrors
];
