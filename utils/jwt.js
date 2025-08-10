import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production', 
    { expiresIn: '24h' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production');
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' }, 
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key', 
    { expiresIn: '7d' }
  );
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key');
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};

// Generate token for password reset
export const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'password_reset' }, 
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production', 
    { expiresIn: '1h' }
  );
};

// Verify password reset token
export const verifyPasswordResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production');
  
  if (decoded.type !== 'password_reset') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};
