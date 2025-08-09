import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

// Load environment variables
dotenv.config();

const createAdmin = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/moulded-furniture'
    );
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:');
      console.log('Username:', existingSuperAdmin.username);
      console.log('Email:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      username: 'superadmin',
      email: 'admin@mouldedfurniture.com',
      password: 'Admin@123',
      role: 'super_admin'
    });

    await superAdmin.save();
    
    console.log('Super admin created successfully!');
    console.log('Username: superadmin');
    console.log('Email: admin@mouldedfurniture.com');
    console.log('Password: Admin@123');
    console.log('Role: super_admin');
    
    // Create regular admin
    const regularAdmin = new Admin({
      username: 'admin',
      email: 'admin2@mouldedfurniture.com',
      password: 'Admin@123',
      role: 'admin'
    });

    await regularAdmin.save();
    
    console.log('\nRegular admin created successfully!');
    console.log('Username: admin');
    console.log('Email: admin2@mouldedfurniture.com');
    console.log('Password: Admin@123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createAdmin();
