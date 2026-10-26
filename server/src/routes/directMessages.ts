import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import DirectMessage from '../models/DirectMessage';
import User from '../models/User';
import auth from '../middleware/auth';

const router = Router();

const isSameId = (a: any, b: any): boolean => a.toString() === b.toString();

// GET /api/direct-messages/:userId
router.get('/:userId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    let { page = 1, limit = 50 } = req.query as any;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    const otherUser = await User.findById(req.params.userId)
      .select('username role avatar isBanned')
      .lean();

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentUser = req.user!;
    const query = {
      $or: [
        { sender: currentUser._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: currentUser._id },
      ],
    };

    const [messages, total] = await Promise.all([
      DirectMessage.find(query)
        .populate('sender', 'username role avatar')
        .populate('recipient', 'username role avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DirectMessage.countDocuments(query),
    ]);

    return res.json({
      user: otherUser,
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
    console.error('Get Direct Messages Error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching direct messages.' });
  }
});

// POST /api/direct-messages/:userId
router.post('/:userId', auth, async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid recipient ID format.' });
    }

    const { content, attachments } = req.body;
    const trimmedContent = content ? content.trim() : '';
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!trimmedContent && !hasAttachments) {
      return res.status(400).json({ message: 'Message content or attachment is required.' });
    }

    const recipient = await User.findById(req.params.userId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }

    if (recipient.isBanned) {
      return res.status(403).json({ message: 'Cannot send message to this user.' });
    }

    const currentUser = req.user!;
    if (isSameId(currentUser._id, recipient._id)) {
      return res.status(400).json({ message: 'You cannot message yourself.' });
    }

    const dmData: Record<string, any> = {
      content: trimmedContent,
      sender: currentUser._id,
      recipient: recipient._id,
    };

    if (hasAttachments) {
      dmData.attachments = attachments;
    }

    const message = await DirectMessage.create(dmData);

    await message.populate('sender', 'username role avatar');
    await message.populate('recipient', 'username role avatar');

    return res.status(201).json({
      message: 'Direct message sent successfully.',
      directMessage: message,
    });
  } catch (error: any) {
    console.error('Send Direct Message Error:', error.message);
    return res.status(500).json({ message: 'Server error while sending direct message.' });
  }
});

export default router;
