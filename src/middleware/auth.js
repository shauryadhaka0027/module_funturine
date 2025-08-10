import jwt from 'jsonwebtoken';
import Dealer from '../models/Dealer.js';
import Admin from '../models/Admin.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace("Bearer ", '');
    
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Check if user exists and is active
    const user = await Dealer.findById(decoded.userId) || await Admin.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.user = user;
    req.userType = user.constructor.name.toLowerCase();
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const dealerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace("Bearer ", '');
    
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const dealer = await Dealer.findById(decoded.userId);
    
    if (!dealer || !dealer.isActive) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    if (dealer.status !== 'approved') {
      res.status(403).json({ message: "Account not approved" });
      return;
    }

    req.dealer = dealer;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace("Bearer ", '');
    
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const admin = await Admin.findById(decoded.userId);
    
    if (!admin || !admin.isActive) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
