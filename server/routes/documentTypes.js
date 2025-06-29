import express from 'express';
import DocumentType from '../models/DocumentType.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Get all document types
router.get('/', requirePermission('document_types', 'view'), async (req, res) => {
  try {
    const documentTypes = await DocumentType.find();
    res.json(documentTypes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get document type by ID
router.get('/:id', requirePermission('document_types', 'view'), async (req, res) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    if (!documentType) {
      return res.status(404).json({ message: 'Document type not found' });
    }
    res.json(documentType);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create document type
router.post('/', requirePermission('document_types', 'add'), async (req, res) => {
  try {
    const documentType = new DocumentType(req.body);
    await documentType.save();
    res.status(201).json(documentType);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Document type name already exists' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Update document type
router.put('/:id', requirePermission('document_types', 'update'), async (req, res) => {
  try {
    const documentType = await DocumentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!documentType) {
      return res.status(404).json({ message: 'Document type not found' });
    }
    
    res.json(documentType);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete document type
router.delete('/:id', requirePermission('document_types', 'delete'), async (req, res) => {
  try {
    const documentType = await DocumentType.findByIdAndDelete(req.params.id);
    if (!documentType) {
      return res.status(404).json({ message: 'Document type not found' });
    }
    res.json({ message: 'Document type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;