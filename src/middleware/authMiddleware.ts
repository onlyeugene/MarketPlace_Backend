import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  id: string;
  // Add other expected properties here if needed
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET as string, (err, payload) => {
    if (err) return res.status(403).json({ status: 'error', message: 'Invalid token' });
    
    // Type assertion to JwtPayload with _id property
    const user = payload as JwtPayload & { _id: string };
    req.user = user;
    next();
  });
};