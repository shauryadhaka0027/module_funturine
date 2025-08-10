import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import Product from '../models/Product';

// Load environment variables
dotenv.config();

const initializeDatabase = async () {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb);
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
    const existingSuperAdmin = await Admin.findOne({ role };
    
    if (!existingSuperAdmin) {
      const superAdmin = new Admin({
        username,
        email,
        password,
        role);

      await superAdmin.save();
      console.log('✓ Super admin created');
    } else {
      console.log('✓ Super admin already exists');
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\nAdmin credentials);
    console.log('Username);
    console.log('Password);

  } catch (error) {
    console.error('❌ Error initializing database, error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
initializeDatabase();
