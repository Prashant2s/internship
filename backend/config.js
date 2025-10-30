// Configuration file for the LFG App Backend
// Copy this to .env and update the values

export const config = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/lfg-app',
  
  // JWT Secret (use a strong secret in production)
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  
  // CORS Origin (frontend URL)
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Email Configuration (optional - for email verification)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  
  // Admin emails (comma-separated)
  ADMIN_EMAILS: process.env.ADMIN_EMAILS || '',
  
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Port
  PORT: process.env.PORT || 4000
};
