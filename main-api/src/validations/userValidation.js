const Joi = require('joi');

/**
 * User registration validation schema
 */
const registerUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
      'any.required': 'Password is required',
    })
});

/**
 * User login validation schema
 */
const loginUserSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    })
});


module.exports = {
  registerUserSchema,
  loginUserSchema
};
