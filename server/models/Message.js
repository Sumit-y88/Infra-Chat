const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'system', 'command'],
      default: 'text',
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        url: { type: String, required: true },
        name: { type: String, required: true },
        size: { type: Number },
        type: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient retrieval
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ type: 1 });

// Prevent empty messages after trimming (allow empty content if attachments exist)
messageSchema.pre('validate', function (next) {
  if (typeof this.content === 'string') {
    this.content = this.content.trim();
  }

  // Allow empty content when attachments are present
  const hasAttachments = this.attachments && this.attachments.length > 0;

  if (!this.content && !hasAttachments) {
    return next(new Error('Message content is required'));
  }

  // Ensure content is at least empty string when only attachments are sent
  if (!this.content && hasAttachments) {
    this.content = '';
  }

  next();
});

// Helper: mark message as edited
messageSchema.methods.markAsEdited = function (newContent) {
  this.content = newContent.trim();
  this.edited = true;
  this.editedAt = new Date();
};

// Helper: soft delete for everyone
messageSchema.methods.softDelete = function () {
  this.content = 'This message was deleted';
  this.deletedForEveryone = true;
  this.type = 'system';
};

module.exports = mongoose.model('Message', messageSchema);
