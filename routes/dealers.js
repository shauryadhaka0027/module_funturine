import express from 'express';
import {
  getDealerProfile,
  updateDealerProfile,
  changeDealerPassword,
  getDealerDashboard,
  getDealerEnquiries,
  getDealerEnquiryById,
  requestChangeEmail,
  verifyChangeEmailOtp,
  logoutDealer,
  forgotDealerPassword,
  verifyDealerOtp,
  resetDealerPassword
} from '../controllers/dealerController.js';
import { dealerAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require dealer authentication
// router.use(dealerAuth);

// Profile routes
router.post('/profile', dealerAuth ,getDealerProfile);
router.put('/profile', dealerAuth, updateDealerProfile);
router.put('/change-password', dealerAuth, changeDealerPassword);

// Dashboard route
router.post('/dashboard', dealerAuth, getDealerDashboard);

// Enquiry routes
router.get('/enquiries', dealerAuth, getDealerEnquiries);
router.get('/enquiries/:id', dealerAuth, getDealerEnquiryById);

// Change email routes
router.post('/change-email/request', dealerAuth, requestChangeEmail);
router.post('/change-email/verify', dealerAuth, verifyChangeEmailOtp);

// Logout route
router.post('/logout', logoutDealer);

// Forgot password routes (no authentication required)
router.post('/user/forgot-password', forgotDealerPassword);
router.post('/user/verify-otp', verifyDealerOtp);
router.post('/user/reset-password', resetDealerPassword);

export default router;
