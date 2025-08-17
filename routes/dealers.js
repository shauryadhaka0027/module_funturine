import express from 'express';
import {
  getDealerProfile,
  updateDealerProfile,
  changeDealerPassword,
  getDealerDashboard,
  getDealerEnquiries,
  getDealerEnquiryById,
  requestChangeEmail,
  verifyChangeEmailOtp
} from '../controllers/dealerController.js';
import { dealerAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require dealer authentication
router.use(dealerAuth);

// Profile routes
router.post('/profile', getDealerProfile);
router.put('/profile', updateDealerProfile);
router.put('/change-password', changeDealerPassword);

// Dashboard route
router.post('/dashboard', dealerAuth, getDealerDashboard);

// Enquiry routes
router.get('/enquiries', getDealerEnquiries);
router.get('/enquiries/:id', getDealerEnquiryById);

// Change email routes
router.post('/change-email/request', dealerAuth, requestChangeEmail);
router.post('/change-email/verify', dealerAuth, verifyChangeEmailOtp);

export default router;
