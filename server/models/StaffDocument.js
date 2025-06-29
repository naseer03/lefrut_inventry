import mongoose from 'mongoose';

const staffDocumentSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  documentTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentType',
    required: true
  },
  documentNumber: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate document types for same staff
staffDocumentSchema.index({ staffId: 1, documentTypeId: 1 }, { unique: true });

export default mongoose.model('StaffDocument', staffDocumentSchema);