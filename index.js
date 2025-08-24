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

// CORS middleware - improved for Vercel
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://admindashboardfurniture.vercel.app',
      'http://localhost:5173',
      'http://localhost:3001',
    
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle Vercel proxy headers
app.use((req, res, next) => {
  // Set real IP from Vercel headers
  if (req.headers['x-real-ip']) {
    req.ip = req.headers['x-real-ip'];
  } else if (req.headers['x-forwarded-for']) {
    req.ip = req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  next();
});

// Favicon handler to prevent Vercel bot issues
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Vercel bot handlers
app.use((req, res, next) => {
  // Handle Vercel screenshot bot and other internal bots
  if (req.headers['x-vercel-internal-bot-name'] === 'vercel-screenshot-bot') {
    // Return a simple HTML response for screenshot bot
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Moulded Furniture API</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>Moulded Furniture API</h1>
          <p>API is running successfully</p>
        </body>
      </html>
    `);
    return;
  }
  next();
});

// Debug middleware to log all requests (filtered for Vercel bots)
app.use((req, res, next) => {
  // Skip logging for Vercel bot requests and basic health checks
  if (req.headers['x-vercel-internal-bot-name'] || 
      req.path === '/favicon.ico' || 
      req.path === '/' ||
      req.path === '/api/health') {
    return next();
  }
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // Only log headers for non-bot requests in development
  if (process.env.NODE_ENV === 'development') {
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Request body:', req.body);
    }
  }
  next();
});

// Rate limiting - configured for Vercel deployment
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  // Trust Vercel proxy headers
  trustProxy: true,
  // Use X-Forwarded-For header for IP detection
  keyGenerator: (req) => {
    // Get real IP from Vercel headers
    const realIP = req.headers['x-real-ip'] || 
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.ip || 
                   req.connection.remoteAddress;
    return realIP;
  },
  // Skip rate limiting for Vercel bots
  skip: (req) => {
    return req.headers['x-vercel-internal-bot-name'] || 
           req.path === '/favicon.ico' ||
           req.path === '/';
  }
});
app.use(limiter);

// MongoDB Connection with retry mechanism
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moulded-furniture';
  try{
  
  // If already connected, don't try to connect again
  if (mongoose.connection.readyState === 1) {
    console.log('✓ Already connected to MongoDB');
    return;
  }
  if (!process.env.MONGODB_URI) {
    console.warn('! MONGODB_URI not set; attempting local MongoDB at mongodb://127.0.0.1:27017/moulded-furniture');
  }
  const connection = await mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000
  });
  console.log('✓ Database connected successfully');
  return connection;
} catch (error) {
  console.error('✗ Failed to connect to database:', error);
  throw error;
}


};

// Set up routes immediately (they will work once DB connects)
app.use('/api/auth', authRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

console.log('✓ Routes configured');



// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Moulded Furniture API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dealers: '/api/dealers',
      enquiries: '/api/enquiries',
      products: '/api/products',
      admin: '/api/admin'
    }
  });
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

// Error handling middleware



// Start server only after initial DB attempt
const startServer = async () => {
  try {
    await connectDB();
    console.log('✓ Database connection established');
  } catch (error) {
    console.error('✗ Failed initial database connection:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.log('Continuing without database connection...');
    }
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

// Keep trying to connect to database periodically
setInterval(async () => {
  if (mongoose.connection.readyState === 0) {
    console.log('Attempting to reconnect to database...');
    try {
      await connectDB();
      console.log('✓ Database reconnection successful');
    } catch (error) {
      console.error('✗ Database reconnection failed:', error.message);
    }
  }
}, 30000); // Try every 30 seconds

export default app;


