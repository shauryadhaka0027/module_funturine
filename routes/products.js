import express from 'express';
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts
} from '../controllers/productController.js';
import { adminAuth } from '../middleware/auth.js';
import { validateProductCreation } from '../middleware/validation.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/get-products', getProducts); // Using POST for complex query parameters
router.get('/categories/list', getCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/search/:query', searchProducts);

// Admin routes (authentication required)
router.post('/', adminAuth, validateProductCreation, createProduct);
router.get('/admin/all', adminAuth, getAdminProducts);
router.put('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

// Public routes (must be after admin routes to avoid conflicts)
router.get('/:id', getProductById);

export default router;
