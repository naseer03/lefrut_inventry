import mongoose from 'mongoose';

const roleDocumentRequiredSchema = new mongoose.Schema({
  jobRoleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRole',
    required: true
  },
  documentTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentType',
    required: true
  },
  isMandatory: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate entries
roleDocumentRequiredSchema.index({ jobRoleId: 1, documentTypeId: 1 }, { unique: true });

export default mongoose.model('RoleDocumentRequired', roleDocumentRequiredSchema);