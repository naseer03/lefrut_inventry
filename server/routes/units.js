import express from 'express';
import Unit from '../models/Unit.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all units
router.get('/', requirePermission('units', 'view'), async (req, res) => {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unit by ID
router.get('/:id', requirePermission('units', 'view'), async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create unit
router.post('/', requirePermission('units', 'add'), async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Unit name already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update unit
router.put('/:id', requirePermission('units', 'update'), async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete unit
router.delete('/:id', requirePermission('units', 'delete'), async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;