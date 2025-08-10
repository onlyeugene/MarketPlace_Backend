"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCompromisedPassword = checkCompromisedPassword;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
/**
 * @module services/passwordCheckService
 * @description Service to check if a password has been compromised using Have I Been Pwned API
 */
/**
 * Check if a password has been compromised in a data breach
 */
async function checkCompromisedPassword(password) {
    try {
        const hash = crypto_1.default.createHash('sha1').update(password).digest('hex').toUpperCase();
        const hashPrefix = hash.slice(0, 5);
        const hashSuffix = hash.slice(5);
        const response = await axios_1.default.get(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
            headers: { 'Add-Padding': true },
        });
        const hashList = response.data;
        const lines = hashList.split('\n');
        for (const line of lines) {
            const [suffix, count] = line.split(':');
            if (suffix === hashSuffix && parseInt(count, 10) > 0) {
                return true;
            }
        }
        return false;
    }
    catch (err) {
        console.error('Error checking compromised password:', err.message);
        return false; // Fail open
    }
}
