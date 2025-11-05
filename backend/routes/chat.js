import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { chatWithAssistant } from '../services/aiService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /chat
router.post('/',
  [
    body('question').trim().notEmpty().withMessage('Question is required')
  ],
  async (req, res) => {
    try {
      // Cleanup: delete chats older than 6 hours for this user
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      await prisma.chat.deleteMany({
        where: { userId: req.user.id, createdAt: { lt: sixHoursAgo } }
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { question } = req.body;

      // Fetch user's health and nutrition data + chat history for context
      const [latestAssessment, recentMeals, todayMealsSummary, chatHistory] = await Promise.all([
        // Get latest health assessment
        prisma.healthAssessment.findFirst({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' }
        }),
        // Get recent meals (last 10 meals)
        prisma.meal.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        // Get today's nutrition summary
        prisma.meal.aggregate({
          where: {
            userId: req.user.id,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
          },
          _sum: {
            calories: true,
            carbs: true,
            protein: true,
            fat: true,
            sugar: true,
            fiber: true
          },
          _count: {
            id: true
          }
        }),
        // Get recent chat history (last 5 conversations for context)
        prisma.chat.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            question: true,
            answer: true,
            createdAt: true
          }
        })
      ]);

      // Prepare context data
      const userContext = {
        healthAssessment: latestAssessment ? {
          age: latestAssessment.age,
          gender: latestAssessment.gender,
          height: latestAssessment.height,
          weight: latestAssessment.weight,
          bmi: (latestAssessment.weight / ((latestAssessment.height / 100) ** 2)).toFixed(1),
          riskLevel: latestAssessment.riskLevel,
          activity: latestAssessment.activity,
          diet: latestAssessment.diet,
          familyHistory: latestAssessment.familyHistory,
          symptoms: JSON.parse(latestAssessment.symptoms || '[]')
        } : null,
        recentMeals: recentMeals.map(meal => ({
          mealType: meal.mealType,
          calories: meal.calories,
          carbs: meal.carbs,
          sugar: meal.sugar,
          impact: meal.impact,
          date: meal.createdAt.toISOString().split('T')[0]
        })),
        todaySummary: {
          calories: todayMealsSummary._sum.calories || 0,
          carbs: todayMealsSummary._sum.carbs || 0,
          protein: todayMealsSummary._sum.protein || 0,
          fat: todayMealsSummary._sum.fat || 0,
          sugar: todayMealsSummary._sum.sugar || 0,
          fiber: todayMealsSummary._sum.fiber || 0,
          mealCount: todayMealsSummary._count.id || 0
        },
        chatHistory: chatHistory.reverse().map(chat => ({
          question: chat.question,
          answer: chat.answer,
          date: chat.createdAt.toISOString().split('T')[0]
        }))
      };

      // Get AI response with user context
      const answer = await chatWithAssistant(question, req.user.id, userContext);

      // Save chat
      const chat = await prisma.chat.create({
        data: {
          userId: req.user.id,
          question,
          answer
        }
      });

      res.json({
        message: 'Chat response received',
        chat
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        message: 'Server error during chat',
        error: error.message 
      });
    }
  }
);

// GET /chat (get chat history)
router.get('/', async (req, res) => {
  try {
    // Cleanup: delete chats older than 6 hours for this user
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    await prisma.chat.deleteMany({
      where: { userId: req.user.id, createdAt: { lt: sixHoursAgo } }
    });

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.chat.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

