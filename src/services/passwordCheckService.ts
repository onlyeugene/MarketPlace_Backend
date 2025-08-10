import crypto from 'crypto';
import axios from 'axios';

/**
 * @module services/passwordCheckService
 * @description Service to check if a password has been compromised using Have I Been Pwned API
 */

/**
 * Check if a password has been compromised in a data breach
 */
async function checkCompromisedPassword(password: string): Promise<boolean> {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const hashPrefix = hash.slice(0, 5);
    const hashSuffix = hash.slice(5);

    const response = await axios.get(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      headers: { 'Add-Padding': true },
    });

    const hashList = response.data as string;
    const lines = hashList.split('\n');
    for (const line of lines) {
      const [suffix, count] = line.split(':');
      if (suffix === hashSuffix && parseInt(count, 10) > 0) {
        return true;
      }
    }

    return false;
  } catch (err: any) {
    console.error('Error checking compromised password:', err.message);
    return false; // Fail open
  }
}

export { checkCompromisedPassword };