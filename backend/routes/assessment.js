import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { predictDiabetesRisk } from '../services/aiService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /assessment/submit
router.post('/submit',
  [
    body('age').isInt({ min: 1, max: 150 }).withMessage('Valid age is required'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('height').isFloat({ min: 1 }).withMessage('Valid height is required'),
    body('weight').isFloat({ min: 1 }).withMessage('Valid weight is required'),
    body('familyHistory').isBoolean().withMessage('Family history is required'),
    body('activity').notEmpty().withMessage('Activity level is required'),
    body('smoking').isBoolean().withMessage('Smoking status is required'),
    body('alcohol').notEmpty().withMessage('Alcohol consumption is required'),
    body('diet').notEmpty().withMessage('Diet type is required'),
    body('sleep').isInt({ min: 1, max: 24 }).withMessage('Valid sleep hours is required'),
    body('symptoms').isArray().withMessage('Symptoms must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        age, gender, height, weight, familyHistory,
        activity, smoking, alcohol, diet, sleep, symptoms
      } = req.body;

      // Save assessment
      const assessment = await prisma.healthAssessment.create({
        data: {
          userId: req.user.id,
          age,
          gender,
          height,
          weight,
          familyHistory,
          activity,
          smoking,
          alcohol,
          diet,
          sleep,
          symptoms: JSON.stringify(symptoms),
          riskLevel: 'Pending' // Will be updated after AI prediction
        }
      });

      res.status(201).json({
        message: 'Assessment submitted successfully',
        assessment
      });
    } catch (error) {
      console.error('Assessment submit error:', error);
      res.status(500).json({ message: 'Server error during assessment submission' });
    }
  }
);

// POST /assessment/predict
router.post('/predict',
  [
    body('assessmentId').isInt().withMessage('Assessment ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { assessmentId } = req.body;

      // Get assessment
      const assessment = await prisma.healthAssessment.findFirst({
        where: {
          id: assessmentId,
          userId: req.user.id
        }
      });

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      // Prepare health data for AI
      const healthData = {
        age: assessment.age,
        gender: assessment.gender,
        height: assessment.height,
        weight: assessment.weight,
        familyHistory: assessment.familyHistory,
        activity: assessment.activity,
        smoking: assessment.smoking,
        alcohol: assessment.alcohol,
        diet: assessment.diet,
        sleep: assessment.sleep,
        symptoms: JSON.parse(assessment.symptoms || '[]')
      };

      // Get AI prediction
      const aiResult = await predictDiabetesRisk(healthData);

      // Update assessment with AI results
      const updatedAssessment = await prisma.healthAssessment.update({
        where: { id: assessmentId },
        data: {
          riskLevel: aiResult.risk,
          aiReason: `${aiResult.explanation}\n\nLifestyle Tips: ${aiResult.tips}`
        }
      });

      res.json({
        message: 'Prediction completed',
        assessment: updatedAssessment,
        risk: aiResult.risk,
        explanation: aiResult.explanation,
        tips: aiResult.tips
      });
    } catch (error) {
      console.error('Assessment predict error:', error);
      res.status(500).json({ 
        message: 'Server error during prediction',
        error: error.message 
      });
    }
  }
);

// GET /assessment/latest
router.get('/latest', async (req, res) => {
  try {
    const assessment = await prisma.healthAssessment.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessment) {
      return res.status(404).json({ message: 'No assessment found' });
    }

    res.json({
      assessment: {
        ...assessment,
        symptoms: JSON.parse(assessment.symptoms || '[]')
      }
    });
  } catch (error) {
    console.error('Get latest assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

