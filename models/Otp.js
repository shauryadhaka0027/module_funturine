import mongoose, { Schema } from 'mongoose';

const otpSchema = new Schema({
  otp: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Dealer'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 1 * 60 * 1000)
  }
}, {
  timestamps: true
});

export default mongoose.model('Otp', otpSchema);
