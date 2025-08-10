import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import Product from '../models/Product';

// Load environment variables
dotenv.config();

const sampleProducts = [
  {
    productCode: 'CH001',
    productName: 'Executive Office Chair',
    category: 'Chair',
    description: 'High-quality executive office chair with ergonomic design and lumbar support.',
    price: 5999,
    colors: ['Black', 'Brown', 'Gray'],
    images: [],
    specifications: new Map([
      ['Material', 'Premium Leather'],
      ['Height Adjustable', 'Yes'],
      ['Armrest', 'Fixed'],
      ['Wheels', '5 Castor Wheels'],
      ['Weight Capacity', '120 kg']
    ]),
    warranty: '3 Year Warranty',
    stockQuantity: 50
  },
  {
    productCode: 'TB001',
    productName: 'Conference Table',
    category: 'Table',
    description: 'Large conference table suitable for meeting rooms and offices.',
    price: 12999,
    colors: ['Walnut', 'Oak', 'White'],
    images: [],
    specifications: new Map([
      ['Material', 'Engineered Wood'],
      ['Size', '6 feet'],
      ['Seating Capacity', '6-8 persons'],
      ['Shape', 'Rectangular'],
      ['Assembly Required', 'Yes']
    ]),
    warranty: '3 Year Warranty',
    stockQuantity: 25
  },
  {
    productCode: 'KC001',
    productName: 'Kids Study Set',
    category: 'Kids Chair & Table',
    description: 'Colorful and safe study set designed specifically for children.',
    price: 3499,
    colors: ['Blue', 'Pink', 'Green', 'Yellow'],
    images: [],
    specifications: new Map([
      ['Age Group', '3-12 years'],
      ['Material', 'Non-toxic Plastic'],
      ['Table Size', '60cm x 40cm'],
      ['Chair Height', 'Adjustable'],
      ['Safety Certified', 'Yes']
    ]),
    warranty: '3 Year Warranty',
    stockQuantity: 40
  },
  {
    productCode: 'SET001',
    productName: 'Office Desk & Chair Combo',
    category: 'Set of Table & Chair',
    description: 'Complete office setup with desk and matching chair.',
    price: 8999,
    colors: ['Black', 'White', 'Walnut'],
    images: [],
    specifications: new Map([
      ['Desk Size', '120cm x 60cm'],
      ['Material', 'Engineered Wood & Steel'],
      ['Chair Type', 'Ergonomic'],
      ['Storage', 'Built-in Drawers'],
      ['Assembly Required', 'Yes']
    ]),
    warranty: '3 Year Warranty',
    stockQuantity: 30
  },
  {
    productCode: 'WC001',
    productName: 'Premium Warranty Chair',
    category: '3 Year Warranty Chair',
    description: 'Premium quality chair with extended warranty coverage.',
    price: 7999,
    colors: ['Black', 'Gray', 'Blue'],
    images: [],
    specifications: new Map([
      ['Material', 'Mesh Back with Fabric Seat'],
      ['Lumbar Support', 'Adjustable'],
      ['Armrest', 'Adjustable'],
      ['Recline', 'Yes'],
      ['Weight Capacity', '130 kg']
    ]),
    warranty: '3 Year Warranty',
    stockQuantity: 35
  }
];

const populateProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/moulded-furniture'
    );
    console.log('Connected to MongoDB');

    // Find admin to use as creator
    const admin = await Admin.findOne({ role: 'super_admin' });
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
      createdBy: admin._id
    }));

    // Insert products
    console.log('Inserting sample products...');
    const insertedProducts = await Product.insertMany(productsWithCreator);
    
    console.log(`✓ ${insertedProducts.length} products inserted successfully!`);
    
    // Display summary
    console.log('\nProduct Summary:');
    for (const product of insertedProducts) {
      console.log(`- ${product.productCode}: ${product.productName} (${product.category}) - ₹${product.price}`);
    }

    console.log('\n🎉 Products populated successfully!');

  } catch (error) {
    console.error('❌ Error populating products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
populateProducts();
