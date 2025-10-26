'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { Product, ProductDocument, ContentSection } from '@/types';
import DocumentUpload from '@/components/products/DocumentUpload';
import DocumentList from '@/components/products/DocumentList';
import { useAuth } from '@/hooks/useAuth';

export default function EditProductPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    target_market: '',
    features: [''],
    unique_selling_points: [''],
    competitors: [''],
    content_sections: [] as ContentSection[]
  });

  // Content section editing
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState<ContentSection>({ name: '', content: '' });

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchDocuments();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.products.get(productId);
      const prod = response.data;
      setProduct(prod);

      // Populate form
      setFormData({
        name: prod.name || '',
        description: prod.description || '',
        price: prod.price?.toString() || '',
        target_market: prod.target_market || '',
        features: prod.features && prod.features.length > 0 ? prod.features : [''],
        unique_selling_points: prod.unique_selling_points && prod.unique_selling_points.length > 0 ? prod.unique_selling_points : [''],
        competitors: prod.competitors && prod.competitors.length > 0 ? prod.competitors : [''],
        content_sections: prod.content_sections || []
      });
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      setError(err.response?.data?.detail || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.products.listDocuments(productId);
      setDocuments(response.data);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayFieldChange = (field: 'features' | 'unique_selling_points' | 'competitors', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleAddArrayField = (field: 'features' | 'unique_selling_points' | 'competitors') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const handleRemoveArrayField = (field: 'features' | 'unique_selling_points' | 'competitors', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray.length > 0 ? newArray : [''] });
  };

  const handleSaveChanges = async () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        target_market: formData.target_market.trim() || undefined,
        features: formData.features.filter(f => f.trim().length > 0),
        unique_selling_points: formData.unique_selling_points.filter(u => u.trim().length > 0),
        competitors: formData.competitors.filter(c => c.trim().length > 0),
        content_sections: formData.content_sections.filter(s => s.name.trim() && s.content.trim())
      };

      const response = await apiClient.products.update(productId, updateData);
      setProduct(response.data);
      setSuccessMessage('Product updated successfully!');

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.response?.data?.detail || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVectorize = async (force: boolean = false) => {
    setIsVectorizing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.products.vectorize(productId, force);
      const data = response.data;

      setSuccessMessage(
        `✓ Vectorized successfully! ${data.sections_vectorized} sections, ${data.documents_vectorized} documents, ${data.total_chunks} total chunks`
      );

      // Refresh product to get updated vectorized_at
      await fetchProduct();

      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to vectorize:', err);
      setError(err.response?.data?.detail || 'Failed to vectorize product');
    } finally {
      setIsVectorizing(false);
    }
  };

  const handleDocumentUploadComplete = () => {
    fetchDocuments();
    fetchProduct(); // Refresh to update document count
  };

  const handleDeleteDocument = async (documentId: string) => {
    setIsDeletingDoc(documentId);
    try {
      await apiClient.products.deleteDocument(productId, documentId);
      setDocuments(documents.filter(d => d.id !== documentId));
      fetchProduct(); // Refresh to update document count
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      alert(err.response?.data?.detail || 'Failed to delete document');
    } finally {
      setIsDeletingDoc(null);
    }
  };

  // Content section handlers
  const handleAddContentSection = () => {
    setEditingSection(formData.content_sections.length);
    setSectionForm({ name: '', content: '' });
  };

  const handleEditContentSection = (index: number) => {
    setEditingSection(index);
    setSectionForm({ ...formData.content_sections[index] });
  };

  const handleSaveContentSection = () => {
    if (!sectionForm.name.trim() || !sectionForm.content.trim()) {
      alert('Section name and content are required');
      return;
    }

    const newSections = [...formData.content_sections];
    if (editingSection !== null && editingSection < newSections.length) {
      newSections[editingSection] = sectionForm;
    } else {
      newSections.push(sectionForm);
    }

    setFormData({ ...formData, content_sections: newSections });
    setEditingSection(null);
    setSectionForm({ name: '', content: '' });
  };

  const handleCancelEditSection = () => {
    setEditingSection(null);
    setSectionForm({ name: '', content: '' });
  };

  const handleDeleteContentSection = (index: number) => {
    const newSections = formData.content_sections.filter((_, i) => i !== index);
    setFormData({ ...formData, content_sections: newSections });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Image
                  src="/rep-logo.png"
                  alt="Rep Logo"
                  width={90}
                  height={36}
                  className="h-9 w-auto cursor-pointer"
                  priority
                />
              </Link>
              <Link
                href="/products"
                className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900 transition font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Products
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 text-sm">{user?.email || 'guest@example.com'}</span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-slate-900 mb-2">{product?.name}</h2>
          <p className="text-slate-600 text-lg">
            Edit product details and manage documents
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Product Details (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Product Details</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Product Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Target Market
                    </label>
                    <input
                      type="text"
                      value={formData.target_market}
                      onChange={(e) => handleInputChange('target_market', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Features
                  </label>
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayFieldChange('features', index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {formData.features.length > 1 && (
                          <button
                            onClick={() => handleRemoveArrayField('features', index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddArrayField('features')}
                    className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Feature
                  </button>
                </div>

                {/* USPs */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Unique Selling Points
                  </label>
                  <div className="space-y-3">
                    {formData.unique_selling_points.map((usp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={usp}
                          onChange={(e) => handleArrayFieldChange('unique_selling_points', index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {formData.unique_selling_points.length > 1 && (
                          <button
                            onClick={() => handleRemoveArrayField('unique_selling_points', index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddArrayField('unique_selling_points')}
                    className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add USP
                  </button>
                </div>

                {/* Competitors */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Competitors
                  </label>
                  <div className="space-y-3">
                    {formData.competitors.map((competitor, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={competitor}
                          onChange={(e) => handleArrayFieldChange('competitors', index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {formData.competitors.length > 1 && (
                          <button
                            onClick={() => handleRemoveArrayField('competitors', index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAddArrayField('competitors')}
                    className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Competitor
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Content Sections Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Custom Content Sections</h3>
                {editingSection === null && (
                  <button
                    onClick={handleAddContentSection}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Section
                  </button>
                )}
              </div>

              {editingSection !== null ? (
                /* Section Editor */
                <div className="border border-indigo-200 rounded-xl p-6 bg-indigo-50">
                  <h4 className="font-semibold text-slate-900 mb-4">
                    {editingSection < formData.content_sections.length ? 'Edit Section' : 'New Section'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Section Name
                      </label>
                      <input
                        type="text"
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                        placeholder="e.g., Pricing Details, Technical Specs"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Content
                      </label>
                      <textarea
                        value={sectionForm.content}
                        onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                        placeholder="Add detailed information..."
                        rows={8}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveContentSection}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold"
                      >
                        Save Section
                      </button>
                      <button
                        onClick={handleCancelEditSection}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : formData.content_sections.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">No custom sections yet</p>
                  <p className="text-slate-500 text-sm mt-1">Add sections to provide additional context for RAG hints</p>
                </div>
              ) : (
                /* Sections List */
                <div className="space-y-3">
                  {formData.content_sections.map((section, index) => (
                    <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{section.name}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditContentSection(index)}
                            className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteContentSection(index)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-3">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Documents & Vectorization (1/3 width) */}
          <div className="space-y-6">
            {/* Vectorization Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4">RAG Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Documents:</span>
                  <span className="font-semibold text-slate-900">{product?.document_count || 0}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Content Sections:</span>
                  <span className="font-semibold text-slate-900">{formData.content_sections.length}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Last Vectorized:</span>
                  <span className="font-semibold text-slate-900 text-xs">{formatDate(product?.vectorized_at)}</span>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleVectorize(false)}
                    disabled={isVectorizing}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 mb-2"
                  >
                    {isVectorizing ? 'Vectorizing...' : 'Vectorize Content'}
                  </button>

                  <button
                    onClick={() => handleVectorize(true)}
                    disabled={isVectorizing}
                    className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-all font-medium disabled:opacity-50"
                  >
                    Force Re-vectorize
                  </button>
                </div>
              </div>
            </div>

            {/* Document Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Documents</h3>
              <DocumentUpload productId={productId} onUploadComplete={handleDocumentUploadComplete} />
            </div>

            {/* Documents List Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Uploaded Documents</h3>
              <DocumentList
                documents={documents}
                onDelete={handleDeleteDocument}
                isDeleting={isDeletingDoc}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
