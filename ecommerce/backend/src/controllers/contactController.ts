import { Request, Response } from 'express';
import { Contact } from '../models';
import { ContactCreateInput, ContactUpdateInput, AuthenticatedRequest } from '../types';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';

// Create a new contact message
export const createContact = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const contactData: ContactCreateInput = req.body;

    // Create the contact message
    const contact = await Contact.create(contactData);

    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully',
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        priority: contact.priority,
        createdAt: contact.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send contact message',
      error: error.message
    });
  }
};

// Get all contacts (Admin only)
export const getAllContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (priority) {
      whereClause.priority = priority;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'repliedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: contacts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    console.error('Error getting contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts',
      error: error.message
    });
  }
};

// Get contact by ID (Admin only)
export const getContactById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id, {
      include: [
        {
          association: 'repliedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    // Mark as read if it's new
    if (contact.status === 'new') {
      contact.markAsRead();
      await contact.save();
    }

    res.json({
      success: true,
      message: 'Contact retrieved successfully',
      data: contact
    });
  } catch (error: any) {
    console.error('Error getting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact',
      error: error.message
    });
  }
};

// Update contact (Admin only)
export const updateContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: ContactUpdateInput = req.body;
    const adminId = req.user?.id;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    // If marking as replied, set the replied fields
    if (updateData.status === 'replied' && adminId) {
      contact.markAsReplied(adminId);
    }

    // Update other fields
    if (updateData.status && updateData.status !== 'replied') {
      contact.status = updateData.status;
    }
    if (updateData.priority) {
      contact.setPriority(updateData.priority);
    }
    if (updateData.adminNotes) {
      contact.addAdminNotes(updateData.adminNotes);
    }

    await contact.save();

    const updatedContact = await Contact.findByPk(id, {
      include: [
        {
          association: 'repliedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact
    });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    });
  }
};

// Delete contact (Admin only)
export const deleteContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    await contact.destroy();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    });
  }
};

// Respond to contact (Admin only)
export const respondToContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, subject } = req.body;
    const adminId = req.user?.id;

    if (!message || !subject) {
      res.status(400).json({
        success: false,
        message: 'Message and subject are required'
      });
      return;
    }

    const contact = await Contact.findByPk(id);

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    // Send email response using email service
    try {
      const emailService = (await import('../services/emailService')).default;
      const emailResult = await emailService.sendContactResponse(contact.email, {
        name: contact.name,
        subject: subject,
        message: message
      });
      
      if (!emailResult.success) {
        console.error('❌ Failed to send contact response email:', emailResult.error);
        res.status(500).json({
          success: false,
          message: 'Failed to send email response',
          error: emailResult.error
        });
        return;
      }
      
      console.log('✅ Contact response email sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending contact response email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send email response',
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
      return;
    }

    // Mark contact as replied
    if (adminId) {
      contact.markAsReplied(adminId);
      await contact.save();
    }

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: {
        contactId: contact.id,
        emailSent: true,
        sentTo: contact.email,
        subject: subject
      }
    });
  } catch (error: any) {
    console.error('Error responding to contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message
    });
  }
};

// Get contact statistics (Admin only)
export const getContactStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalContacts = await Contact.count();
    const newContacts = await Contact.count({ where: { status: 'new' } });
    const readContacts = await Contact.count({ where: { status: 'read' } });
    const repliedContacts = await Contact.count({ where: { status: 'replied' } });
    const closedContacts = await Contact.count({ where: { status: 'closed' } });
    
    const highPriorityContacts = await Contact.count({ where: { priority: 'high' } });
    const mediumPriorityContacts = await Contact.count({ where: { priority: 'medium' } });
    const lowPriorityContacts = await Contact.count({ where: { priority: 'low' } });
    
    const highPriorityUnread = await Contact.getHighPriorityUnread();

    res.json({
      success: true,
      message: 'Contact statistics retrieved successfully',
      data: {
        total: totalContacts,
        byStatus: {
          new: newContacts,
          read: readContacts,
          replied: repliedContacts,
          closed: closedContacts
        },
        byPriority: {
          high: highPriorityContacts,
          medium: mediumPriorityContacts,
          low: lowPriorityContacts
        },
        highPriorityUnread: highPriorityUnread.length,
        unreadCount: newContacts
      }
    });
  } catch (error: any) {
    console.error('Error getting contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact statistics',
      error: error.message
    });
  }
};

// Bulk update contacts (Admin only)
export const bulkUpdateContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactIds, updateData } = req.body;
    const adminId = req.user?.id;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Contact IDs are required'
      });
      return;
    }

    const contacts = await Contact.findAll({
      where: {
        id: {
          [Op.in]: contactIds
        }
      }
    });

    if (contacts.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No contacts found'
      });
      return;
    }

    // Update each contact
    for (const contact of contacts) {
      if (updateData.status === 'replied' && adminId) {
        contact.markAsReplied(adminId);
      } else if (updateData.status) {
        contact.status = updateData.status;
      }
      
      if (updateData.priority) {
        contact.setPriority(updateData.priority);
      }
      
      await contact.save();
    }

    res.json({
      success: true,
      message: `${contacts.length} contacts updated successfully`,
      data: {
        updatedCount: contacts.length
      }
    });
  } catch (error: any) {
    console.error('Error bulk updating contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contacts',
      error: error.message
    });
  }
};

export default {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats,
  bulkUpdateContacts
};