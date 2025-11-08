import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth 401: No token provided. Origin:', req.headers.origin || 'n/a');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('Auth 401: User not found for token userId', decoded?.userId, 'Origin:', req.headers.origin || 'n/a');
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('Auth 401: Invalid token. Origin:', req.headers.origin || 'n/a');
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      console.log('Auth 401: Token expired. Origin:', req.headers.origin || 'n/a');
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

