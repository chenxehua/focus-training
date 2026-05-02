import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock JWT token for testing
const TEST_SECRET = 'test-jwt-secret-for-testing';

// Mock auth middleware for testing
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, TEST_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate test token
export const generateTestToken = (userId: string, role: string = 'parent'): string => {
  return jwt.sign(
    { userId, role, iat: Math.floor(Date.now() / 1000) },
    TEST_SECRET,
    { expiresIn: '7d' }
  );
};

// Validate test token
export const validateTestToken = (token: string): any => {
  try {
    return jwt.verify(token, TEST_SECRET);
  } catch (error) {
    return null;
  }
};