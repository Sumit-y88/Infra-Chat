import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IRoomAnnouncement {
  text: string;
  setBy: Types.ObjectId | null;
  setAt: Date | null;
}

export interface IRoom extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  bannedUsers: Types.ObjectId[];
  moderators: Types.ObjectId[];
  isPrivate: boolean;
  roomType: 'public' | 'private' | 'broadcast';
  isArchived: boolean;
  announcement: IRoomAnnouncement;
  createdAt: Date;
  updatedAt: Date;
  isMember(userId: Types.ObjectId | string): boolean;
  isBanned(userId: Types.ObjectId | string): boolean;
  isRoomModerator(userId: Types.ObjectId | string): boolean;
  addMember(userId: Types.ObjectId | string): void;
  removeMember(userId: Types.ObjectId | string): void;
  banUser(userId: Types.ObjectId | string): void;
}

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Room name must be at least 2 characters'],
      maxlength: [50, 'Room name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bannedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    roomType: {
      type: String,
      enum: ['public', 'private', 'broadcast'],
      default: 'public',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    announcement: {
      text: { type: String, default: '' },
      setBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      setAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ createdBy: 1 });
roomSchema.index({ members: 1 });

// Ensure creator is automatically added as member and moderator, sync isPrivate with roomType
roomSchema.pre('save', function () {
  if (this.isModified('roomType')) {
    this.isPrivate = this.roomType === 'private';
  } else if (this.isModified('isPrivate')) {
    this.roomType = this.isPrivate ? 'private' : 'public';
  }

  if (
    this.createdBy &&
    !this.members.some((id) => id.toString() === this.createdBy.toString())
  ) {
    this.members.push(this.createdBy);
  }

  if (
    this.createdBy &&
    !this.moderators.some((id) => id.toString() === this.createdBy.toString())
  ) {
    this.moderators.push(this.createdBy);
  }
});

roomSchema.methods.isMember = function (userId: Types.ObjectId | string): boolean {
  const strId = userId.toString();
  return this.members.some((id: Types.ObjectId) => id.toString() === strId);
};

roomSchema.methods.isBanned = function (userId: Types.ObjectId | string): boolean {
  const strId = userId.toString();
  return this.bannedUsers.some((id: Types.ObjectId) => id.toString() === strId);
};

roomSchema.methods.isRoomModerator = function (userId: Types.ObjectId | string): boolean {
  const strId = userId.toString();
  return this.moderators.some((id: Types.ObjectId) => id.toString() === strId);
};

roomSchema.methods.addMember = function (userId: Types.ObjectId | string): void {
  if (!this.isMember(userId) && !this.isBanned(userId)) {
    this.members.push(new Types.ObjectId(userId.toString()));
  }
};

roomSchema.methods.removeMember = function (userId: Types.ObjectId | string): void {
  const strId = userId.toString();
  this.members = this.members.filter((id: Types.ObjectId) => id.toString() !== strId);
  this.moderators = this.moderators.filter((id: Types.ObjectId) => id.toString() !== strId);
};

roomSchema.methods.banUser = function (userId: Types.ObjectId | string): void {
  const strId = userId.toString();
  if (!this.isBanned(strId)) {
    this.bannedUsers.push(new Types.ObjectId(strId));
  }
  this.removeMember(strId);
};

export const Room: Model<IRoom> = mongoose.model<IRoom>('Room', roomSchema);
export default Room;
