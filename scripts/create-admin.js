import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

// Load environment variables
dotenv.config();

const createAdmin = async () {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role };
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists);
      console.log('Username, existingSuperAdmin.username);
      console.log('Email, existingSuperAdmin.email);
      process.exit(0);
    }

    // Create super admin
    const superAdmin = new Admin({
      username,
      email,
      password,
      role);

    await superAdmin.save();
    
    console.log('Super admin created successfully!');
    console.log('Username);
    console.log('Email);
    console.log('Password);
    console.log('Role);
    
    // Create regular admin
    const regularAdmin = new Admin({
      username,
      email,
      password,
      role);

    await regularAdmin.save();
    
    console.log('\nRegular admin created successfully!');
    console.log('Username);
    console.log('Email);
    console.log('Password);
    console.log('Role);

  } catch (error) {
    console.error('Error creating admin, error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createAdmin();
