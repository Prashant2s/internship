# Render Deployment Checklist

## Prerequisites
- [ ] GitHub repository created and code pushed
- [ ] MongoDB Atlas database created
- [ ] Render account created

## Backend Deployment (Render)

### Step 1: Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the repository with your chat app

### Step 2: Configure Service
- **Name**: `chat-app-backend` (or your choice)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Step 3: Set Environment Variables
Add the following in the Environment section:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URI` | Your MongoDB connection string | Get from MongoDB Atlas |
| `JWT_SECRET` | Random secure string (32+ chars) | Generate with: `openssl rand -base64 32` |
| `CORS_ORIGIN` | Your frontend URL | e.g., `https://your-app.netlify.app` |
| `NODE_ENV` | `production` | Already set in render.yaml |
| `ADMIN_EMAILS` | `admin@example.com` | Optional: comma-separated |

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for deployment to complete (5-10 minutes)
3. Copy your backend URL (e.g., `https://chat-app-backend.onrender.com`)

### Step 5: Test Backend
Visit: `https://your-backend-url.onrender.com/health`

Should return: `{"ok":true}`

---

## Frontend Deployment (Netlify)

### Step 1: Create New Site
1. Go to [Netlify](https://app.netlify.com/)
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub and select your repository

### Step 2: Configure Build Settings
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/.next`

### Step 3: Set Environment Variables
Go to Site settings → Environment variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_BASE` | Your Render backend URL |
| `NEXT_PUBLIC_SOCKET_URL` | Same as API_BASE |

### Step 4: Deploy
1. Click **Deploy site**
2. Wait for build to complete
3. Copy your site URL

### Step 5: Update CORS
Go back to Render → Backend service → Environment:
- Update `CORS_ORIGIN` to your Netlify URL (e.g., `https://your-app.netlify.app`)
- Save and redeploy

---

## Post-Deployment

### Test the Application
1. Visit your Netlify site
2. Register a new account
3. Create a game room
4. Send messages
5. Test voice chat

### Common Issues

**Backend won't start:**
- Check environment variables are set correctly
- Verify MongoDB connection string includes database name
- Check Render logs for errors

**Frontend can't connect:**
- Verify `CORS_ORIGIN` matches your Netlify URL exactly
- Check `NEXT_PUBLIC_API_BASE` is set correctly
- Check browser console for errors

**Socket.IO not connecting:**
- Ensure `NEXT_PUBLIC_SOCKET_URL` is the same as API_BASE
- Check for CORS errors in browser console

---

## Monitoring

### Render
- View logs: Dashboard → Your service → Logs
- Monitor performance: Dashboard → Metrics

### Netlify
- View build logs: Site → Deploys → Build log
- Monitor functions: Site → Functions

---

## Cost Considerations

### Free Tier Limits:
- **Render**: 750 hours/month (enough for 1 service)
- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **MongoDB Atlas**: 512MB storage

**Note**: Render free tier services sleep after 15 minutes of inactivity. First request after sleep will be slow (30-60 seconds).

---

## Maintenance

### Update Backend
1. Push changes to GitHub
2. Render auto-deploys from main branch

### Update Frontend
1. Push changes to GitHub
2. Netlify auto-deploys from main branch

### Manual Deploy
- **Render**: Dashboard → Service → Manual Deploy
- **Netlify**: Site → Deploys → Trigger deploy
