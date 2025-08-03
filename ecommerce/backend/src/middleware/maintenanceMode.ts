import { Request, Response, NextFunction } from 'express';
import { SiteSettings } from '../models';
import { AuthenticatedAdminRequest } from '../types';

/**
 * Middleware to check if the site is in maintenance mode
 * Blocks all non-admin requests when maintenance mode is enabled
 */
export const checkMaintenanceMode = async (
  req: Request | AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip maintenance check for admin routes
    if (req.path.startsWith('/api/v1/admin') || req.path.startsWith('/admin')) {
      next();
      return;
    }

    // Skip maintenance check for settings routes (needed to check and disable maintenance mode)
    if (req.path.startsWith('/api/v1/settings')) {
      next();
      return;
    }

    // Skip maintenance check for health endpoint
    if (req.path === '/health' || req.path === '/api/v1/health') {
      next();
      return;
    }

    // Skip maintenance check for auth routes (login/logout)
    if (req.path.startsWith('/api/v1/auth')) {
      next();
      return;
    }

    // Get site settings to check maintenance mode
    const settings = await SiteSettings.findOne();
    
    if (settings && settings.maintenanceMode) {
      // Check if user is authenticated as admin
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Let admin users through even in maintenance mode
        // The admin auth middleware will validate the token
        next();
        return;
      }
      
      // Site is in maintenance mode for non-admin users
      res.status(503).json({
        success: false,
        message: 'Site is currently under maintenance. Please try again later.',
        error: 'MAINTENANCE_MODE',
        maintenanceMode: true,
      });
      return;
    }

    // Site is not in maintenance mode, continue
    next();
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request to continue
    // This prevents the site from being completely broken if there's a database issue
    console.error('Error checking maintenance mode:', error);
    next();
  }
};

/**
 * Middleware specifically for frontend routes
 * Returns a maintenance page HTML instead of JSON
 */
export const checkMaintenanceModeForFrontend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get site settings to check maintenance mode
    const settings = await SiteSettings.findOne();
    
    if (settings && settings.maintenanceMode) {
      // Return maintenance page HTML
      const maintenanceHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Site Under Maintenance</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 500px;
              margin: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #333;
              margin-bottom: 1rem;
              font-size: 2rem;
            }
            p {
              color: #666;
              line-height: 1.6;
              margin-bottom: 2rem;
            }
            .refresh-btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 0.75rem 2rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              transition: background 0.3s;
            }
            .refresh-btn:hover {
              background: #5a6fd8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🔧</div>
            <h1>Site Under Maintenance</h1>
            <p>We're currently performing scheduled maintenance to improve your experience. Please check back in a few minutes.</p>
            <button class="refresh-btn" onclick="window.location.reload()">Refresh Page</button>
          </div>
        </body>
        </html>
      `;
      
      res.status(503).send(maintenanceHTML);
      return;
    }

    // Site is not in maintenance mode, continue
    next();
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request to continue
    console.error('Error checking maintenance mode:', error);
    next();
  }
};