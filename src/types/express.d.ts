// In your type declaration file (e.g., src/types/express.d.ts)
declare global {
    namespace Express {
      interface Request {
        user?: {
          id: string;  // Standard JWT payload uses 'id' rather than '_id'
          [key: string]: any;  // Allow other properties
        };
      }
    }
  }