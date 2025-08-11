import { OpenApiSpec } from '@loopback/openapi-v3-types';

const profileSwaggerDocument: OpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Profile Management API',
    version: '1.0.0',
    description: 'API for managing user profile details, including updating username, date of birth, email, and password.',
  },
  servers: [
    {
      url: 'http://localhost:9540',
      description: 'Local development server',
    },
  ],
  paths: {
    '/api/v1/update-details/{id}': {
      put: {
        summary: 'Update user details',
        description: 'Updates the authenticated user’s username and/or date of birth.',
        tags: ['Profile'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID.',
            schema: {
              type: 'string',
              example: '68997961505b339d66223dcb',
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
                  username: {
                    type: 'string',
                    description: '3-30 characters, lowercase, alphanumeric, underscores.',
                    example: 'johndoe123',
                    nullable: true,
                  },
                  dob: {
                    type: 'string',
                    format: 'date',
                    description: 'Valid date, not in future.',
                    example: '1990-01-01',
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
                        dob: { type: 'string', format: 'date', example: '1990-01-01' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or duplicate username.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Username is already in use' },
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
          '403': {
            description: 'Forbidden: Cannot update another user’s details.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Forbidden: Cannot update another user’s details' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Too many requests, please try again later' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/update-email/{id}': {
      put: {
        summary: 'Initiate email update',
        description: 'Initiates an email update for the authenticated user by sending an OTP to the new email.',
        tags: ['Profile'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID.',
            schema: {
              type: 'string',
              example: '68997961505b339d66223dcb',
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
                  email: {
                    type: 'string',
                    format: 'email',
                    description: 'New email address.',
                    example: 'new.john.doe@example.com',
                  },
                },
                required: ['email'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OTP sent to new email for verification.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'OTP sent to new email for verification' },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string', example: '68997961505b339d66223dcb' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or email already in use.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Email already in use' },
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
          '403': {
            description: 'Forbidden: Cannot update another user’s email.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Forbidden: Cannot update another user’s email' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Too many attempts.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Too many email update attempts. Try again later.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/update-password/{id}': {
      post: {
        summary: 'Update user password',
        description: 'Updates the authenticated user’s password after verifying the current password.',
        tags: ['Profile'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID.',
            schema: {
              type: 'string',
              example: '68997961505b339d66223dcb',
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
                    message: { type: 'string', example: 'This password has been compromised in a data breach.' },
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
          '403': {
            description: 'Forbidden: Cannot update another user’s password.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Forbidden: Cannot update another user’s password' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Too many requests.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Too many requests, please try again later' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/verify-otp': {
      post: {
        summary: 'Verify OTP',
        description: 'Verifies OTP for registration or email update.',
        tags: ['Profile'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID.',
                    example: '68997961505b339d66223dcb',
                  },
                  otp: {
                    type: 'string',
                    description: '6-digit OTP sent to email.',
                    example: '123456',
                  },
                  type: {
                    type: 'string',
                    enum: ['registration', 'email-update'],
                    description: 'Type of OTP verification.',
                    example: 'registration',
                  },
                },
                required: ['userId', 'otp', 'type'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OTP verified successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    token: {
                      type: 'string',
                      description: 'JWT token issued for registration.',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      nullable: true,
                    },
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
            description: 'Invalid or expired OTP.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Invalid or expired OTP' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Too many attempts.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Too many attempts, please try again later' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/resend-otp': {
      post: {
        summary: 'Resend OTP',
        description: 'Resends an OTP for registration or email update to the user’s email.',
        tags: ['Profile'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User ID.',
                    example: '68997961505b339d66223dcb',
                  },
                  type: {
                    type: 'string',
                    enum: ['registration', 'email-update'],
                    description: 'Type of OTP to resend.',
                    example: 'registration',
                  },
                },
                required: ['userId', 'type'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OTP resent successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'OTP resent successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string', example: '68997961505b339d66223dcb' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error or user not found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'User not found' },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Too many attempts.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Too many OTP resend attempts. Try again later.' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Internal server error' },
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
      name: 'Profile',
      description: 'User profile management endpoints.',
    },
  ],
};

export default profileSwaggerDocument;