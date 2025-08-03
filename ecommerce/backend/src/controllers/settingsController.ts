import { Request, Response } from 'express';
import { SiteSettings, HomePageSection, PaymentMethod } from '../models';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  AuthenticatedAdminRequest,
  ApiResponse,
} from '../types';
import fs from 'fs';
import path from 'path';

// Site Settings Controllers

/**
 * Get site settings
 */
export const getSiteSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  let settings = await SiteSettings.findOne();
  
  // Create default settings if none exist
  if (!settings) {
    settings = await SiteSettings.create({
      siteName: 'E-Commerce Store',
      siteDescription: 'Your one-stop shop for quality products',
      contactEmail: 'contact@example.com',
      contactPhone: '',
      address: '',
      socialLinks: '{}',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      maintenanceMode: false,
    });
  }

  // Parse socialLinks if it's a string
  const settingsData = settings.toJSON();
  if (typeof settingsData.socialLinks === 'string') {
    try {
      settingsData.socialLinks = JSON.parse(settingsData.socialLinks);
    } catch (e) {
      console.error('Error parsing socialLinks:', e);
      settingsData.socialLinks = {};
    }
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Site settings retrieved successfully',
    data: settingsData,
  };

  res.json(response);
});

/**
 * Update site settings (Admin only)
 */
export const updateSiteSettings = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const {
    siteName,
    siteDescription,
    contactEmail,
    contactPhone,
    address,
    socialLinks,
    seoTitle,
    seoDescription,
    seoKeywords,
    maintenanceMode,
  } = req.body;

  // Debug logging
  console.log('🔍 [updateSiteSettings] Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 [updateSiteSettings] socialLinks received:', socialLinks);
  console.log('🔍 [updateSiteSettings] socialLinks type:', typeof socialLinks);
  console.log('🔍 [updateSiteSettings] socialLinks stringified:', JSON.stringify(socialLinks));

  // Ensure socialLinks is properly serialized
  const serializedSocialLinks = typeof socialLinks === 'object' ? JSON.stringify(socialLinks) : socialLinks;
  console.log('🔍 [updateSiteSettings] serializedSocialLinks:', serializedSocialLinks);

  let settings = await SiteSettings.findOne();
  
  if (!settings) {
    // Create new settings
    settings = await SiteSettings.create({
      siteName: siteName || 'E-Commerce Store',
      siteDescription: siteDescription || 'Your one-stop shop for quality products',
      contactEmail: contactEmail || 'contact@example.com',
      contactPhone,
      address,
      socialLinks: serializedSocialLinks || '{}',
      seoTitle,
      seoDescription,
      seoKeywords,
      maintenanceMode: maintenanceMode || false,
    });
  } else {
    // Update existing settings
    await settings.update({
      siteName,
      siteDescription,
      contactEmail,
      contactPhone,
      address,
      socialLinks: serializedSocialLinks,
      seoTitle,
      seoDescription,
      seoKeywords,
      maintenanceMode,
    });
  }

  // Debug logging after save
  console.log('🔍 [updateSiteSettings] After save - settings.socialLinks:', settings.socialLinks);
  console.log('🔍 [updateSiteSettings] After save - settings.socialLinks type:', typeof settings.socialLinks);
  console.log('🔍 [updateSiteSettings] After save - settings.socialLinks stringified:', JSON.stringify(settings.socialLinks));

  const response: ApiResponse<any> = {
    success: true,
    message: 'Site settings updated successfully',
    data: settings,
  };

  res.json(response);
});

/**
 * Upload site assets (favicon, logo, footer logo)
 */
export const uploadSiteAsset = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { type } = req.params; // 'favicon', 'logo', 'footerLogo', 'heroVideoMobile', 'heroVideoDesktop'
  
  if (!req.file) {
    throw new ValidationError('File is required');
  }

  if (!['favicon', 'logo', 'footerLogo', 'heroVideoMobile', 'heroVideoDesktop'].includes(type)) {
    throw new ValidationError('Invalid asset type');
  }

  let settings = await SiteSettings.findOne();
  
  if (!settings) {
    settings = await SiteSettings.create({
      siteName: 'E-Commerce Store',
      siteDescription: 'Your one-stop shop for quality products',
      contactEmail: 'contact@example.com',
      socialLinks: {},
      maintenanceMode: false,
    });
  }

  // Update the specific asset field
  const updateData: any = {};
  updateData[type] = req.file.filename;
  
  await settings.update(updateData);

  const response: ApiResponse<any> = {
    success: true,
    message: `${type} uploaded successfully`,
    data: {
      [type]: req.file.filename,
      url: `/uploads/assets/${req.file.filename}`,
    },
  };

  res.json(response);
});

// Home Page Section Controllers

/**
 * Get all home page sections
 */
export const getHomePageSections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sections = await HomePageSection.findAll({
    order: [['sortOrder', 'ASC']],
  });

  // Parse content field if it's a string
  const parsedSections = sections.map(section => {
    const sectionData = section.toJSON();
    if (typeof sectionData.content === 'string') {
      try {
        sectionData.content = JSON.parse(sectionData.content);
      } catch (e) {
        console.error('Error parsing section content:', e);
        sectionData.content = {};
      }
    }
    return sectionData;
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Home page sections retrieved successfully',
    data: parsedSections,
  };

  res.json(response);
});

/**
 * Get active home page sections (for public use)
 */
export const getActiveHomePageSections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sections = await HomePageSection.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC']],
  });

  // Parse content field if it's a string
  const parsedSections = sections.map(section => {
    const sectionData = section.toJSON();
    if (typeof sectionData.content === 'string') {
      try {
        sectionData.content = JSON.parse(sectionData.content);
      } catch (e) {
        console.error('Error parsing section content:', e);
        sectionData.content = {};
      }
    }
    return sectionData;
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Active home page sections retrieved successfully',
    data: parsedSections,
  };

  res.json(response);
});

/**
 * Create home page section (Admin only)
 */
export const createHomePageSection = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { type, title, subtitle, content, isActive, sortOrder } = req.body;

  const section = await HomePageSection.create({
    type,
    title,
    subtitle,
    content: content || {},
    isActive: isActive !== undefined ? isActive : true,
    sortOrder: sortOrder || 0,
  });

  // Parse content field if it's a string
  const sectionData = section.toJSON();
  if (typeof sectionData.content === 'string') {
    try {
      sectionData.content = JSON.parse(sectionData.content);
    } catch (e) {
      console.error('Error parsing section content:', e);
      sectionData.content = {};
    }
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Home page section created successfully',
    data: sectionData,
  };

  res.status(201).json(response);
});

/**
 * Update home page section (Admin only)
 */
export const updateHomePageSection = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { type, title, subtitle, content, isActive, sortOrder } = req.body;

  const section = await HomePageSection.findByPk(id);
  
  if (!section) {
    throw new NotFoundError('Home page section not found');
  }

  // Only update fields that are provided
  const updateData: any = {};
  if (type !== undefined) updateData.type = type;
  if (title !== undefined) updateData.title = title;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (content !== undefined) updateData.content = content;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  await section.update(updateData);

  // Parse content field if it's a string
  const sectionData = section.toJSON();
  if (typeof sectionData.content === 'string') {
    try {
      sectionData.content = JSON.parse(sectionData.content);
    } catch (e) {
      console.error('Error parsing section content:', e);
      sectionData.content = {};
    }
  }

  const response: ApiResponse<any> = {
    success: true,
    message: 'Home page section updated successfully',
    data: sectionData,
  };

  res.json(response);
});

/**
 * Delete home page section (Admin only)
 */
export const deleteHomePageSection = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const section = await HomePageSection.findByPk(id);
  
  if (!section) {
    throw new NotFoundError('Home page section not found');
  }

  await section.destroy();

  const response: ApiResponse<any> = {
    success: true,
    message: 'Home page section deleted successfully',
    data: null,
  };

  res.json(response);
});

/**
 * Reorder home page sections (Admin only)
 */
export const reorderHomePageSections = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { sections } = req.body; // Array of { id, sortOrder }

  if (!Array.isArray(sections)) {
    throw new ValidationError('Sections must be an array');
  }

  // Update sort order for each section
  for (const sectionData of sections) {
    await HomePageSection.update(
      { sortOrder: sectionData.sortOrder },
      { where: { id: sectionData.id } }
    );
  }

  const updatedSections = await HomePageSection.findAll({
    order: [['sortOrder', 'ASC']],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Home page sections reordered successfully',
    data: updatedSections,
  };

  res.json(response);
});

// Payment Method Controllers

/**
 * Get all payment methods
 */
export const getPaymentMethods = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const methods = await PaymentMethod.findAll({
    order: [['sortOrder', 'ASC']],
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Payment methods retrieved successfully',
    data: methods,
  };

  res.json(response);
});

/**
 * Get active payment methods (for public use)
 */
export const getActivePaymentMethods = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const methods = await PaymentMethod.findAll({
    where: { isActive: true },
    order: [['sortOrder', 'ASC']],
    attributes: { exclude: ['configuration'] }, // Hide sensitive config from public
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Active payment methods retrieved successfully',
    data: methods,
  };

  res.json(response);
});

/**
 * Create payment method (Admin only)
 */
export const createPaymentMethod = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { name, type, displayName, description, configuration, isActive, sortOrder } = req.body;

  const method = await PaymentMethod.create({
    name,
    type,
    displayName,
    description,
    configuration: configuration || {},
    isActive: isActive !== undefined ? isActive : false,
    sortOrder: sortOrder || 0,
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Payment method created successfully',
    data: method,
  };

  res.status(201).json(response);
});

/**
 * Update payment method (Admin only)
 */
export const updatePaymentMethod = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, type, displayName, description, configuration, isActive, sortOrder } = req.body;

  const method = await PaymentMethod.findByPk(id);
  
  if (!method) {
    throw new NotFoundError('Payment method not found');
  }

  await method.update({
    name,
    type,
    displayName,
    description,
    configuration,
    isActive,
    sortOrder,
  });

  const response: ApiResponse<any> = {
    success: true,
    message: 'Payment method updated successfully',
    data: method,
  };

  res.json(response);
});

/**
 * Delete payment method (Admin only)
 */
export const deletePaymentMethod = asyncHandler(async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const method = await PaymentMethod.findByPk(id);
  
  if (!method) {
    throw new NotFoundError('Payment method not found');
  }

  await method.destroy();

  const response: ApiResponse<any> = {
    success: true,
    message: 'Payment method deleted successfully',
    data: null,
  };

  res.json(response);
});

export default {
  getSiteSettings,
  updateSiteSettings,
  uploadSiteAsset,
  getHomePageSections,
  getActiveHomePageSections,
  createHomePageSection,
  updateHomePageSection,
  deleteHomePageSection,
  reorderHomePageSections,
  getPaymentMethods,
  getActivePaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};