import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product, Category, Review, User } from '../models';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import * as XLSX from 'xlsx';
const csvWriter = require('csv-writer');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
import path from 'path';
import fs from 'fs';

/**
 * Get all products with filtering, sorting, and pagination
 */
export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    search,
    categoryId,
    categoryIds,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
    sortBy = 'newest',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query as any;



  // Build where conditions
  const whereConditions: any = {
    isActive: true,
  };

  // Search filter
  if (search) {
    whereConditions[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { tags: { [Op.like]: `%${search}%` } },
    ];
  }

  // Category filter - support both single categoryId and multiple categoryIds
  if (categoryIds) {
    // Handle multiple category IDs (comma-separated string or array)
    const categoryIdArray = Array.isArray(categoryIds) 
      ? categoryIds.map(id => parseInt(id))
      : categoryIds.split(',').map((id: string) => parseInt(id.trim()));
    whereConditions.categoryId = { [Op.in]: categoryIdArray };
  } else if (categoryId) {
    // Handle single category ID for backward compatibility
    whereConditions.categoryId = categoryId;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    whereConditions.price = {};
    if (minPrice && !isNaN(parseFloat(minPrice))) {
      whereConditions.price[Op.gte] = parseFloat(minPrice);
    }
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      whereConditions.price[Op.lte] = parseFloat(maxPrice);
    }
  }

  // Rating filter
  if (minRating) {
    whereConditions.averageRating = { [Op.gte]: parseFloat(minRating) };
  }

  // Stock filter
  if (inStock === 'true') {
    whereConditions.stock = { [Op.gt]: 0 };
  }

  // Sale filter
  if (onSale === 'true') {
    whereConditions.salePrice = { [Op.not]: null };
  }

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'name':
      orderConditions = [['name', sortOrder.toUpperCase()]];
      break;
    case 'price':
      orderConditions = [['price', sortOrder.toUpperCase()]];
      break;
    case 'rating':
      orderConditions = [['averageRating', sortOrder.toUpperCase()]];
      break;
    case 'featured':
      orderConditions = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', sortOrder.toUpperCase()]];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Fetch products
  const { count, rows: products } = await Product.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: orderConditions,
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  const response: PaginatedResponse<any> = {
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Products retrieved successfully',
    data: response,
  };

  res.json(response);
});

/**
 * Get featured products
 */
export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { limit = 8 } = req.query;

  const products = await Product.findAll({
    where: {
      isActive: true,
      isFeatured: true,
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
  });

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Featured products retrieved successfully',
    data: products,
  };

  res.json(response);
});

/**
 * Get products on sale
 */
export const getSaleProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { limit = 12 } = req.query;

  const products = await Product.findAll({
    where: {
      isActive: true,
      salePrice: { [Op.gt]: 0 },
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
  });

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Sale products retrieved successfully',
    data: products,
  };

  res.json(response);
});

/**
 * Get single product by ID or slug
 */
export const getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Try to find by ID first, then by slug
  let product;
  if (/^\d+$/.test(id)) {
    product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
          where: { isApproved: true },
          required: false,
          order: [['createdAt', 'DESC']],
          limit: 10,
        },
      ],
    });
  } else {
    product = await Product.findOne({
      where: { slug: id },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
          where: { isApproved: true },
          required: false,
          order: [['createdAt', 'DESC']],
          limit: 10,
        },
      ],
    });
  }

  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found');
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  };

  res.json(response);
});

/**
 * Get related products
 */
export const getRelatedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { limit = 4 } = req.query;

  // Get the current product to find related ones
  const currentProduct = await Product.findByPk(id);
  if (!currentProduct) {
    throw new NotFoundError('Product not found');
  }

  // Find related products in the same category
  const relatedProducts = await Product.findAll({
    where: {
      isActive: true,
      categoryId: currentProduct.categoryId,
      id: { [Op.ne]: currentProduct.id },
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: [['averageRating', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit as string),
  });

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Related products retrieved successfully',
    data: relatedProducts,
  };

  res.json(response);
});

/**
 * Create new product (Admin only)
 */
export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const productData = req.body;

  // Process uploaded images
  const uploadedFiles = req.files as Express.Multer.File[];
  const imagePaths: string[] = [];
  
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach(file => {
      // Store relative path from uploads directory
      const relativePath = `/uploads/products/${file.filename}`;
      imagePaths.push(relativePath);
    });
  }
  
  // Add images to product data
  productData.images = imagePaths;

  // Process tags to ensure they are always an array
  if (productData.tags !== undefined) {
    if (typeof productData.tags === 'string') {
      try {
        // Try to parse as JSON first (for arrays sent as JSON strings)
        const parsed = JSON.parse(productData.tags);
        productData.tags = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If not JSON, treat as comma-separated string
        productData.tags = productData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    } else if (!Array.isArray(productData.tags)) {
      // Ensure non-string, non-array values become arrays
      productData.tags = [productData.tags];
    }
    // Ensure all tag elements are strings
    productData.tags = productData.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
  }

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ where: { sku: productData.sku } });
  if (existingProduct) {
    throw new ConflictError('Product with this SKU already exists');
  }

  // Verify category exists
  const category = await Category.findByPk(productData.categoryId);
  if (!category) {
    throw new ValidationError('Invalid category ID');
  }

  // Create product
  const product = await Product.create(productData);

  // Fetch created product with associations
  const createdProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Product created successfully',
    data: createdProduct,
  };

  res.status(201).json(response);
});

/**
 * Update product (Admin only)
 */
export const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  // Process uploaded images
  const uploadedFiles = req.files as Express.Multer.File[];
  
  if (uploadedFiles && uploadedFiles.length > 0) {
    const imagePaths: string[] = [];
    uploadedFiles.forEach(file => {
      // Store relative path from uploads directory
      const relativePath = `/uploads/products/${file.filename}`;
      imagePaths.push(relativePath);
    });
    // Update images only if new files are uploaded
    updateData.images = imagePaths;
  }

  // Process tags to ensure they are always an array
  if (updateData.tags !== undefined) {
    if (typeof updateData.tags === 'string') {
      try {
        // Try to parse as JSON first (for arrays sent as JSON strings)
        const parsed = JSON.parse(updateData.tags);
        updateData.tags = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If not JSON, treat as comma-separated string
        updateData.tags = updateData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    } else if (!Array.isArray(updateData.tags)) {
      // Ensure non-string, non-array values become arrays
      updateData.tags = [updateData.tags];
    }
    // Ensure all tag elements are strings
    updateData.tags = updateData.tags.map((tag: any) => String(tag).trim()).filter((tag: string) => tag.length > 0);
  }

  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if SKU is being changed and if it already exists
  if (updateData.sku && updateData.sku !== product.sku) {
    const existingProduct = await Product.findOne({ where: { sku: updateData.sku } });
    if (existingProduct) {
      throw new ConflictError('Product with this SKU already exists');
    }
  }

  // Verify category exists if being updated
  if (updateData.categoryId) {
    const category = await Category.findByPk(updateData.categoryId);
    if (!category) {
      throw new ValidationError('Invalid category ID');
    }
  }

  // Update product
  await product.update(updateData);

  // Fetch updated product with associations
  const updatedProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct,
  };

  res.json(response);
});

/**
 * Delete product (Admin only)
 */
export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Soft delete by setting isActive to false
  await product.update({ isActive: false });

  const response: ApiResponse<null> = {
    success: true,
    message: 'Product deleted successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Update product stock
 */
export const updateStock = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { stock, operation = 'set' } = req.body;

  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  let newStock: number;
  switch (operation) {
    case 'add':
      newStock = product.stock + stock;
      break;
    case 'subtract':
      newStock = Math.max(0, product.stock - stock);
      break;
    case 'set':
    default:
      newStock = stock;
      break;
  }

  await product.update({ stock: newStock });

  const response: ApiResponse<{ stock: number }> = {
    success: true,
    message: 'Stock updated successfully',
    data: { stock: newStock },
  };

  res.json(response);
});

/**
 * Get product reviews
 */
export const getProductReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Verify product exists
  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: {
      productId: id,
      isApproved: true,
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit as string),
    offset,
  });

  const totalPages = Math.ceil(count / parseInt(limit as string));

  const response: PaginatedResponse<any> = {
    data: reviews,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: parseInt(page as string) < totalPages,
      hasPrev: parseInt(page as string) > 1,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Product reviews retrieved successfully',
    data: response,
  };

  res.json(response);
});

/**
 * Search products
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q: query, limit = 10 } = req.query;

  if (!query || typeof query !== 'string') {
    throw new ValidationError('Search query is required');
  }

  // Simple search implementation using LIKE operator
  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
      ],
      isActive: true,
    },
    limit: parseInt(limit as string),
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Search completed successfully',
    data: products,
  };

  res.json(response);
});

/**
 * Get search suggestions
 */
export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q: query, limit = 5 } = req.query;

  if (!query || typeof query !== 'string' || query.length < 2) {
    const response: ApiResponse<string[]> = {
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: [],
    };
    res.json(response);
    return;
  }

  // Get product name suggestions
  const products = await Product.findAll({
    where: {
      name: { [Op.like]: `%${query}%` },
      isActive: true,
    },
    attributes: ['name'],
    limit: parseInt(limit as string),
    order: [['name', 'ASC']],
  });

  // Extract unique product names
  const suggestions = products.map(product => product.name);

  const response: ApiResponse<string[]> = {
    success: true,
    message: 'Search suggestions retrieved successfully',
    data: suggestions,
  };

  res.json(response);
});

/**
 * Get all products for admin (includes inactive products)
 */
export const getAllProductsAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    search,
    categoryId,
    status,
    sortBy = 'newest',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query as any;

  // Build where conditions (no isActive filter for admin)
  const whereConditions: any = {};

  // Search filter
  if (search) {
    whereConditions[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
    ];
  }

  // Category filter
  if (categoryId) {
    whereConditions.categoryId = parseInt(categoryId);
  }

  // Status filter
  if (status === 'active') {
    whereConditions.isActive = true;
  } else if (status === 'inactive') {
    whereConditions.isActive = false;
  }

  // Sorting
  let orderConditions: any[] = [];
  switch (sortBy) {
    case 'name':
      orderConditions = [['name', sortOrder.toUpperCase()]];
      break;
    case 'price':
      orderConditions = [['price', sortOrder.toUpperCase()]];
      break;
    case 'stock':
      orderConditions = [['stock', sortOrder.toUpperCase()]];
      break;
    case 'category':
      orderConditions = [[{ model: Category, as: 'category' }, 'name', sortOrder.toUpperCase()]];
      break;
    case 'oldest':
      orderConditions = [['createdAt', 'ASC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', 'DESC']];
      break;
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ],
    order: orderConditions,
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  const response: PaginatedResponse<any> = {
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  res.json(response);
});

// Bulk export products to Excel
export const exportProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const products = await Product.scope('all').findAll({
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  // Transform data for Excel export
  const exportData = products.map(product => ({
    ID: product.id,
    Name: product.name,
    Description: product.description,
    'Short Description': (product as any).shortDescription || '',
    Price: product.price,
    'Sale Price': product.salePrice || '',
    Stock: product.stock,
    SKU: product.sku,
    'Category ID': product.categoryId,
    'Category Name': product.category?.name || '',
    Weight: (product as any).weight || '',
    Dimensions: (product as any).dimensions || '',
    Tags: (product as any).tags ? (Array.isArray((product as any).tags) ? (product as any).tags.join(', ') : (product as any).tags) : '',
    'Meta Title': (product as any).metaTitle || '',
    'Meta Description': (product as any).metaDescription || '',
    'Is Active': product.isActive ? 'Yes' : 'No',
    'Is Featured': product.isFeatured ? 'Yes' : 'No',
    'Is Digital': (product as any).isDigital ? 'Yes' : 'No',
    'Created At': product.createdAt,
    'Updated At': product.updatedAt,
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=products-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  
  res.send(buffer);
});

// Export products to CSV
export const exportProductsCSV = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const products = await Product.scope('all').findAll({
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  // Transform data for CSV export
  const exportData = products.map(product => ({
    ID: product.id,
    Name: product.name,
    Description: product.description,
    'Short Description': (product as any).shortDescription || '',
    Price: product.price,
    'Sale Price': product.salePrice || '',
    Stock: product.stock,
    SKU: product.sku,
    'Category ID': product.categoryId,
    'Category Name': product.category?.name || '',
    Weight: (product as any).weight || '',
    Dimensions: (product as any).dimensions || '',
    Tags: (product as any).tags ? (Array.isArray((product as any).tags) ? (product as any).tags.join(', ') : (product as any).tags) : '',
    'Meta Title': (product as any).metaTitle || '',
    'Meta Description': (product as any).metaDescription || '',
    'Is Active': product.isActive ? 'Yes' : 'No',
    'Is Featured': product.isFeatured ? 'Yes' : 'No',
    'Is Digital': (product as any).isDigital ? 'Yes' : 'No',
    'Created At': product.createdAt,
    'Updated At': product.updatedAt,
  }));

  // Create CSV content
  const csvStringifier = csvWriter.createObjectCsvStringifier({
    header: [
      { id: 'ID', title: 'ID' },
      { id: 'Name', title: 'Name' },
      { id: 'Description', title: 'Description' },
      { id: 'Short Description', title: 'Short Description' },
      { id: 'Price', title: 'Price' },
      { id: 'Sale Price', title: 'Sale Price' },
      { id: 'Stock', title: 'Stock' },
      { id: 'SKU', title: 'SKU' },
      { id: 'Category ID', title: 'Category ID' },
      { id: 'Category Name', title: 'Category Name' },
      { id: 'Weight', title: 'Weight' },
      { id: 'Dimensions', title: 'Dimensions' },
      { id: 'Tags', title: 'Tags' },
      { id: 'Meta Title', title: 'Meta Title' },
      { id: 'Meta Description', title: 'Meta Description' },
      { id: 'Is Active', title: 'Is Active' },
      { id: 'Is Featured', title: 'Is Featured' },
      { id: 'Is Digital', title: 'Is Digital' },
      { id: 'Created At', title: 'Created At' },
      { id: 'Updated At', title: 'Updated At' },
    ],
  });

  const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(exportData);

  // Set response headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=products-export-${new Date().toISOString().split('T')[0]}.csv`);
  
  res.send(csvContent);
});

// Export products to PDF
export const exportProductsPDF = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const products = await Product.scope('all').findAll({
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 100, // Limit for PDF to avoid performance issues
  });

  // Create PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text('Products Export Report', 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Products: ${products.length}`, 14, 36);

  // Prepare table data
  const tableData = products.map(product => [
    product.id,
    product.name.substring(0, 20) + (product.name.length > 20 ? '...' : ''),
    `$${product.price}`,
    product.stock,
    product.sku,
    product.category?.name || 'N/A',
    product.isActive ? 'Yes' : 'No',
  ]);

  // Add table
  (doc as any).autoTable({
    head: [['ID', 'Name', 'Price', 'Stock', 'SKU', 'Category', 'Active']],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=products-export-${new Date().toISOString().split('T')[0]}.pdf`);
  
  res.send(pdfBuffer);
});

// Bulk upload products from CSV
export const bulkUploadProductsCSV = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Temporary implementation - will be completed after fixing imports
  res.status(501).json({ message: 'CSV bulk upload temporarily unavailable' });
  return;
});

// Bulk upload products from Excel
export const bulkUploadProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    throw new ValidationError('Excel file is required');
  }

  try {
    // Read the uploaded Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      try {
        // Validate required fields
        if (!row.Name || !row.Price || !row.Stock || !row.SKU) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields (Name, Price, Stock, SKU)`);
          continue;
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ where: { sku: row.SKU } });
        if (existingProduct) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: SKU '${row.SKU}' already exists`);
          continue;
        }

        // Validate category if provided
        let categoryId = null;
        if (row['Category ID']) {
          const category = await Category.findByPk(row['Category ID']);
          if (!category) {
            results.failed++;
            results.errors.push(`Row ${i + 2}: Category ID '${row['Category ID']}' not found`);
            continue;
          }
          categoryId = row['Category ID'];
        }

        // Generate slug from name
        const generateSlug = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };

        // Create product
        await Product.create({
          name: row.Name,
          slug: generateSlug(row.Name),
          description: row.Description || '',
          shortDescription: row['Short Description'] || '',
          price: parseFloat(row.Price),
          salePrice: row['Sale Price'] ? parseFloat(row['Sale Price']) : undefined,
          stock: parseInt(row.Stock),
          sku: row.SKU,
          categoryId: categoryId,
          weight: row.Weight ? parseFloat(row.Weight) : undefined,
          dimensions: row.Dimensions || '',
          tags: row.Tags ? row.Tags.split(',').map((tag: string) => tag.trim()) : [],
          metaTitle: row['Meta Title'] || '',
          metaDescription: row['Meta Description'] || '',
          isActive: row['Is Active'] === 'Yes' || row['Is Active'] === true || row['Is Active'] === 1,
          isFeatured: row['Is Featured'] === 'Yes' || row['Is Featured'] === true || row['Is Featured'] === 1,
          isDigital: row['Is Digital'] === 'Yes' || row['Is Digital'] === true || row['Is Digital'] === 1,
          images: [], // Images need to be uploaded separately
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const response: ApiResponse<typeof results> = {
      success: true,
      message: `Bulk upload completed. ${results.success} products created, ${results.failed} failed.`,
      data: results,
    };

    res.status(200).json(response);
  } catch (error: any) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw new ValidationError(`Failed to process Excel file: ${error.message}`);
  }
});

// Download bulk upload template
export const downloadBulkTemplate = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Sample data for template
  const templateData = [
    {
      Name: 'Sample Product 1',
      Description: 'This is a sample product description',
      'Short Description': 'Short description for sample product',
      Price: 29.99,
      'Sale Price': 24.99,
      Stock: 100,
      SKU: 'SAMPLE-001',
      'Category ID': 1,
      Weight: 0.5,
      Dimensions: '10 x 5 x 2 cm',
      Tags: 'electronics, gadget, sample',
      'Meta Title': 'Sample Product - Best Electronics',
      'Meta Description': 'Buy the best sample product with amazing features',
      'Is Active': 'Yes',
      'Is Featured': 'No',
      'Is Digital': 'No',
    },
    {
      Name: 'Sample Product 2',
      Description: 'Another sample product description',
      'Short Description': 'Another short description',
      Price: 49.99,
      'Sale Price': '',
      Stock: 50,
      SKU: 'SAMPLE-002',
      'Category ID': 2,
      Weight: 1.2,
      Dimensions: '15 x 10 x 5 cm',
      Tags: 'clothing, fashion, sample',
      'Meta Title': 'Sample Fashion Product',
      'Meta Description': 'Stylish fashion product for modern lifestyle',
      'Is Active': 'Yes',
      'Is Featured': 'Yes',
      'Is Digital': 'No',
    },
  ];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products Template');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=products-bulk-upload-template.xlsx');
  
  res.send(buffer);
});

export default {
  getProducts,
  getFeaturedProducts,
  getSaleProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductReviews,
  searchProducts,
  getAllProductsAdmin,
  exportProducts,
  exportProductsCSV,
  exportProductsPDF,
  bulkUploadProducts,
  downloadBulkTemplate,
};