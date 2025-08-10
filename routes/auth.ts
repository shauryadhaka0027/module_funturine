import express from 'express';
import {
  registerDealer,
  registerDealerStep1,
  registerDealerStep2,
  resendOTP,
  loginDealer,
  loginAdmin,
  forgotPassword,
  resetPassword,
  getProfile
} from '../controllers/authController.js';
import {
  validateDealerRegistration,
  validateDealerLogin,
  validateAdminLogin
} from '../middleware/validation.js';

const router = express.Router();

// Dealer authentication routes
router.post('/dealer/register', validateDealerRegistration, registerDealer);
router.post('/dealer/register/step1', validateDealerRegistration, registerDealerStep1);
router.post('/dealer/register/step2', registerDealerStep2);
router.post('/dealer/resend-otp', resendOTP);
router.post('/dealer/login', validateDealerLogin, loginDealer);
router.post('/dealer/forgot-password', forgotPassword);

// Admin authentication routes
router.post('/admin/login', validateAdminLogin, loginAdmin);

// Common routes
router.post('/reset-password', resetPassword);
router.get('/profile', getProfile);

export default router;
