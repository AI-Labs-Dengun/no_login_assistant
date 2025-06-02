const isDevelopment = process.env.NODE_ENV === 'development';

// Configurações compartilhadas
export const sharedConfig = {
  dashboardUrl: isDevelopment 
    ? 'http://localhost:3000'
    : process.env.DASHBOARD_URL || 'https://ai-admin-dashboard.vercel.app/',
  
  botUrl: isDevelopment
    ? 'http://localhost:3001'
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.BOT_WEBSITE || 'https://no-login-assistant-git-admindashboard-ai-denguns-projects.vercel.app/',
      
  apiBaseUrl: isDevelopment
    ? 'http://localhost:3000/api'
    : `${process.env.DASHBOARD_URL || 'https://ai-admin-dashboard.vercel.app/'}/api`
}; 