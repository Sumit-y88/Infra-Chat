import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Room from '../models/Room';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import auth from '../middleware/auth';
import { requireRole, ROLES } from '../middleware/rbac';
import { getIO } from '../socket';
import { getUserSocketIds, removeUserFromRoom, getRoomOnlineUsers } from '../socket/presence';

const router = Router();

const isSameId = (a: any, b: any): boolean => a.toString() === b.toString();

// GET /api/rooms - List all rooms (public + joined private rooms)
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const rooms = await Room.find({
      $or: [{ isPrivate: false }, { members: currentUser._id }],
    })
      .populate('createdBy', 'username role')
      .populate('members', 'username role avatar')
      .sort({ createdAt: -1 });

    return res.json({ rooms });
  } catch (error: any) {
    console.error('Get Rooms Error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching rooms.' });
  }
});

// GET /api/rooms/:id - Get single room
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username role')
      .populate('members', 'username role avatar');

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    if (room.isPrivate && !room.isMember(currentUser._id) && currentUser.role < ROLES.SUPERADMIN) {
      return res.status(403).json({ message: 'You do not have access to this private room.' });
    }

    return res.json({ room });
  } catch (error: any) {
    console.error('Get Single Room Error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching room.' });
  }
});

// POST /api/rooms - Create room (Moderator+)
router.post('/', auth, requireRole(ROLES.MODERATOR), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    let { name, description, isPrivate, roomType } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Room name is required.' });
    }

    name = name.trim();
    description = description ? description.trim() : '';

    if (roomType && ['public', 'private', 'broadcast'].includes(roomType)) {
      isPrivate = roomType === 'private';
    } else {
      isPrivate = Boolean(isPrivate);
      roomType = isPrivate ? 'private' : 'public';
    }

    if (roomType === 'broadcast' && currentUser.role < ROLES.SUPERADMIN) {
      return res.status(403).json({ message: 'Only SuperAdmins can create broadcast rooms.' });
    }

    const existing = await Room.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Room name already exists.' });
    }

    const room = await Room.create({
      name,
      description,
      isPrivate,
      roomType,
      createdBy: currentUser._id,
      members: [currentUser._id],
      moderators: [currentUser._id],
    });

    await AuditLog.create({
      action: 'ROOM_CREATED',
      performedBy: currentUser._id,
      room: room._id,
      details: `${currentUser.username} created room ${room.name}`,
      metadata: { isPrivate: room.isPrivate },
    });

    await room.populate('createdBy', 'username role');
    await room.populate('members', 'username role avatar');

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.status(201).json({
      message: 'Room created successfully.',
      room,
    });
  } catch (error: any) {
    console.error('Create Room Error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    return res.status(500).json({ message: 'Server error while creating room.' });
  }
});

// POST /api/rooms/:id/join
router.post('/:id/join', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;

    if (room.isBanned(currentUser._id)) {
      return res.status(403).json({ message: 'You are banned from this room.' });
    }

    if (room.isMember(currentUser._id)) {
      return res.status(400).json({ message: 'Already a member of this room.' });
    }

    if (room.isPrivate) {
      return res.status(403).json({
        message: 'This is a private room. You need to be added by a moderator.',
      });
    }

    room.addMember(currentUser._id);
    await room.save();

    await room.populate('members', 'username role avatar');

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.json({
      message: 'Joined room successfully.',
      room,
    });
  } catch (error: any) {
    console.error('Join Room Error:', error.message);
    return res.status(500).json({ message: 'Server error while joining room.' });
  }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;

    if (!room.isMember(currentUser._id)) {
      return res.status(400).json({ message: 'You are not a member of this room.' });
    }

    const isCreator = isSameId(room.createdBy, currentUser._id);
    const isOnlyModerator =
      room.moderators.length === 1 &&
      room.moderators.some((id) => isSameId(id, currentUser._id));

    if (isCreator && isOnlyModerator) {
      return res.status(400).json({
        message: 'You cannot leave this room as the only moderator/creator.',
      });
    }

    room.removeMember(currentUser._id);
    room.moderators = room.moderators.filter((id) => !isSameId(id, currentUser._id));

    await room.save();

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.json({ message: 'Left the room successfully.' });
  } catch (error: any) {
    console.error('Leave Room Error:', error.message);
    return res.status(500).json({ message: 'Server error while leaving room.' });
  }
});

// GET /api/rooms/:id/members
router.get('/:id/members', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const room = await Room.findById(req.params.id).populate(
      'members',
      'username role avatar email'
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    if (room.isPrivate && !room.isMember(currentUser._id)) {
      return res.status(403).json({
        message: 'You do not have access to view members of this private room.',
      });
    }

    return res.json({ members: room.members });
  } catch (error: any) {
    console.error('Get Members Error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching members.' });
  }
});

// PATCH /api/rooms/:id - Update room details
router.patch('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const { name, description, isPrivate } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    const canManage =
      room.isRoomModerator(currentUser._id) || currentUser.role >= ROLES.SUPERADMIN;

    if (!canManage) {
      return res.status(403).json({
        message: 'Only room moderators or superadmins can update this room.',
      });
    }

    if (name && name.trim()) {
      const existing = await Room.findOne({
        name: name.trim(),
        _id: { $ne: room._id },
      });

      if (existing) {
        return res.status(400).json({ message: 'Another room with this name already exists.' });
      }

      room.name = name.trim();
    }

    if (description !== undefined) {
      room.description = description.trim();
    }

    if (typeof isPrivate === 'boolean') {
      room.isPrivate = isPrivate;
    }

    await room.save();

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.json({
      message: 'Room updated successfully.',
      room,
    });
  } catch (error: any) {
    console.error('Update Room Error:', error.message);
    return res.status(500).json({ message: 'Server error while updating room.' });
  }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', auth, requireRole(ROLES.SUPERADMIN), async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;

    await AuditLog.create({
      action: 'ROOM_DELETED',
      performedBy: currentUser._id,
      room: room._id,
      details: `${currentUser.username} deleted room ${room.name}`,
    });

    await Room.findByIdAndDelete(room._id);

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.json({ message: 'Room deleted successfully.' });
  } catch (error: any) {
    console.error('Delete Room Error:', error.message);
    return res.status(500).json({ message: 'Server error while deleting room.' });
  }
});

// POST /api/rooms/:id/members - Add member to room
router.post('/:id/members', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const { userId } = req.body;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Valid User ID is required.' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    const canManage =
      room.isRoomModerator(currentUser._id) || currentUser.role >= ROLES.SUPERADMIN;

    if (!canManage) {
      return res.status(403).json({
        message: 'Only room moderators or superadmins can add members.',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    if (room.isBanned(targetUser._id)) {
      return res.status(403).json({ message: 'User is banned from this room.' });
    }

    if (room.isMember(targetUser._id)) {
      return res.status(400).json({ message: 'User is already a member of this room.' });
    }

    room.addMember(targetUser._id);
    await room.save();
    await room.populate('members', 'username role avatar email');

    await AuditLog.create({
      action: 'USER_PROMOTED',
      performedBy: currentUser._id,
      targetUser: targetUser._id,
      room: room._id,
      details: `${currentUser.username} added ${targetUser.username} to room ${room.name}`,
      metadata: { actionType: 'ROOM_MEMBER_ADDED' },
    });

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.json({
      message: 'Member added successfully.',
      members: room.members,
    });
  } catch (error: any) {
    console.error('Add Member Error:', error.message);
    return res.status(500).json({ message: 'Server error while adding member.' });
  }
});

// DELETE /api/rooms/:id/members/:userId - Remove member from room
router.delete('/:id/members/:userId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid ID format.' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    const currentUser = req.user!;
    const canManage =
      room.isRoomModerator(currentUser._id) || currentUser.role >= ROLES.MODERATOR;

    if (!canManage) {
      return res.status(403).json({
        message: 'Only room moderators or superadmins can remove members.',
      });
    }

    if (!room.isMember(targetUser._id)) {
      return res.status(400).json({
        message: 'User is not a member of this room.',
      });
    }

    if (isSameId(targetUser._id, room.createdBy)) {
      return res.status(400).json({
        message: 'Room creator cannot be removed from the room.',
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          members: targetUser._id,
          moderators: targetUser._id,
        },
      },
      { new: true }
    ).populate('members', 'username role avatar email');

    await AuditLog.create({
      action: 'USER_KICKED',
      performedBy: currentUser._id,
      targetUser: targetUser._id,
      room: room._id,
      details: `${currentUser.username} removed ${targetUser.username} from room ${room.name}`,
      metadata: { actionType: 'ROOM_MEMBER_REMOVED' },
    });

    const io = getIO();
    if (io) {
      const roomId = req.params.id as string;
      const targetSocketIds = getUserSocketIds(targetUser._id.toString());

      for (const socketId of targetSocketIds) {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.leave(roomId);
          targetSocket.emit('room:kicked', {
            roomId,
            roomName: room.name,
            message: `You have been removed from ${room.name} by ${currentUser.username}.`,
          });
        }
      }

      removeUserFromRoom(roomId, targetUser._id.toString());

      io.to(roomId).emit('room:onlineUsers', {
        roomId,
        users: getRoomOnlineUsers(roomId),
      });

      io.to(roomId).emit('room:member_removed', {
        roomId,
        userId: targetUser._id,
        username: targetUser.username,
      });

      io.emit('room:listUpdated');
    }

    return res.json({
      message: 'Member removed successfully.',
      members: updatedRoom?.members || [],
    });
  } catch (error: any) {
    console.error('Remove Member Error:', error.message);
    return res.status(500).json({
      message: 'Server error while removing member.',
    });
  }
});

// PATCH /api/rooms/:id/archive - Archive/unarchive room (SuperAdmin only)
router.patch('/:id/archive', auth, requireRole(ROLES.SUPERADMIN), async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    room.isArchived = !room.isArchived;
    await room.save();

    await AuditLog.create({
      action: room.isArchived ? 'ROOM_ARCHIVED' : 'ROOM_UNARCHIVED',
      performedBy: currentUser._id,
      room: room._id,
      details: `${currentUser.username} ${room.isArchived ? 'archived' : 'unarchived'} room ${room.name}`,
    });

    const io = getIO();
    if (io) {
      io.emit('room:listUpdated');
    }

    return res.json({
      message: `Room ${room.isArchived ? 'archived' : 'unarchived'} successfully.`,
      room,
    });
  } catch (error: any) {
    console.error('Archive Room Error:', error.message);
    return res.status(500).json({ message: 'Server error while archiving room.' });
  }
});

export default router;
