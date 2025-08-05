import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ValidationError } from './errorHandler';

// Define a simple file interface based on multer's structure
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDir = path.join(process.cwd(), 'uploads');
const productImagesDir = path.join(uploadDir, 'products');
const categoryImagesDir = path.join(uploadDir, 'categories');
const userAvatarsDir = path.join(uploadDir, 'avatars');
const assetsDir = path.join(uploadDir, 'assets');
const tempDir = path.join(uploadDir, 'temp');

// Ensure all directories exist
ensureDirectoryExists(uploadDir);
ensureDirectoryExists(productImagesDir);
ensureDirectoryExists(categoryImagesDir);
ensureDirectoryExists(userAvatarsDir);
ensureDirectoryExists(assetsDir);
ensureDirectoryExists(tempDir);

// File type validation
const allowedImageTypes = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const allowedVideoTypes = {
  'video/mp4': '.mp4',
  'video/mpeg': '.mpeg',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/webm': '.webm',
};

const allowedDocumentTypes = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
};

const allowedBulkUploadTypes = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'text/csv': '.csv',
};

// File filter function
const createFileFilter = (allowedTypes: Record<string, string>) => {
  return (req: Request, file: MulterFile, cb: multer.FileFilterCallback) => {
    if (allowedTypes[file.mimetype]) {
      cb(null, true);
    } else {
      const allowedExtensions = Object.values(allowedTypes).join(', ');
      cb(new ValidationError(`Invalid file type. Allowed types: ${allowedExtensions}`));
    }
  };
};

// Storage configuration for different file types
const createStorage = (destination: string, filenamePrefix?: string) => {
  return multer.diskStorage({
    destination: (req: Request, file: MulterFile, cb: (_error: Error | null, _destination: string) => void) => {
      cb(null, destination);
    },
    filename: (req: Request, file: MulterFile, cb: (_error: Error | null, _filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = (allowedImageTypes as Record<string, string>)[file.mimetype] || (allowedVideoTypes as Record<string, string>)[file.mimetype] || (allowedDocumentTypes as Record<string, string>)[file.mimetype] || path.extname(file.originalname);
      const prefix = filenamePrefix ? `${filenamePrefix}-` : '';
      cb(null, `${prefix}${uniqueSuffix}${extension}`);
    },
  });
};

// Memory storage for temporary processing
const memoryStorage = multer.memoryStorage();

// Common upload limits
const uploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 10,
};

const avatarLimits = {
  fileSize: 2 * 1024 * 1024, // 2MB
  files: 1,
};

const documentLimits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 5,
};

// Product image upload middleware
export const uploadProductImages = multer({
  storage: createStorage(productImagesDir, 'product'),
  fileFilter: createFileFilter(allowedImageTypes),
  limits: uploadLimits,
}).array('images', 10);

// Single product image upload
export const uploadSingleProductImage = multer({
  storage: createStorage(productImagesDir, 'product'),
  fileFilter: createFileFilter(allowedImageTypes),
  limits: { fileSize: uploadLimits.fileSize },
}).single('image');

// Category image upload middleware
export const uploadCategoryImage = multer({
  storage: createStorage(categoryImagesDir, 'category'),
  fileFilter: createFileFilter(allowedImageTypes),
  limits: { fileSize: uploadLimits.fileSize },
}).single('image');

// User avatar upload middleware
export const uploadUserAvatar = multer({
  storage: createStorage(userAvatarsDir, 'avatar'),
  fileFilter: createFileFilter(allowedImageTypes),
  limits: avatarLimits,
}).single('avatar');

// Site assets upload (favicon, logo, footer logo, videos)
export const uploadSiteAssets = multer({
  storage: createStorage(assetsDir, 'asset'),
  fileFilter: createFileFilter({ ...allowedImageTypes, ...allowedVideoTypes }),
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB for site assets (to accommodate videos)
}).single('file');

// Multiple file upload for various purposes
export const uploadMultipleFiles = multer({
  storage: createStorage(tempDir),
  fileFilter: createFileFilter({ ...allowedImageTypes, ...allowedDocumentTypes }),
  limits: documentLimits,
}).array('files', 5);

// Memory upload for processing before saving
export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter: createFileFilter(allowedImageTypes),
  limits: uploadLimits,
});

// Upload to memory for single image processing
export const uploadSingleToMemory = uploadToMemory.single('image');

// Bulk upload middleware for Excel/CSV files
export const uploadBulkFileToMemory = multer({
  storage: memoryStorage,
  fileFilter: createFileFilter(allowedBulkUploadTypes),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for bulk upload files
}).single('file');

// Upload to memory for multiple images
export const uploadMultipleToMemory = uploadToMemory.array('images', 10);

// Utility functions for file management

/**
 * Delete a file from the filesystem
 */
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Delete multiple files from the filesystem
 */
export const deleteFiles = async (filePaths: string[]): Promise<void> => {
  const deletePromises = filePaths.map(filePath => deleteFile(filePath));
  await Promise.all(deletePromises);
};

/**
 * Move file from one location to another
 */
export const moveFile = (sourcePath: string, destinationPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.rename(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Copy file from one location to another
 */
export const copyFile = (sourcePath: string, destinationPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.copyFile(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get file information
 */
export const getFileInfo = (filePath: string): Promise<fs.Stats> => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
};

/**
 * Check if file exists
 */
export const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string, prefix?: string): string => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const prefixPart = prefix ? `${prefix}-` : '';
  return `${prefixPart}${baseName}-${uniqueSuffix}${extension}`;
};

/**
 * Get file URL for serving
 */
export const getFileUrl = (filePath: string, baseUrl?: string): string => {
  const relativePath = path.relative(uploadDir, filePath);
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const base = baseUrl || process.env.BASE_URL || 'http://localhost:3007';
  return `${base}/uploads/${normalizedPath}`;
};

/**
 * Validate file size
 */
export const validateFileSize = (file: MulterFile, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Validate file type
 */
export const validateFileType = (file: MulterFile, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype);
};

/**
 * Clean up temporary files older than specified time
 */
export const cleanupTempFiles = (maxAge: number = 24 * 60 * 60 * 1000): void => {
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      // console.error('Error reading temp directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          // console.error('Error getting file stats:', err);
          return;
        }

        const now = Date.now();
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              // console.error('Error deleting temp file:', err);
            } else {
              // console.log('Deleted temp file:', filePath);
            }
          });
        }
      });
    });
  });
};

// Schedule cleanup of temp files every hour
setInterval(() => {
  cleanupTempFiles();
}, 60 * 60 * 1000);

// Export upload directories for use in other modules
export const uploadDirectories = {
  base: uploadDir,
  products: productImagesDir,
  categories: categoryImagesDir,
  avatars: userAvatarsDir,
  assets: assetsDir,
  temp: tempDir,
};

// Export file type constants
export const fileTypes = {
  images: allowedImageTypes,
  documents: allowedDocumentTypes,
};

// Export limits
export const limits = {
  upload: uploadLimits,
  avatar: avatarLimits,
  document: documentLimits,
};

export default {
  uploadProductImages,
  uploadSingleProductImage,
  uploadCategoryImage,
  uploadUserAvatar,
  uploadSiteAssets,
  uploadMultipleFiles,
  uploadSingleToMemory,
  uploadBulkFileToMemory,
  uploadMultipleToMemory,
  deleteFile,
  deleteFiles,
  moveFile,
  copyFile,
  getFileInfo,
  fileExists,
  generateUniqueFilename,
  getFileUrl,
  validateFileSize,
  validateFileType,
  cleanupTempFiles,
  uploadDirectories,
  fileTypes,
  limits,
};