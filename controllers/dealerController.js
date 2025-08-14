import Enquiry from '../models/Enquiry.js';

// Get dealer profile
export const getDealerProfile = async (req, res) => {
  try {
    res.json({ dealer: req.dealer.getPublicProfile() });
  } catch (error) {
    console.error('Get dealer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update dealer profile
export const updateDealerProfile = async (req, res) => {
  try {
    const { companyName, contactPersonName, mobile, address } = req.body;
    const dealer = req.dealer;

    // Update allowed fields
    if (companyName) dealer.companyName = companyName;
    if (contactPersonName) dealer.contactPersonName = contactPersonName;
    if (mobile) dealer.mobile = mobile;
    if (address) dealer.address = address;

    await dealer.save();

    res.json({
      message: 'Profile updated successfully',
      dealer: dealer.getPublicProfile()
    });

  } catch (error) {
    console.error('Update dealer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
export const changeDealerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const dealer = req.dealer;

    // Verify current password
    const isCurrentPasswordValid = await dealer.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password
    dealer.password = newPassword;
    await dealer.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer dashboard stats
export const getDealerDashboard = async (req, res) => {
  const dealer = req.dealer;
  console.log("hshsh",dealer)
  try {
    
    // Get enquiry statistics
    const totalEnquiries = await Enquiry.countDocuments({ dealer: dealer._id });
    const pendingEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer._id, 
      status: 'pending' 
    });
    const underProcessEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer._id, 
      status: 'under_process' 
    });
    const approvedEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer._id, 
      status: 'approved' 
    });
    const rejectedEnquiries = await Enquiry.countDocuments({ 
      dealer: dealer._id, 
      status: 'rejected' 
    });

    const dashboardStats = {
      totalEnquiries,
      pendingEnquiries,
      underProcessEnquiries,
      approvedEnquiries,
      rejectedEnquiries,
      accountStatus: dealer.status,
      isFirstTimeUser: dealer.isFirstTimeUser
    };

    res.json({ dashboardStats });

  } catch (error) {
    console.error('Get dealer dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dealer enquiries
export const getDealerEnquiries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const dealer = req.dealer;
    
    const query = { dealer: dealer._id };
    if (status) {
      query.status = status;
    }

    const enquiries = await Enquiry.find(query)
      .populate('product', 'productCode productName category price')
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

// Get dealer enquiry by ID
export const getDealerEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = req.dealer;
    
    const enquiry = await Enquiry.findOne({ _id: id, dealer: dealer._id })
      .populate('product', 'productCode productName category price colors images');

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
