import Joi from 'joi';

export const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
    'any.required': 'OTP is required',
  }),
});