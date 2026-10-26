import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import DirectMessage from '../models/DirectMessage';
import auth from '../middleware/auth';
import { getIO } from '../socket';
import { getUserSocketIds } from '../socket/presence';
import { deleteFileStorage } from '../config/cloudinary';

const router = Router();

const isSameId = (a: any, b: any): boolean => a.toString() === b.toString();

// PATCH /api/direct-message-actions/:messageId
router.patch('/:messageId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format.' });
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Updated content is required.' });
    }

    const message = await DirectMessage.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Direct message not found.' });
    }

    const currentUser = req.user!;
    if (!isSameId(message.sender, currentUser._id)) {
      return res.status(403).json({ message: 'You can edit only your own direct messages.' });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: 'Deleted messages cannot be edited.' });
    }

    message.markAsEdited(content);
    await message.save();
    await message.populate('sender', 'username role avatar');
    await message.populate('recipient', 'username role avatar');

    const io = getIO();
    if (io) {
      const recipientSockets = getUserSocketIds(message.recipient._id.toString());
      const senderSockets = getUserSocketIds(message.sender._id.toString());
      const allSockets = Array.from(new Set([...recipientSockets, ...senderSockets]));

      allSockets.forEach((sockId) => {
        io.to(sockId).emit('dm:updated', {
          messageId: message._id.toString(),
          updatedMessage: message,
        });
      });
    }

    return res.json({
      message: 'Direct message updated successfully.',
      updatedMessage: message,
    });
  } catch (error: any) {
    console.error('Edit Direct Message Error:', error.message);
    return res.status(500).json({ message: 'Server error while editing direct message.' });
  }
});

// DELETE /api/direct-message-actions/:messageId
router.delete('/:messageId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format.' });
    }

    const message = await DirectMessage.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Direct message not found.' });
    }

    const currentUser = req.user!;
    if (!isSameId(message.sender, currentUser._id)) {
      return res.status(403).json({ message: 'You can delete only your own direct messages.' });
    }

    // Delete attached files from Cloudinary and/or local storage
    if (Array.isArray(message.attachments) && message.attachments.length > 0) {
      for (const att of message.attachments) {
        await deleteFileStorage(att);
      }
    }

    message.softDelete();
    await message.save();
    await message.populate('sender', 'username role avatar');
    await message.populate('recipient', 'username role avatar');

    const io = getIO();
    if (io) {
      const recipientSockets = getUserSocketIds(message.recipient._id.toString());
      const senderSockets = getUserSocketIds(message.sender._id.toString());
      const allSockets = Array.from(new Set([...recipientSockets, ...senderSockets]));

      allSockets.forEach((sockId) => {
        io.to(sockId).emit('dm:deleted', {
          messageId: message._id.toString(),
          deletedMessage: message,
        });
      });
    }

    return res.json({
      message: 'Direct message deleted successfully.',
      deletedMessage: message,
    });
  } catch (error: any) {
    console.error('Delete Direct Message Error:', error.message);
    return res.status(500).json({ message: 'Server error while deleting direct message.' });
  }
});

export default router;
