import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import slugify from "slugify";

import authRoutes from "./src/routes/auth.js";
import roomRoutes from "./src/routes/rooms.js";
import groupRoutes from "./src/routes/groups.js";
import adminRoutes from "./src/routes/admin.js";
import { authMiddleware, requireAdmin } from "./src/middleware/auth.js";
import Message from "./src/models/Message.js";
import Room from "./src/models/Room.js";
import User from "./src/models/User.js";
import { config } from "./config.js";

const app = express();

// Config
const PORT = config.PORT;
const JWT_SECRET = config.JWT_SECRET;
const MONGODB_URI = config.MONGODB_URI;
const CORS_ORIGIN = config.CORS_ORIGIN.split(",");

// DB
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGODB_URI, { autoIndex: true })
  .then(async () => {
    console.log("Mongo connected");
    // Promote admin emails if configured
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (ADMIN_EMAILS.length) {
      await User.updateMany(
        { email: { $in: ADMIN_EMAILS } },
        { $set: { role: "admin" } }
      );
    }
  })
  .catch((e) => {
    console.error("Mongo connection error", e.message);
    process.exit(1);
  });

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1); // Trust first proxy

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  // Use default key generator (req.ip) which is safe with trust proxy = 1
});
app.use(limiter);

// Routes
app.get("/", (req, res) => res.json({ 
  message: "Chat App Backend API", 
  status: "running",
  endpoints: {
    health: "/health",
    auth: "/api/auth/*",
    rooms: "/api/rooms/*",
    groups: "/api/groups/*",
    admin: "/api/admin/*"
  }
}));
app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", authMiddleware, roomRoutes);
app.use("/api/groups", authMiddleware, groupRoutes);
app.use("/api/admin", authMiddleware, requireAdmin, adminRoutes);

// HTTP + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

// Presence maps
const roomUsers = new Map(); // key -> Map(userId -> username)

function roomKeyFor(type, key) {
  return `${type}:${key}`;
}

function normalizeGameName(name) {
  return slugify(name, { lower: true, strict: true });
}

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Unauthorized"));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = { id: payload.id, username: payload.username };
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Track sockets per user for targeted signaling
  if (!io.userSockets) io.userSockets = new Map(); // userId -> Set(socketId)
  const userSet = io.userSockets.get(socket.user.id) || new Set();
  userSet.add(socket.id);
  io.userSockets.set(socket.user.id, userSet);

  // Join room
  socket.on("join_room", async ({ roomType, roomKey }) => {
    try {
      if (roomType === "game") {
        const slug = normalizeGameName(roomKey);
        await Room.findOneAndUpdate(
          { slug },
          { $setOnInsert: { slug, name: roomKey, type: "game" } },
          { upsert: true }
        );
        const sr = roomKeyFor("game", slug);
        socket.join(sr);
        if (!roomUsers.has(sr)) roomUsers.set(sr, new Map());
        roomUsers.get(sr).set(socket.user.id, socket.user.username);

        // History
        const history = await Message.find({ roomType: "game", roomKey: slug })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("room_history", {
          roomType: "game",
          roomKey: slug,
          messages: history.reverse(),
        });

        // Presence - send usernames array
        io.to(sr).emit("room_users", Array.from(roomUsers.get(sr).values()));
        io.to(sr).emit("user_joined", {
          userId: socket.user.id,
          username: socket.user.username,
        });
      } else if (roomType === "group") {
        const sr = roomKeyFor("group", roomKey);
        socket.join(sr);
        if (!roomUsers.has(sr)) roomUsers.set(sr, new Map());
        roomUsers.get(sr).set(socket.user.id, socket.user.username);

        const history = await Message.find({ roomType: "group", roomKey })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        socket.emit("room_history", {
          roomType: "group",
          roomKey,
          messages: history.reverse(),
        });
        io.to(sr).emit("room_users", Array.from(roomUsers.get(sr).values()));
        io.to(sr).emit("user_joined", {
          userId: socket.user.id,
          username: socket.user.username,
        });
      }
    } catch (e) {
      socket.emit("error_message", e.message);
    }
  });

  socket.on("leave_room", ({ roomType, roomKey }) => {
    const sr = roomKeyFor(roomType, roomKey);
    socket.leave(sr);
    if (roomUsers.has(sr)) {
      roomUsers.get(sr).delete(socket.user.id);
      io.to(sr).emit("room_users", Array.from(roomUsers.get(sr).values()));
      io.to(sr).emit("user_left", { userId: socket.user.id });
    }
  });

  socket.on("typing", ({ roomType, roomKey, isTyping }) => {
    const sr = roomKeyFor(roomType, roomKey);
    socket.to(sr).emit("typing", {
      userId: socket.user.id,
      username: socket.user.username,
      isTyping,
    });
  });

  socket.on("send_message", async ({ roomType, roomKey, content }) => {
    try {
      const trimmed = (content || "").toString().trim();
      if (!trimmed || trimmed.length > 1000) return;
      const msg = await Message.create({
        roomType,
        roomKey: roomType === "game" ? normalizeGameName(roomKey) : roomKey,
        senderId: socket.user.id,
        senderName: socket.user.username,
        content: trimmed,
      });
      const sr = roomKeyFor(roomType, msg.roomKey);
      io.to(sr).emit("new_message", msg);
    } catch (e) {
      socket.emit("error_message", e.message);
    }
  });

  // --- Voice chat signaling ---
  function voiceRoomKey(roomType, roomKey) {
    return `voice:${roomType}:${roomKey}`;
  }

  socket.on("voice_join", ({ roomType, roomKey }) => {
    const sr = voiceRoomKey(roomType, roomKey);
    socket.join(sr);

    // Gather existing peers with usernames in the voice room, excluding self
    const room = io.sockets.adapter.rooms.get(sr) || new Set();
    const peers = [];
    for (const sid of room) {
      if (sid === socket.id) continue;
      const s = io.sockets.sockets.get(sid);
      if (s?.user?.id && s?.user?.username) {
        peers.push({ userId: s.user.id, username: s.user.username });
      }
    }

    // Inform joiner of current peers with usernames
    socket.emit("voice_peers", peers);
    // Notify others that this user joined with username
    socket.to(sr).emit("voice_user_joined", {
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  socket.on("voice_leave", ({ roomType, roomKey }) => {
    const sr = voiceRoomKey(roomType, roomKey);
    socket.leave(sr);
    socket.to(sr).emit("voice_user_left", {
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  // Targeted signaling helpers
  function forEachTargetSocket(userId, fn) {
    const set = io.userSockets.get(userId);
    if (!set) return;
    for (const sid of set) fn(sid);
  }

  socket.on("voice_offer", ({ toUserId, sdp }) => {
    forEachTargetSocket(toUserId, (sid) => {
      io.to(sid).emit("voice_offer", { fromUserId: socket.user.id, sdp });
    });
  });

  socket.on("voice_answer", ({ toUserId, sdp }) => {
    forEachTargetSocket(toUserId, (sid) => {
      io.to(sid).emit("voice_answer", { fromUserId: socket.user.id, sdp });
    });
  });

  socket.on("voice_ice_candidate", ({ toUserId, candidate }) => {
    forEachTargetSocket(toUserId, (sid) => {
      io.to(sid).emit("voice_ice_candidate", {
        fromUserId: socket.user.id,
        candidate,
      });
    });
  });

  socket.on("disconnect", () => {
    // Remove user from all rooms they were in
    for (const [sr, userMap] of roomUsers.entries()) {
      if (userMap.delete(socket.user?.id)) {
        io.to(sr).emit("room_users", Array.from(userMap.values()));
        io.to(sr).emit("user_left", { userId: socket.user.id });
      }
    }

    // Cleanup user socket mapping
    const set = io.userSockets.get(socket.user?.id);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) io.userSockets.delete(socket.user.id);
    }
  });
});

const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`API listening on ${HOST}:${PORT}`));
