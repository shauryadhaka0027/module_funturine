import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest, ProductQuery } from '../types/index';

// Get all products (public - for visitors and dealers)
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as ProductQuery;

    const query: any = { isActive: true };
    
    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .select('-createdBy')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Product.countDocuments(query);

    // Get unique categories for filter
    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      categories
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product by ID (public)
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .select('-createdBy')
      .exec();

    if (!product || !product.isActive) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as ProductQuery;

    const query: any = { 
      category: category,
      isActive: true 
    };

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .select('-createdBy')
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      category
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search products
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query as ProductQuery;

    const searchQuery: any = {
      isActive: true,
      $or: [
        { productName: { $regex: query, $options: 'i' } },
        { productCode: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    };

    const products = await Product.find(searchQuery)
      .select('-createdBy')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Product.countDocuments(searchQuery);

    res.json({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      searchQuery: query
    });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin routes for product management

// Create new product (admin only)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      productCode,
      productName,
      category,
      description,
      price,
      colors,
      images,
      specifications,
      warranty,
      stockQuantity
    } = req.body;

    // Check if product code already exists
    const existingProduct = await Product.findOne({ productCode });
    if (existingProduct) {
      res.status(400).json({ message: 'Product code already exists' });
      return;
    }

    const product = new Product({
      productCode,
      productName,
      category,
      description,
      price,
      colors: colors || [],
      images: images || [],
      specifications: specifications || {},
      warranty,
      stockQuantity: stockQuantity || 0,
      createdBy: req.admin!._id
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product (admin only)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Update product fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'createdBy' && key !== '_id') {
        (product as any)[key] = updateData[key];
      }
    });

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product (admin only)
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Soft delete - set isActive to false
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all products for admin (including inactive)
export const getAdminProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, category, status } = req.query as any;

    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    const products = await Product.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
