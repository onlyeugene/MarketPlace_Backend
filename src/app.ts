import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes'
import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './docs/authSwagger';
// import profileSwaggerDocument from './docs/profileSwaggerDocument';
import combinedSwagger from './docs/combinedSwagger';

// Initialize environment variables
dotenv.config();

// Create Express app
const app: Express = express();

// Serve a single combined Swagger document
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(combinedSwagger));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', adminRoutes)

export default app;