"use strict";
/**
 * @module services/emailValidationService
 * @description Service to check if an email address uses a disposable domain
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDisposableEmail = checkDisposableEmail;
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
function checkDisposableEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
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
        }
        catch (err) {
            console.error('Error checking disposable email:', err.message);
            return false; // Fail open
        }
    });
}
