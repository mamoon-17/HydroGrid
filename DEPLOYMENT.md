# Water Plant Manager - Deployment Guide

This app uses:

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (NestJS)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Local disk (ephemeral on Render)

## Architecture Notes

- Files uploaded for reports are stored in the backend's `/uploads` folder
- The uploads folder is ephemeral - it clears on each Render deployment/restart
- Files are served statically at `/uploads/*` endpoint

---

## 1. Supabase Setup (Database)

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to **Settings → Database**
3. Copy the **Connection string** (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Save this for the backend environment variables

---

## 2. Backend Deployment (Render)

### Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `water-plant-manager-api` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

### Environment Variables

Add these in Render's environment settings:

| Variable               | Value                                              |
| ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | Your Supabase connection string                    |
| `JWT_SECRET`           | A long random string (use a password generator)    |
| `JWT_REFRESH_SECRET`   | Another long random string                         |
| `NODE_ENV`             | `production`                                       |
| `REFRESH_CLEANUP_CRON` | `0 0 * * *`                                        |
| `CORS_EXTRA_ORIGINS`   | Your Vercel frontend URL (optional, auto-detected) |

### Important Notes

- The `PORT` is automatically set by Render
- Uploads folder clears on each deployment - this is expected behavior
- SSL is automatically handled by Render

---

## 3. Frontend Deployment (Vercel)

### Create New Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### Environment Variables

Add in Vercel project settings:

| Variable            | Value                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | Your Render backend URL (e.g., `https://water-plant-manager-api.onrender.com`) |

### Important Notes

- Make sure to add the backend URL WITHOUT a trailing slash
- Redeploy after adding environment variables

---

## 4. Post-Deployment Checklist

- [ ] Backend is deployed and accessible
- [ ] Database tables are auto-created (synchronize: true)
- [ ] Frontend is deployed and loads correctly
- [ ] Login/authentication works
- [ ] File uploads work (test by creating a report with images)
- [ ] CORS is working (no browser errors)

---

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Edit with your values
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Edit with local backend URL
npm run dev
```

---

## Troubleshooting

### CORS Errors

- Make sure your Vercel URL is allowed. The backend auto-allows `*.vercel.app` domains
- For custom domains, add them to `CORS_EXTRA_ORIGINS`

### Database Connection Issues

- Check if your Supabase project is active (free tier pauses after inactivity)
- Verify the connection string format is correct

### File Upload Issues

- Files are stored temporarily and will be lost on Render restarts
- For persistent storage, consider upgrading to a solution like Supabase Storage

### Build Failures

- Check Node.js version compatibility (18+ recommended)
- Review build logs in Render/Vercel dashboards
