import express from 'express';

// Test importing controllers and validation
import {
  registerDealer,
  loginDealer
} from '../controllers/authController.js';

import {
  validateDealerRegistration,
  validateDealerLogin
} from '../middleware/validation.js';

const router = express.Router();

// Test routes with validation middleware
router.post('/dealer/register', validateDealerRegistration, registerDealer);
router.post('/dealer/login', validateDealerLogin, loginDealer);

export default router;
