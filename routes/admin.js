import express from 'express';
import {
  loginAdmin,
  getDashboardStats,
  getAllDealers,
  getDealerById,
  approveDealer,
  rejectDealer,
  updateDealerStatus,
  getDealerStatistics,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  changeAdminPassword,
  validateToken
} from '../controllers/adminController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginAdmin);

// Token validation route (public - no auth required)
router.get('/validate-token', validateToken);

// Protected routes (require admin authentication)
router.use(adminAuth);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Dealer management
router.get('/dealers', getAllDealers);
router.get('/dealers/statistics', getDealerStatistics);
router.get('/dealers/:id', getDealerById);
router.put('/dealers/:id/approve', approveDealer);
router.put('/dealers/:id/reject', rejectDealer);
router.put('/dealers/:id/status', updateDealerStatus);

// Admin management (super admin only)
router.post('/create-admin', createAdmin);
router.get('/admins', getAllAdmins);
router.put('/admins/:id', updateAdmin);
router.put('/change-password', changeAdminPassword);


export default router;
