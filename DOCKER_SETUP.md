# Docker MySQL Setup Guide

Complete guide for setting up and running MySQL database using Docker for the Diabetes Risk & AI Nutrition Assistant project.

## 📁 Project Structure

```
aiprediction/
├── docker-compose.yml          # Docker Compose configuration
├── db/
│   ├── init.sql                # Database initialization script
│   ├── create_tables.sql       # Table creation script
│   └── README.md              # Database documentation
├── scripts/
│   ├── setup_db.sh             # Setup script (Linux/macOS/Git Bash)
│   └── setup_db.ps1            # Setup script (Windows PowerShell)
└── DOCKER_SETUP.md            # This file
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**On Linux/macOS or Git Bash (Windows):**
```bash
chmod +x scripts/setup_db.sh
./scripts/setup_db.sh
```

**On Windows PowerShell:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup_db.ps1
```

### Option 2: Manual Setup

**Step 1: Start MySQL Container**
```bash
docker-compose up -d mysql
```

**Step 2: Wait for MySQL to be ready** (about 10-20 seconds)
```bash
docker logs patient_mysql_db
# Wait until you see "ready for connections"
```

**Step 3: Execute SQL scripts**
```bash
# Execute table creation
docker exec -i patient_mysql_db mysql -uadmin -padmin123 patient_db < db/create_tables.sql
```

**Step 4: Verify setup**
```bash
docker exec -it patient_mysql_db mysql -uadmin -padmin123 patient_db -e "SHOW TABLES;"
```

## 📋 Database Configuration

- **Database Name**: `patient_db`
- **Username**: `admin`
- **Password**: `admin123`
- **Root Password**: `rootpassword`
- **Port**: `3307` (mapped to host, uses 3306 internally)
- **MySQL Version**: `8.0`

## 🔧 Docker Commands

### Start MySQL Container
```bash
docker-compose up -d mysql
```

### Stop MySQL Container
```bash
docker-compose stop mysql
```

### Start MySQL Container (if already created)
```bash
docker-compose start mysql
```

### Stop and Remove Container
```bash
docker-compose down
```

### Stop and Remove Container + Data (⚠️ CAUTION: Deletes all data)
```bash
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f mysql
```

### Access MySQL Command Line
```bash
docker exec -it patient_mysql_db mysql -uadmin -padmin123 patient_db
```

### View All Tables
```bash
docker exec patient_mysql_db mysql -uadmin -padmin123 patient_db -e "SHOW TABLES;"
```

### View Table Structure
```bash
docker exec patient_mysql_db mysql -uadmin -padmin123 patient_db -e "DESCRIBE users;"
```

## 🔌 Backend Configuration

Update your `backend/.env` file with:

```env
DATABASE_URL="mysql://admin:admin123@localhost:3307/patient_db"
```

Or for production/remote:

```env
DATABASE_URL="mysql://admin:admin123@patient_mysql_db:3306/patient_db"
```

**Note**: If connecting from a Docker container (not host), use `patient_mysql_db` as the hostname instead of `localhost`.

## 📊 Database Schema

The database includes 4 main tables:

1. **users** - Patient/user accounts
2. **health_assessments** - Health questionnaires and risk assessments
3. **meals** - Meal logs with nutrition data
4. **chats** - AI chat interactions

See `db/README.md` for detailed schema documentation.

## 🔄 Using with Prisma

If you're using Prisma ORM:

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations (if needed)
npm run prisma:migrate
```

**Note**: The tables are already created by `create_tables.sql`, so Prisma migrations will detect existing tables and won't recreate them.

## 🗄️ Data Persistence

Data is persisted in a Docker volume named `mysql_data`. To backup:

```bash
# Backup database
docker exec patient_mysql_db mysqldump -uadmin -padmin123 patient_db > backup.sql

# Restore database
docker exec -i patient_mysql_db mysql -uadmin -padmin123 patient_db < backup.sql
```

## 🔒 Security Notes

**⚠️ Important for Production:**

1. **Change Default Passwords**
   - Update `MYSQL_ROOT_PASSWORD` in `docker-compose.yml`
   - Update `MYSQL_PASSWORD` in `docker-compose.yml`
   - Update `DATABASE_URL` in `backend/.env`

2. **Use Environment Variables**
   ```yaml
   environment:
     MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
     MYSQL_PASSWORD: ${MYSQL_PASSWORD}
   ```

3. **Network Security**
   - Don't expose MySQL port (`3306`) to public internet
   - Use Docker networks for internal communication
   - Consider using Docker secrets for passwords

## 🐛 Troubleshooting

### MySQL Container Won't Start
```bash
# Check logs
docker-compose logs mysql

# Check if port 3306 is already in use
netstat -an | grep 3306  # Linux/macOS
netstat -an | findstr 3306  # Windows
```

### Can't Connect to Database
- Verify container is running: `docker ps`
- Check connection string in `backend/.env`
- Ensure you're using the correct port (3306)

### Tables Not Created
```bash
# Manually execute create_tables.sql
docker exec -i patient_mysql_db mysql -uadmin -padmin123 patient_db < db/create_tables.sql
```

### Reset Everything
```bash
# Stop and remove container + data
docker-compose down -v

# Restart setup
./scripts/setup_db.sh  # or setup_db.ps1 on Windows
```

## 📝 Verification Checklist

After setup, verify:

- [ ] MySQL container is running: `docker ps`
- [ ] Can connect to database: `docker exec -it patient_mysql_db mysql -uadmin -padmin123 patient_db`
- [ ] Tables exist: `SHOW TABLES;` shows 4 tables
- [ ] Backend `.env` has correct `DATABASE_URL`
- [ ] Backend can connect (start server and check logs)

## 🎯 Next Steps

1. **Backend Setup**: Update `backend/.env` with DATABASE_URL
2. **Install Dependencies**: `cd backend && npm install`
3. **Generate Prisma Client**: `npm run prisma:generate`
4. **Start Backend**: `npm run dev`
5. **Start Frontend**: `cd ../frontend && npm install && npm run dev`

## 📚 Additional Resources

- [MySQL Docker Official Image](https://hub.docker.com/_/mysql)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Created for**: Diabetes Risk & AI Nutrition Assistant Project  
**Database**: MySQL 8.0  
**Container**: `patient_mysql_db`

