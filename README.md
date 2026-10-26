<div align="center">

# 🔐 The Internal Network

**A real-time internal messaging platform for distributed engineering teams**

Built with the MERN stack + Socket.io

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)

</div>

---

## ✨ Features

### 💬 Real-Time Messaging
- Instant message delivery via Socket.io
- Room-based conversations with join/leave
- Direct messages between users
- Typing indicators and online presence tracking
- File & image attachments (up to 10MB)
- Message editing and deletion

### 🛡️ Role-Based Access Control (RBAC)
| Role | Level | Permissions |
|------|-------|-------------|
| **SuperAdmin** | 3 | Full platform control, room management, audit logs, user role management |
| **Moderator** | 2 | Kick, ban, mute users; create rooms; view audit logs |
| **Member** | 1 | Send/read messages, join public rooms |

### ⚡ Command System
Messages starting with `/` are intercepted and processed through a **6-stage pipeline**:

```
Parse → Lookup → Permission → Context → Cooldown → Execute
```

**Built-in commands:**
| Command | Min Role | Description |
|---------|----------|-------------|
| `/help` | Member | List available commands |
| `/rooms` | Member | List accessible rooms |
| `/kick <user>` | Moderator | Remove user from room |
| `/ban <user>` | Moderator | Ban user from room |
| `/mute <user>` | Moderator | Mute a user |
| `/unmute <user>` | Moderator | Unmute a user |
| `/unban <user>` | Moderator | Unban a user |
| `/promote <user>` | SuperAdmin | Promote user role |

### 📋 Audit Logging
- Append-only audit trail for all privileged actions
- Tracks kicks, bans, mutes, promotions, room creation/deletion
- Accessible to Moderators and SuperAdmins

### 🎨 Premium UI
- Light and dark theme with seamless toggle
- Responsive design with mobile slide-over sidebar
- Indigo/violet accent palette with glassmorphism effects
- Smooth micro-animations throughout

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 8, React Router 7, Socket.io Client |
| **Backend** | Node.js, TypeScript 5+, Express 4, Socket.io 4 |
| **Database** | MongoDB with Mongoose 8 |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **File Upload** | Multer (disk storage) |
| **Styling** | Vanilla CSS with CSS custom properties |

---

## 📁 Project Structure

```
hack/
├── server/                        # Backend API + Socket server (TypeScript)
│   ├── tsconfig.json              # TypeScript configuration
│   ├── src/
│   │   ├── server.ts              # Entry point
│   │   ├── config/db.ts           # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.ts            # User with roles & mute/ban
│   │   │   ├── Room.ts            # Chat rooms with members
│   │   │   ├── Message.ts         # Room messages + attachments
│   │   │   ├── DirectMessage.ts   # DM messages
│   │   │   └── AuditLog.ts        # Append-only audit trail
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification & mute sync
│   │   │   ├── rbac.ts            # Role permission checks
│   │   │   └── upload.ts          # Multer file upload config
│   │   ├── routes/
│   │   │   ├── auth.ts            # Register, login, profile
│   │   │   ├── rooms.ts           # Room CRUD, join/leave
│   │   │   ├── messages.ts        # Message history
│   │   │   ├── directMessages.ts  # DM endpoints
│   │   │   ├── directMessageActions.ts # DM edit & soft delete
│   │   │   ├── users.ts           # User management
│   │   │   ├── audit.ts           # Audit log viewer
│   │   │   └── upload.ts          # File upload endpoint
│   │   ├── socket/
│   │   │   ├── index.ts           # Socket.io init + JWT auth
│   │   │   ├── handlers.ts        # Event handlers
│   │   │   └── presence.ts        # Online user tracking
│   │   └── commands/
│   │       └── pipeline.ts        # 6-stage command processor
│   └── uploads/                   # Uploaded media assets
│
└── frontend/                      # React SPA
    └── src/
        ├── App.jsx                # Routes & layout
        ├── App.css                # Complete design system
        ├── context/
        │   └── AuthContext.jsx    # JWT auth state
        ├── services/
        │   ├── api.js             # Axios instance
        │   └── socket.js          # Socket.io client
        ├── components/
        │   ├── Navbar.jsx         # Top nav with theme toggle
        │   ├── Sidebar.jsx        # Room list + user list
        │   ├── ChatPanel.jsx      # Message display + input
        │   └── InfoPanel.jsx      # Room info + moderation
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Workspace.jsx      # Main chat workspace
            ├── AdminPanel.jsx     # Role management
            └── AuditLogs.jsx      # Audit log viewer
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally or a connection URI
- **npm** or **yarn**

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd hack
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/internal-network
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
```

Start the server:

```bash
npm run dev
```

### 3. Setup the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Navigate to **http://localhost:5173** in your browser.

---

## 🔑 Default Setup

1. Register the first user — they will be a **Member** by default
2. To make someone a SuperAdmin, manually update the role in MongoDB:
   ```js
   db.users.updateOne({ username: "yourname" }, { $set: { role: 3 } })
   ```
3. SuperAdmins can then promote other users through the **Admin Panel**

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List rooms |
| POST | `/api/rooms` | Create room (Mod+) |
| POST | `/api/rooms/:id/join` | Join room |
| POST | `/api/rooms/:id/leave` | Leave room |
| GET | `/api/rooms/:id/members` | List members |
| GET | `/api/rooms/:id/messages` | Message history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PATCH | `/api/users/:id/role` | Change user role (SA) |
| GET | `/api/audit` | Audit logs (Mod+) |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file (10MB max) |

---

## 🔌 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `roomId` | Join a room |
| `room:leave` | `roomId` | Leave a room |
| `message:send` | `{ roomId, content, attachments? }` | Send message |
| `dm:send` | `{ recipientId, content, attachments? }` | Send DM |
| `typing:start` | `{ roomId }` | Start typing |
| `typing:stop` | `{ roomId }` | Stop typing |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Message object | New message in room |
| `dm:new` | DM object | New direct message |
| `room:onlineUsers` | `{ roomId, users[] }` | Online users update |
| `typing:update` | `{ username, isTyping }` | Typing indicator |
| `room:kicked` | `{ roomId, message }` | You were kicked |
| `user:role_changed` | `{ userId }` | Role was changed |

---

## 🛡️ Security

- **Passwords**: Hashed with bcrypt (12 salt rounds)
- **Authentication**: Stateless JWT tokens with configurable expiry
- **Authorization**: Role-based middleware on all protected routes
- **Socket Auth**: JWT verified on every socket connection
- **Audit Trail**: Append-only logs that cannot be modified or deleted
- **File Upload**: MIME type validation + 10MB size limit
- **Input Validation**: Mongoose schema validation on all models

---

## 📄 License

MIT

---

<div align="center">
  <sub>Built with ❤️ using the MERN Stack</sub>
</div>
