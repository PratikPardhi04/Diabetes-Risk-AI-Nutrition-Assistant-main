# Database Setup Documentation

This directory contains SQL scripts for initializing and setting up the patient database.

## Files

- **`init.sql`**: Database initialization script that creates the database and sets up privileges.
  - This file is automatically executed by Docker when the MySQL container starts for the first time.
  - Creates the `patient_db` database if it doesn't exist.
  - Grants privileges to the admin user.

- **`create_tables.sql`**: Table creation script that defines all required tables.
  - Creates 4 main tables: `users`, `health_assessments`, `meals`, and `chats`.
  - Sets up foreign key relationships.
  - Creates indexes for better query performance.

## Tables Overview

### 1. `users`
Stores patient/user account information.
- Primary Key: `id`
- Unique: `email`
- Related to: health_assessments, meals, chats

### 2. `health_assessments`
Stores patient health assessment questionnaire data and AI risk predictions.
- Primary Key: `id`
- Foreign Key: `user_id` → users(id)
- Stores: age, gender, height, weight, lifestyle factors, symptoms, risk assessment

### 3. `meals`
Stores patient meal logs with AI-analyzed nutrition data.
- Primary Key: `id`
- Foreign Key: `user_id` → users(id)
- Stores: meal details, calories, macronutrients, impact assessment

### 4. `chats`
Stores patient chat interactions with AI health assistant.
- Primary Key: `id`
- Foreign Key: `user_id` → users(id)
- Stores: questions and AI-generated answers

## Manual Execution

If you need to manually execute these scripts:

```bash
# Execute init.sql
docker exec -i patient_mysql_db mysql -uroot -prootpassword < db/init.sql

# Execute create_tables.sql
docker exec -i patient_mysql_db mysql -uadmin -padmin123 patient_db < db/create_tables.sql
```

## Notes

- All tables use `utf8mb4` character set for full Unicode support.
- Foreign keys have `ON DELETE CASCADE` to maintain referential integrity.
- Indexes are created on frequently queried columns for better performance.
- Timestamps are stored using `DATETIME` with `DEFAULT CURRENT_TIMESTAMP`.

