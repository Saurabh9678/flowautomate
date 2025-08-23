/**
 * Success response utility
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {any} error - Error object (optional)
 */
exports.successResponse = (res, statusCode = 200, data = null, message = 'Success', error = null) => {
    try {
        const response = {
            success: true,
            data,
            message,
            error,
            timestamp: new Date().toISOString()
        };

        // Only include error if we're in development
        if (error && process.env.NODE_ENV === 'development') {
            response.error = error;
        }

        return res.status(statusCode).json(response);
    } catch (err) {
        console.error('Error in successResponse:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null,
            error: null,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Error response utility
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {any} error - Error details (optional)
 */
exports.errorResponse = (res, statusCode = 500, message = 'Internal server error', error = null) => {
    try {
        const response = {
            success: false,
            message,
            data: null,
            error: null,
            timestamp: new Date().toISOString()
        };

        // Log error for debugging 
        if (error) {
            console.error('API Error:', {
                statusCode,
                message,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });

            // Only include error details in development
            if (process.env.NODE_ENV === 'development') {
                response.error = error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error;
            }
        }

        return res.status(statusCode).json(response);
    } catch (err) {
        console.error('Error in errorResponse:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null,
            error: null,
            timestamp: new Date().toISOString()
        });
    }
};

