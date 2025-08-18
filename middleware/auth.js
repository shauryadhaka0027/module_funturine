import jwt from 'jsonwebtoken';
import Dealer from '../models/Dealer.js';
import Admin from '../models/Admin.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Check if user exists and is active
    const userId = decoded.userId && decoded.userId.id ? decoded.userId.id : decoded.userId;
    const user = await Dealer.findById(userId) || await Admin.findById(userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid token or user not found.' });
      return;
    }

    req.user = user;
    req.userType = user.constructor.name.toLowerCase();
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const dealerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // console.log('[dealerAuth] Received token:', token);
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      // console.log('[dealerAuth] Decoded token:', decoded);
    } catch (err) {
      console.error('[dealerAuth] Token verification failed:', err);
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    const dealerId = decoded.userId && decoded.userId.id ? decoded.userId.id : decoded.userId;
    const dealer = await Dealer.findById(dealerId);
    // console.log('[dealerAuth] Dealer lookup result:', dealer);
    
    if (!dealer || !dealer.isActive) {
      res.status(401).json({ message: 'Invalid token or dealer not found.' });
      return;
    }

    if (dealer.status !== 'approved') {
      res.status(403).json({ message: 'Account not approved. Please wait for admin approval.' });
      return;
    }

    req.dealer = dealer;
    console.log('>>>>>>>>delaseer', dealer);
    next();
  } catch (error) {
    console.error('[dealerAuth] Unexpected error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const adminId = decoded.userId && decoded.userId.id ? decoded.userId.id : decoded.userId;
    const admin = await Admin.findById(adminId);
    
    if (!admin || !admin.isActive) {
      res.status(401).json({ message: 'Invalid token or admin not found.' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
