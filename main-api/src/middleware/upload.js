const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BadRequestError } = require('../utils/CustomError');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get user ID from authenticated user
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return cb(new BadRequestError('User ID not found in request'));
    }

    // Create user-specific directory
    const userUploadDir = path.join(uploadsDir, userId.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    cb(null, userUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    // Create unique filename: originalname_timestamp.extension
    const uniqueFilename = `${nameWithoutExt}_${timestamp}${extension}`;
    
    cb(null, uniqueFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('pdf');

// Wrapper middleware to handle multer errors
const uploadSinglePDF = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return next(new BadRequestError('File size too large. Maximum size is 10MB'));
        case 'LIMIT_FILE_COUNT':
          return next(new BadRequestError('Too many files. Only 1 file allowed'));
        case 'LIMIT_UNEXPECTED_FILE':
          return next(new BadRequestError('Unexpected file field'));
        default:
          return next(new BadRequestError('File upload error'));
      }
    } else if (err) {
      // Other errors (including our custom errors)
      return next(err);
    }

    // Check if file was uploaded
    if (!req.file) {
      return next(new BadRequestError('No file uploaded'));
    }

    // Add file info to request
    req.uploadedFile = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    next();
  });
};

// Utility function to get file path for a user
const getUserFilePath = (userId, filename) => {
  return path.join(uploadsDir, userId.toString(), filename);
};

// Utility function to check if file exists
const fileExists = (userId, filename) => {
  const filePath = getUserFilePath(userId, filename);
  return fs.existsSync(filePath);
};

// Utility function to delete file
const deleteFile = (userId, filename) => {
  const filePath = getUserFilePath(userId, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Utility function to get file stats
const getFileStats = (userId, filename) => {
  const filePath = getUserFilePath(userId, filename);
  if (fs.existsSync(filePath)) {
    return fs.statSync(filePath);
  }
  return null;
};

module.exports = {
  uploadSinglePDF,
  getUserFilePath,
  fileExists,
  deleteFile,
  getFileStats,
  uploadsDir
};
