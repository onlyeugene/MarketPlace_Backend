"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adminSwaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Admin Management API',
        version: '1.0.0',
        description: 'API for admin operations, including registration, authentication, and user management for the MarketPlaceAdmins and MarketPlaceUsers collections.',
    },
    servers: [
        {
            url: 'http://localhost:9550',
            description: 'Local development server',
        },
    ],
    paths: {
        '/api/v1/auth/admin/register': {
            post: {
                summary: 'Register a new admin',
                description: 'Creates a new admin account in the MarketPlaceAdmins collection. Accessible only to authenticated admins.',
                tags: ['Admin'],
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
                                        description: 'Unique username, 3-30 characters, lowercase, alphanumeric, underscores.',
                                        example: 'admin123',
                                    },
                                    firstname: {
                                        type: 'string',
                                        description: 'First name, max 50 characters, letters, spaces, or hyphens.',
                                        example: 'Admin',
                                    },
                                    lastname: {
                                        type: 'string',
                                        description: 'Last name, max 50 characters, letters, spaces, or hyphens.',
                                        example: 'User',
                                    },
                                    email: {
                                        type: 'string',
                                        format: 'email',
                                        description: 'Unique email address.',
                                        example: 'admin@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        description: 'Password, minimum 8 characters.',
                                        example: 'securepassword123',
                                    },
                                    role: {
                                        type: 'string',
                                        enum: ['admin', 'moderator'],
                                        description: 'Admin role, defaults to "admin".',
                                        example: 'admin',
                                    },
                                },
                                required: ['username', 'firstname', 'lastname', 'email', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Admin registered successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'success' },
                                        token: {
                                            type: 'string',
                                            description: 'JWT token for admin authentication.',
                                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                username: { type: 'string', example: 'admin123' },
                                                email: { type: 'string', example: 'admin@example.com' },
                                                fullName: { type: 'string', example: 'Admin User' },
                                                role: { type: 'string', example: 'admin' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Validation error or username/email already in use.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            example: ['Username is required', 'Email already in use'],
                                        },
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
                        description: 'Forbidden: Invalid or expired token.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Forbidden' },
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
                                        message: { type: 'string', example: 'Too many attempts, please try again later' },
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
        '/api/v1/auth/admin/login': {
            post: {
                summary: 'Admin login',
                description: 'Authenticates an admin using username or email and password, issuing a JWT token. Only admins in the MarketPlaceAdmins collection can log in.',
                tags: ['Admin'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    identifier: {
                                        type: 'string',
                                        description: 'Admin username or email.',
                                        example: 'admin@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        description: 'Admin password, minimum 8 characters.',
                                        example: 'securepassword123',
                                    },
                                },
                                required: ['identifier', 'password'],
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Admin authenticated successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'success' },
                                        token: {
                                            type: 'string',
                                            description: 'JWT token for admin authentication.',
                                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                username: { type: 'string', example: 'admin123' },
                                                email: { type: 'string', example: 'admin@example.com' },
                                                fullName: { type: 'string', example: 'Admin User' },
                                                lastLogin: { type: 'string', format: 'date-time', example: '2025-08-12T23:05:00Z' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Validation error or missing credentials.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: {
                                            type: 'array',
                                            items: { type: 'string' },
                                            example: ['Email or username is required', 'Password is required'],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Invalid credentials.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Invalid credentials' },
                                    },
                                },
                            },
                        },
                    },
                    '429': {
                        description: 'Too many login attempts.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Too many login attempts. Please try again later.' },
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
        '/api/v1/auth/admin/users': {
            get: {
                summary: 'Get all users',
                description: 'Retrieves a paginated list of all users in the MarketPlaceUsers collection. Accessible only to authenticated admins.',
                tags: ['Admin'],
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        description: 'Page number for pagination (default: 1).',
                        required: false,
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            example: 1,
                        },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Number of users per page (default: 10).',
                        required: false,
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            example: 10,
                        },
                    },
                ],
                responses: {
                    '200': {
                        description: 'List of users retrieved successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'success' },
                                        totalCount: { type: 'number', example: 100 },
                                        page: { type: 'number', example: 1 },
                                        limit: { type: 'number', example: 10 },
                                        totalPages: { type: 'number', example: 10 },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                users: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            _id: { type: 'string', example: '68997961505b339d66223dcb' },
                                                            username: { type: 'string', example: 'johndoe123' },
                                                            email: { type: 'string', example: 'john.doe@example.com' },
                                                            fullName: { type: 'string', example: 'John Doe' },
                                                            dob: { type: 'string', format: 'date', example: '1990-01-01' },
                                                            role: { type: 'string', example: 'user' },
                                                            isActive: { type: 'boolean', example: true },
                                                            lastLogin: { type: 'string', format: 'date-time', example: '2025-08-12T23:05:00Z' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid pagination parameters.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Page and limit must be positive integers' },
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
                        description: 'Forbidden: Invalid or expired token.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Forbidden' },
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
                                        message: { type: 'string', example: 'Too many attempts, please try again later' },
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
        '/api/v1/auth/admin/users/{id}': {
            get: {
                summary: 'Get user by ID',
                description: 'Retrieves a single user by their ID from the MarketPlaceUsers collection. Accessible only to authenticated admins.',
                tags: ['Admin'],
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
                    {
                        name: 'page',
                        in: 'query',
                        description: 'Page number for pagination (default: 1).',
                        required: false,
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            example: 1,
                        },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Number of users per page (default: 1).',
                        required: false,
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            example: 1,
                        },
                    },
                ],
                responses: {
                    '200': {
                        description: 'User retrieved successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'success' },
                                        totalCount: { type: 'number', example: 1 },
                                        page: { type: 'number', example: 1 },
                                        limit: { type: 'number', example: 1 },
                                        totalPages: { type: 'number', example: 1 },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                user: {
                                                    type: 'object',
                                                    properties: {
                                                        _id: { type: 'string', example: '68997961505b339d66223dcb' },
                                                        username: { type: 'string', example: 'johndoe123' },
                                                        email: { type: 'string', example: 'john.doe@example.com' },
                                                        fullName: { type: 'string', example: 'John Doe' },
                                                        dob: { type: 'string', format: 'date', example: '1990-01-01' },
                                                        role: { type: 'string', example: 'user' },
                                                        isActive: { type: 'boolean', example: true },
                                                        lastLogin: { type: 'string', format: 'date-time', example: '2025-08-12T23:05:00Z' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid pagination parameters.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Page and limit must be positive integers' },
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
                        description: 'Forbidden: Invalid or expired token.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Forbidden' },
                                    },
                                },
                            },
                        },
                    },
                    '404': {
                        description: 'User not found.',
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
                        description: 'Too many requests.',
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
            delete: {
                summary: 'Delete user by ID',
                description: 'Deletes a user by their ID from the MarketPlaceUsers collection. Accessible only to authenticated admins.',
                tags: ['Admin'],
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
                responses: {
                    '204': {
                        description: 'User deleted successfully.',
                        content: {},
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
                        description: 'Forbidden: Invalid or expired token.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        message: { type: 'string', example: 'Forbidden' },
                                    },
                                },
                            },
                        },
                    },
                    '404': {
                        description: 'User not found.',
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
                        description: 'Too many requests.',
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
};
exports.default = adminSwaggerDocument;
