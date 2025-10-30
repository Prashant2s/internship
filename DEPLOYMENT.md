# Chat App - Deployment Guide

## Netlify Deployment (Frontend)

### Prerequisites
1. Create a [Netlify](https://netlify.com) account
2. Install Netlify CLI (optional): `npm install -g netlify-cli`
3. Ensure backend is deployed first (see Backend Deployment section)

### Deploy to Netlify

#### Option 1: Using Netlify UI (Recommended)

1. **Connect Repository**
   - Log in to Netlify
   - Click "Add new site" > "Import an existing project"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your chat-app repository

2. **Configure Build Settings**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`

3. **Set Environment Variables**
   Go to Site settings > Environment variables and add:
   ```
   NEXT_PUBLIC_API_BASE=https://your-backend-url.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your app
   - Your site will be live at a Netlify URL (e.g., https://your-app-name.netlify.app)

#### Option 2: Using Netlify CLI

1. **Login to Netlify**
   ```bash
   netlify login
   ```

2. **Initialize Netlify**
   ```bash
   cd frontend
   netlify init
   ```

3. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_API_BASE "https://your-backend-url.onrender.com"
   netlify env:set NEXT_PUBLIC_SOCKET_URL "https://your-backend-url.onrender.com"
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Post-Deployment Steps

1. **Update Backend CORS**
   - Add your Netlify URL to the backend's `CORS_ORIGIN` environment variable
   - Example: `CORS_ORIGIN=https://your-app-name.netlify.app`

2. **Test the Deployment**
   - Visit your Netlify URL
   - Try registering a new account
   - Test login functionality
   - Check if real-time chat works

---

## Render Deployment (Backend)

### Prerequisites
1. Create a [Render](https://render.com) account
2. Set up MongoDB Atlas (free tier available)

### Deploy to Render

1. **Create MongoDB Database**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

2. **Deploy Backend to Render**
   - Log in to Render
   - Click "New" > "Web Service"
   - Connect your repository
   - Configure:
     - Name: `chat-app-backend`
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Set Environment Variables**
   In Render dashboard, add:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this
   CORS_ORIGIN=https://your-app-name.netlify.app
   NODE_ENV=production
   PORT=4000
   ```

4. **Deploy**
   - Render will automatically build and deploy
   - Copy your backend URL (e.g., https://chat-app-backend.onrender.com)

---

## Continuous Deployment

Both Netlify and Render support automatic deployments:
- Push to your main/master branch to trigger automatic deployments
- Configure branch-specific deployments for staging environments

---

## Troubleshooting

### Frontend Issues
- **Build fails**: Check if all environment variables are set
- **Can't connect to backend**: Verify NEXT_PUBLIC_API_BASE URL is correct
- **Socket.IO not working**: Ensure NEXT_PUBLIC_SOCKET_URL matches backend URL

### Backend Issues
- **Database connection fails**: Check MONGODB_URI format and network access in MongoDB Atlas
- **CORS errors**: Ensure CORS_ORIGIN matches your Netlify URL exactly
- **JWT errors**: Verify JWT_SECRET is set and consistent

### Common Solutions
1. Check Netlify/Render deployment logs
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas allows connections from Render's IP addresses
4. Check that both services are using HTTPS
