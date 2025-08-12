# 🚀 Automatic Backend Deployment

This guide will help you set up automatic deployment for your backend so it updates automatically when you push to git, just like your Amplify frontend!

## 🎯 Options Available

### Option 1: GitHub Actions (Recommended)

- **Pros**: Most reliable, runs in GitHub's infrastructure, easy to debug
- **Cons**: Requires setting up GitHub secrets
- **Best for**: Production environments, team projects

### Option 2: Webhook Server (Easier Setup)

- **Pros**: Simple to set up, runs on your EC2 instance
- **Cons**: Requires keeping a webhook server running
- **Best for**: Quick setup, single developer

### Option 3: Cron Job (Simplest)

- **Pros**: Very simple, no external dependencies
- **Cons**: Not real-time, may deploy unnecessary updates
- **Best for**: Basic automation needs

## 🚀 Quick Setup - Webhook Method (Recommended for Start)

### Step 1: Run Setup Script on EC2

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to your project directory
cd /path/to/your/backend

# Run the setup script
sudo ./setup-auto-deploy.sh
```

### Step 2: Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks**
3. Click **Add webhook**
4. Configure:
   - **Payload URL**: `http://YOUR_EC2_IP:3001/webhook`
   - **Content type**: `application/json`
   - **Secret**: Copy the secret from the setup script
   - **Events**: Select "Just the push event"

### Step 3: Open EC2 Port

- Go to EC2 Console → Security Groups
- Add inbound rule: Port 3001, Source 0.0.0.0/0

### Step 4: Test!

Push a change to your main branch and watch it auto-deploy! 🎉

## 🔧 GitHub Actions Setup (Advanced)

### Step 1: Add GitHub Secrets

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `EC2_HOST`: Your EC2 public IP
   - `EC2_USERNAME`: Your EC2 username (usually `ubuntu`)
   - `EC2_SSH_KEY`: Your private SSH key content

### Step 2: Update Workflow File

Edit `.github/workflows/deploy.yml` and update the path in the deploy script:

```yaml
script: |
  cd /actual/path/to/your/backend/project
  git pull origin main
  npm install
  npm run build
  cp .env ./dist/.env
  pm2 reload main
```

## ⚙️ Manual Setup (If Scripts Don't Work)

### Install Dependencies

```bash
sudo apt-get update
sudo apt-get install -y curl git openssl
```

### Generate Webhook Secret

```bash
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo $WEBHOOK_SECRET
```

### Start Webhook Server

```bash
# Set environment variables
export WEBHOOK_SECRET="your-secret-here"
export PROJECT_PATH=$(pwd)

# Start with PM2
pm2 start webhook-server.js --name webhook-server
pm2 save
pm2 startup
```

## 🔍 Troubleshooting

### Webhook Not Working?

1. Check if webhook server is running: `pm2 status`
2. Check logs: `pm2 logs webhook-server`
3. Verify port is open: `netstat -tlnp | grep 3001`
4. Check GitHub webhook delivery logs

### Build Failing?

1. Check your `build.sh` script permissions: `chmod +x build.sh`
2. Verify Node.js version: `node --version`
3. Check PM2 logs: `pm2 logs main`

### Security Issues?

1. Change default webhook secret
2. Restrict webhook access to GitHub IPs only
3. Use HTTPS with proper SSL certificates

## 📝 Files Created

- `webhook-server.js` - Webhook server that triggers deployments
- `ecosystem.config.js` - PM2 configuration for both apps
- `setup-auto-deploy.sh` - Automated setup script
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `AUTO-DEPLOY-README.md` - This file

## 🎉 What Happens Now?

1. **Push to main branch** → GitHub sends webhook to your EC2
2. **Webhook received** → Triggers your `build.sh` script
3. **Build runs** → Code pulls, builds, and restarts
4. **App updates** → Your backend is live with new changes!

No more manual SSH-ing into EC2! 🚀

## 📞 Need Help?

If you run into issues:

1. Check the troubleshooting section above
2. Look at PM2 logs: `pm2 logs`
3. Verify webhook deliveries in GitHub repository settings
4. Make sure your `build.sh` script works manually first
