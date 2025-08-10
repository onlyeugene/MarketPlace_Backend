/**
 * @module services/emailValidationService
 * @description Service to check if an email address uses a disposable domain
 */

const disposableDomains = new Set([
    'mailinator.com',
    '10minutemail.com',
    'tempmail.com',
    'guerrillamail.com',
    'throwawaymail.com',
    'yopmail.com',
    'dispostable.com',
    'temp-mail.org',
    'getnada.com',
    'sharklasers.com',
  ]);
  
  /**
   * Check if an email address uses a disposable domain
   */
  async function checkDisposableEmail(email: string): Promise<boolean> {
    try {
      const domain = email.toLowerCase().split('@')[1];
      if (!domain) {
        return true; // Invalid email format
      }
  
      if (disposableDomains.has(domain)) {
        return true;
      }
  
      // Optional: Integrate with an external API (e.g., Hunter.io)
      /*
      const axios = require('axios');
      const response = await axios.get('https://api.hunter.io/v2/domain-check', {
        params: { domain, api_key: process.env.HUNTER_API_KEY },
      });
      if (response.data.data.disposable) {
        return true;
      }
      */
  
      return false;
    } catch (err: any) {
      console.error('Error checking disposable email:', err.message);
      return false; // Fail open
    }
  }
  
  export { checkDisposableEmail };