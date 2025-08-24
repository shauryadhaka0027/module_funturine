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

// Handle Vercel proxy headers and IP detection
app.use((req, res, next) => {
  try {
    // Set real IP from Vercel headers
    if (req.headers['x-real-ip']) {
      req.ip = req.headers['x-real-ip'];
    } else if (req.headers['x-forwarded-for']) {
      // Handle multiple IPs in X-Forwarded-For header
      const forwardedIps = req.headers['x-forwarded-for'].split(',').map(ip => ip.trim());
      req.ip = forwardedIps[0]; // Use the first (original client) IP
    } else if (req.headers['x-vercel-proxied-for']) {
      req.ip = req.headers['x-vercel-proxied-for'];
    }
    
    // Ensure req.ip is always set
    if (!req.ip) {
      req.ip = req.connection?.remoteAddress || 'unknown';
    }
    
    // Log IP detection for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`IP Detection - Original: ${req.connection?.remoteAddress}, Final: ${req.ip}`);
    }
  } catch (error) {
    console.warn('IP detection error:', error.message);
    req.ip = 'unknown';
  }
  next();
});

// Favicon handler to prevent Vercel bot issues
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Vercel bot handlers - comprehensive coverage
app.use((req, res, next) => {
  const botName = req.headers['x-vercel-internal-bot-name'];
  
  // Handle all types of Vercel bots
  if (botName) {
    console.log(`Vercel bot detected: ${botName} - Path: ${req.path}`);
    
    // Handle screenshot bot specifically
    if (botName === 'vercel-screenshot-bot') {
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Moulded Furniture API</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #333; }
              .status { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Moulded Furniture API</h1>
            <p class="status">✓ API is running successfully</p>
            <p>Status: Operational</p>
            <p>Environment: ${process.env.NODE_ENV || 'production'}</p>
          </body>
        </html>
      `);
      return;
    }
    
    // Handle other Vercel bots with a simple response
    if (botName === 'vercel-favicon-bot' || botName.includes('bot')) {
      res.status(200).json({
        message: 'Bot request handled',
        bot: botName,
        timestamp: new Date().toISOString()
      });
      return;
    }
  }
  
  next();
});

// Debug middleware to log all requests (filtered for Vercel bots)
app.use((req, res, next) => {
  try {
    // Skip logging for Vercel bot requests and basic health checks
    const hasBotHeader = req.headers && req.headers['x-vercel-internal-bot-name'];
    const path = req.path || req.url || '';
    
    if (hasBotHeader || 
        path === '/favicon.ico' || 
        path === '/' ||
        path === '/api/health') {
      return next();
    }
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${path} - IP: ${req.ip || 'unknown'}`);
    
    // Only log headers for non-bot requests in development
    if (process.env.NODE_ENV === 'development') {
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
      }
    }
  } catch (error) {
    console.warn('Debug middleware error:', error.message);
  }
  next();
});

// Rate limiting - configured for Vercel deployment with fallback
const createRateLimiter = () => {
  // Check if we're in Vercel environment
  const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  
  // Allow disabling rate limiting via environment variable
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('Rate limiting disabled via environment variable');
    return (req, res, next) => next();
  }
  
  // Additional safety check for problematic environments
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true') {
    console.log('Rate limiting skipped for test/skip environment');
    return (req, res, next) => next();
  }
  
  // Force disable rate limiting if there are path-to-regexp issues
  if (process.env.FORCE_DISABLE_RATE_LIMIT === 'true') {
    console.log('Rate limiting force disabled due to path-to-regexp issues');
    return (req, res, next) => next();
  }
  
  try {
    const config = {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      // Trust Vercel proxy headers
      trustProxy: true,
             // Use X-Forwarded-For header for IP detection
       keyGenerator: (req) => {
         try {
           // Get real IP from Vercel headers
           const realIP = req.headers?.['x-real-ip'] || 
                          req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 
                          req.ip || 
                          req.connection?.remoteAddress;
           return realIP || 'unknown';
         } catch (error) {
           console.warn('Rate limiter keyGenerator error:', error.message);
           return 'unknown';
         }
       },
             // Skip rate limiting for Vercel bots and health checks
       skip: (req) => {
         try {
           // Safely check path and headers
           const hasBotHeader = req.headers && req.headers['x-vercel-internal-bot-name'];
           const path = req.path || req.url || '';
           
           return hasBotHeader || 
                  path === '/favicon.ico' ||
                  path === '/' ||
                  path === '/api/health';
         } catch (error) {
           console.warn('Rate limiter skip function error:', error.message);
           return false; // Don't skip if there's an error
         }
       }
    };
    
    // Add additional Vercel-specific configurations
    if (isVercel) {
      config.standardHeaders = true;
      config.legacyHeaders = false;
    }
    
    console.log(`Rate limiter configured for ${isVercel ? 'Vercel' : 'local'} environment`);
    return rateLimit(config);
    
  } catch (error) {
    console.warn('Rate limiter creation failed, continuing without rate limiting:', error.message);
    // Return a no-op middleware if rate limiter fails
    return (req, res, next) => next();
  }
};

const limiter = createRateLimiter();
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


