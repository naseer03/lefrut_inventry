import express from 'express';
import JobRole from '../models/JobRole.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all job roles
router.get('/', requirePermission('job_roles', 'view'), async (req, res) => {
  try {
    const jobRoles = await JobRole.find();
    res.json(jobRoles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get job role by ID
router.get('/:id', requirePermission('job_roles', 'view'), async (req, res) => {
  try {
    const jobRole = await JobRole.findById(req.params.id);
    if (!jobRole) {
      return res.status(404).json({ message: 'Job role not found' });
    }
    res.json(jobRole);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create job role
router.post('/', requirePermission('job_roles', 'add'), async (req, res) => {
  try {
    const jobRole = new JobRole(req.body);
    await jobRole.save();
    res.status(201).json(jobRole);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Job role name already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update job role
router.put('/:id', requirePermission('job_roles', 'update'), async (req, res) => {
  try {
    const jobRole = await JobRole.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!jobRole) {
      return res.status(404).json({ message: 'Job role not found' });
    }
    
    res.json(jobRole);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete job role
router.delete('/:id', requirePermission('job_roles', 'delete'), async (req, res) => {
  try {
    const jobRole = await JobRole.findByIdAndDelete(req.params.id);
    if (!jobRole) {
      return res.status(404).json({ message: 'Job role not found' });
    }
    res.json({ message: 'Job role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;