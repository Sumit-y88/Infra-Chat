import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IAttachment } from './Message';

export interface IDirectMessage extends Document {
  _id: Types.ObjectId;
  content: string;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  edited: boolean;
  editedAt: Date | null;
  deletedForEveryone: boolean;
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
  markAsEdited(newContent: string): void;
  softDelete(): void;
}

const directMessageSchema = new Schema<IDirectMessage>(
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
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
directMessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

directMessageSchema.pre('validate', function () {
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

  if (this.sender && this.recipient && this.sender.toString() === this.recipient.toString()) {
    throw new Error('You cannot send a direct message to yourself.');
  }
});

directMessageSchema.methods.markAsEdited = function (newContent: string): void {
  this.content = newContent.trim();
  this.edited = true;
  this.editedAt = new Date();
};

directMessageSchema.methods.softDelete = function (): void {
  this.content = 'This message was deleted';
  this.deletedForEveryone = true;
  this.attachments = [];
};

export const DirectMessage: Model<IDirectMessage> = mongoose.model<IDirectMessage>(
  'DirectMessage',
  directMessageSchema
);
export default DirectMessage;
