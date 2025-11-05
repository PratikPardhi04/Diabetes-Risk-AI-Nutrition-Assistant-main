import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { analyzeMealNutrition } from '../services/aiService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /meals/add
router.post('/add',
  [
    body('mealType').isIn(['Breakfast', 'Lunch', 'Dinner', 'Snack']).withMessage('Valid meal type is required'),
    body('mealText').trim().notEmpty().withMessage('Meal description is required'),
    body('imageBase64').optional().isString().withMessage('imageBase64 must be a base64 string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mealType, mealText, imageBase64 } = req.body;

      // Get AI nutrition analysis
      const nutrition = await analyzeMealNutrition(mealText, mealType, imageBase64 || null);

      // Save meal
      const meal = await prisma.meal.create({
        data: {
          userId: req.user.id,
          mealType,
          mealText,
          calories: nutrition.calories,
          carbs: nutrition.carbs,
          protein: nutrition.protein,
          fat: nutrition.fat,
          sugar: nutrition.sugar,
          fiber: nutrition.fiber,
          impact: nutrition.impact,
          notes: nutrition.notes
        }
      });

      res.status(201).json({
        message: 'Meal added successfully',
        meal
      });
    } catch (error) {
      console.error('Add meal error:', error);
      res.status(500).json({ 
        message: 'Server error during meal addition',
        error: error.message 
      });
    }
  }
);

// GET /meals
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, mealType, days } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(mealType && { mealType })
    };

    // If 'days' is provided, restrict results to the last N days
    const daysNum = Number(days);
    if (Number.isFinite(daysNum) && daysNum > 0) {
      const since = new Date();
      since.setDate(since.getDate() - daysNum);
      where.createdAt = { gte: since };
    }

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.meal.count({ where })
    ]);

    res.json({
      meals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /meals/summary
router.get('/summary', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Get start and end of day
    let startDate, endDate;
    if (date) {
      const selectedDate = new Date(date);
      startDate = new Date(selectedDate.setHours(0, 0, 0, 0));
      endDate = new Date(selectedDate.setHours(23, 59, 59, 999));
    } else {
      // Today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const meals = await prisma.meal.findMany({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const summary = meals.reduce((acc, meal) => {
      // Prisma Decimal values may be returned as strings/Decimal objects; coerce to numbers for arithmetic
      acc.calories += Number(meal.calories) || 0;
      acc.carbs += Number(meal.carbs) || 0;
      acc.protein += Number(meal.protein) || 0;
      acc.fat += Number(meal.fat) || 0;
      acc.sugar += Number(meal.sugar) || 0;
      acc.fiber += Number(meal.fiber) || 0;
      return acc;
    }, {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      sugar: 0,
      fiber: 0,
      mealCount: meals.length
    });

    res.json({
      date: date || new Date().toISOString().split('T')[0],
      summary
    });
  } catch (error) {
    console.error('Get meals summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

