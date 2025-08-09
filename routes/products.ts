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
} from '../controllers/productController';
import { adminAuth } from '../middleware/auth';
import { validateProductCreation } from '../middleware/validation';

const router = express.Router();

// Public routes (no authentication required)
router.post('/get-products', getProducts); // Using POST for complex query parameters
router.get('/categories/list', getCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/search/:query', searchProducts);
router.get('/:id', getProductById);

// Admin routes (authentication required)
router.post('/', adminAuth, validateProductCreation, createProduct);
router.put('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);
router.get('/admin/all', adminAuth, getAdminProducts);

export default router;
