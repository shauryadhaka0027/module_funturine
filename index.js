import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import dealerRoutes from './routes/dealers.js';
import enquiryRoutes from './routes/enquiries.js';
import productRoutes from './routes/products.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Trust proxy for Vercel deployment
app.set('trust proxy', true);

// CORS middleware - simplified
app.use(cors({
  origin: ['https://admindashboardfurniture.vercel.app', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// MongoDB Connection
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moulded-furniture';
  
  console.log('Attempting to connect to MongoDB...');
  console.log('MongoDB URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
  
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false // Disable mongoose buffering
  };
  
  try {
    await mongoose.connect(mongoURI, options);
    console.log('✓ Successfully connected to MongoDB');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    
    if (err.message.includes('ECONNREFUSED')) {
      console.error('MongoDB server is not running or not accessible.');
      console.error('Please check:');
      console.error('1. MongoDB server is started');
      console.error('2. MONGODB_URI environment variable is set correctly');
      console.error('3. Network connectivity to MongoDB server');
    }
    
    // In production, we should not exit immediately - let the app handle gracefully
    if (process.env.NODE_ENV === 'production') {
      console.error('Running in production mode - continuing without database connection');
      console.error('Some features may not work properly');
    } else {
      process.exit(1);
    }
  }
};

// Set up routes immediately (they will work once DB connects)
app.use('/api/auth', authRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

console.log('✓ Routes configured');

// Connect to database
connectDB().then(() => {
  console.log('✓ Database connected successfully');
}).catch((error) => {
  console.error('✗ Failed to connect to database:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const status = dbStatus === 'connected' ? 'OK' : 'DEGRADED';
  
  res.json({ 
    status: status,
    message: 'Moulded Furniture API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for debugging
app.post('/api/test-enquiry', (req, res) => {
  console.log('=== TEST ENQUIRY ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  
  res.json({
    message: 'Test endpoint working',
    receivedBody: req.body,
    headers: req.headers
  });
});

// Test admin route
app.get('/api/admin/test', (req, res) => {
  res.json({
    message: 'Admin route is working',
    timestamp: new Date().toISOString(),
    routes: ['/api/admin/login', '/api/admin/dashboard', '/api/admin/dealers']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error middleware caught:', err);
  console.error('Error stack:', err.stack);
  
  // Check if it's a MongoDB connection error
  if (err.name === 'MongooseServerSelectionError' || err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      message: 'Database connection error',
      error: 'Service temporarily unavailable',
      suggestion: 'Please try again later or contact support if the issue persists'
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;


