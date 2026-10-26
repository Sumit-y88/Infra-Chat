import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message';
import Room from '../models/Room';
import AuditLog from '../models/AuditLog';
import auth from '../middleware/auth';
import { ROLES } from '../middleware/rbac';
import { getIO } from '../socket';
import { deleteFileStorage } from '../config/cloudinary';

const router = Router();

const isSameId = (a: any, b: any): boolean => a.toString() === b.toString();

// GET /api/rooms/:id/messages
router.get('/:id/messages', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid room ID format.' });
    }

    let { page = 1, limit = 50 } = req.query as any;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    const room = await Room.findById(req.params.id).populate('createdBy', 'username role');

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    const isMember = room.members.some((memberId: any) => isSameId(memberId, currentUser._id));
    const isSuperAdmin = currentUser.role >= ROLES.SUPERADMIN;

    if (room.isBanned(currentUser._id) && !isSuperAdmin) {
      return res.status(403).json({ message: 'You are banned from this room.' });
    }

    if (!isMember && !isSuperAdmin) {
      return res.status(403).json({ message: 'You are not a member of this room.' });
    }

    const query = { room: req.params.id };

    const [messages, total] = await Promise.all([
      Message.find(query)
        .populate('sender', 'username role avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments(query),
    ]);

    return res.json({
      room: {
        id: room._id,
        name: room.name,
        isPrivate: room.isPrivate,
        createdBy: room.createdBy,
      },
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Get Messages Error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching messages.' });
  }
});

// PATCH /api/rooms/messages/:messageId
router.patch('/messages/:messageId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format.' });
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Updated content is required.' });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const currentUser = req.user!;

    if (!isSameId(message.sender, currentUser._id)) {
      return res.status(403).json({ message: 'You can edit only your own messages.' });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: 'Deleted messages cannot be edited.' });
    }

    message.markAsEdited(content);
    await message.save();
    await message.populate('sender', 'username role avatar');

    const io = getIO();
    if (io) {
      io.to(message.room.toString()).emit('message:updated', {
        messageId: message._id.toString(),
        roomId: message.room.toString(),
        updatedMessage: message,
      });
    }

    return res.json({
      message: 'Message updated successfully.',
      updatedMessage: message,
    });
  } catch (error: any) {
    console.error('Edit Message Error:', error.message);
    return res.status(500).json({ message: 'Server error while editing message.' });
  }
});

// DELETE /api/rooms/messages/:messageId
router.delete('/messages/:messageId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format.' });
    }

    const message = await Message.findById(req.params.messageId).populate('room');
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const room = await Room.findById(message.room._id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const currentUser = req.user!;
    const canDeleteOwn = isSameId(message.sender, currentUser._id);
    const canModerate =
      room.isRoomModerator(currentUser._id) || currentUser.role >= ROLES.SUPERADMIN;

    if (!canDeleteOwn && !canModerate) {
      return res.status(403).json({
        message: 'You do not have permission to delete this message.',
      });
    }

    // Delete attached files from Cloudinary and/or local storage
    if (Array.isArray(message.attachments) && message.attachments.length > 0) {
      for (const att of message.attachments) {
        await deleteFileStorage(att);
      }
    }

    message.softDelete();
    await message.save();

    await AuditLog.create({
      action: 'MESSAGE_DELETED',
      performedBy: currentUser._id,
      room: room._id,
      targetUser: message.sender,
      details: `${currentUser.username} deleted a message in room ${room.name}`,
      metadata: {
        messageId: message._id.toString(),
      },
    });

    await message.populate('sender', 'username role avatar');

    const io = getIO();
    if (io) {
      io.to(room._id.toString()).emit('message:deleted', {
        messageId: message._id.toString(),
        roomId: room._id.toString(),
        deletedMessage: message,
      });
    }

    return res.json({
      message: 'Message deleted successfully.',
      deletedMessage: message,
    });
  } catch (error: any) {
    console.error('Delete Message Error:', error.message);
    return res.status(500).json({ message: 'Server error while deleting message.' });
  }
});

export default router;
