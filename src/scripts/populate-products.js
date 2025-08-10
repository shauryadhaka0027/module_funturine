import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import Product from '../models/Product';

// Load environment variables
dotenv.config();

const sampleProducts = [
  {
    productCode,
    productName,
    category,
    description,
    price,
    colors, 'Brown', 'Gray'],
    images,
    specifications, 'Premium Leather'],
      ["Height Adjustable", 'Yes'],
      ['Armrest', 'Fixed'],
      ['Wheels', '5 Castor Wheels'],
      ["Weight Capacity", '120 kg']
    ]),
    warranty,
    stockQuantity,
  {
    productCode,
    productName,
    category,
    description,
    price,
    colors, 'Oak', 'White'],
    images,
    specifications, 'Engineered Wood'],
      ['Size', '6 feet'],
      ["Seating Capacity", '6-8 persons'],
      ['Shape', 'Rectangular'],
      ["Assembly Required", 'Yes']
    ]),
    warranty,
    stockQuantity,
  {
    productCode,
    productName,
    category,
    description,
    price,
    colors, 'Pink', 'Green', 'Yellow'],
    images,
    specifications, '3-12 years'],
      ['Material', 'Non-toxic Plastic'],
      ["Table Size", '60cm x 40cm'],
      ["Chair Height", 'Adjustable'],
      ["Safety Certified", 'Yes']
    ]),
    warranty,
    stockQuantity,
  {
    productCode,
    productName,
    category,
    description,
    price,
    colors, 'White', 'Walnut'],
    images,
    specifications, '120cm x 60cm'],
      ['Material', 'Engineered Wood & Steel'],
      ["Chair Type", 'Ergonomic'],
      ['Storage', 'Built-in Drawers'],
      ["Assembly Required", 'Yes']
    ]),
    warranty,
    stockQuantity,
  {
    productCode,
    productName,
    category,
    description,
    price,
    colors, 'Gray', 'Blue'],
    images,
    specifications, 'Mesh Back with Fabric Seat'],
      ["Lumbar Support", 'Adjustable'],
      ['Armrest', 'Adjustable'],
      ['Recline', 'Yes'],
      ["Weight Capacity", '130 kg']
    ]),
    warranty,
    stockQuantity= async () {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb);
    console.log('Connected to MongoDB');

    // Find admin to use 
    const admin = await Admin.findOne({ role };
    if (!admin) {
      console.error('No admin found. Please run create-admin script first.');
      process.exit(1);
    }

    // Check if products already exist
    const existingProductsCount = await Product.countDocuments();
    if (existingProductsCount > 0) {
      console.log(`${existingProductsCount} products already exist in database.`);
      const confirm = process.argv.includes('--force');
      if (!confirm) {
        console.log('Use --force flag to add products anyway.');
        process.exit(0);
      }
    }

    // Add createdBy field to each product
    const productsWithCreator = sampleProducts.map(product => ({
      ...product,
      createdBy));

    // Insert products
    console.log('Inserting sample products...');
    const insertedProducts = await Product.insertMany(productsWithCreator);
    
    console.log(`✓ ${insertedProducts.length} products inserted successfully!`);
    
    // Display summary
    console.log('\nProduct Summary);
    for (const product of insertedProducts) {
      console.log(`- ${product.productCode}: ${product.productName} (${product.category}) - ₹${product.price}`);
    }

    console.log('\n🎉 Products populated successfully!');

  } catch (error) {
    console.error('❌ Error populating products, error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
populateProducts();
