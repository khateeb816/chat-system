const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

let databaseUrl = process.env.DATABASE_URL;

// If DATABASE_URL is not set (e.g. CLI run without Next.js environment), try loading .env.local
if (!databaseUrl) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
          let urlVal = line.substring('DATABASE_URL='.length).trim();
          if (urlVal.startsWith('"') && urlVal.endsWith('"')) {
            urlVal = urlVal.slice(1, -1);
          } else if (urlVal.startsWith("'") && urlVal.endsWith("'")) {
            urlVal = urlVal.slice(1, -1);
          }
          databaseUrl = urlVal;
          break;
        }
      }
    }
  } catch (err) {
    console.error('Error loading .env.local manually:', err.message);
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

const schemaDDLQueries = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    "createdAt" VARCHAR(100) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS apps (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "ownerId" VARCHAR(50) NOT NULL,
    "apiKey" VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    "createdAt" VARCHAR(100) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(50) PRIMARY KEY,
    "appId" VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    answers JSONB NOT NULL,
    "createdAt" VARCHAR(100) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS app_progress (
    id VARCHAR(50) PRIMARY KEY,
    "appId" VARCHAR(50) UNIQUE NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL,
    "currentAnswerIndex" INTEGER NOT NULL,
    "currentMode" VARCHAR(50) NOT NULL,
    "totalApiCalls" INTEGER NOT NULL,
    "lastAccessedAt" VARCHAR(100),
    "usedQuestions" JSONB,
    "currentServingAgentId" VARCHAR(255),
    "lastServedAt" VARCHAR(100),
    "servingHistory" JSONB
  )`,
  
  `CREATE TABLE IF NOT EXISTS agents (
    "agentId" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(50),
    "createdAt" VARCHAR(100) NOT NULL,
    "lastSeenAt" VARCHAR(100) NOT NULL,
    "totalRequests" INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS api_request_logs (
    id SERIAL PRIMARY KEY,
    "appId" VARCHAR(50) NOT NULL,
    "agentId" VARCHAR(255) NOT NULL,
    "requestType" VARCHAR(50) NOT NULL,
    "returnedType" VARCHAR(50) NOT NULL,
    "returnedQuestionIndex" INTEGER,
    "returnedAnswerIndex" INTEGER,
    timestamp VARCHAR(100) NOT NULL,
    ip VARCHAR(100),
    "userAgent" TEXT
  )`,
  
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    "userId" VARCHAR(50),
    "appId" VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    "createdAt" VARCHAR(100) NOT NULL
  )`
];

async function initializeDatabase() {
  console.log('Initializing Neon Database schema...');
  try {
    // 1. Create tables individually
    for (const query of schemaDDLQueries) {
      await sql.query(query);
    }
    console.log('Database tables verified/created successfully.');

    // 2. Check and seed default admin user
    const users = await sql.query('SELECT * FROM users WHERE email = $1 LIMIT 1', ['test@test.com']);
    if (users.length === 0) {
      console.log('Seeding default admin user: test@test.com');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password', salt);
      
      const adminId = 'seed_admin_user_id';
      const createdAt = new Date().toISOString();
      
      await sql.query(
        'INSERT INTO users (id, email, password, role, "createdAt") VALUES ($1, $2, $3, $4, $5)',
        [adminId, 'test@test.com', hashedPassword, 'Admin', createdAt]
      );
      console.log('Default admin user seeded successfully.');
    } else {
      console.log('Default user already exists.');
    }
    
    console.log('Neon Database initialization complete!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Only execute directly if run from CLI
if (require.main === module) {
  initializeDatabase().then(() => process.exit(0));
}

module.exports = { initializeDatabase };
