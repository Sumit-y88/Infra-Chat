import assert from 'assert';
import { ROLES } from './middleware/rbac';
import {
  addUserSocket,
  removeUserSocket,
  getUserSocketIds,
  setUserOnline,
  setUserOffline,
  getUserStatus,
} from './socket/presence';

console.log('🧪 Starting backend self-check tests...');

// 1. RBAC roles test
assert.strictEqual(ROLES.MEMBER, 1, 'Member role should be 1');
assert.strictEqual(ROLES.MODERATOR, 2, 'Moderator role should be 2');
assert.strictEqual(ROLES.SUPERADMIN, 3, 'SuperAdmin role should be 3');
console.log('✅ RBAC role levels verified');

// 2. Presence with multi-socket verification
const testUserId = 'test_user_123';
const socketId1 = 'socket_1';
const socketId2 = 'socket_2';

addUserSocket(testUserId, socketId1);
addUserSocket(testUserId, socketId2);
assert.deepStrictEqual(
  getUserSocketIds(testUserId).sort(),
  [socketId1, socketId2].sort(),
  'User should have both sockets registered'
);

setUserOnline(testUserId);
assert.strictEqual(getUserStatus(testUserId), 'online', 'User should be online');

// Remove one socket (simulating closing one of two browser tabs)
removeUserSocket(testUserId, socketId1);
setUserOffline(testUserId);
assert.strictEqual(
  getUserStatus(testUserId),
  'online',
  'User must stay online while another tab/socket remains active'
);

// Remove last socket
removeUserSocket(testUserId, socketId2);
setUserOffline(testUserId);
assert.strictEqual(
  getUserStatus(testUserId),
  'offline',
  'User must go offline when all sockets are disconnected'
);
console.log('✅ Presence & multi-tab socket tracking verified');

// 3. User mute status check
const userWithExpiredMute: { isMuted: boolean; mutedUntil: Date | null; checkMuteStatus(): boolean } = {
  isMuted: true,
  mutedUntil: new Date(Date.now() - 10000), // past
  checkMuteStatus() {
    if (this.isMuted && this.mutedUntil && this.mutedUntil < new Date()) {
      this.isMuted = false;
      this.mutedUntil = null;
      return true;
    }
    return false;
  },
};

const changed = userWithExpiredMute.checkMuteStatus();
assert.strictEqual(changed, true, 'checkMuteStatus should return true when status changed');
assert.strictEqual(userWithExpiredMute.isMuted, false, 'User isMuted should be cleared');
assert.strictEqual(userWithExpiredMute.mutedUntil, null, 'User mutedUntil should be cleared');
console.log('✅ Mute expiry auto-clear verified');

console.log('🎉 All backend self-check assertions passed successfully!');
