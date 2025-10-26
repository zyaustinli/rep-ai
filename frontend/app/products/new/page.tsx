'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function NewProductPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Validate file types
      const validFiles = selectedFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension === 'pdf' || extension === 'txt';
      });

      if (validFiles.length !== selectedFiles.length) {
        setError('Only PDF and TXT files are supported');
        return;
      }

      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);

      // Validate file types
      const validFiles = droppedFiles.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension === 'pdf' || extension === 'txt';
      });

      if (validFiles.length !== droppedFiles.length) {
        setError('Only PDF and TXT files are supported');
        return;
      }

      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      setError('Product name is required');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one supporting document (PDF or TXT)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create product
      const productResponse = await apiClient.products.create({
        name: productName.trim(),
      });
      const product = productResponse.data;

      // Step 2: Upload documents
      const uploadPromises = files.map(async (file) => {
        try {
          await apiClient.products.uploadDocument(product.id, file, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          });
        } catch (err: any) {
          console.error(`Failed to upload ${file.name}:`, err);
          const errorDetail = err.response?.data?.detail || err.message || 'Unknown error';
          throw new Error(`Failed to upload ${file.name}: ${errorDetail}`);
        }
      });

      await Promise.all(uploadPromises);

      // Step 3: Trigger vectorization
      try {
        await apiClient.products.vectorize(product.id);
      } catch (err) {
        console.error('Failed to trigger vectorization:', err);
        // Don't block navigation - vectorization can be retried later
      }

      // Navigate to products list
      router.push('/products');
    } catch (err: any) {
      console.error('Failed to create product:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create product');
      setIsSubmitting(false);
    }
  };

  const isUploading = Object.keys(uploadProgress).length > 0 && isSubmitting;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
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
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900 transition font-medium"
            >
              Products
            </Link>
            <span className="text-slate-600 text-sm">{user?.email || 'guest@example.com'}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Create New Product</h2>
          <p className="text-slate-600 text-lg">
            Add a product name and upload supporting documents (competitors, features, pricing, etc.)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Product Name */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Product Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., RepAI Sales Platform"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Supporting Documents <span className="text-red-600">*</span>
              </label>
              <p className="text-slate-600 text-sm">
                Upload PDFs or TXT files containing product information, competitor analysis, features, pricing, case studies, etc.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors"
            >
              <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-slate-500 text-sm mb-4">
                Supports PDF and TXT files
              </p>
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                disabled={isSubmitting}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Select Files
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">Selected Files ({files.length})</h4>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        {isUploading && uploadProgress[file.name] !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{uploadProgress[file.name]}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Your documents will be automatically processed and vectorized</li>
                  <li>• RAG hints will be available during practice sessions</li>
                  <li>• Include all relevant product information: features, pricing, competitors, FAQs, case studies, etc.</li>
                  <li>• You can add more documents later from the product page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Link
              href="/products"
              className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-all font-semibold"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !productName.trim() || files.length === 0}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isUploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
