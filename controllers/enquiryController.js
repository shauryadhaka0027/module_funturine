import { Types } from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import Product from '../models/Product.js';
import { sendEnquiryConfirmationEmail } from '../services/emailService.js';

// Create new enquiry (dealer only)
export const createEnquiry = async (req, res) => {
  try {
    const {
      productId,
      productCode,
      productName,
      productColor,
      quantity,
      price,
      remarks
    } = req.body;

    const dealer = req.dealer;

    // Only allow approved dealers to create orders
    if (dealer.status !== 'approved') {
      res.status(403).json({ message: 'Only approved dealers can place orders.' });
      return;
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Convert quantity and price to numbers and calculate total amount
    const quantityNum = Number(quantity);
    const priceNum = Number(price);
    
    // Validate that the conversions resulted in valid numbers
    if (isNaN(quantityNum) || quantityNum <= 0) {
      res.status(400).json({ message: 'Invalid quantity. Must be a positive number.' });
      return;
    }
    
    if (isNaN(priceNum) || priceNum < 0) {
      res.status(400).json({ message: 'Invalid price. Must be a non-negative number.' });
      return;
    }
    
    const totalAmount = quantityNum * priceNum;

    // Create enquiry with dealer info
    const enquiry = new Enquiry({
      dealer: dealer._id,
      product: productId,
      productCode,
      productName,
      productColor,
      quantity: quantityNum,
      price: priceNum,
      totalAmount,
      remarks,
      dealerInfo: {
        companyName: dealer.companyName,
        contactPersonName: dealer.contactPersonName,
        mobile: dealer.mobile,
        email: dealer.email,
        address: dealer.address,
        gst: dealer.gst
      }
    });

    await enquiry.save();

    // Send confirmation email to dealer
    await sendEnquiryConfirmationEmail(enquiry);

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry
    });

  } catch (error) {
    console.error('Create enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer's enquiries (dealer only)
export const getDealerEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const dealer = req.dealer;

    const query = { dealer: dealer._id };
    if (status) {
      query.status = status;
    }

    const enquiries = await Enquiry.find(query)
      .populate('product', 'productCode productName category')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Enquiry.countDocuments(query);

    res.json({
      enquiries,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Get dealer enquiries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer's enquiry by ID (dealer only)
export const getDealerEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = req.dealer;

    const enquiry = await Enquiry.findOne({ _id: id, dealer: dealer._id })
      .populate('product', 'productCode productName category price colors')
      .exec();

    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    res.json({ enquiry });

  } catch (error) {
    console.error('Get dealer enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all enquiries (admin only)
export const getAdminEnquiries = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      dealerId, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (dealerId) {
      query.dealer = dealerId;
    }

    if (search) {
      query.$or = [
        { productCode: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { 'dealerInfo.companyName': { $regex: search, $options: 'i' } },
        { 'dealerInfo.contactPersonName': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const enquiries = await Enquiry.find(query)
      .populate('dealer', 'companyName contactPersonName email mobile')
      .populate('product', 'productCode productName category')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Enquiry.countDocuments(query);

    res.json({
      enquiries,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Get admin enquiries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get enquiry by ID (admin only)
export const getAdminEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id)
      .populate('dealer', 'companyName contactPersonName email mobile address gst')
      .populate('product', 'productCode productName category price colors specifications')
      .exec();

    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    res.json({ enquiry });

  } catch (error) {
    console.error('Get admin enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update enquiry status (admin only)
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    // Update status
    enquiry.status = status;
    
    // Add admin remarks if provided
    if (adminRemarks) {
      enquiry.adminRemarks = adminRemarks;
    }

    // Add status update timestamp
    enquiry.statusUpdatedAt = new Date();

    await enquiry.save();

    res.json({
      message: 'Enquiry status updated successfully',
      enquiry
    });

  } catch (error) {
    console.error('Update enquiry status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Close enquiry (admin only)
export const closeEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    if (enquiry.status === 'closed') {
      res.status(400).json({ message: 'Enquiry is already closed' });
      return;
    }

    // Close the enquiry
    enquiry.status = 'closed';
    enquiry.closedAt = new Date();
    
    if (adminRemarks) {
      enquiry.adminRemarks = adminRemarks;
    }

    await enquiry.save();

    res.json({
      message: 'Enquiry closed successfully',
      enquiry
    });

  } catch (error) {
    console.error('Close enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve enquiry (admin only)
export const approveEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    if (enquiry.status === 'approved') {
      res.status(400).json({ message: 'Enquiry is already approved' });
      return;
    }

    // Approve the enquiry
    enquiry.status = 'approved';
    enquiry.approvedAt = new Date();
    
    if (adminRemarks) {
      enquiry.adminRemarks = adminRemarks;
    }

    await enquiry.save();

    res.json({
      message: 'Enquiry approved successfully',
      enquiry
    });

  } catch (error) {
    console.error('Approve enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject enquiry (admin only)
export const rejectEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminRemarks } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    if (enquiry.status === 'rejected') {
      res.status(400).json({ message: 'Enquiry is already rejected' });
      return;
    }

    // Reject the enquiry
    enquiry.status = 'rejected';
    enquiry.rejectionReason = reason;
    enquiry.rejectedAt = new Date();
    
    if (adminRemarks) {
      enquiry.adminRemarks = adminRemarks;
    }

    await enquiry.save();

    res.json({
      message: 'Enquiry rejected successfully',
      enquiry
    });

  } catch (error) {
    console.error('Reject enquiry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get enquiry statistics (admin only)
export const getEnquiryStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const query = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    const totalEnquiries = await Enquiry.countDocuments(query);
    const pendingEnquiries = await Enquiry.countDocuments({ ...query, status: 'pending' });
    const underProcessEnquiries = await Enquiry.countDocuments({ ...query, status: 'under_process' });
    const approvedEnquiries = await Enquiry.countDocuments({ ...query, status: 'approved' });
    const rejectedEnquiries = await Enquiry.countDocuments({ ...query, status: 'rejected' });
    const closedEnquiries = await Enquiry.countDocuments({ ...query, status: 'closed' });

    // Get enquiries by month (for chart)
    const enquiriesByMonth = await Enquiry.aggregate([
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

    // Get enquiries by status (for pie chart)
    const enquiriesByStatus = await Enquiry.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statistics = {
      totalEnquiries,
      pendingEnquiries,
      underProcessEnquiries,
      approvedEnquiries,
      rejectedEnquiries,
      closedEnquiries,
      enquiriesByMonth,
      enquiriesByStatus
    };

    res.json({ statistics });

  } catch (error) {
    console.error('Get enquiry statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
