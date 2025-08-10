import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger';

// Initialize environment variables
dotenv.config();

// Create Express app
const app: Express = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);

export default app;