import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  role: number; // 1 = Member, 2 = Moderator, 3 = SuperAdmin
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil: Date | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isSuperAdmin(): boolean;
  isModerator(): boolean;
  checkMuteStatus(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: Number,
      enum: [1, 2, 3], // 1 = Member, 2 = Moderator, 3 = SuperAdmin
      default: 1,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Role helper methods
userSchema.methods.isSuperAdmin = function (): boolean {
  return this.role === 3;
};

userSchema.methods.isModerator = function (): boolean {
  return this.role >= 2;
};

// Auto-check mute expiry; returns true if status changed
userSchema.methods.checkMuteStatus = function (): boolean {
  if (this.isMuted && this.mutedUntil && this.mutedUntil < new Date()) {
    this.isMuted = false;
    this.mutedUntil = null;
    return true;
  }
  return false;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
