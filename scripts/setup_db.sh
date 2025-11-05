#!/bin/bash

# ================================================
# Database Setup Script
# ================================================
# This script:
# 1. Starts the MySQL Docker container
# 2. Waits for MySQL to be ready
# 3. Connects to the container and executes SQL files
# 4. Verifies the setup
# ================================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="patient_db"
DB_USER="admin"
DB_PASSWORD="admin123"
DB_CONTAINER="patient_mysql_db"
DB_PORT="3307"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Patient Database Setup Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed or not in PATH${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"

# Check if Docker Compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}✗ Docker Compose is not available${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose found${NC}\n"

# Step 1: Start MySQL container
echo -e "${YELLOW}[Step 1/5] Starting MySQL container...${NC}"
$DOCKER_COMPOSE up -d mysql

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start MySQL container${NC}"
    exit 1
fi

echo -e "${GREEN}✓ MySQL container started${NC}\n"

# Step 2: Wait for MySQL to be ready
echo -e "${YELLOW}[Step 2/5] Waiting for MySQL to be ready...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0
READY=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec $DB_CONTAINER mysqladmin ping -h localhost --silent 2>/dev/null; then
        READY=1
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -e "${YELLOW}  Waiting... ($ATTEMPT/$MAX_ATTEMPTS)${NC}"
    sleep 2
done

if [ $READY -eq 0 ]; then
    echo -e "${RED}✗ MySQL failed to start within timeout period${NC}"
    echo "Check logs with: docker-compose logs mysql"
    exit 1
fi

echo -e "${GREEN}✓ MySQL is ready${NC}\n"

# Step 3: Execute init.sql (already executed automatically, but we verify)
echo -e "${YELLOW}[Step 3/5] Verifying database initialization...${NC}"
sleep 2

# Verify database exists
DB_EXISTS=$(docker exec $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME")

if [ "$DB_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}  Database not found, creating...${NC}"
    docker exec -i $DB_CONTAINER mysql -uroot -prootpassword < db/init.sql
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to initialize database${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Database '$DB_NAME' is ready${NC}\n"

# Step 4: Execute create_tables.sql
echo -e "${YELLOW}[Step 4/5] Creating tables...${NC}"

if [ -f "db/create_tables.sql" ]; then
    docker exec -i $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME < db/create_tables.sql
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to create tables${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Tables created successfully${NC}"
else
    echo -e "${RED}✗ File db/create_tables.sql not found${NC}"
    exit 1
fi

echo ""

# Step 5: Verify setup
echo -e "${YELLOW}[Step 5/5] Verifying setup...${NC}"

# Count tables
TABLE_COUNT=$(docker exec $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;" 2>/dev/null | wc -l)
TABLE_COUNT=$((TABLE_COUNT - 1)) # Subtract header row

if [ "$TABLE_COUNT" -ge 4 ]; then
    echo -e "${GREEN}✓ Found $TABLE_COUNT tables${NC}"
    
    # List tables
    echo -e "\n${BLUE}Tables in database:${NC}"
    docker exec $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;" 2>/dev/null | tail -n +2
    
    echo ""
else
    echo -e "${RED}✗ Expected at least 4 tables, found $TABLE_COUNT${NC}"
    exit 1
fi

# Final success message
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Connection Details:${NC}"
echo -e "  Host: localhost"
echo -e "  Port: $DB_PORT"
echo -e "  Database: $DB_NAME"
echo -e "  Username: $DB_USER"
echo -e "  Password: $DB_PASSWORD\n"

echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs: ${YELLOW}docker-compose logs -f mysql${NC}"
echo -e "  Stop container: ${YELLOW}docker-compose stop mysql${NC}"
echo -e "  Start container: ${YELLOW}docker-compose start mysql${NC}"
echo -e "  Remove container: ${YELLOW}docker-compose down${NC}"
echo -e "  Access MySQL CLI: ${YELLOW}docker exec -it $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME${NC}\n"

echo -e "${BLUE}Backend .env Configuration:${NC}"
echo -e "  ${YELLOW}DATABASE_URL=\"mysql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME\"${NC}\n"

