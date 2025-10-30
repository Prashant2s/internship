# 🔧 Backend Deployment Troubleshooting for Render

## Common Issues & Solutions

### Issue 1: "Cannot find repository" or "No services found"

**Solution:**
1. Make sure code is pushed to GitHub
2. Render needs to connect to the repository
3. If using render.yaml, Render should auto-detect it

**Alternative - Manual Setup:**
Instead of using render.yaml, create service manually:

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Select **"Connect GitHub"**
5. Find and select `Prashant2s/internship`
6. Click **"Connect"**

### Issue 2: "Build Failed" or "Deploy Failed"

**Check these settings:**

| Setting | Value |
|---------|-------|
| **Name** | `chat-app-backend` (any name you want) |
| **Region** | Select any (e.g., Oregon USA) |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ IMPORTANT |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### Issue 3: "Application Failed to Respond"

This usually means environment variables are missing or incorrect.

**Required Environment Variables:**

In Render service settings → **Environment** tab, add:

```
MONGODB_URI=mongodb+srv://prashantextra2003_db_user:LVhFXLwjjZn040oj@cluster3.vysuke8.mongodb.net/chat-app
JWT_SECRET=super-secret-jwt-key-change-this-in-production-min-32-chars
CORS_ORIGIN=http://localhost:3000
NODE_ENV=production
PORT=10000
```

**Important:**
- `PORT` should be set to `10000` for Render (or leave blank, Render will assign)
- `CORS_ORIGIN` can be `*` for testing, then update with frontend URL
- `MONGODB_URI` must include database name at the end (e.g., `/chat-app`)

### Issue 4: MongoDB Connection Failed

**Error in logs:** `MongooseServerSelectionError` or `ENOTFOUND`

**Solutions:**

1. **Check MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas
   - Network Access → IP Access List
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (`0.0.0.0/0`)
   - Save

2. **Verify Connection String:**
   ```
   mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME
   ```
   - Replace USERNAME with your username
   - Replace PASSWORD with your password (no special characters if possible)
   - Replace CLUSTER with your cluster address
   - Replace DATABASE_NAME with `chat-app`

3. **Test Connection Locally:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   If it works locally, the connection string is correct.

### Issue 5: "Module not found" errors

**Check these:**

1. **package.json exists in backend folder**
   - File: `backend/package.json`
   - Contains all dependencies

2. **All imports use `.js` extensions**
   - ✅ `import { config } from "./config.js"`
   - ❌ `import { config } from "./config"`

3. **package.json has `"type": "module"`**
   - Required for ES modules

---

## Step-by-Step Manual Backend Setup

If you're having issues, follow these exact steps:

### Step 1: Go to Render Dashboard
- URL: https://dashboard.render.com/
- Make sure you're logged in

### Step 2: Create New Web Service
- Click **"New +"** button (top right)
- Select **"Web Service"**

### Step 3: Connect Repository
- If not connected: Click "Connect GitHub"
- Find repository: `Prashant2s/internship`
- Click **"Connect"** next to the repo

### Step 4: Configure Service

**Fill out EXACTLY as shown:**

**Name:** `chat-app-backend`

**Region:** `Oregon (US West)` (or closest to you)

**Branch:** `main`

**Root Directory:** `backend` ⚠️ **THIS IS CRITICAL**

**Environment:** `Node`

**Build Command:** `npm install`

**Start Command:** `node server.js`

**Instance Type:** `Free`

### Step 5: Add Environment Variables

Click **"Advanced"** to expand, then add these:

**Variable 1:**
- Key: `MONGODB_URI`
- Value: `mongodb+srv://prashantextra2003_db_user:LVhFXLwjjZn040oj@cluster3.vysuke8.mongodb.net/chat-app`

**Variable 2:**
- Key: `JWT_SECRET`
- Value: `my-super-secret-jwt-key-for-production-minimum-32-characters-long`

**Variable 3:**
- Key: `CORS_ORIGIN`
- Value: `*` (for now, update after frontend is deployed)

**Variable 4:**
- Key: `NODE_ENV`
- Value: `production`

**Variable 5:**
- Key: `ADMIN_EMAILS`
- Value: `admin@example.com` (optional)

### Step 6: Create Service
- Click **"Create Web Service"** button at bottom
- Wait 5-10 minutes for deployment

### Step 7: Check Logs
- While deploying, click **"Logs"** tab
- Watch for errors
- Look for: `API listening on :XXXX` and `Mongo connected`

### Step 8: Test Backend
Once deployed, you'll see a URL like:
```
https://chat-app-backend-xxxx.onrender.com
```

Test it:
```
https://your-backend-url.onrender.com/health
```

Should return:
```json
{"ok":true}
```

---

## Quick Checklist

Before deploying, verify:

- [ ] Code is pushed to GitHub (`main` branch)
- [ ] `backend/package.json` exists
- [ ] `backend/server.js` exists
- [ ] MongoDB Atlas cluster is running
- [ ] MongoDB Atlas allows all IPs (`0.0.0.0/0`)
- [ ] MongoDB connection string includes database name
- [ ] Root Directory is set to `backend` in Render

---

## Environment Variables Template

Copy this and fill in your values:

```bash
# Database
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/chat-app

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# CORS (use * for testing, update with frontend URL later)
CORS_ORIGIN=*

# Environment
NODE_ENV=production

# Admin (optional)
ADMIN_EMAILS=your-email@example.com
```

---

## What to Check in Logs

Good logs should show:
```
Starting...
> node server.js
API listening on :10000
Mongo connected
```

Bad logs will show:
- `Error: Cannot find module` → Check package.json
- `MongooseServerSelectionError` → Check MongoDB Atlas settings
- `ENOTFOUND` → Check MongoDB connection string
- `Cannot read property` → Check environment variables

---

## Still Not Working?

1. **Check Render Status Page:** https://status.render.com/
2. **Try Deploying with Minimal Config:**
   - Remove all env vars except `MONGODB_URI` and `JWT_SECRET`
   - Set `CORS_ORIGIN=*`
   - Deploy and check logs

3. **Test Locally First:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI
   npm install
   npm start
   ```
   If it works locally, the issue is in Render configuration.

4. **Contact Me:**
   - Email: prashantextra2003@gmail.com
   - Share your Render logs (screenshot)
   - Share error message

---

## Example Successful Deployment

**URL:** `https://chat-app-backend.onrender.com`

**Test:**
```bash
curl https://chat-app-backend.onrender.com/health
# Returns: {"ok":true}
```

**Then test auth:**
```bash
curl -X POST https://chat-app-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

Should return user data or error message (not 500 error).

---

Good luck! 🚀
