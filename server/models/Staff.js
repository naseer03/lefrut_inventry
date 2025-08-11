import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const staffSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    trim: true
    // Remove required: true as we'll auto-generate it
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows multiple null values
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  shiftTiming: {
    type: String,
    trim: true,
    default: ''
  },
  dateOfJoining: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    min: 0
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  idProofType: {
    type: String,
    trim: true,
    enum: ['Aadhar Card', 'PAN Card', 'Passport', 'Driving License', 'Voter ID', 'Other'],
    default: ''
  },
  idProofNumber: {
    type: String,
    trim: true,
    default: ''
  },
  idProofDocument: {
    type: String,
    default: ''
  },
  // Truck Driver Information
  drivingLicenseNumber: {
    type: String,
    trim: true,
    default: ''
  },
  drivingLicenseExpiry: {
    type: Date,
    default: null
  },
  drivingLicenseDocument: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  jobRoles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRole'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate employee ID before saving
staffSchema.pre('save', async function(next) {
  try {
    // Generate employee ID only if it's not already set
    if (!this.employeeId) {
      this.employeeId = await generateEmployeeId();
    }

    // Hash password only if it's modified
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Function to generate unique employee ID
async function generateEmployeeId() {
  const currentYear = new Date().getFullYear();
  const prefix = `EMP${currentYear}`;
  
  // Find the latest employee ID for the current year
  const latestStaff = await mongoose.model('Staff').findOne({
    employeeId: { $regex: `^${prefix}` }
  }).sort({ employeeId: -1 });

  let sequence = 1;
  
  if (latestStaff && latestStaff.employeeId) {
    // Extract sequence number from latest employee ID
    const lastSequence = parseInt(latestStaff.employeeId.replace(prefix, ''));
    sequence = lastSequence + 1;
  }
  
  // Generate employee ID with zero-padded sequence (4 digits)
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

// Compare password method
staffSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Staff', staffSchema);