import { OpenApiSpec } from '@loopback/openapi-v3-types';

const swaggerDocument: OpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Backend Service API',
    version: '1.0.0',
    description: 'API for user authentication, including registration, login, password reset, and user profile updates.',
  },
  servers: [
    {
      url: 'http://localhost:9540',
      description: 'Local development server',
    },
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        summary: 'Register a new user',
        description: 'Creates a new user and issues a JWT token.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                    description: '3-30 characters, lowercase, alphanumeric, underscores.',
                    example: 'johndoe123',
                  },
                  firstname: {
                    type: 'string',
                    description: 'Max 50 characters, letters/spaces/hyphens.',
                    example: 'John',
                  },
                  lastname: {
                    type: 'string',
                    description: 'Max 50 characters, letters/spaces/hyphens.',
                    example: 'Doe',
                  },
                  dob: {
                    type: 'string',
                    format: 'date',
                    description: 'Valid date, not in future.',
                    example: '1990-01-01',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Valid email address.',
                    example: 'john.doe@example.com',
                  },
                  password: {
                    type: 'string',
                    description: 'Min 8 characters.',
                    example: 'securepassword123',
                  },
                  phone: {
                    type: 'string',
                    description: 'E.164 format, optional.',
                    example: '+1234567890',
                    nullable: true,
                  },
                  address: {
                    type: 'object',
                    description: 'Optional address details.',
                    properties: {
                      street: { type: 'string', example: '123 Main St', nullable: true },
                      city: { type: 'string', example: 'Springfield', nullable: true },
                      state: { type: 'string', example: 'IL', nullable: true },
                      country: { type: 'string', example: 'USA', nullable: true },
                      postalCode: { type: 'string', example: '62701', nullable: true },
                    },
                  },
                  role: {
                    type: 'string',
                    enum: ['user', 'admin', 'moderator'],
                    description: 'User role, defaults to user.',
                    example: 'user',
                  },
                },
                required: ['username', 'firstname', 'lastname', 'dob', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    data: {
                      type: 'object',
                      properties: {
                        username: { type: 'string', example: 'johndoe123' },
                        email: { type: 'string', example: 'john.doe@example.com' },
                        fullName: { type: 'string', example: 'John Doe' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or duplicate username/email.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'array', items: { type: 'string' }, example: ['Username is required'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login a user',
        description: 'Authenticates a user and issues a JWT token.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Valid email address.',
                    example: 'john.doe@example.com',
                  },
                  password: {
                    type: 'string',
                    description: 'User password.',
                    example: 'securepassword123',
                  },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User logged in successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    data: {
                      type: 'object',
                      properties: {
                        username: { type: 'string', example: 'johndoe123' },
                        email: { type: 'string', example: 'john.doe@example.com' },
                        fullName: { type: 'string', example: 'John Doe' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials or inactive account.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Invalid email or password' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        summary: 'Request a password reset',
        description: 'Sends a password reset email with a secure link.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Valid email address.',
                    example: 'john.doe@example.com',
                  },
                },
                required: ['email'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset email sent.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Password reset email sent' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Email not found or inactive user.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'No user found with that email' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Failed to send email.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Failed to send reset email' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/reset-password/{token}': {
      post: {
        summary: 'Reset password',
        description: 'Resets the user’s password using a reset token.',
        tags: ['Authentication'],
        parameters: [
          {
            name: 'token',
            in: 'path',
            required: true,
            description: 'Password reset token from email.',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  password: {
                    type: 'string',
                    description: 'New password, min 8 characters.',
                    example: 'newsecurepassword123',
                  },
                },
                required: ['password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    data: {
                      type: 'object',
                      properties: {
                        username: { type: 'string', example: 'johndoe123' },
                        email: { type: 'string', example: 'john.doe@example.com' },
                        fullName: { type: 'string', example: 'John Doe' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid or expired token or validation error.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Invalid or expired token' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/update-user-details': {
      post: {
        summary: 'Update user details',
        description: 'Updates the authenticated user\'s details (username, email, firstname, lastname).',
        tags: ['Authentication'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                    description: '3-30 characters, lowercase, alphanumeric, underscores.',
                    example: 'johndoe123',
                    nullable: true,
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'Valid email address.',
                    example: 'john.doe@example.com',
                    nullable: true,
                  },
                  firstname: {
                    type: 'string',
                    description: 'Max 50 characters, letters/spaces/hyphens.',
                    example: 'John',
                    nullable: true,
                  },
                  lastname: {
                    type: 'string',
                    description: 'Max 50 characters, letters/spaces/hyphens.',
                    example: 'Doe',
                    nullable: true,
                  },
                },
                required: [], // Optional fields
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User details updated successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        username: { type: 'string', example: 'johndoe123' },
                        email: { type: 'string', example: 'john.doe@example.com' },
                        fullName: { type: 'string', example: 'John Doe' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or duplicate username/email.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'array', items: { type: 'string' }, example: ['Email is already in use'] },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized access.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Unauthorized' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/update-password': {
      post: {
        summary: 'Update user password',
        description: 'Updates the authenticated user\'s password.',
        tags: ['Authentication'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currentPassword: {
                    type: 'string',
                    description: 'Current password for verification.',
                    example: 'securepassword123',
                  },
                  newPassword: {
                    type: 'string',
                    description: 'New password, min 8 characters.',
                    example: 'newsecurepassword123',
                  },
                },
                required: ['currentPassword', 'newPassword'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Password updated successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or compromised password.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'array', items: { type: 'string' }, example: ['New password is compromised'] },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized or invalid current password.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Invalid current password' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and password management endpoints.',
    },
  ],
};

export default swaggerDocument;