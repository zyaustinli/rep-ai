'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Product } from '@/types';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Product selection: 'existing' or 'new'
  const [productMode, setProductMode] = useState<'existing' | 'new'>('existing');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    personaDescription: '',
    difficulty: 'medium',
    callType: 'cold',
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiClient.products.list();
      setProducts(response.data);

      // If no products, default to 'new' mode
      if (response.data.length === 0) {
        setProductMode('new');
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      // If error fetching products, default to 'new' mode
      setProductMode('new');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
  };

  const nextStep = () => {
    // Validate Step 1
    if (step === 1) {
      if (productMode === 'existing' && !selectedProductId) {
        setError('Please select a product');
        return;
      }
      if (productMode === 'new' && (!formData.productName || !formData.productDescription)) {
        setError('Please enter product name and description');
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let scenario, productId = null;

      // Generate scenario based on product mode
      if (productMode === 'existing' && selectedProductId && selectedProduct) {
        // Use existing product
        productId = selectedProductId;
        const scenarioResponse = await apiClient.sessions.generateScenarioSimple({
          product_name: selectedProduct.name,
          product_description: selectedProduct.description || `Product: ${selectedProduct.name}`,
          persona_description: formData.personaDescription,
          difficulty: formData.difficulty,
          call_type: formData.callType,
          duration: 15
        });
        scenario = scenarioResponse.data.scenario;
      } else {
        // Use new/temporary product
        const scenarioResponse = await apiClient.sessions.generateScenarioSimple({
          product_name: formData.productName,
          product_description: formData.productDescription,
          persona_description: formData.personaDescription,
          difficulty: formData.difficulty,
          call_type: formData.callType,
          duration: 15
        });
        scenario = scenarioResponse.data.scenario;
      }

      // Create session with the generated scenario
      const sessionResponse = await apiClient.sessions.create({
        scenario: scenario,
        difficulty: formData.difficulty,
        call_type: formData.callType,
        product_id: productId, // Associate with product if using existing
        rag_enabled: productId !== null, // Enable RAG if using existing product
      });

      const session = sessionResponse.data;

      // Navigate to practice page
      router.push(`/practice/${session.id}`);
    } catch (err: any) {
      console.error('Error creating session:', err);

      // Handle validation errors
      let errorMessage = 'Failed to create practice session. Please try again.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors
          errorMessage = err.response.data.detail.map((e: any) =>
            `${e.loc?.join(' > ') || 'Field'}: ${e.msg}`
          ).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-900">
            Rep
          </Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition font-medium text-sm inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Step {step} of 3</span>
            <span className="text-sm font-medium text-slate-600">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all ${
                step >= num
                  ? 'bg-slate-900 text-white shadow-sm scale-110'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {num}
              </div>
              {num < 3 && (
                <div className={`h-1 w-16 mx-2 transition-all ${
                  step > num ? 'bg-slate-900' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Product Selection/Details */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Product Selection
                </h2>
                <p className="text-slate-600">Choose an existing product or enter new product details</p>
              </div>

              {loadingProducts ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">Loading products...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Product Mode Selection */}
                  {products.length > 0 && (
                    <div className="flex gap-3 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setProductMode('existing');
                          setError(null);
                        }}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          productMode === 'existing'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Use Existing Product
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProductMode('new');
                          setSelectedProductId(null);
                          setSelectedProduct(null);
                          setError(null);
                        }}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          productMode === 'new'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Enter New Product
                      </button>
                    </div>
                  )}

                  {/* Existing Product Selection */}
                  {productMode === 'existing' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Select Product *
                        </label>
                        <Link
                          href="/products"
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Manage Products
                        </Link>
                      </div>

                      {products.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <p className="text-slate-600 font-medium mb-1">No products found</p>
                          <p className="text-slate-500 text-sm mb-4">Create a product to enable RAG hints</p>
                          <Link
                            href="/products/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Product
                          </Link>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {products.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleProductSelect(product)}
                              className={`text-left p-4 border-2 rounded-xl transition-all ${
                                selectedProductId === product.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-slate-900">{product.name}</h4>
                                {product.vectorized_at && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    RAG Ready
                                  </span>
                                )}
                              </div>
                              {product.description && (
                                <p className="text-slate-600 text-sm line-clamp-2 mb-2">{product.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{product.document_count || 0} documents</span>
                                {product.document_count && product.document_count > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Hints available</span>
                                  </>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected Product Info */}
                      {selectedProduct && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-indigo-900 text-sm font-medium mb-1">
                                Selected: {selectedProduct.name}
                              </p>
                              <p className="text-indigo-700 text-sm">
                                {selectedProduct.document_count && selectedProduct.document_count > 0
                                  ? `RAG hints will be available during practice (${selectedProduct.document_count} documents)`
                                  : 'No RAG documents. You can add them later in product settings.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* New Product Entry */}
                  {productMode === 'new' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          name="productName"
                          value={formData.productName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                          placeholder="e.g., CloudSync CRM"
                          required={productMode === 'new'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Product Description *
                        </label>
                        <textarea
                          name="productDescription"
                          value={formData.productDescription}
                          onChange={handleChange}
                          rows={6}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                          placeholder="Describe your product's key features and benefits..."
                          required={productMode === 'new'}
                        />
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-amber-900 text-sm font-medium mb-1">Temporary Product</p>
                            <p className="text-amber-800 text-sm">
                              This product won't be saved. To enable RAG hints and reuse products, create a product in the Products section.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800 font-medium text-sm">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loadingProducts}
                  className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  Next Step
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Persona Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Target Persona
                </h2>
                <p className="text-slate-600">Describe the person you'll be selling to</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Persona Description *
                  </label>
                  <textarea
                    name="personaDescription"
                    value={formData.personaDescription}
                    onChange={handleChange}
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none"
                    placeholder="Describe who you'll be selling to. For example:&#10;&#10;- Hedge fund manager&#10;- VP of Sales at a mid-size tech company&#10;- Small business owner in retail&#10;- Random stranger at a coffee shop&#10;&#10;Be as detailed or simple as you like!"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all inline-flex items-center gap-2"
                >
                  Next Step
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Session Preferences
                </h2>
                <p className="text-slate-600">Customize your practice session</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Difficulty Level *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.difficulty === 'easy'
                          ? 'bg-emerald-600 text-white shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Easy
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.difficulty === 'medium'
                          ? 'bg-blue-600 text-white shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.difficulty === 'hard'
                          ? 'bg-orange-500 text-white shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Hard
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: 'expert' })}
                      className={`px-4 py-4 rounded-xl font-medium transition-all ${
                        formData.difficulty === 'expert'
                          ? 'bg-rose-600 text-white shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Expert
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Call Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['cold', 'warm', 'follow-up', 'closing'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, callType: type })}
                        className={`px-4 py-3 rounded-xl font-medium transition-all ${
                          formData.callType === type
                            ? 'bg-indigo-600 text-white shadow-sm scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Session Summary
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Product</p>
                        <p className="text-slate-900 font-medium">
                          {productMode === 'existing' && selectedProduct
                            ? selectedProduct.name
                            : formData.productName || 'Not specified'}
                        </p>
                        {productMode === 'existing' && selectedProduct && selectedProduct.vectorized_at && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            RAG hints enabled
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Prospect</p>
                        <p className="text-slate-900 font-medium line-clamp-2">{formData.personaDescription || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Settings</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200">
                            {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)} difficulty
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200">
                            {formData.callType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} call
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Scenario...
                    </>
                  ) : (
                    <>
                      Start Practice Session
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
