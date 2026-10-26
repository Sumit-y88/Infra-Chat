import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type AuditAction =
  | 'USER_KICKED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'USER_MUTED'
  | 'USER_UNMUTED'
  | 'USER_PROMOTED'
  | 'USER_DEMOTED'
  | 'ROOM_CREATED'
  | 'ROOM_DELETED'
  | 'ROOM_ARCHIVED'
  | 'ROOM_UNARCHIVED'
  | 'ROOM_ANNOUNCEMENT'
  | 'MESSAGE_DELETED';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  action: AuditAction;
  performedBy: Types.ObjectId;
  targetUser: Types.ObjectId | null;
  room: Types.ObjectId | null;
  details: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'USER_KICKED',
        'USER_BANNED',
        'USER_UNBANNED',
        'USER_MUTED',
        'USER_UNMUTED',
        'USER_PROMOTED',
        'USER_DEMOTED',
        'ROOM_CREATED',
        'ROOM_DELETED',
        'ROOM_ARCHIVED',
        'ROOM_UNARCHIVED',
        'ROOM_ANNOUNCEMENT',
        'MESSAGE_DELETED',
      ],
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Details cannot exceed 500 characters'],
      default: '',
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ room: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });

// Prevent modifications (append-only logs)
const preventModification = () => {
  throw new Error('Audit logs are append-only and cannot be modified or deleted');
};

auditLogSchema.pre(
  [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'findOneAndDelete',
    'deleteOne',
    'deleteMany',
  ],
  preventModification
);

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
