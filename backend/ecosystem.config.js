module.exports = {
  apps: [
    {
      name: 'main',
      script: './dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'webhook-server',
      script: './webhook-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        PROJECT_PATH: process.cwd(),
        WEBHOOK_SECRET:
          process.env.WEBHOOK_SECRET || 'your-webhook-secret-here',
      },
    },
  ],
};
