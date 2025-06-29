import express from 'express';
import State from '../models/State.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all states
router.get('/', requirePermission('states', 'view'), async (req, res) => {
  try {
    const states = await State.find();
    res.json(states);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get state by ID
router.get('/:id', requirePermission('states', 'view'), async (req, res) => {
  try {
    const state = await State.findById(req.params.id);
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create state
router.post('/', requirePermission('states', 'add'), async (req, res) => {
  try {
    const state = new State(req.body);
    await state.save();
    res.status(201).json(state);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'State name already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update state
router.put('/:id', requirePermission('states', 'update'), async (req, res) => {
  try {
    const state = await State.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete state
router.delete('/:id', requirePermission('states', 'delete'), async (req, res) => {
  try {
    const state = await State.findByIdAndDelete(req.params.id);
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.json({ message: 'State deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;