# 🎮 Chat App - Game Rooms & Voice Chat

A full-stack real-time chat application designed for gamers to connect, chat, and voice communicate in game-specific rooms.

![Node.js](https://img.shields.io/badge/Node.js-v22-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## 🌟 Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication
- User registration and login
- Password reset functionality
- Email verification support
- Role-based access control (User/Admin)

### 💬 Real-time Chat
- **Game Rooms**: Auto-created chat rooms based on game names
- **Private Groups**: Create custom group chats
- **Live Messaging**: Instant message delivery via WebSocket
- **Typing Indicators**: See when others are typing
- **Message History**: Persistent chat history stored in MongoDB
- **Online Presence**: Real-time user status tracking

### 🎙️ Voice Chat
- WebRTC-based voice communication
- Peer-to-peer connections
- Multiple participants support
- Join/leave voice channels seamlessly

### 👨‍💼 Admin Panel
- User management
- Room moderation
- Content monitoring
- Admin-only protected routes

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Voice**: WebRTC
- **Styling**: CSS Modules
- **Deployment**: Netlify

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, express-rate-limit, CORS
- **Email**: Nodemailer
- **Deployment**: Render

## 📁 Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication
│   │   │   └── permissions.js       # Role-based access
│   │   ├── models/
│   │   │   ├── User.js              # User schema
│   │   │   ├── Room.js              # Room schema
│   │   │   ├── Message.js           # Message schema
│   │   │   └── Group.js             # Group schema
│   │   ├── routes/
│   │   │   ├── auth.js              # Auth endpoints
│   │   │   ├── rooms.js             # Room management
│   │   │   ├── groups.js            # Group management
│   │   │   └── admin.js             # Admin endpoints
│   │   ├── services/
│   │   │   └── emailService.js      # Email functionality
│   │   └── utils/
│   │       └── tokenUtils.js        # JWT utilities
│   ├── config.js                     # Configuration
│   ├── server.js                     # Main server file
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── pages/
│   │   ├── index.js                 # Landing page
│   │   ├── login.js                 # Login page
│   │   ├── register.js              # Registration page
│   │   ├── forgot-password.js       # Password reset request
│   │   ├── reset-password.js        # Password reset form
│   │   ├── verify-email.js          # Email verification
│   │   ├── rooms/[game].js          # Game room page
│   │   ├── groups/[id].js           # Group chat page
│   │   └── admin/index.js           # Admin dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatRoom.js          # Chat component
│   │   │   ├── VoiceChat.js         # Voice chat component
│   │   │   ├── NavBar.js            # Navigation
│   │   │   └── LandingHero.js       # Hero section
│   │   ├── context/
│   │   │   └── AuthContext.js       # Auth state management
│   │   └── config.js                # Frontend config
│   ├── styles/
│   │   └── globals.css              # Global styles
│   ├── package.json
│   ├── next.config.mjs
│   └── .env.local.example
│
├── .gitignore
├── render.yaml                       # Render deployment config
├── DEPLOYMENT.md                     # Deployment guide
└── RENDER_DEPLOY.md                  # Detailed Render setup
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Prashant2s/internship.git
cd internship
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

**Environment Variables** (backend/.env):
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAILS=admin@example.com
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm install
npm run dev
```

**Environment Variables** (frontend/.env.local):
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 🌐 Deployment

### Deploy to Render (Backend)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables
6. Deploy!

**See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for detailed instructions**

### Deploy to Netlify (Frontend)
1. Connect repository to Netlify
2. Configure build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`
3. Add environment variables
4. Deploy!

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email` - Verify email

### Room Endpoints
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:slug` - Get room by slug
- `POST /api/rooms` - Create new room

### Group Endpoints
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join group
- `DELETE /api/groups/:id/leave` - Leave group

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/rooms` - Get all rooms
- `DELETE /api/admin/rooms/:id` - Delete room

### Socket.IO Events

#### Client → Server
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send message
- `typing` - Typing indicator
- `voice_join` - Join voice channel
- `voice_leave` - Leave voice channel
- `voice_offer` - WebRTC offer
- `voice_answer` - WebRTC answer
- `voice_ice_candidate` - ICE candidate

#### Server → Client
- `room_history` - Chat history
- `room_users` - Online users
- `user_joined` - User joined notification
- `user_left` - User left notification
- `new_message` - New message received
- `typing` - Someone is typing
- `voice_peers` - Voice chat participants
- `voice_user_joined` - User joined voice
- `voice_user_left` - User left voice
- `voice_offer` - Received WebRTC offer
- `voice_answer` - Received WebRTC answer
- `voice_ice_candidate` - Received ICE candidate

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- CORS protection
- Environment variable configuration
- Input validation
- SQL injection protection (via Mongoose)
- XSS protection

## 🎯 Key Features Explained

### Auto-created Game Rooms
When a user enters a game name, the system:
1. Normalizes the game name (slugify)
2. Creates or finds existing room
3. Adds user to room
4. Loads message history
5. Broadcasts presence to other users

### WebRTC Voice Chat
The voice chat uses a mesh architecture:
1. User joins voice room via Socket.IO
2. Receives list of current peers
3. Creates peer connections with each participant
4. Exchanges SDP offers/answers via signaling server
5. Establishes direct peer-to-peer audio streams

### Real-time Presence
- Users' online status tracked via Socket.IO connections
- Automatic cleanup on disconnect
- Room-specific user lists
- Join/leave notifications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Prashant**
- GitHub: [@Prashant2s](https://github.com/Prashant2s)

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- WebRTC for voice chat capabilities
- MongoDB for flexible data storage
- Next.js for amazing React framework
- Render & Netlify for easy deployment

## 📧 Support

For support, email prashantextra2003@gmail.com or open an issue on GitHub.

---

Made with ❤️ for gamers by gamers
