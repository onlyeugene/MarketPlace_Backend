import { Request, Response } from "express";
/**
 * Register a new user with enhanced security checks
 */
declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * Login a user with enhanced security checks
 */
declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Send a password reset email
 */
declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
/**
 * Reset password using a token
 */
declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export { register, login, forgotPassword, resetPassword };
