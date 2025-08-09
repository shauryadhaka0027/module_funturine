import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Dealer from '../models/Dealer';
import Admin from '../models/Admin';
import { AuthRequest, IDealer, IAdmin, JWTPayload } from '../types/index';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JWTPayload;
    
    // Check if user exists and is active
    const user = await Dealer.findById(decoded.userId) || await Admin.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid token or user not found.' });
      return;
    }

    req.user = user;
    req.userType = (user as any).constructor.name.toLowerCase() as 'dealer' | 'admin';
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const dealerAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JWTPayload;
    const dealer = await Dealer.findById(decoded.userId);
    
    if (!dealer || !dealer.isActive) {
      res.status(401).json({ message: 'Invalid token or dealer not found.' });
      return;
    }

    if (dealer.status !== 'approved') {
      res.status(403).json({ message: 'Account not approved. Please wait for admin approval.' });
      return;
    }

    req.dealer = dealer;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JWTPayload;
    const admin = await Admin.findById(decoded.userId);
    
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
