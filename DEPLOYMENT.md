# 🚀 Complete Application Deployment Guide

## 📋 Overview

This guide covers deploying the entire Diabetes Risk & AI Nutrition Assistant application using Docker Compose.

---

## 🐳 Docker Compose Configurations

### Available Configurations

1. **docker-compose.yml** - Full stack deployment (MySQL + Backend + Frontend)
2. **docker-compose.prod.yml** - Production optimized configuration
3. **docker-compose.dev.yml** - Development configuration (MySQL only, backend optional)

---

## 🚀 Quick Start - Full Stack Deployment

### 1. Prerequisites

- Docker and Docker Compose installed
- Environment variables configured

### 2. Create Environment File

Create `.env` file in project root:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=patient_db
MYSQL_USER=admin
MYSQL_PASSWORD=your-secure-password
MYSQL_PORT=3307

# Backend Configuration
NODE_ENV=production
BACKEND_PORT=5000
JWT_SECRET=your-super-secret-jwt-key-generate-with-openssl-rand-hex-32
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:3000

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_API_URL=http://localhost:5000
```

### 3. Build and Start All Services

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Initialize Database

```bash
# Wait for MySQL to be ready
docker-compose exec mysql mysqladmin ping -h localhost --silent

# Initialize tables (if not auto-created)
docker-compose exec mysql mysql -uadmin -padmin123 patient_db < db/create_tables.sql
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

---

## 🏭 Production Deployment

### Using Production Configuration

```bash
# Build for production
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Production Environment Variables

Create `.env.production`:

```env
MYSQL_ROOT_PASSWORD=<strong-secure-password>
MYSQL_PASSWORD=<strong-secure-password>
JWT_SECRET=<generate-strong-secret>
GEMINI_API_KEY=<your-api-key>
FRONTEND_URL=https://yourdomain.com
FRONTEND_API_URL=https://api.yourdomain.com
```

### Production Best Practices

1. **Use Secrets Management**
   ```bash
   # Use Docker secrets or environment files
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

2. **SSL/HTTPS Setup**
   - Add reverse proxy (Nginx/Traefik) for SSL
   - Update frontend Dockerfile to include SSL certificates
   - Configure FRONTEND_URL and FRONTEND_API_URL with HTTPS

3. **Database Backups**
   ```bash
   # Backup database
   docker-compose exec mysql mysqldump -uadmin -p patient_db > backup.sql
   
   # Restore database
   docker-compose exec -T mysql mysql -uadmin -p patient_db < backup.sql
   ```

4. **Resource Limits**
   - Already configured in docker-compose.prod.yml
   - Adjust based on your server capacity

5. **Monitoring**
   ```bash
   # View resource usage
   docker stats
   
   # View service health
   docker-compose ps
   ```

---

## 🛠️ Development Deployment

### Option 1: MySQL Only (Recommended for Development)

```bash
# Start only MySQL
docker-compose -f docker-compose.dev.yml up -d mysql

# Run backend locally
cd backend
npm install
npm run dev

# Run frontend locally
cd frontend
npm install
npm run dev
```

### Option 2: Full Docker Development

```bash
# Start all services (with hot reload)
docker-compose -f docker-compose.dev.yml up
```

**Note**: Backend has volume mount for hot reload, but frontend still best run locally for HMR.

---

## 📦 Service Details

### MySQL Service

- **Image**: mysql:8.0
- **Port**: 3307 (dev) / Internal only (prod)
- **Volume**: Persistent data storage
- **Health Check**: Automatic MySQL readiness
- **Auto-init**: SQL scripts run on first start

### Backend Service

- **Base Image**: node:18-alpine
- **Port**: 5000
- **Depends On**: MySQL (waits for health check)
- **Environment**: All config via environment variables
- **Health Check**: HTTP endpoint `/health`
- **Volume**: Code mounted for development hot reload

### Frontend Service

- **Build Stage**: node:18-alpine (builds React app)
- **Production Stage**: nginx:alpine (serves static files)
- **Port**: 3000 (dev) / 80 (prod)
- **Depends On**: Backend
- **Health Check**: Nginx server check
- **Multi-stage Build**: Optimized production image

---

## 🔧 Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend npm run prisma:generate
docker-compose exec mysql mysql -uadmin -padmin123 patient_db
```

### Database Operations

```bash
# Access MySQL CLI
docker-compose exec mysql mysql -uadmin -padmin123 patient_db

# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma Client
docker-compose exec backend npm run prisma:generate

# Open Prisma Studio
docker-compose exec backend npm run prisma:studio
# Then access at http://localhost:5555 (port forward needed)
```

### Build Operations

```bash
# Rebuild specific service
docker-compose build backend

# Rebuild without cache
docker-compose build --no-cache

# View build logs
docker-compose build --progress=plain
```

---

## 🔍 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps

# Verify environment variables
docker-compose config
```

### Database Connection Issues

```bash
# Check MySQL is healthy
docker-compose exec mysql mysqladmin ping -h localhost

# Verify connection string
docker-compose exec backend env | grep DATABASE_URL

# Test connection
docker-compose exec backend node -e "console.log(process.env.DATABASE_URL)"
```

### Frontend Can't Connect to Backend

```bash
# Verify backend is running
curl http://localhost:5000/health

# Check network
docker network inspect aiprediction_diabetes_ai_network

# Verify FRONTEND_API_URL
docker-compose exec frontend env | grep VITE
```

### Port Conflicts

```bash
# Check what's using ports
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/macOS

# Change ports in docker-compose.yml
# Update BACKEND_PORT and FRONTEND_PORT
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Or specific service
docker-compose up -d --build backend
```

---

## 📊 Monitoring & Maintenance

### View Resource Usage

```bash
docker stats
```

### Database Backup

```bash
# Create backup script
#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T mysql mysqldump -uadmin -padmin123 patient_db > $BACKUP_FILE
echo "Backup created: $BACKUP_FILE"
```

### Log Management

```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f backend

# Limit log lines
docker-compose logs --tail=100 backend

# Export logs
docker-compose logs > application.log
```

---

## 🔐 Security Considerations

### Production Security

1. **Change Default Passwords**
   - Update MYSQL_ROOT_PASSWORD
   - Update MYSQL_PASSWORD
   - Generate strong JWT_SECRET

2. **Network Security**
   - MySQL not exposed to public in production
   - Use Docker networks for internal communication
   - Implement firewall rules

3. **Secrets Management**
   - Don't commit .env files
   - Use Docker secrets or environment management
   - Rotate API keys regularly

4. **SSL/TLS**
   - Add reverse proxy with SSL certificates
   - Update FRONTEND_URL and FRONTEND_API_URL to HTTPS

---

## 🚢 Deployment Checklist

### Before Deployment

- [ ] All environment variables configured
- [ ] Strong passwords generated
- [ ] JWT_SECRET generated (openssl rand -hex 32)
- [ ] Database credentials secure
- [ ] API keys configured
- [ ] SSL certificates ready (production)

### During Deployment

- [ ] Build all images successfully
- [ ] All services start without errors
- [ ] Database initialized correctly
- [ ] Health checks passing
- [ ] Frontend can connect to backend
- [ ] API endpoints responding

### After Deployment

- [ ] Test user registration
- [ ] Test login functionality
- [ ] Test health assessment
- [ ] Test meal logging
- [ ] Test AI chat
- [ ] Verify charts loading
- [ ] Monitor logs for errors
- [ ] Set up backup schedule

---

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **MySQL Docker Image**: https://hub.docker.com/_/mysql
- **Node.js Docker Image**: https://hub.docker.com/_/node
- **Nginx Docker Image**: https://hub.docker.com/_/nginx

---

## 🆘 Support

For deployment issues:
1. Check service logs: `docker-compose logs`
2. Verify environment variables
3. Check network connectivity
4. Review health check status
5. Consult troubleshooting section above

---

*Last Updated: November 2024*

