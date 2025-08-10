import Joi from 'joi';
declare const userSchema: Joi.ObjectSchema<any>;
declare const loginSchema: Joi.ObjectSchema<any>;
declare const forgotPasswordSchema: Joi.ObjectSchema<any>;
declare const resetPasswordSchema: Joi.ObjectSchema<any>;
export { userSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
