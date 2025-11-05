#!/bin/bash

# ================================================
# Environment Files Setup Script
# ================================================
# This script creates .env files for backend and frontend
# ================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating environment files...${NC}\n"

# Backend .env
BACKEND_ENV="backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}⚠ $BACKEND_ENV already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping backend .env${NC}"
    else
        CREATE_BACKEND=1
    fi
else
    CREATE_BACKEND=1
fi

if [ "$CREATE_BACKEND" == "1" ]; then
    cat > "$BACKEND_ENV" << 'EOF'
# ================================================
# Backend Environment Configuration
# Diabetes Risk & AI Nutrition Assistant
# ================================================

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration (Docker MySQL)
# Format: mysql://username:password@host:port/database_name
DATABASE_URL="mysql://admin:admin123@localhost:3307/patient_db"

# JWT Authentication
# ⚠️ IMPORTANT: Change this to a strong random secret in production!
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# Gemini AI API Configuration
# API Key for Google Gemini Flash 2.0
GEMINI_API_KEY=AIzaSyDDI0BNK32jxtRCQIV_dUur0hM0iJTVYbY
EOF
    echo -e "${GREEN}✓ Created $BACKEND_ENV${NC}"
fi

# Frontend .env.local
FRONTEND_ENV="frontend/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}⚠ $FRONTEND_ENV already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping frontend .env.local${NC}"
    else
        CREATE_FRONTEND=1
    fi
else
    CREATE_FRONTEND=1
fi

if [ "$CREATE_FRONTEND" == "1" ]; then
    cat > "$FRONTEND_ENV" << 'EOF'
# ================================================
# Frontend Environment Configuration
# ================================================

# Backend API URL
# For local development, use localhost
# For production, use your deployed backend URL
VITE_API_URL=http://localhost:5000
EOF
    echo -e "${GREEN}✓ Created $FRONTEND_ENV${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Environment files created successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Backend .env:${NC} $BACKEND_ENV"
echo -e "${BLUE}Frontend .env.local:${NC} $FRONTEND_ENV\n"

echo -e "${YELLOW}⚠️  Security Note:${NC}"
echo -e "  - Review and update JWT_SECRET in backend/.env"
echo -e "  - Never commit .env files to version control"
echo -e "  - Use different values for production\n"

