const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  dashboardUrl: isDevelopment 
    ? 'http://localhost:3000'
    : process.env.DASHBOARD_URL || 'https://seu-dashboard.vercel.app',
  
  botUrl: isDevelopment
    ? 'http://localhost:3001'
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.BOT_URL || 'https://seu-bot.vercel.app',
      
  apiBaseUrl: isDevelopment
    ? 'http://localhost:3000/api'
    : `${process.env.DASHBOARD_URL || 'https://seu-dashboard.vercel.app'}/api`
}; 