# Audit Backlog: Unimplemented & Partial Features

This document tracks all missing (❌) and partially implemented (🟡) features identified during the senior architecture and security review. Use this as a checklist for hardening and production readiness.

---

## Priority Summary

- **Total Items Tracked**: 47 items (27 Missing, 20 Partial)
- **Phase 1: Critical Security & Auth Fixes** (Immediate risk)
- **Phase 2: Message Reliability & Delivery Acks** (Core UX/data consistency)
- **Phase 3: Data, Storage & Cursor Pagination** (Scalability)
- **Phase 4: File Upload & Input Hardening** (Vulnerability mitigation)
- **Phase 5: Operations, Testing & Compliance** (Production lifecycle)

---

## Phase 1: Critical Security & Authentication Fixes

- [ ] **1. Remove Hardcoded `'fallback_secret'` JWT Default**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/socket/index.ts:78`](server/src/socket/index.ts#L78), [`server/src/routes/auth.ts:9`](server/src/routes/auth.ts#L9), [`server/src/middleware/auth.ts:33`](server/src/middleware/auth.ts#L33)
  - **Risk**: If the `JWT_SECRET` environment variable fails to load, the server silently signs and verifies tokens using a known public string, enabling trivial offline token forgery and SuperAdmin account takeover.
  - **Fix**: Require high-entropy `JWT_SECRET` on boot and crash immediately if missing:
    ```ts
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('FATAL: JWT_SECRET must be set and contain at least 32 characters.');
    }
    ```

- [ ] **2. Fix Permissive CORS Wildcard Fallback**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/server.ts:58`](server/src/server.ts#L58), [`server/src/socket/index.ts:52`](server/src/socket/index.ts#L52)
  - **Risk**: Line 58 always returns `callback(null, true)` with `credentials: true`, allowing any malicious website to send authenticated cross-origin requests.
  - **Fix**: Reject unauthorized origins explicitly:
    ```ts
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Origin blocked by CORS policy'));
    }
    ```

- [ ] **3. Brute-Force Protection & Rate Limiting on Auth Routes**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/auth.ts:108-162`](server/src/routes/auth.ts#L108-L162), [`server/src/server.ts:64`](server/src/server.ts#L64)
  - **Risk**: `/api/auth/login` and `/api/auth/register` have no rate limiting, permitting high-speed dictionary attacks and credential stuffing.
  - **Fix**: Install `express-rate-limit`:
    ```ts
    import rateLimit from 'express-rate-limit';
    const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many attempts. Try again in 15 minutes.' });
    router.post('/login', authLimiter, ...);
    ```

- [ ] **4. Stored XSS Mitigation on Attachment Links**
  - **Status**: 🟡 Partial
  - **Evidence**: [`frontend/src/components/ChatPanel.jsx:245`](frontend/src/components/ChatPanel.jsx#L245)
  - **Risk**: `<a href={fileUrl}>` renders raw `att.url`; attachments with `javascript:` protocol execute arbitrary code in the victim's session when clicked.
  - **Fix**: Sanitize URLs with protocol whitelist before binding to `href`:
    ```js
    const isSafeUrl = /^https?:\/\//i.test(att.url) || att.url.startsWith('/uploads/');
    const fileUrl = isSafeUrl ? att.url : '#';
    ```

- [ ] **5. Install `helmet` for Security Headers**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/server.ts:21`](server/src/server.ts#L21), [`server/package.json:14-24`](server/package.json#L14-L24)
  - **Risk**: The API serves responses without `X-Content-Type-Options: nosniff`, `X-Frame-Options`, or Content-Security-Policy headers.
  - **Fix**: Install `helmet` and register `app.use(helmet())` in `server.ts`.

- [ ] **6. Short-Lived Access Tokens + Refresh Tokens & Revocation**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/auth.ts:8-14`](server/src/routes/auth.ts#L8-L14)
  - **Risk**: A single 7-day JWT is issued without refresh token rotation or revocation; compromised tokens cannot be invalidated before expiration.
  - **Fix**: Issue 15-minute access tokens and store cryptographically random refresh tokens in a database collection supporting rotation and immediate revocation.

- [ ] **7. HttpOnly Cookie Storage for Tokens**
  - **Status**: ❌ Missing
  - **Evidence**: [`frontend/src/context/AuthContext.jsx:16, 39, 46, 52`](frontend/src/context/AuthContext.jsx#L16)
  - **Risk**: Tokens are stored in browser `localStorage`, making them vulnerable to direct exfiltration through any client-side XSS.
  - **Fix**: Issue tokens via `Set-Cookie` with `HttpOnly; Secure; SameSite=Strict`.

- [ ] **8. Force-Disconnect Active Sockets on Ban / Demotion**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/commands/pipeline.ts:313-348`](server/src/commands/pipeline.ts#L313-L348), [`server/src/middleware/auth.ts:45`](server/src/middleware/auth.ts#L45)
  - **Risk**: Room ban updates the database, but does not close the target user's active socket connection or remove them from the Socket.io room channel, allowing continued real-time eavesdropping.
  - **Fix**: Terminate the target's sockets immediately upon banning:
    ```ts
    getUserSocketIds(targetUserId).forEach(id => io.sockets.sockets.get(id)?.disconnect(true));
    ```

- [ ] **9. Password Complexity Enforcement & Email Verification**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/auth.ts:52`](server/src/routes/auth.ts#L52)
  - **Risk**: Allows weak 6-character passwords and unverified disposable email registrations.
  - **Fix**: Enforce zxcvbn / regex validation (minimum 10 chars, uppercase, lowercase, numbers, symbols) and send an email verification token before activating accounts.

- [ ] **10. Fix First-Admin Race Condition & Role Escalation in Room Member Deletion**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/routes/auth.ts:73-74`](server/src/routes/auth.ts#L73-L74), [`server/src/routes/rooms.ts:439`](server/src/routes/rooms.ts#L439)
  - **Risk**: Concurrent registration when the database is initialized allows multiple users to claim SuperAdmin; `rooms.ts:439` allows any global moderator to evict members from private rooms they do not belong to.
  - **Fix**: In `rooms.ts:439`, check `currentUser.role >= ROLES.SUPERADMIN` (not `ROLES.MODERATOR`); use atomic initialization flags for the first SuperAdmin setup.

- [ ] **11. Commit `.env.example`**
  - **Status**: ❌ Missing
  - **Evidence**: Root and `server/` directories lack a `.env.example` file.
  - **Risk**: Environment variables remain undocumented, leading to runtime failures or default fallback secrets in new environments.
  - **Fix**: Commit a sanitized `.env.example` template with placeholder values.

---

## Phase 2: Message Reliability & Real-Time Sync

- [ ] **12. Client-Generated Unique Message IDs (Idempotency)**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/socket/handlers.ts:203`](server/src/socket/handlers.ts#L203), [`frontend/src/pages/Workspace.jsx:537-548`](frontend/src/pages/Workspace.jsx#L537-L548), [`server/src/models/Message.ts:27-75`](server/src/models/Message.ts#L27-L75)
  - **Risk**: Network hiccups causing client retries create duplicate messages in the database.
  - **Fix**: Generate a UUID `clientMsgId` on client send and enforce a unique compound index on `{ sender: 1, clientMsgId: 1 }`.

- [ ] **13. Message Delivery Acknowledgements (Sent / Delivered / Read)**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/socket/handlers.ts:147, 203`](server/src/socket/handlers.ts#L147)
  - **Risk**: Senders receive no confirmation that the server committed the message, and recipients have no read receipt mechanism.
  - **Fix**: Add a callback ack to `message:send`:
    ```ts
    socket.on('message:send', async (data, ack) => {
      const msg = await Message.create(...);
      ack?.({ status: 'sent', id: msg._id, clientMsgId: data.clientMsgId });
    });
    ```

- [ ] **14. Optimistic UI with Sending / Failed / Retry States**
  - **Status**: ❌ Missing
  - **Evidence**: [`frontend/src/pages/Workspace.jsx:537-554`](frontend/src/pages/Workspace.jsx#L537-L554)
  - **Risk**: Typed input text is wiped before the server acknowledges receipt; if socket delivery fails, the user's message is permanently lost.
  - **Fix**: Render the message immediately with a temporary ID and status `sending`; mark as `failed` with a "Click to retry" button if the server does not ack within 5 seconds.

- [ ] **15. Offline Queue & Delta Sync on Reconnect**
  - **Status**: ❌ Missing
  - **Evidence**: [`frontend/src/services/socket.js:8-25`](frontend/src/services/socket.js#L8-L25), [`frontend/src/pages/Workspace.jsx:149-340`](frontend/src/pages/Workspace.jsx#L149-L340)
  - **Risk**: Disconnected users drop outgoing messages silently and miss all messages sent during temporary connection drops.
  - **Fix**: Queue outgoing messages in IndexedDB/localStorage while offline, and on socket `connect`/`reconnect`, request missed messages:
    ```js
    socket.on('connect', () => {
      api.get(`/rooms/${roomId}/messages?since=${lastMessageTimestamp}`).then(...);
    });
    ```

- [ ] **16. Monotonic Sequence Numbers per Room**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/models/Message.ts:77`](server/src/models/Message.ts#L77), [`server/src/routes/messages.ts:54`](server/src/routes/messages.ts#L54)
  - **Risk**: Clock skew or concurrent millisecond writes across distributed servers can result in out-of-order message displays.
  - **Fix**: Implement an atomic counter (`seq: Number`) incremented per room via MongoDB `$inc`.

- [ ] **17. Dynamic Token Refresh on Socket Reconnection**
  - **Status**: 🟡 Partial
  - **Evidence**: [`frontend/src/services/socket.js:8-16`](frontend/src/services/socket.js#L8-L16)
  - **Risk**: Socket.io attempts reconnection using the initial token passed at connect time; if the token expired while offline, reconnection fails in an infinite 401 loop.
  - **Fix**: Pass an auth function to `io()`:
    ```js
    socket = io(SOCKET_URL, { auth: (cb) => cb({ token: localStorage.getItem("token") }) });
    ```

---

## Phase 3: Data, Storage & Cursor Pagination

- [ ] **18. Cursor-Based Pagination for Message History**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/messages.ts:55-56`](server/src/routes/messages.ts#L55-L56), [`server/src/routes/directMessages.ts:48-49`](server/src/routes/directMessages.ts#L48-L49)
  - **Risk**: Offset pagination (`.skip((page - 1) * limit)`) performs O(N) table scans on large channels and skips or duplicates messages when new items arrive during paging.
  - **Fix**: Paginate using `createdAt` or `_id` cursors:
    ```ts
    const query = { room: id, ...(before ? { createdAt: { $lt: new Date(before) } } : {}) };
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit);
    ```

- [ ] **19. Frontend Infinite Scroll & Older Message Lazy-Loading**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/routes/messages.ts:56`](server/src/routes/messages.ts#L56), [`frontend/src/pages/Workspace.jsx:96-104`](frontend/src/pages/Workspace.jsx#L96-L104)
  - **Risk**: The server returns only the 50 most recent messages, and the frontend provides no scroll-up trigger to load older history, leaving past messages permanently inaccessible.
  - **Fix**: Attach an intersection observer or scroll listener to the top of `ChatPanel` to trigger fetching the next cursor.

- [ ] **20. Persistent Per-User Read States (`lastReadMessageId`)**
  - **Status**: ❌ Missing
  - **Evidence**: [`frontend/src/pages/Workspace.jsx:31-32, 165-168`](frontend/src/pages/Workspace.jsx#L31-L32), [`server/src/models/Message.ts:27-75`](server/src/models/Message.ts#L27-L75)
  - **Risk**: Unread counts are tracked strictly in React component state and are lost on every page refresh or cross-device session.
  - **Fix**: Add a `RoomMemberState` collection tracking `userId`, `roomId`, and `lastReadMessageId: ObjectId`.

- [ ] **21. Message Retention & Archival Policy**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/models/Message.ts:27-75`](server/src/models/Message.ts#L27-L75)
  - **Risk**: Unbounded database growth without a TTL index or archival policy increases storage costs and backup overhead.
  - **Fix**: Add a MongoDB TTL index or an automated daily cron job archiving messages older than 180 days.

- [ ] **22. Signed Object Storage URLs & Remove Disk Fallback in Production**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/config/cloudinary.ts:42-76`](server/src/config/cloudinary.ts#L42-L76), [`server/src/routes/upload.ts:36-47`](server/src/routes/upload.ts#L36-L47)
  - **Risk**: Cloudinary URLs are public and unsigned; local disk fallback writes to container ephemeral disk which is wiped on restart.
  - **Fix**: Require Cloudinary/S3 in production, remove local disk fallback, and configure private signed delivery URLs:
    ```ts
    cloudinary.url(publicId, { sign_url: true, type: 'authenticated', expires_at: Date.now() / 1000 + 3600 });
    ```

---

## Phase 4: File Upload & Input Hardening

- [ ] **23. Magic Byte Inspection for File Uploads**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/middleware/upload.ts:38`](server/src/middleware/upload.ts#L38)
  - **Risk**: Multer checks only the client-supplied MIME header; attackers can upload arbitrary scripts disguised as `.png` or `.pdf`.
  - **Fix**: Install `file-type` and validate buffer magic bytes before persisting:
    ```ts
    import { fileTypeFromBuffer } from 'file-type';
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_TYPES.includes(detected.mime)) throw new Error('File content does not match allowed types');
    ```

- [ ] **24. Safe Download Headers for Statically Served Files**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/server.ts:68`](server/src/server.ts#L68)
  - **Risk**: Files on `/uploads` are served without `Content-Disposition: attachment` or `X-Content-Type-Options: nosniff`, enabling stored XSS via SVG or HTML files.
  - **Fix**: Add header overrides to `express.static`:
    ```ts
    app.use('/uploads', express.static(uploadDir, {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'attachment');
      }
    }));
    ```

- [ ] **25. Private Room Attachment Access Control**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/upload.ts:13-62`](server/src/routes/upload.ts#L13-L62), [`server/src/server.ts:68`](server/src/server.ts#L68)
  - **Risk**: Uploaded files have unauthenticated URLs; anyone with the URL can view files attached to private or confidential channels.
  - **Fix**: Store private files in a restricted bucket and stream them through an authenticated route `GET /api/attachments/:id` that validates room membership.

- [ ] **26. Server-Side Schema Validation (Zod / Joi)**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/socket/handlers.ts:147, 203`](server/src/socket/handlers.ts#L147), [`server/src/routes/auth.ts:34-45`](server/src/routes/auth.ts#L34-L45)
  - **Risk**: Socket payloads and HTTP bodies accept unstructured `any` objects with manual, incomplete property validation.
  - **Fix**: Define Zod schemas and validate inputs across both REST routes and socket handlers:
    ```ts
    const MessagePayload = z.object({ roomId: z.string().length(24), content: z.string().max(2000) });
    ```

- [ ] **27. NoSQL Query Injection Sanitization**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/routes/auth.ts:122`](server/src/routes/auth.ts#L122), [`server/package.json:14-24`](server/package.json#L14-L24)
  - **Risk**: No query sanitizer is registered; nested objects with MongoDB operators (`$gt`, `$ne`) can be injected through JSON bodies.
  - **Fix**: Install `express-mongo-sanitize` and register `app.use(mongoSanitize())` in `server.ts`.

- [ ] **28. Cumulative Storage Quotas per User / Room**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/middleware/upload.ts:23`](server/src/middleware/upload.ts#L23)
  - **Risk**: Enforces a 10MB per-file cap, but users can upload unlimited files to exhaust Cloudinary storage limits or disk space.
  - **Fix**: Track total upload bytes per user in the database and reject uploads when quota (e.g., 250MB) is exceeded.

- [ ] **29. Malware / Antivirus Scanning Plan**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/upload.ts:13-62`](server/src/routes/upload.ts#L13-L62)
  - **Risk**: Malicious binaries or infected documents can be uploaded and distributed to workspace members.
  - **Fix**: Integrate an asynchronous ClamAV daemon (`clamscan`) or VirusTotal scanning pipeline for uploaded buffers.

---

## Phase 5: Operations, Testing, Frontend UX & Compliance

- [ ] **30. Redis Adapter for Multi-Node Socket.io Scaling**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/socket/index.ts:42-60`](server/src/socket/index.ts#L42-L60), [`server/src/socket/presence.ts:19-20`](server/src/socket/presence.ts#L19-L20)
  - **Risk**: All presence and socket rooms are kept in Node memory; multiple backend instances cannot communicate or synchronize events.
  - **Fix**: Install `@socket.io/redis-adapter` and `ioredis` and connect both pub/sub clients.

- [ ] **31. Offload Heavy Command Processing & Audit Logs from Hot Path**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/socket/handlers.ts:265-272`](server/src/socket/handlers.ts#L265-L272)
  - **Risk**: Synchronous command parsing, DB lookups, and audit log creation block the single-threaded event loop during message dispatch.
  - **Fix**: Use `setImmediate` or an asynchronous job queue (`bullmq`) for non-critical audit log and notification tasks.

- [ ] **32. Chat History Scroll Retention (Fix Auto-Scroll Jumping)**
  - **Status**: ❌ Missing
  - **Evidence**: [`frontend/src/components/ChatPanel.jsx:53-64`](frontend/src/components/ChatPanel.jsx#L53-L64)
  - **Risk**: `scrollToBottom` triggers unconditionally on every new message or typing notification, pulling users away while reading past history.
  - **Fix**: Check `isNearBottom` before auto-scrolling:
    ```js
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (isNearBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    ```

- [ ] **33. User Block (DMs) & Message Reporting Moderation Features**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/commands/pipeline.ts:205-375`](server/src/commands/pipeline.ts#L205-L375)
  - **Risk**: Kick, mute, and ban exist for rooms, but users have no mechanism to block direct message harassers or report abusive messages.
  - **Fix**: Add `blockedUsers: [ObjectId]` to `User` model and create a `POST /api/reports` endpoint.

- [ ] **34. Message Flood Control & Spam Detection**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/commands/pipeline.ts:20-36`](server/src/commands/pipeline.ts#L20-L36)
  - **Risk**: Commands enforce a 3-second cooldown, but regular text sends have no rate limit or duplicate detection.
  - **Fix**: Reject send requests if a user posts more than 5 messages within a 5-second window.

- [ ] **35. Web Push & Desktop Browser Notifications**
  - **Status**: 🟡 Partial
  - **Evidence**: [`frontend/src/pages/Workspace.jsx:40-44`](frontend/src/pages/Workspace.jsx#L40-L44)
  - **Risk**: Users miss incoming messages when the browser window is minimized or inactive.
  - **Fix**: Request permission via `Notification.requestPermission()` and show desktop alerts for incoming DMs/mentions.

- [ ] **36. Structured Logging without Sensitive Credentials**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/server.ts:95`](server/src/server.ts#L95), [`server/src/routes/auth.ts:92, 157`](server/src/routes/auth.ts#L92)
  - **Risk**: Raw `console.log` and `console.error` are unstructured and can leak tokens or passwords to stdout logs.
  - **Fix**: Install `pino` with redact filters on headers, tokens, and password fields.

- [ ] **37. Health Check with Database Connectivity & Graceful Shutdown**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/server.ts:71-76, 94-97`](server/src/server.ts#L71-L76)
  - **Risk**: `/` endpoint returns 200 even if MongoDB is disconnected; shutting down abruptly drops active WebSocket connections.
  - **Fix**: Add `mongoose.connection.readyState` check to `/health` and attach `SIGTERM`/`SIGINT` graceful draining handlers.

- [ ] **38. Operational Metrics (Latency, Error Rates, Connection Counts)**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/package.json:14-35`](server/package.json#L14-L35)
  - **Risk**: Zero operational insight into WebSocket connection spikes or p99 event loop latency degradations.
  - **Fix**: Integrate `prom-client` and expose `/metrics` for Prometheus scraping.

- [ ] **39. Automated Unit, API & Socket Integration Tests with CI Pipeline**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/selfCheck.ts:1-76`](server/src/selfCheck.ts#L1-L76), no `.github/workflows`
  - **Risk**: Only 3 assertion tests exist; regressions in authentication or RBAC can pass undetected into deployment.
  - **Fix**: Add Vitest/Supertest suites covering auth, room permissions, and socket handlers, with a GitHub Actions CI workflow.

- [ ] **40. GDPR User Data Export & Account Deletion Endpoints**
  - **Status**: ❌ Missing
  - **Evidence**: [`server/src/routes/users.ts:1-97`](server/src/routes/users.ts#L1-L97)
  - **Risk**: Non-compliant with GDPR Article 17 (Right to Erasure) and Article 20 (Data Portability).
  - **Fix**: Implement `DELETE /api/users/me` (anonymize messages, delete record) and `GET /api/users/me/export` (export user JSON).

- [ ] **41. Documented Terms of Service & Privacy Policy**
  - **Status**: ❌ Missing
  - **Evidence**: No legal documentation or consent checkboxes during registration.
  - **Risk**: Operating without documented terms or consent disclosures.
  - **Fix**: Add Privacy Policy and Terms of Service modals with explicit consent during registration.

- [ ] **42. End-to-End Encryption (E2EE) Consideration for Direct Messages**
  - **Status**: 🟡 Partial
  - **Evidence**: [`server/src/models/DirectMessage.ts:21-26`](server/src/models/DirectMessage.ts#L21-L26)
  - **Risk**: All direct messages are stored in plaintext in MongoDB; a database compromise exposes all private conversations.
  - **Fix**: Evaluate client-side Web Crypto API envelope encryption for 1-on-1 direct messages.
