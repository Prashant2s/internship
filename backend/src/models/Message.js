import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomType: { type: String, enum: ['game', 'group'], required: true, index: true },
    roomKey: { type: String, required: true, index: true }, // gameSlug or groupId
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.model('Message', messageSchema);
