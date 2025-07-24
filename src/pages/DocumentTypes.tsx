import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import DocumentTypeModal from '../components/DocumentTypeModal';

interface DocumentType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const DocumentTypes: React.FC = () => {
  const { hasPermission } = useAuth();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    const filtered = documentTypes.filter(docType =>
      docType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docType.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocumentTypes(filtered);
  }, [documentTypes, searchTerm]);

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/document-types');
      setDocumentTypes(response.data);
    } catch (error) {
      toast.error('Failed to fetch document types');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocumentType = async (docTypeId: string) => {
    if (!window.confirm('Are you sure you want to delete this document type?')) return;

    try {
      await api.delete(`/document-types/${docTypeId}`);
      setDocumentTypes(documentTypes.filter(d => d._id !== docTypeId));
      toast.success('Document type deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document type');
    }
  };

  const handleDocumentTypeSaved = (savedDocumentType: DocumentType) => {
    if (selectedDocumentType) {
      setDocumentTypes(documentTypes.map(d => d._id === savedDocumentType._id ? savedDocumentType : d));
    } else {
      setDocumentTypes([...documentTypes, savedDocumentType]);
    }
    setShowModal(false);
    setSelectedDocumentType(null);
  };

  const handleEditDocumentType = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">Document Types</h1>
          {hasPermission('document_types', 'add') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Document Type
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search document types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Document Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocumentTypes.map((documentType) => (
            <div
              key={documentType._id}
              className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      {documentType.name}
                    </h3>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  documentType.isActive 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {documentType.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-4 min-h-[3rem]">
                {documentType.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Created: {new Date(documentType.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  {hasPermission('document_types', 'update') && (
                    <button
                      onClick={() => handleEditDocumentType(documentType)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Document Type"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {hasPermission('document_types', 'delete') && (
                    <button
                      onClick={() => handleDeleteDocumentType(documentType._id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Document Type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDocumentTypes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Document Types Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm ? 'No document types match your search.' : 'Get started by creating your first document type.'}
            </p>
            {hasPermission('document_types', 'add') && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Document Type
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <DocumentTypeModal
          documentType={selectedDocumentType}
          onClose={() => {
            setShowModal(false);
            setSelectedDocumentType(null);
          }}
          onSave={handleDocumentTypeSaved}
        />
      )}
    </Layout>
  );
};

export default DocumentTypes;