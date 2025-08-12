import { OpenApiSpec } from "@loopback/openapi-v3-types";

const swaggerDocument: OpenApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Authentication API",
    version: "1.0.0",
    description:
      "API for user authentication, including registration, login, and password reset.",
  },
  servers: [
    {
      url: "http://localhost:9550",
      description: "Local development server",
    },
  ],
  paths: {
    "/api/v1/auth/whoami": {
      get: {
        summary: "Get my profile",
        description: "Returns the profile of the currently authenticated user.",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        fullName: { type: "string" },
                        dob: { type: "string", format: "date" },
                        phone: { type: "string" },
                        address: { type: "object" },
                        role: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/auth/users/{id}": {
      get: {
        summary: "Get user profile by ID",
        description: "Returns a user's profile by ID.",
        tags: ["Authentication"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Profile retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        fullName: { type: "string" },
                        dob: { type: "string", format: "date" },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Register a new user",
        description: "Creates a new user and sends an OTP for verification.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: {
                    type: "string",
                    description:
                      "3-30 characters, lowercase, alphanumeric, underscores.",
                    example: "johndoe123",
                  },
                  firstname: {
                    type: "string",
                    description: "Max 50 characters, letters/spaces/hyphens.",
                    example: "John",
                  },
                  lastname: {
                    type: "string",
                    description: "Max 50 characters, letters/spaces/hyphens.",
                    example: "Doe",
                  },
                  dob: {
                    type: "string",
                    format: "date",
                    description: "Valid date, not in future.",
                    example: "1990-01-01",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "Valid email address.",
                    example: "john.doe@example.com",
                  },
                  password: {
                    type: "string",
                    description: "Min 8 characters.",
                    example: "securepassword123",
                  },
                  phone: {
                    type: "string",
                    description: "E.164 format, optional.",
                    example: "+1234567890",
                    nullable: true,
                  },
                  address: {
                    type: "object",
                    description: "Optional address details.",
                    properties: {
                      street: {
                        type: "string",
                        example: "123 Main St",
                        nullable: true,
                      },
                      city: {
                        type: "string",
                        example: "Springfield",
                        nullable: true,
                      },
                      state: { type: "string", example: "IL", nullable: true },
                      country: {
                        type: "string",
                        example: "USA",
                        nullable: true,
                      },
                      postalCode: {
                        type: "string",
                        example: "62701",
                        nullable: true,
                      },
                    },
                  },
                  role: {
                    type: "string",
                    enum: ["user", "admin", "moderator"],
                    description: "User role, defaults to user.",
                    example: "user",
                  },
                },
                required: [
                  "username",
                  "firstname",
                  "lastname",
                  "dob",
                  "email",
                  "password",
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully, OTP sent.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: {
                      type: "string",
                      example:
                        "Registration successful, please verify OTP sent to your email",
                    },
                    data: {
                      type: "object",
                      properties: {
                        userId: {
                          type: "string",
                          example: "68997961505b339d66223dcb",
                        },
                        username: { type: "string", example: "johndoe123" },
                        email: {
                          type: "string",
                          example: "john.doe@example.com",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error or duplicate username/email.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Account already exists",
                    },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many registration attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example:
                        "Too many registration attempts. Try again later.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Login a user",
        description: "Authenticates a user and issues a JWT token.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  identifier: {
                    type: "string",
                    description: "Email or username.",
                    example: "john.doe@example.com",
                  },
                  password: {
                    type: "string",
                    description: "User password.",
                    example: "securepassword123",
                  },
                },
                required: ["identifier", "password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User logged in successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    token: {
                      type: "string",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    _id: {
                      type: "string",
                      example: "68997961505b339d66223dcb",
                    },
                    data: {
                      type: "object",
                      properties: {
                        username: { type: "string", example: "johndoe123" },
                        email: {
                          type: "string",
                          example: "john.doe@example.com",
                        },
                        fullName: { type: "string", example: "John Doe" },
                        lastLogin: {
                          type: "string",
                          format: "date-time",
                          example: "2025-08-11T23:59:00Z",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials or inactive account.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: { type: "string", example: "Invalid credentials" },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many login attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example:
                        "Too many login attempts. Please try again later.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        summary: "Request a password reset",
        description: "Sends a password reset email with a secure link.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "Valid email address.",
                    example: "john.doe@example.com",
                  },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset email sent.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: {
                      type: "string",
                      example: "Password reset email sent",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Email not found or inactive user.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "No user found with that email",
                    },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Too many attempts, please try again later",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/reset-password/{token}": {
      post: {
        summary: "Reset password",
        description: "Resets the user’s password using a reset token.",
        tags: ["Authentication"],
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            description: "Password reset token from email.",
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  password: {
                    type: "string",
                    description: "New password, min 8 characters.",
                    example: "newsecurepassword123",
                  },
                },
                required: ["password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    token: {
                      type: "string",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    data: {
                      type: "object",
                      properties: {
                        username: { type: "string", example: "johndoe123" },
                        email: {
                          type: "string",
                          example: "john.doe@example.com",
                        },
                        fullName: { type: "string", example: "John Doe" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid or expired token or validation error.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Invalid or expired token",
                    },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Too many attempts, please try again later",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/verify-otp": {
      post: {
        summary: "Verify OTP",
        description: "Verifies OTP for registration or email update.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    description: "User ID.",
                    example: "68997961505b339d66223dcb",
                  },
                  otp: {
                    type: "string",
                    description: "6-digit OTP sent to email.",
                    example: "123456",
                  },
                  type: {
                    type: "string",
                    enum: ["registration", "email-update"],
                    description: "Type of OTP verification.",
                    example: "registration",
                  },
                },
                required: ["userId", "otp", "type"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP verified successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    token: {
                      type: "string",
                      description: "JWT token issued for registration.",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      nullable: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        username: { type: "string", example: "johndoe123" },
                        email: {
                          type: "string",
                          example: "john.doe@example.com",
                        },
                        fullName: { type: "string", example: "John Doe" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid or expired OTP.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Invalid or expired OTP",
                    },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Too many attempts, please try again later",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/resend-otp": {
      post: {
        summary: "Resend OTP",
        description:
          "Resends an OTP for registration or email update to the user’s email.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    description: "User ID.",
                    example: "68997961505b339d66223dcb",
                  },
                  type: {
                    type: "string",
                    enum: ["registration", "email-update"],
                    description: "Type of OTP to resend.",
                    example: "registration",
                  },
                },
                required: ["userId", "type"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP resent successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: {
                      type: "string",
                      example: "OTP resent successfully",
                    },
                    data: {
                      type: "object",
                      properties: {
                        userId: {
                          type: "string",
                          example: "68997961505b339d66223dcb",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error or user not found.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: { type: "string", example: "User not found" },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Too many OTP resend attempts. Try again later.",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Refresh access token",
        description:
          "Exchanges a valid refresh token for a new access token and rotated refresh token.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
                required: ["refreshToken"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token refreshed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    token: { type: "string" },
                    refreshToken: { type: "string" },
                    refreshTokenExpiresAt: { type: "number" },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid or expired refresh token" },
          "403": { description: "Account deactivated" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Log out a user",
        description:
          "Logs out the authenticated user by revoking a single refresh token or all refresh tokens.",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: {
                    type: "string",
                    description: "The refresh token to revoke (optional if revokeAll is true).",
                    example: "abc123def456...",
                    nullable: true,
                  },
                  revokeAll: {
                    type: "boolean",
                    description: "Set to true to revoke all refresh tokens for the user.",
                    example: false,
                    nullable: true,
                  },
                },
                anyOf: [
                  { required: ["refreshToken"] },
                  { required: ["revokeAll"] },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User logged out successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    message: {
                      type: "string",
                      example: "Logged out successfully",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing refreshToken or revokeAll.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "refreshToken or revokeAll required",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: { type: "string", example: "Unauthorized" },
                  },
                },
              },
            },
          },
          "429": {
            description: "Too many logout attempts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Too many logout attempts. Try again later.",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "error" },
                    message: {
                      type: "string",
                      example: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/deactivate": {
      post: {
        summary: "Deactivate account",
        description:
          "Deactivates the authenticated user account with an optional reason.",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: { type: "string", example: "Taking a break" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Account deactivated" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/auth/delete-account": {
      delete: {
        summary: "Delete account",
        description: "Permanently deletes the authenticated user account.",
        tags: ["Authentication"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Account deleted" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  tags: [
    {
      name: "Authentication",
      description: "User authentication and password reset endpoints.",
    },
  ],
};

export default swaggerDocument;