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
import { upload, uploadSingleImage } from '../services/cloudinaryService.js';

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

// Image upload
router.post('/upload-images', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const file = (req.files?.image?.[0]) || (req.files?.file?.[0]) || req.file;
    const files = req.files?.images;

    if (files && files.length) {
      const { uploadMultipleImages } = await import('../services/cloudinaryService.js');
      const result = await uploadMultipleImages(files);
      res.status(result.success ? 200 : 400).json(result);
      return;
    }

    const result = await uploadSingleImage(file);
    res.status(result?.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unexpected error', error: error.message });
  }
});

// Public routes (must be after admin routes to avoid conflicts)
router.get('/:id', getProductById);

export default router;
