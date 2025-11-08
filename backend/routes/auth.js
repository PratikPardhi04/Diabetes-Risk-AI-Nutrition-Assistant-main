import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// POST /auth/signup
router.post('/signup', 
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;
      console.log('Signup attempt:', email);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('Signup success:', user.email, user.id);
      res.status(201).json({
        message: 'User created successfully',
        user,
        token
      });
    } catch (error) {
      console.error('Signup error:', error?.message || error);
      res.status(500).json({ message: 'Server error during signup' });
    }
  }
);

// POST /auth/login
router.post('/login',
  [
    body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      console.log('Login attempt:', email);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        console.log('Login failed: user not found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log('Login failed: bad password');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('Login success:', user.email, user.id);
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error?.message || error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// Simple ping endpoints to diagnose mobile proxy/POST issues
router.get('/ping', (req, res) => {
  res.json({ ok: true, method: 'GET', path: '/auth/ping' });
});
router.post('/ping', (req, res) => {
  res.json({ ok: true, method: 'POST', path: '/auth/ping', body: req.body || null });
});

// GET /auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

