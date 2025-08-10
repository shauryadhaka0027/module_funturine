import express from 'express';
import {
  getDealerProfile,
  updateDealerProfile,
  changeDealerPassword,
  getDealerDashboard,
  getDealerEnquiries,
  getDealerEnquiryById
} from '../controllers/dealerController';
import { dealerAuth } from '../middleware/auth';

const router = express.Router();

// All routes require dealer authentication
router.use(dealerAuth);

// Profile routes
router.get('/profile', getDealerProfile);
router.put('/profile', updateDealerProfile);
router.put('/change-password', changeDealerPassword);

// Dashboard route
router.get('/dashboard', getDealerDashboard);

// Enquiry routes
router.get('/enquiries', getDealerEnquiries);
router.get('/enquiries/:id', getDealerEnquiryById);

export default router;
