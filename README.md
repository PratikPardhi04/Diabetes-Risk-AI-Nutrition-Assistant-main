# Diabetes Risk & AI Nutrition Assistant

A full-stack web application for diabetes risk assessment and AI-powered nutrition guidance using Gemini Flash 2.0.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT
- **AI**: Google Gemini Flash 2.0 API
- **Charts**: Recharts

## Features

- ✅ User Authentication (Signup/Login/JWT)
- ✅ Diabetes Risk Assessment Questionnaire
- ✅ AI-Powered Diabetes Risk Prediction
- ✅ Meal Logging with AI Nutrition Analysis
- ✅ Meal History & Nutrition Charts
- ✅ AI Health Chat Assistant
- ✅ Dashboard with Risk Summary
- ✅ Protected Routes

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── assessment.js
│   │   ├── meals.js
│   │   └── chat.js
│   ├── services/
│   │   └── aiService.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn
- Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd aiprediction
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example and update values)
# Set your DATABASE_URL and GEMINI_API_KEY

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start the server (development)
npm run dev

# Or start in production
npm start
```

**Backend Environment Variables (.env):**

```env
PORT=5000
DATABASE_URL="mysql://user:password@localhost:3306/diabetes_ai"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Frontend Environment Variables (.env.local):**

```env
VITE_API_URL=http://localhost:5000
```

### 4. Database Setup

1. Create a MySQL database:
   ```sql
   CREATE DATABASE diabetes_ai;
   ```

2. Update `DATABASE_URL` in `backend/.env` with your MySQL credentials

3. Run Prisma migrations:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user (protected)

### Assessment
- `POST /assessment/submit` - Submit health questionnaire (protected)
- `POST /assessment/predict` - Get AI risk prediction (protected)
- `GET /assessment/latest` - Get latest assessment (protected)

### Meals
- `POST /meals/add` - Add and analyze meal (protected)
- `GET /meals` - Get meal history (protected)
- `GET /meals/summary` - Get daily nutrition summary (protected)

### Chat
- `POST /chat` - Send message to AI assistant (protected)
- `GET /chat` - Get chat history (protected)

## Database Schema

### Users
- `id`, `name`, `email`, `passwordHash`, `createdAt`

### HealthAssessments
- `id`, `userId`, `age`, `gender`, `height`, `weight`, `familyHistory`, 
  `activity`, `smoking`, `alcohol`, `diet`, `sleep`, `symptoms`, 
  `riskLevel`, `aiReason`, `createdAt`

### Meals
- `id`, `userId`, `mealType`, `mealText`, `calories`, `carbs`, `protein`, 
  `fat`, `sugar`, `fiber`, `impact`, `notes`, `createdAt`

### Chats
- `id`, `userId`, `question`, `answer`, `createdAt`

## Usage

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**
   - Navigate to `http://localhost:5173`
   - Sign up for a new account or login
   - Complete the health assessment questionnaire
   - View your risk assessment on the dashboard
   - Log meals and get AI nutrition analysis
   - Chat with the AI assistant for lifestyle guidance

## Features Details

### Diabetes Risk Assessment
- Comprehensive health questionnaire covering:
  - Demographics (age, gender, height, weight)
  - Family history
  - Lifestyle factors (activity, smoking, alcohol)
  - Diet type
  - Sleep patterns
  - Symptoms checklist
- AI-powered risk prediction (Low/Moderate/High)
- Personalized explanation and lifestyle tips

### Meal Analysis
- Natural language meal description input
- AI-powered nutrition estimation:
  - Calories, carbs, protein, fat, sugar, fiber
  - Impact assessment (Low/Moderate/High)
  - Personalized recommendations
- Meal history tracking
- Daily nutrition summary
- Visual charts for calories and sugar trends

### AI Chat Assistant
- General lifestyle and nutrition guidance
- Supportive and encouraging responses
- No medical diagnosis (educational purposes only)

## Important Notes

⚠️ **Disclaimer**: This application is for educational purposes only. It does NOT provide medical diagnosis or treatment. Always consult healthcare professionals for medical concerns.

⚠️ **Security**: 
- Change JWT_SECRET in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement rate limiting for API endpoints

⚠️ **Gemini API**:
- Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Monitor API usage to stay within free tier limits

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check DATABASE_URL format: `mysql://user:password@host:port/database`
- Ensure database exists before running migrations

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations
- Use `npm run prisma:studio` to view database

### API Errors
- Check backend server is running on port 5000
- Verify GEMINI_API_KEY is set correctly
- Check CORS settings if frontend can't connect

### Frontend Issues
- Clear browser cache and localStorage
- Check browser console for errors
- Verify VITE_API_URL matches backend URL

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Database Migrations
```bash
cd backend
npm run prisma:migrate  # Create new migration
npm run prisma:studio   # Open Prisma Studio
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure database connection
4. Enable HTTPS
5. Use PM2 or similar process manager

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to hosting service
3. Set `VITE_API_URL` to production backend URL

## License
PES MCOE
## Support

For issues and questions, please open an issue in the repository.

# smart-diabetes-prediction
# smart-diabetes-prediction
# Diabetes-Risk-AI-Nutrition-Assistant
