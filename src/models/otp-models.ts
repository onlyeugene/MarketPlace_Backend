import mongoose, { Schema, Document } from 'mongoose';

export interface IOTPDocument extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  type: 'registration' | 'email-update';
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['registration', 'email-update'], required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOTPDocument>('OTP', OTPSchema);