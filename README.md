User Authentication Backend
Overview
This backend service provides a robust API for user authentication, including registration, login, password reset, and profile management. It follows the OpenAPI Specification (OAS) 3.0 and is designed to work with a React frontend using Zustand for state management and Tailwind CSS for styling.
Features

User Registration: Create a new user account with required fields: username, firstname, lastname, dob, email, and password.
User Login: Authenticate users using either username or email along with a password, issuing a JWT token upon success.
Password Reset: Request a password reset email and reset the password using a secure token.
Profile Management: Fetch authenticated user profile details (e.g., username, email, fullName, dob).
Security: Utilizes JWT for authentication, with token validation and automatic inclusion in requests via Axios interceptors.

Tech Stack

Backend: Assumed to be a REST API (language/framework not specified; compatible with Node.js/Express, Python/FastAPI, etc.).
Frontend Integration: Designed to work with a React frontend using TypeScript, Zustand for state management, Axios for API calls, and Tailwind CSS for styling.
Storage: LocalStorage for persisting user and token data on the client side (consider httpOnly cookies for enhanced security in production).

API Endpoints
The backend exposes the following endpoints under the base URL ':
Authentication

POST /auth/register
Description: Register a new user and issue a JWT token.
Request Body: { username, firstname, lastname, dob, email, password }
Responses:
201: Success ({ status: "success", token, data: { username, email, fullName } })
400: Validation error or duplicate username/email




POST /auth/login
Description: Authenticate a user with identifier (username or email) and password, issuing a JWT token.
Request Body: { identifier, password }
Responses:
200: Success ({ status: "success", token, data: { username, email, fullName } })
401: Invalid credentials




POST /auth/forgot-password
Description: Send a password reset email with a secure link.
Request Body: { email }
Responses:
200: Email sent ({ status: "success", message: "Password reset email sent" })
404: Email not found
500: Failed to send email




POST /auth/reset-password/{token}
Description: Reset the user’s password using a reset token.
Request Body: { password }
Responses:
200: Success ({ status: "success", token, data: { username, email, fullName } })
400: Invalid or expired token





Profile

GET /users/me
Description: Fetch the authenticated user’s profile details (assumed endpoint).
Responses:
200: Success ({ data: { username, email, fullName, dob } })
401: Unauthorized (invalid or missing token)





Project Structure
src/
├── api/
│   └── apiClient.js          # Axios instance for all API calls
├── stores/
│   ├── authStore.js         # Zustand store for authentication (login, register, etc.)
│   └── profileStore.js      # Zustand store for profile management
├── components/
│   ├── Login.tsx            # Login and registration form
│   └── Profile.tsx          # Profile details display
├── App.tsx                  # Main entry point
└── index.tsx                # Root file

Setup Instructions

Clone the Repository:
git clone <repository-url>
cd <repository-name>


Install Dependencies (assuming a Node.js frontend):
npm install

Required packages:

axios: For API requests
zustand: For state management
tailwindcss: For styling (or use CDN)
@types/react, @types/react-dom (for TypeScript)


Configure Environment:

Update src/api/apiClient.js to set API_BASE_URL to your backend URL (e.g., '' for development).
Ensure the backend supports the specified endpoints and handles identifier for login (username or email).


Run the Application:
npm start


The frontend runs on http://localhost:3000 (default for Create React App).
The backend should run on http://localhost:9540.


Initialize Stores:

In App.tsx, call useAuthStore.getState().initialize() on app load to validate stored tokens.
Optionally, fetch profile data after login using useProfileStore.getState().fetchProfile().



Security Considerations

HTTPS: Use HTTPS in production to secure API requests.
Token Storage: LocalStorage is used for simplicity; consider httpOnly cookies to prevent XSS attacks (requires backend support).
Input Validation: Client-side validation is minimal (HTML5 required attributes); rely on backend validation for security.
Token Expiry: The client checks JWT expiry and logs out on invalid tokens via interceptors.
Rate Limiting: Implement on the backend to prevent brute-force attacks (not handled client-side).

Usage

Login/Register: Use the Login.tsx component to authenticate or create a user. Toggle between login and register modes.
Profile: Use the Profile.tsx component to display user details after authentication.
Other Endpoints: Add new stores (e.g., orderStore.js) or call apiClient directly for additional endpoints like orders or settings.

Example API Call
import api from '@/app/api/apiClient';

// Fetch profile details
const response = await api.get('/users/me');
console.log(response.data.data); // { username, email, fullName, dob }

Notes

Backend Requirements: Ensure the backend supports identifier (username or email) for login. If it only accepts email, adjust the login action in authStore.js to validate input client-side.
Additional Endpoints: For new endpoints (e.g., POST /api/v1/orders), use apiClient.js directly or create dedicated stores for state management.
Tailwind CSS: Include via CDN (<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">) or configure via npm for production.
TypeScript: The frontend uses TypeScript for type safety. Update interfaces in stores as needed for additional fields.

Troubleshooting

401 Unauthorized: Check if the JWT token is valid and included in requests (handled by apiClient interceptors).
CORS Issues: Ensure the backend allows requests from the frontend origin (e.g., http://localhost:3000).
Token Expiry: The client automatically logs out on 401 responses. Implement token refresh if supported by the backend.

For further customization or additional endpoints, refer to the API specification or contact the backend team.