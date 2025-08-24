const { ValidationError } = require('../utils/CustomError');

const validateJoi = (schema, validationType = 'body') => {
  return (req, res, next) => {
    try {
      // Get the data to validate based on validation type
      const dataToValidate = req[validationType];
      
      // Validate the data against the schema
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Collect all validation errors
        stripUnknown: true, // Remove unknown fields
        allowUnknown: false // Don't allow unknown fields
      });

      // If validation fails, throw ValidationError
      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        throw new ValidationError('Validation failed', validationErrors);
      }

      // Replace the request data with validated data
      req[validationType] = value;
      
      next();
    } catch (err) {
      // Pass the error to the next middleware (error handler)
      next(err);
    }
  };
};

/**
 * Body validation middleware
 * @param {Object} schema - Joi schema for request body
 */
const validateBody = (schema) => validateJoi(schema, 'body');

/**
 * Params validation middleware
 * @param {Object} schema - Joi schema for request parameters
 */
const validateParams = (schema) => validateJoi(schema, 'params');

/**
 * Query validation middleware
 * @param {Object} schema - Joi schema for query parameters
 */
const validateQuery = (schema) => validateJoi(schema, 'query');

module.exports = {
  validateJoi,
  validateBody,
  validateParams,
  validateQuery
};
