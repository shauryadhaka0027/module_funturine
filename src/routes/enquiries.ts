import express from 'express';
import {
  createEnquiry,
  getDealerEnquiries,
  getDealerEnquiryById,
  getAdminEnquiries,
  getAdminEnquiryById,
  updateEnquiryStatus,
  closeEnquiry,
  approveEnquiry,
  rejectEnquiry,
  getEnquiryStatistics
} from '../controllers/enquiryController';
import { dealerAuth, adminAuth } from '../middleware/auth';
import { validateEnquiryCreation } from '../middleware/validation';

const router = express.Router();

// Dealer routes
router.post('/create-enquiry', dealerAuth, validateEnquiryCreation, createEnquiry);
router.get('/my-enquiries', dealerAuth, getDealerEnquiries);
router.get('/my-enquiries/:id', dealerAuth, getDealerEnquiryById);

// Admin routes
router.get('/admin/all', adminAuth, getAdminEnquiries);
router.get('/admin/statistics', adminAuth, getEnquiryStatistics);
router.get('/admin/:id', adminAuth, getAdminEnquiryById);
router.put('/admin/:id/status', adminAuth, updateEnquiryStatus);
router.put('/admin/:id/close', adminAuth, closeEnquiry);
router.put('/admin/:id/approve', adminAuth, approveEnquiry);
router.put('/admin/:id/reject', adminAuth, rejectEnquiry);

export default router;
