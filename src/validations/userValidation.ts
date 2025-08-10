import Joi from 'joi';

const userSchema = Joi.object({
  username: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(30)
    .pattern(/^[a-z0-9_]+$/)
    .required()
    .messages({
      'string.base': 'Username must be a string',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'string.pattern.base': 'Username can only contain lowercase letters, numbers, and underscores',
      'any.required': 'Username is required',
    }),
  firstname: Joi.string()
    .trim()
    .max(50)
    .pattern(/^[A-Za-z\s-]+$/)
    .required()
    .messages({
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, and hyphens',
      'any.required': 'First name is required',
    }),
  lastname: Joi.string()
    .trim()
    .max(50)
    .pattern(/^[A-Za-z\s-]+$/)
    .required()
    .messages({
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, and hyphens',
      'any.required': 'Last name is required',
    }),
  dob: Joi.date()
    .less('now')
    .required()
    .messages({
      'date.base': 'Date of birth must be a valid date',
      'date.less': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number',
    }),
  address: Joi.object({
    street: Joi.string().trim().max(100).allow(null),
    city: Joi.string().trim().max(50).allow(null),
    state: Joi.string().trim().max(50).allow(null),
    country: Joi.string().trim().max(50).allow(null),
    postalCode: Joi.string().trim().max(20).allow(null),
  }).default(null),
  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .default('user')
    .messages({
      'any.only': 'Role must be one of: user, admin, moderator',
    }),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or username is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
}).strict();

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
});

export { userSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };