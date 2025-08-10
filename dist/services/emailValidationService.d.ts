/**
 * @module services/emailValidationService
 * @description Service to check if an email address uses a disposable domain
 */
/**
 * Check if an email address uses a disposable domain
 */
declare function checkDisposableEmail(email: string): Promise<boolean>;
export { checkDisposableEmail };
