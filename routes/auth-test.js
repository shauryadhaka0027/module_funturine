import express from 'express';

// Test importing controllers one by one
import {
  registerDealer,
  loginDealer
} from '../controllers/authController.js';

const router = express.Router();

// Test routes with actual controllers but no middleware
router.post('/dealer/register', registerDealer);
router.post('/dealer/login', loginDealer);

export default router;
