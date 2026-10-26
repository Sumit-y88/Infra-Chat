// In-memory presence tracker
// Structure:
// roomId -> Map(userId -> { userId, username, socketIds: Set<string> })

export type PresenceStatus = 'online' | 'away' | 'offline';

interface RoomUserEntry {
  userId: string;
  username: string;
  socketIds: Set<string>;
}

interface UserPresenceEntry {
  status: PresenceStatus;
  lastActivity: number;
  timer?: NodeJS.Timeout;
}

const onlineUsers = new Map<string, Map<string, RoomUserEntry>>();
const userSockets = new Map<string, Set<string>>(); // userId -> Set(socketId)

const AWAY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const userPresence = new Map<string, UserPresenceEntry>();
let presenceChangeCallback: ((userId: string, status: PresenceStatus) => void) | null = null;

export const setPresenceCallback = (
  callback: (userId: string, status: PresenceStatus) => void
): void => {
  presenceChangeCallback = callback;
};

export const getUserStatus = (userId: string): PresenceStatus => {
  const entry = userPresence.get(userId);
  return entry ? entry.status : 'offline';
};

export const setUserOnline = (userId: string): void => {
  const existing = userPresence.get(userId);
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(() => {
    const entry = userPresence.get(userId);
    if (entry && entry.status === 'online') {
      entry.status = 'away';
      if (presenceChangeCallback) {
        presenceChangeCallback(userId, 'away');
      }
    }
  }, AWAY_TIMEOUT_MS);

  const oldStatus = existing ? existing.status : 'offline';
  userPresence.set(userId, { status: 'online', lastActivity: Date.now(), timer });

  if (oldStatus !== 'online' && presenceChangeCallback) {
    presenceChangeCallback(userId, 'online');
  }
};

export const touchUserActivity = (userId: string): void => {
  const entry = userPresence.get(userId);
  if (!entry) return;

  if (entry.timer) {
    clearTimeout(entry.timer);
  }

  entry.lastActivity = Date.now();
  const wasAway = entry.status === 'away';
  entry.status = 'online';

  entry.timer = setTimeout(() => {
    const e = userPresence.get(userId);
    if (e && e.status === 'online') {
      e.status = 'away';
      if (presenceChangeCallback) {
        presenceChangeCallback(userId, 'away');
      }
    }
  }, AWAY_TIMEOUT_MS);

  if (wasAway && presenceChangeCallback) {
    presenceChangeCallback(userId, 'online');
  }
};

export const setUserOffline = (userId: string): void => {
  // Only go offline if no remaining active sockets for this user
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    const entry = userPresence.get(userId);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    userPresence.delete(userId);
    if (presenceChangeCallback) {
      presenceChangeCallback(userId, 'offline');
    }
  }
};

export const getAllUserStatuses = (): Record<string, PresenceStatus> => {
  const statuses: Record<string, PresenceStatus> = {};
  for (const [userId, entry] of userPresence.entries()) {
    statuses[userId] = entry.status;
  }
  return statuses;
};

export const addUserToRoom = (
  roomId: string,
  userId: string,
  username: string,
  socketId: string
): void => {
  if (!onlineUsers.has(roomId)) {
    onlineUsers.set(roomId, new Map());
  }

  const roomUsers = onlineUsers.get(roomId)!;

  if (!roomUsers.has(userId)) {
    roomUsers.set(userId, {
      userId,
      username,
      socketIds: new Set(),
    });
  }

  roomUsers.get(userId)!.socketIds.add(socketId);
};

export const removeUserFromRoom = (
  roomId: string,
  userId: string,
  socketId: string | null = null
): void => {
  if (!onlineUsers.has(roomId)) return;

  const roomUsers = onlineUsers.get(roomId)!;
  const userEntry = roomUsers.get(userId);

  if (!userEntry) return;

  if (socketId) {
    userEntry.socketIds.delete(socketId);

    if (userEntry.socketIds.size === 0) {
      roomUsers.delete(userId);
    }
  } else {
    roomUsers.delete(userId);
  }

  if (roomUsers.size === 0) {
    onlineUsers.delete(roomId);
  }
};

export const removeUserFromAllRooms = (
  socketId: string
): Array<{ roomId: string; userId: string; username: string }> => {
  const removedFrom: Array<{ roomId: string; userId: string; username: string }> = [];

  for (const [roomId, users] of onlineUsers.entries()) {
    for (const [userId, data] of users.entries()) {
      if (data.socketIds.has(socketId)) {
        data.socketIds.delete(socketId);

        if (data.socketIds.size === 0) {
          users.delete(userId);
          removedFrom.push({
            roomId,
            userId,
            username: data.username,
          });
        }
      }
    }

    if (users.size === 0) {
      onlineUsers.delete(roomId);
    }
  }

  return removedFrom;
};

export const getRoomOnlineUsers = (
  roomId: string
): Array<{ userId: string; username: string; status: PresenceStatus }> => {
  if (!onlineUsers.has(roomId)) return [];

  return Array.from(onlineUsers.get(roomId)!.values()).map((user) => ({
    userId: user.userId,
    username: user.username,
    status: getUserStatus(user.userId),
  }));
};

export const isUserOnlineInRoom = (roomId: string, userId: string): boolean => {
  if (!onlineUsers.has(roomId)) return false;
  return onlineUsers.get(roomId)!.has(userId);
};

export const addUserSocket = (userId: string, socketId: string): void => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);
};

export const removeUserSocket = (userId: string, socketId: string): void => {
  const set = userSockets.get(userId);
  if (!set) return;

  set.delete(socketId);

  if (set.size === 0) {
    userSockets.delete(userId);
  }
};

export const getUserSocketIds = (userId: string): string[] => {
  const set = userSockets.get(userId);
  if (!set) return [];
  return Array.from(set);
};

export default {
  addUserToRoom,
  removeUserFromRoom,
  removeUserFromAllRooms,
  getRoomOnlineUsers,
  isUserOnlineInRoom,
  addUserSocket,
  removeUserSocket,
  getUserSocketIds,
  setUserOnline,
  setUserOffline,
  touchUserActivity,
  getUserStatus,
  getAllUserStatuses,
  setPresenceCallback,
};
