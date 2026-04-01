-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Initial database setup for FinPlan
-- This file is executed when the PostgreSQL container first starts

-- Create the renewal dev database (used during the FinPlan v2 rebuild)
CREATE DATABASE finplan_renew_dev;

-- Create default schema (already exists in PostgreSQL by default)
-- Additional initialization can be added here if needed

SELECT 'Database initialized successfully' AS status;
