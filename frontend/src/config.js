// Frontend Configuration
export const config = {
  // API Base URL
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000',
  
  // Socket.IO URL (same as API base for development)
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
  
  // App Name
  APP_NAME: 'LFG Gaming Community',
  
  // Features
  FEATURES: {
    VOICE_CHAT: true,
    EMAIL_VERIFICATION: true,
    PASSWORD_RESET: true
  }
};
