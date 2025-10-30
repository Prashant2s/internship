# 🚀 Complete Render Deployment Guide

This guide will help you deploy both the **backend** and **frontend** on Render.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### ✅ Before You Start

1. **GitHub Account**
   - Code must be pushed to GitHub
   - Repository: https://github.com/Prashant2s/internship

2. **Render Account**
   - Sign up at https://render.com
   - Free tier is sufficient

3. **MongoDB Atlas**
   - Create account at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get connection string

4. **Environment Variables Ready**
   - MongoDB connection string
   - JWT secret (generate: `openssl rand -base64 32`)
   - Admin email addresses

---

## Backend Deployment

### Step 1: Create Backend Service

1. **Login to Render**
   - Go to https://dashboard.render.com/

2. **Create New Web Service**
   - Click **"New +"** button → **"Web Service"**

3. **Connect Repository**
   - Click **"Connect GitHub"** if not connected
   - Select repository: `Prashant2s/internship`
   - Click **"Connect"**

### Step 2: Configure Backend Service

Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `chat-app-backend` |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | `Free` |

### Step 3: Set Backend Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value | Example |
|-----|-------|---------|
| `MONGODB_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/chat-app` |
| `JWT_SECRET` | Random 32+ character string | `your-super-secret-jwt-key-min-32-chars` |
| `CORS_ORIGIN` | Will be frontend URL (add after frontend) | `https://chat-app-frontend.onrender.com` |
| `NODE_ENV` | `production` | `production` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@example.com,admin2@example.com` |
| `PORT` | Leave blank (Render auto-assigns) | - |

**Important Notes:**
- For `CORS_ORIGIN`, temporarily set to `https://chat-app-frontend.onrender.com` (we'll update after frontend is deployed)
- Don't include `/` at the end of URLs
- MongoDB URI must include database name at the end

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. **Copy your backend URL** (e.g., `https://chat-app-backend.onrender.com`)
4. Keep this URL - you'll need it for frontend!

### Step 5: Verify Backend

Once deployed, test the backend:

**Health Check:**
```
https://your-backend-url.onrender.com/health
```

Should return:
```json
{"ok":true}
```

---

## Frontend Deployment

### Step 1: Create Frontend Service

1. **In Render Dashboard**
   - Click **"New +"** → **"Web Service"**

2. **Connect Same Repository**
   - Select `Prashant2s/internship` again
   - Click **"Connect"**

### Step 2: Configure Frontend Service

| Field | Value |
|-------|-------|
| **Name** | `chat-app-frontend` |
| **Region** | **Same as backend** (important for latency) |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### Step 3: Set Frontend Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_BASE` | Your backend URL from Step 4 above |
| `NEXT_PUBLIC_SOCKET_URL` | Same as `NEXT_PUBLIC_API_BASE` |
| `NODE_ENV` | `production` |

**Example:**
```
NEXT_PUBLIC_API_BASE=https://chat-app-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://chat-app-backend.onrender.com
NODE_ENV=production
```

**Important:**
- No trailing slash `/` at the end of URLs
- Both `API_BASE` and `SOCKET_URL` should be the same
- Use the exact backend URL from backend deployment

### Step 4: Deploy Frontend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build and deployment
3. **Copy your frontend URL** (e.g., `https://chat-app-frontend.onrender.com`)

---

## Post-Deployment Configuration

### Update Backend CORS

Now that frontend is deployed, update the backend:

1. **Go to Backend Service**
   - Render Dashboard → `chat-app-backend`

2. **Update Environment Variables**
   - Click **"Environment"** in left sidebar
   - Find `CORS_ORIGIN`
   - Update value to your frontend URL: `https://chat-app-frontend.onrender.com`
   - Click **"Save Changes"**

3. **Manual Deploy** (if needed)
   - Backend should auto-redeploy
   - If not, click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Testing

### 1. Test Backend
```
Visit: https://your-backend.onrender.com/health
Expected: {"ok":true}
```

### 2. Test Frontend
```
Visit: https://your-frontend.onrender.com
Expected: Landing page loads
```

### 3. Full Application Test

1. **Register Account**
   - Click "Get Started" or "Register"
   - Create a new account
   - Check if registration succeeds

2. **Login**
   - Login with your credentials
   - Should redirect to home

3. **Create Game Room**
   - Enter a game name (e.g., "Valorant")
   - Click to join room
   - Should see chat interface

4. **Send Messages**
   - Type and send a message
   - Message should appear in chat

5. **Voice Chat** (optional)
   - Click voice chat button
   - Allow microphone permissions
   - Test with another user/device

---

## Important Notes

### 🕐 Free Tier Limitations

**Render Free Tier:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- 750 hours/month per service (enough for 1 service running 24/7)

**Solutions:**
- Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your app every 5 minutes
- Or accept cold starts (common for free hosting)

### 🔄 Auto-Deploy

Both services will auto-deploy when you push to GitHub:
- Push to `main` branch → Automatic deployment

To disable auto-deploy:
- Service Settings → Auto-Deploy → Toggle off

### 📊 Monitoring

**View Logs:**
- Dashboard → Service → Logs tab
- Real-time logs during deployment and runtime

**View Metrics:**
- Dashboard → Service → Metrics tab
- CPU, Memory, Request count

---

## Troubleshooting

### Backend Issues

**❌ "Application failed to respond"**
- Check environment variables are set correctly
- Verify MongoDB connection string includes database name
- Check logs: Dashboard → Backend → Logs

**❌ "Cannot connect to MongoDB"**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist: MongoDB Atlas → Network Access → Allow all IPs (`0.0.0.0/0`)
- Verify connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

**❌ Build fails**
- Check `package.json` exists in `backend/` folder
- Verify all dependencies are listed
- Check logs for specific error

### Frontend Issues

**❌ "Build failed"**
- Check `NEXT_PUBLIC_API_BASE` is set
- Verify `package.json` exists in `frontend/` folder
- Check Next.js version compatibility

**❌ "Cannot connect to server"**
- Verify `NEXT_PUBLIC_API_BASE` points to backend URL
- Check backend is running (visit `/health` endpoint)
- Verify CORS_ORIGIN in backend matches frontend URL

**❌ "WebSocket connection failed"**
- Check `NEXT_PUBLIC_SOCKET_URL` is same as API_BASE
- Verify backend Socket.IO is configured correctly
- Check browser console for CORS errors

### General Issues

**❌ "403 Forbidden" or CORS errors**
- Backend `CORS_ORIGIN` must exactly match frontend URL
- No trailing slashes
- Must include `https://`

**❌ Slow initial load**
- Free tier services sleep after 15 minutes
- First request takes 30-60 seconds (cold start)
- Consider using UptimeRobot to keep services awake

**❌ Can't register/login**
- Check JWT_SECRET is set in backend
- Verify MongoDB is connected
- Check backend logs for errors

---

## Environment Variables Summary

### Backend Environment Variables
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chat-app
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
CORS_ORIGIN=https://chat-app-frontend.onrender.com
NODE_ENV=production
ADMIN_EMAILS=admin@example.com
```

### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_BASE=https://chat-app-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://chat-app-backend.onrender.com
NODE_ENV=production
```

---

## 🎉 Success!

If everything works:
- ✅ Backend health check returns `{"ok":true}`
- ✅ Frontend loads without errors
- ✅ You can register/login
- ✅ You can send messages in chat rooms
- ✅ Voice chat connects (if tested)

Your app is now live at:
- **Frontend**: https://chat-app-frontend.onrender.com
- **Backend**: https://chat-app-backend.onrender.com

---

## Next Steps

1. **Custom Domain** (Optional)
   - Render Settings → Custom Domain
   - Add your domain and configure DNS

2. **Upgrade to Paid** (Optional)
   - Remove cold starts
   - Better performance
   - More resources

3. **Monitor Usage**
   - Check Render dashboard regularly
   - Monitor logs for errors
   - Track user activity

4. **Backup Database**
   - MongoDB Atlas → Backup
   - Schedule regular backups

---

## Support

**Issues?**
- Check logs in Render dashboard
- Review this guide again
- Open issue on GitHub: https://github.com/Prashant2s/internship/issues

**Need Help?**
- Email: prashantextra2003@gmail.com
- GitHub: [@Prashant2s](https://github.com/Prashant2s)

---

## Quick Reference

### Render Dashboard URLs
- **Dashboard**: https://dashboard.render.com/
- **Backend Service**: https://dashboard.render.com/web/YOUR_BACKEND_ID
- **Frontend Service**: https://dashboard.render.com/web/YOUR_FRONTEND_ID

### Important Commands (Local Testing)
```bash
# Test backend locally
cd backend
npm install
npm run dev

# Test frontend locally  
cd frontend
npm install
npm run dev
```

### Deployment Checklist
- [ ] Backend deployed and health check works
- [ ] Frontend deployed and loads
- [ ] Backend CORS_ORIGIN updated with frontend URL
- [ ] Can register new account
- [ ] Can login
- [ ] Can create and join rooms
- [ ] Messages send/receive
- [ ] Voice chat works (optional)

---

Made with ❤️ for deployment success!
