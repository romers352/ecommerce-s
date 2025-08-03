import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Category, Product } from '../models';
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

/**
 * Get all categories
 */
export const getCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { includeInactive = 'false', includeProductCount = 'false' } = req.query;

  const whereConditions: any = {};
  
  // Filter active categories unless specifically requested
  if (includeInactive !== 'true') {
    whereConditions.isActive = true;
  }

  const includeOptions: any[] = [];
  
  // Include product count if requested
  if (includeProductCount === 'true') {
    includeOptions.push({
      model: Product,
      as: 'products',
      attributes: [],
      where: { isActive: true },
      required: false,
    });
  }

  const categories = await Category.findAll({
    where: whereConditions,
    include: includeOptions,
    attributes: includeProductCount === 'true' 
      ? {
          include: [
            [
              Category.sequelize!.fn('COUNT', Category.sequelize!.col('products.id')),
              'productCount'
            ]
          ]
        }
      : undefined,
    group: includeProductCount === 'true' ? ['Category.id'] : undefined,
    order: [['sortOrder', 'ASC'], ['name', 'ASC']],
  });

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  };

  res.json(response);
});

/**
 * Get active categories with product count
 */
export const getActiveCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await Category.getActiveWithProducts();

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Active categories retrieved successfully',
    data: categories,
  };

  res.json(response);
});

/**
 * Get main categories for navbar/footer (max 3)
 */
export const getMainCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await Category.getMainCategories();

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Main categories retrieved successfully',
    data: categories,
  };

  res.json(response);
});

/**
 * Get category hierarchy (main categories with subcategories)
 */
export const getCategoryHierarchy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await Category.getCategoryHierarchy();

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Category hierarchy retrieved successfully',
    data: categories,
  };

  res.json(response);
});

/**
 * Get subcategories by parent ID
 */
export const getSubcategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { parentId } = req.params;
  
  const categories = await Category.getSubcategories(parseInt(parentId));

  const response: ApiResponse<any[]> = {
    success: true,
    message: 'Subcategories retrieved successfully',
    data: categories,
  };

  res.json(response);
});

/**
 * Get single category by ID or slug
 */
export const getCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { includeProducts = 'false' } = req.query;

  let category;
  const includeOptions: any[] = [];

  // Include products if requested
  if (includeProducts === 'true') {
    includeOptions.push({
      model: Product,
      as: 'products',
      where: { isActive: true },
      required: false,
      order: [['createdAt', 'DESC']],
      limit: 12,
    });
  }

  // Try to find by ID first, then by slug
  if (/^\d+$/.test(id)) {
    category = await Category.findByPk(id, {
      include: includeOptions,
    });
  } else {
    category = await Category.findBySlug(id);
    if (category && includeOptions.length > 0) {
      category = await Category.findByPk(category.id, {
        include: includeOptions,
      });
    }
  }

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Category retrieved successfully',
    data: category,
  };

  res.json(response);
});

/**
 * Get products by category
 */
export const getCategoryProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    page = 1,
    limit = 12,
    sortBy = 'newest',
    sortOrder = 'desc',
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
  } = req.query;

  // Find category
  let category;
  if (/^\d+$/.test(id)) {
    category = await Category.findByPk(id);
  } else {
    category = await Category.findBySlug(id);
  }

  if (!category || !category.isActive) {
    throw new NotFoundError('Category not found');
  }

  // Build where conditions for products
  const whereConditions: any = {
    categoryId: category.id,
    isActive: true,
  };

  // Price range filter
  if (minPrice || maxPrice) {
    whereConditions.price = {};
    if (minPrice) whereConditions.price[Op.gte] = parseFloat(minPrice as string);
    if (maxPrice) whereConditions.price[Op.lte] = parseFloat(maxPrice as string);
  }

  // Rating filter
  if (minRating) {
    whereConditions.averageRating = { [Op.gte]: parseFloat(minRating as string) };
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
      orderConditions = [['name', (sortOrder as string).toUpperCase()]];
      break;
    case 'price':
      orderConditions = [['price', (sortOrder as string).toUpperCase()]];
      break;
    case 'rating':
      orderConditions = [['averageRating', (sortOrder as string).toUpperCase()]];
      break;
    case 'featured':
      orderConditions = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', (sortOrder as string).toUpperCase()]];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

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
    limit: parseInt(limit as string),
    offset,
  });

  // Calculate pagination info
  const totalPages = Math.ceil(count / parseInt(limit as string));
  const hasNextPage = parseInt(page as string) < totalPages;
  const hasPrevPage = parseInt(page as string) > 1;

  const response: PaginatedResponse<any> = {
    data: products,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  res.json({
    success: true,
    message: 'Category products retrieved successfully',
    data: response,
  });
});

/**
 * Create new category (Admin only)
 */
export const createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const categoryData = req.body;

  // Check if category with same name already exists
  const existingCategory = await Category.findOne({
    where: { name: categoryData.name },
  });

  if (existingCategory) {
    throw new ConflictError('Category with this name already exists');
  }

  // Create category
  const category = await Category.create(categoryData);

  const response: ApiResponse<any> = {
    success: true,
    message: 'Category created successfully',
    data: category,
  };

  res.status(201).json(response);
});

/**
 * Update category (Admin only)
 */
export const updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  console.log('🔍 Update Category Debug:');
  console.log('Category ID:', id);
  console.log('Update Data:', JSON.stringify(updateData, null, 2));

  const category = await Category.findByPk(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  console.log('Current Category:', JSON.stringify({
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    isMainCategory: category.isMainCategory
  }, null, 2));

  // Check if name is being changed and if it already exists
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({
      where: { name: updateData.name },
    });
    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }
  }

  try {
    // Update category
    console.log('🔄 Attempting to update category...');
    await category.update(updateData);
    console.log('✅ Category updated successfully');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Category updated successfully',
      data: category,
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Category update failed:', error);
    throw error;
  }
});

/**
 * Delete category (Admin only)
 */
export const deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { force = 'false' } = req.query;

  const category = await Category.findByPk(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has products
  const productCount = await Product.count({
    where: {
      categoryId: category.id,
      isActive: true,
    },
  });

  if (productCount > 0 && force !== 'true') {
    throw new ValidationError(
      'Cannot delete category with active products. Use force=true to deactivate instead.'
    );
  }

  if (force === 'true') {
    // Soft delete by setting isActive to false
    await category.update({ isActive: false });
    
    // Also deactivate all products in this category
    await Product.update(
      { isActive: false },
      {
        where: {
          categoryId: category.id,
          isActive: true,
        },
      }
    );
  } else {
    // Hard delete if no products
    await category.destroy();
  }

  const response: ApiResponse<null> = {
    success: true,
    message: force === 'true' ? 'Category deactivated successfully' : 'Category deleted successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Reorder categories (Admin only)
 */
export const reorderCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { categoryOrders } = req.body;

  if (!Array.isArray(categoryOrders)) {
    throw new ValidationError('categoryOrders must be an array');
  }

  // Validate and update sort orders
  const updatePromises = categoryOrders.map(async (item: any) => {
    if (!item.id || typeof item.sortOrder !== 'number') {
      throw new ValidationError('Each item must have id and sortOrder');
    }

    const category = await Category.findByPk(item.id);
    if (!category) {
      throw new NotFoundError(`Category with id ${item.id} not found`);
    }

    return category.update({ sortOrder: item.sortOrder });
  });

  await Promise.all(updatePromises);

  const response: ApiResponse<null> = {
    success: true,
    message: 'Categories reordered successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Get category statistics (Admin only)
 */
export const getCategoryStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const category = await Category.findByPk(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Get product statistics
  const totalProducts = await Product.count({
    where: { categoryId: category.id },
  });

  const activeProducts = await Product.count({
    where: {
      categoryId: category.id,
      isActive: true,
    },
  });

  const featuredProducts = await Product.count({
    where: {
      categoryId: category.id,
      isActive: true,
      isFeatured: true,
    },
  });

  const productsOnSale = await Product.count({
    where: {
      categoryId: category.id,
      isActive: true,
      salePrice: { [Op.gt]: 0 },
    },
  });

  const outOfStockProducts = await Product.count({
    where: {
      categoryId: category.id,
      isActive: true,
      stock: 0,
    },
  });

  // Get price range
  const priceStats = await Product.findOne({
    where: {
      categoryId: category.id,
      isActive: true,
    },
    attributes: [
      [Product.sequelize!.fn('MIN', Product.sequelize!.col('price')), 'minPrice'],
      [Product.sequelize!.fn('MAX', Product.sequelize!.col('price')), 'maxPrice'],
      [Product.sequelize!.fn('AVG', Product.sequelize!.col('price')), 'avgPrice'],
    ],
    raw: true,
  }) as any;

  const stats = {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      featured: featuredProducts,
      onSale: productsOnSale,
      outOfStock: outOfStockProducts,
    },
    pricing: {
      minPrice: priceStats?.minPrice || 0,
      maxPrice: priceStats?.maxPrice || 0,
      avgPrice: priceStats?.avgPrice || 0,
    },
  };

  const response: ApiResponse<any> = {
    success: true,
    message: 'Category statistics retrieved successfully',
    data: stats,
  };

  res.json(response);
});

export default {
  getCategories,
  getActiveCategories,
  getMainCategories,
  getCategoryHierarchy,
  getSubcategories,
  getCategory,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getCategoryStats,
};