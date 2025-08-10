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
      res.status(403).json({ message: "Access denied" });
      return;
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    // Convert quantity and price to numbers and calculate total amount
    const quantityNum = Number(quantity);
    const priceNum = Number(price);
    
    // Validate that the conversions resulted in valid numbers
    if (isNaN(quantityNum) || quantityNum <= 0) {
      res.status(400).json({ message: "Bad request" });
      return;
    }
    
    if (isNaN(priceNum) || priceNum < 0) {
      res.status(400).json({ message: "Bad request" });
      return;
    }
    
    const totalAmount = quantityNum * priceNum;

    // Create enquiry with dealer info
    const enquiry = new Enquiry({
      dealer,
      product,
      productCode,
      productName,
      productColor,
      quantity,
      price,
      totalAmount,
      remarks,
      dealerInfo: {
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
      message: "Operation successful",
      enquiry
    });

  } catch (error) {
    console.error('Create enquiry error:', error);
    res.status(500).json({ message: "Internal server error" });
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
      .populate('product', 'productCode productName category price images')
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
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get enquiry by ID (dealer only)
export const getDealerEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = req.dealer;

    const enquiry = await Enquiry.findOne({ _id: id, dealer: dealer._id })
      .populate('product', 'productCode productName category price colors images description');

    if (!enquiry) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    res.json({ enquiry });

  } catch (error) {
    console.error('Get enquiry error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin routes for enquiry management

// Get all enquiries (admin only)
export const getAdminEnquiries = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending', 
      dealerId,
      dateFrom,
      dateTo
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (dealerId) {
      query.dealer = dealerId;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    const enquiries = await Enquiry.find(query)
      .populate('dealer', 'companyName contactPersonName email mobile')
      .populate('product', 'productCode productName category')
      .populate('processedBy', 'username')
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
    console.error('Get admin enquiries error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get enquiry by ID (admin only)
export const getAdminEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findById(id)
      .populate('dealer', 'companyName contactPersonName email mobile address gst')
      .populate('product', 'productCode productName category price colors images description')
      .populate('processedBy', 'username');

    if (!enquiry) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    res.json({ enquiry });

  } catch (error) {
    console.error('Get admin enquiry error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update enquiry status (admin only)
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'pending', adminNotes } = req.body;
    const admin = req.admin;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    // Update status and admin info
    enquiry.status = status;
    enquiry.adminNotes = adminNotes;
    enquiry.processedBy = new Types.ObjectId(admin._id);
    enquiry.processedAt = new Date();

    await enquiry.save();

    res.json({
      message: "Operation successful",
      enquiry
    });

  } catch (error) {
    console.error('Update enquiry status error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Close enquiry (admin only)
export const closeEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const admin = req.admin;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    // Close the enquiry
    enquiry.status = 'closed';
    enquiry.adminNotes = adminNotes;
    enquiry.processedBy = new Types.ObjectId(admin._id);
    enquiry.processedAt = new Date();

    await enquiry.save();

    res.json({
      message: "Operation successful",
      enquiry
    });

  } catch (error) {
    console.error('Close enquiry error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve enquiry (admin only)
export const approveEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    enquiry.status = 'approved';
    enquiry.processedBy = new Types.ObjectId(admin._id);
    enquiry.processedAt = new Date();

    await enquiry.save();

    res.json({ message: "Operation successful", enquiry });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reject enquiry (admin only)
export const rejectEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const admin = req.admin;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    enquiry.status = 'rejected';
    enquiry.adminNotes = adminNotes;
    enquiry.processedBy = new Types.ObjectId(admin._id);
    enquiry.processedAt = new Date();

    await enquiry.save();

    res.json({ message: "Operation successful", enquiry });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
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
    const underProcessEnquiries = await Enquiry.countDocuments({ ...query, status: 'under-process' });
    const approvedEnquiries = await Enquiry.countDocuments({ ...query, status: 'approved' });
    const rejectedEnquiries = await Enquiry.countDocuments({ ...query, status: 'rejected' });
    const closedEnquiries = await Enquiry.countDocuments({ ...query, status: 'closed' });

    // Get enquiries by category
    const enquiriesByCategory = await Enquiry.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: '$productData' },
      {
        $group: {
          _id: '$productData.category',
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
      enquiriesByCategory
    };

    res.json({ statistics });

  } catch (error) {
    console.error('Get enquiry statistics error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};
