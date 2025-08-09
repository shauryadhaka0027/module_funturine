import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index';

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production', 
    { expiresIn: '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production') as JWTPayload;
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' }, 
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key', 
    { expiresIn: '30d' }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key') as any;
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};

// Generate token for password reset
export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'password_reset' }, 
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production', 
    { expiresIn: '1h' }
  );
};

// Verify password reset token
export const verifyPasswordResetToken = (token: string): JWTPayload => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production') as any;
  
  if (decoded.type !== 'password_reset') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};
