import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
  publicId?: string;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  content: string;
  sender: Types.ObjectId;
  room: Types.ObjectId;
  type: 'text' | 'system' | 'command';
  edited: boolean;
  editedAt: Date | null;
  deletedForEveryone: boolean;
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
  markAsEdited(newContent: string): void;
  softDelete(): void;
}

const messageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: Schema.Types.ObjectId,
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
        publicId: { type: String, default: null },
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ type: 1 });

messageSchema.pre('validate', function () {
  if (typeof this.content === 'string') {
    this.content = this.content.trim();
  }

  const hasAttachments = Boolean(this.attachments && this.attachments.length > 0);

  if (!this.content && !hasAttachments) {
    throw new Error('Message content is required');
  }

  if (!this.content && hasAttachments) {
    this.content = '';
  }
});

messageSchema.methods.markAsEdited = function (newContent: string): void {
  this.content = newContent.trim();
  this.edited = true;
  this.editedAt = new Date();
};

messageSchema.methods.softDelete = function (): void {
  this.content = 'This message was deleted';
  this.deletedForEveryone = true;
  this.type = 'system';
  this.attachments = [];
};

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
