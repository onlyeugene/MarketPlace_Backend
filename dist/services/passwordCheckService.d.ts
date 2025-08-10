/**
 * @module services/passwordCheckService
 * @description Service to check if a password has been compromised using Have I Been Pwned API
 */
/**
 * Check if a password has been compromised in a data breach
 */
declare function checkCompromisedPassword(password: string): Promise<boolean>;
export { checkCompromisedPassword };
