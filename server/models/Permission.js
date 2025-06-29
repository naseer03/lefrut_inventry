import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  actions: [{
    name: {
      type: String,
      enum: ['view', 'add', 'update', 'delete'],
      required: true
    },
    displayName: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Permission', permissionSchema);