import { Response } from 'express';
import { Op } from 'sequelize';
import { Order, OrderItem, Product, User, CartItem, Category } from '../models';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Get user's orders
 */
export const getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = 'newest',
    sortOrder = 'desc',
  } = req.query;

  // Build where conditions
  const whereConditions: any = { userId };
  
  if (status) {
    whereConditions.status = status;
  }

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'total':
      orderConditions = [['total', (sortOrder as string).toUpperCase()]];
      break;
    case 'status':
      orderConditions = [['status', (sortOrder as string).toUpperCase()]];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', (sortOrder as string).toUpperCase()]];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch orders
  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product.unscoped(),
            as: 'product',
            attributes: ['id', 'name', 'slug', 'images', 'sku'],
          },
        ],
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
    data: orders,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Orders retrieved successfully',
    data: response,
  };

  res.json(_apiResponse);
});

/**
 * Get single order
 */
export const getOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Build where conditions (users can only see their own orders, admins can see all)
  const whereConditions: any = { id };
  if (userRole !== 'admin') {
    whereConditions.userId = userId;
  }

  const order = await Order.findOne({
    where: whereConditions,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'images', 'sku', 'description'],
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug'],
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Order retrieved successfully',
    data: order,
  };

  res.json(_apiResponse);
});

/**
 * Create new order
 */
export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes,
  } = req.body;

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  // Start transaction
  const transaction = await Order.sequelize!.transaction();

  try {
    // Validate products and calculate total
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      
      if (!product || !product.isActive) {
        throw new ValidationError(`Product ${item.productId} not found or inactive`);
      }

      if (product.stock < item.quantity) {
        throw new ValidationError(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.getDisplayPrice() * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.getDisplayPrice(),
        total: itemTotal,
      });
    }

    // Calculate totals (simplified - in real app, add tax, shipping, etc.)
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
      userId,
      orderNumber,
      status: 'pending',
      subtotal,
      tax,
      shipping,
      total,
      discount: 0,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      notes,
    }, { transaction });

    // Create order items and update product stock
    for (const item of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }, { transaction });

      // Update product stock within transaction
      const product = await Product.findByPk(item.productId, { transaction });
      if (product) {
        product.stock -= item.quantity;
        await product.save({ transaction });
      }
    }

    // Clear user's cart
    await CartItem.destroy({
      where: { userId },
      transaction
    });

    // Commit transaction
    await transaction.commit();

    // Fetch created order with items and user
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'slug', 'images', 'sku'],
              include: [
                {
                  model: Category,
                  as: 'category',
                  attributes: ['id', 'name', 'slug'],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Send order confirmation email
    try {
      const emailService = (await import('../services/emailService')).default;
      const user = createdOrder?.user;
      
      if (user && user.email) {
        await emailService.sendOrderConfirmation(user.email, {
          customerName: `${user.firstName} ${user.lastName}`,
          orderNumber: createdOrder?.orderNumber,
          orderTotal: createdOrder?.total.toFixed(2),
          orderDate: new Date(createdOrder?.createdAt).toLocaleDateString(),
          paymentMethod: createdOrder?.paymentMethod,
          shippingAddress: createdOrder?.shippingAddress ? 
            `${(createdOrder.shippingAddress as any).address1}\n${(createdOrder.shippingAddress as any).city}, ${(createdOrder.shippingAddress as any).state} ${(createdOrder.shippingAddress as any).postalCode}` : 
            'N/A',
          estimatedDelivery: '3-5 business days'
        });
        console.log('✅ Order confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError);
      // Continue with the response even if email fails
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Order created successfully',
      data: createdOrder,
    };

    res.status(201).json(response);
  } catch (error) {
    // Rollback transaction
    await transaction.rollback();
    throw error;
  }
});

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, trackingNumber, notes } = req.body;

  const order = await Order.findByPk(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Validate status transition
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid order status');
  }

  // Update order
  const updateData: any = { status };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (notes) updateData.notes = notes;

  await order.updateStatus(status);

  // Fetch updated order
  const updatedOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product.unscoped(),
            as: 'product',
            attributes: ['id', 'name', 'slug', 'images', 'sku'],
          },
        ],
      },
    ],
  });

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Order status updated successfully',
    data: updatedOrder,
  };

  res.json(_apiResponse);
});

/**
 * Cancel order
 */
export const cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { reason } = req.body;

  // Build where conditions (users can only cancel their own orders)
  const whereConditions: any = { id };
  if (userRole !== 'admin') {
    whereConditions.userId = userId;
  }

  const order = await Order.findOne({
    where: whereConditions,
    include: [
      {
        model: OrderItem,
        as: 'items',
      },
    ],
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if order can be cancelled
  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    throw new ValidationError('Order cannot be cancelled in current status');
  }

  // Start transaction
  const transaction = await Order.sequelize!.transaction();

  try {
    // Restore product stock
    if (order.items) {
       for (const item of order.items) {
         await Product.updateStock(item.productId, item.quantity);
       }
     }

    // Update order status
    await order.update({
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Order cancelled',
    }, { transaction });

    await transaction.commit();

    const _apiResponse: ApiResponse<any> = {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };

    res.json(_apiResponse);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * Get order statistics (Admin only)
 */
export const getOrderStats = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { period = '30d' } = req.query;

  // Calculate date range
  let startDate: Date;
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get order statistics
  const totalOrders = await Order.count({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
  });

  const ordersByStatus = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
    },
    attributes: [
      'status',
      [Order.sequelize!.fn('COUNT', Order.sequelize!.col('id')), 'count'],
      [Order.sequelize!.fn('SUM', Order.sequelize!.col('total')), 'total'],
    ],
    group: ['status'],
    raw: true,
  });

  const totalRevenue = await Order.sum('total', {
    where: {
      createdAt: { [Op.gte]: startDate },
      status: { [Op.notIn]: ['cancelled'] },
    },
  });

  const averageOrderValue = await Order.findOne({
    where: {
      createdAt: { [Op.gte]: startDate },
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: [
      [Order.sequelize!.fn('AVG', Order.sequelize!.col('total')), 'average'],
    ],
    raw: true,
  });

  // Get sales data for chart
  const salesData = await Order.getSalesData(startDate.getTime());

  const stats = {
    period,
    totalOrders,
    totalRevenue: totalRevenue || 0,
    averageOrderValue: (averageOrderValue as any)?.average || 0,
    ordersByStatus,
    salesData,
  };

  const _apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Order statistics retrieved successfully',
    data: stats,
  };

  res.json(_apiResponse);
});

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    status,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'newest',
    sortOrder = 'desc',
  } = req.query;

  // Build where conditions
  const whereConditions: any = {};
  
  if (status) {
    whereConditions.status = status;
  }
  
  if (userId) {
    whereConditions.userId = userId;
  }
  
  if (startDate || endDate) {
    whereConditions.createdAt = {};
    if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate as string);
    if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate as string);
  }

  // Build order conditions
  let orderConditions: any[];
  switch (sortBy) {
    case 'total':
      orderConditions = [['total', (sortOrder as string).toUpperCase()]];
      break;
    case 'status':
      orderConditions = [['status', (sortOrder as string).toUpperCase()]];
      break;
    case 'customer':
      orderConditions = [[{ model: User, as: 'user' }, 'lastName', (sortOrder as string).toUpperCase()]];
      break;
    case 'newest':
    default:
      orderConditions = [['createdAt', (sortOrder as string).toUpperCase()]];
      break;
  }

  // Calculate pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Fetch orders
  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product.unscoped(),
            as: 'product',
            attributes: ['id', 'name', 'slug', 'images', 'sku'],
          },
        ],
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
    data: orders,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count,
      totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
    },
  };

  const apiResponse: ApiResponse<any> = {
    success: true,
    message: 'Orders retrieved successfully',
    data: response,
  };

  res.json(apiResponse);
});

/**
 * Download invoice for an order
 */
export const downloadInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { orderNumber } = req.params;
  const userId = req.user!.id;

  // Find the order
  const order = await Order.findOne({
    where: { 
      orderNumber,
      userId // Ensure user can only download their own invoices
    },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku']
          }
        ]
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Create PDF
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 20, 30);
  
  // Company info
  doc.setFontSize(12);
  doc.text('E-commerce Store', 20, 50);
  doc.text('123 Business Street', 20, 60);
  doc.text('City, State 12345', 20, 70);
  doc.text('Phone: (555) 123-4567', 20, 80);
  
  // Invoice details
  doc.text(`Invoice #: ${order.orderNumber}`, 120, 50);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 120, 60);
  doc.text(`Status: ${order.status.toUpperCase()}`, 120, 70);
  doc.text(`Payment: ${order.paymentStatus.toUpperCase()}`, 120, 80);
  
  // Customer info
  doc.text('Bill To:', 20, 100);
  doc.text(`${order.user?.firstName} ${order.user?.lastName}`, 20, 110);
  doc.text(`${order.user?.email}`, 20, 120);
  
  if (order.billingAddress) {
    const billing = order.billingAddress as any;
    doc.text(`${billing.address1}`, 20, 130);
    if (billing.address2) {
      doc.text(`${billing.address2}`, 20, 140);
    }
    doc.text(`${billing.city}, ${billing.state} ${billing.postalCode}`, 20, 150);
    doc.text(`${billing.country}`, 20, 160);
  }
  
  // Items table
  const tableData = order.items?.map((item: any) => [
    item.product?.name || 'Unknown Product',
    item.product?.sku || 'N/A',
    item.quantity.toString(),
    `$${parseFloat(item.price).toFixed(2)}`,
    `$${(parseFloat(item.price) * item.quantity).toFixed(2)}`
  ]) || [];
  
  autoTable(doc, {
    head: [['Product', 'SKU', 'Qty', 'Price', 'Total']],
    body: tableData,
    startY: 180,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 }
  });
  
  // Calculate final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // Totals
  doc.text(`Subtotal: $${parseFloat(order.subtotal.toString()).toFixed(2)}`, 120, finalY);
  doc.text(`Tax: $${parseFloat(order.tax.toString()).toFixed(2)}`, 120, finalY + 10);
  doc.text(`Shipping: $${parseFloat(order.shipping.toString()).toFixed(2)}`, 120, finalY + 20);
  if (parseFloat(order.discount.toString()) > 0) {
    doc.text(`Discount: -$${parseFloat(order.discount.toString()).toFixed(2)}`, 120, finalY + 30);
  }
  
  doc.setFontSize(14);
  doc.text(`Total: $${parseFloat(order.total.toString()).toFixed(2)}`, 120, finalY + 40);
  
  // Footer
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 20, finalY + 60);
  
  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  
  // Send PDF
  res.send(pdfBuffer);
});

export default {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders,
  downloadInvoice,
};