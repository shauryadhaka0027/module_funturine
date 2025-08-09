import { Request, Response } from 'express';
import Dealer from '../models/Dealer';
import Admin from '../models/Admin';
import Product from '../models/Product';
import Enquiry from '../models/Enquiry';
import { sendDealerApprovalEmail, sendDealerRejectionEmail } from '../services/emailService';
import { generateToken } from '../utils/jwt';
import { AuthRequest, DashboardStats, DealerQuery } from '../types/index';

// Admin Login
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });

    if (!admin) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    // Check if account is active
    if (!admin.isActive) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      message: 'Login successful',
      token,
      admin: admin.getPublicProfile()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get dealer statistics
    const totalDealers = await Dealer.countDocuments();
    const pendingDealers = await Dealer.countDocuments({ status: 'pending' });
    const approvedDealers = await Dealer.countDocuments({ status: 'approved' });
    const rejectedDealers = await Dealer.countDocuments({ status: 'rejected' });

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });

    // Get enquiry statistics
    const totalEnquiries = await Enquiry.countDocuments();
    const pendingEnquiries = await Enquiry.countDocuments({ status: 'pending' });
    const underProcessEnquiries = await Enquiry.countDocuments({ status: 'under_process' });
    const approvedEnquiries = await Enquiry.countDocuments({ status: 'approved' });
    const rejectedEnquiries = await Enquiry.countDocuments({ status: 'rejected' });
    const closedEnquiries = await Enquiry.countDocuments({ status: 'closed' });

    // Get recent activities
    const recentDealers = await Dealer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('companyName contactPersonName email status createdAt');

    const recentEnquiries = await Enquiry.find()
      .populate('dealer', 'companyName contactPersonName')
      .populate('product', 'productName category')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('productCode productName quantity status createdAt');

    const dashboardStats: DashboardStats = {
      dealers: {
        total: totalDealers,
        pending: pendingDealers,
        approved: approvedDealers,
        rejected: rejectedDealers
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts
      },
      enquiries: {
        total: totalEnquiries,
        pending: pendingEnquiries,
        underProcess: underProcessEnquiries,
        approved: approvedEnquiries,
        rejected: rejectedEnquiries,
        closed: closedEnquiries
      },
      recentDealers,
      recentEnquiries
    };

    res.json({ dashboardStats });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all dealers (admin only)
export const getAllDealers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as DealerQuery;

    const query: any = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPersonName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const dealers = await Dealer.find(query)
      .select('-password')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Dealer.countDocuments(query);

    res.json({
      dealers,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Get dealers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer by ID (admin only)
export const getDealerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dealer = await Dealer.findById(id).select('-password');
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    // Get dealer's enquiries
    const enquiries = await Enquiry.find({ dealer: id })
      .populate('product', 'productCode productName category')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ dealer, enquiries });

  } catch (error) {
    console.error('Get dealer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve dealer (admin only)
export const approveDealer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = req.admin!;

    const dealer = await Dealer.findById(id);
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    if (dealer.status === 'approved') {
      res.status(400).json({ message: 'Dealer is already approved' });
      return;
    }

    // Update dealer status
    dealer.status = 'approved';
    dealer.approvedBy = admin._id;
    dealer.approvedAt = new Date();

    await dealer.save();

    // Send approval email
    await sendDealerApprovalEmail(dealer);

    res.json({
      message: 'Dealer approved successfully',
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Approve dealer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject dealer (admin only)
export const rejectDealer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = req.admin!;

    const dealer = await Dealer.findById(id);
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    if (dealer.status === 'rejected') {
      res.status(400).json({ message: 'Dealer is already rejected' });
      return;
    }

    // Update dealer status
    dealer.status = 'rejected';
    dealer.rejectionReason = reason;
    dealer.approvedBy = admin._id;
    dealer.approvedAt = new Date();

    await dealer.save();

    // Send rejection email
    await sendDealerRejectionEmail(dealer, reason);

    res.json({
      message: 'Dealer rejected successfully',
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Reject dealer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update dealer status (admin only)
export const updateDealerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;
    const admin = req.admin!;

    const dealer = await Dealer.findById(id);
    if (!dealer) {
      res.status(404).json({ message: 'Dealer not found' });
      return;
    }

    // Update status
    if (status) {
      dealer.status = status;
    }

    // Update active status
    if (isActive !== undefined) {
      dealer.isActive = isActive;
    }

    dealer.approvedBy = admin._id;
    dealer.approvedAt = new Date();

    await dealer.save();

    res.json({
      message: 'Dealer status updated successfully',
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Update dealer status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer statistics (admin only)
export const getDealerStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query as any;

    const query: any = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    const totalDealers = await Dealer.countDocuments(query);
    const pendingDealers = await Dealer.countDocuments({ ...query, status: 'pending' });
    const approvedDealers = await Dealer.countDocuments({ ...query, status: 'approved' });
    const rejectedDealers = await Dealer.countDocuments({ ...query, status: 'rejected' });

    // Get dealers by month (for chart)
    const dealersByMonth = await Dealer.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const statistics = {
      totalDealers,
      pendingDealers,
      approvedDealers,
      rejectedDealers,
      dealersByMonth
    };

    res.json({ statistics });

  } catch (error) {
    console.error('Get dealer statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create admin account (super admin only)
export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password, role = 'admin' } = req.body;
    const currentAdmin = req.admin!;

    // Check if current admin is super admin
    if (currentAdmin.role !== 'super_admin') {
      res.status(403).json({ message: 'Only super admin can create new admin accounts' });
      return;
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingAdmin) {
      res.status(400).json({ message: 'Admin with this username or email already exists' });
      return;
    }

    const admin = new Admin({
      username,
      email,
      password,
      role
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: admin.getPublicProfile()
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all admin accounts (super admin only)
export const getAllAdmins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentAdmin = req.admin!;

    // Check if current admin is super admin
    if (currentAdmin.role !== 'super_admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

    res.json({ admins });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update admin account (super admin only)
export const updateAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;
    const currentAdmin = req.admin!;

    // Check if current admin is super admin
    if (currentAdmin.role !== 'super_admin') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    res.json({
      message: 'Admin account updated successfully',
      admin: admin.getPublicProfile()
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change admin password
export const changeAdminPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = req.admin!;

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
