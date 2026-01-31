#!/bin/bash

echo "🚀 Setting up automatic deployment for your backend..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root or with sudo"
    exit 1
fi

# Install required packages
echo "📦 Installing required packages..."
apt-get update
apt-get install -y curl git

# Create webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "🔑 Generated webhook secret: $WEBHOOK_SECRET"

# Create environment file for webhook
cat > .env.webhook << EOF
WEBHOOK_SECRET=$WEBHOOK_SECRET
PROJECT_PATH=$(pwd)
EOF

# Make scripts executable
chmod +x build.sh
chmod +x setup-auto-deploy.sh

# Start webhook server with PM2
echo "🚀 Starting webhook server with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "✅ Setup complete! Here's what you need to do next:"
echo ""
echo "1. 🔑 Copy this webhook secret: $WEBHOOK_SECRET"
echo ""
echo "2. 🌐 Go to your GitHub repository → Settings → Webhooks"
echo "   - Add webhook: http://YOUR_EC2_IP:3001/webhook"
echo "   - Content type: application/json"
echo "   - Secret: $WEBHOOK_SECRET"
echo "   - Events: Just the push event"
echo ""
echo "3. 🔒 Make sure port 3001 is open in your EC2 security group"
echo ""
echo "4. 🧪 Test by pushing to your main branch!"
echo ""
echo "Your backend will now automatically deploy whenever you push to main! 🎉"
