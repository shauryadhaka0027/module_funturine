import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import Product from '../models/Product';

// Load environment variables
dotenv.config();

const initializeDatabase = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/moulded-furniture'
    );
    console.log('Connected to MongoDB');

    // Create indexes
    console.log('Creating database indexes...');
    
    // Admin indexes
    await Admin.createIndexes();
    console.log('✓ Admin indexes created');

    // Product indexes
    await Product.createIndexes();
    console.log('✓ Product indexes created');

    // Create super admin if not exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (!existingSuperAdmin) {
      const superAdmin = new Admin({
        username: 'superadmin',
        email: 'admin@mouldedfurniture.com',
        password: 'Admin@123',
        role: 'super_admin'
      });

      await superAdmin.save();
      console.log('✓ Super admin created');
    } else {
      console.log('✓ Super admin already exists');
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('Username: superadmin');
    console.log('Password: Admin@123');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
initializeDatabase();
