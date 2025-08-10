/**
 * Generate HTML email template for password reset
 */
declare const passwordResetTemplate: (resetURL: string, fullName: string) => string;
export default passwordResetTemplate;
