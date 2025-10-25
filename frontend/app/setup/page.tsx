'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    price: '',
    targetMarket: '',
    personaName: '',
    personaRole: '',
    personaCompany: '',
    industry: '',
    companySize: 'medium',
    difficulty: 'medium',
    callType: 'cold',
    duration: '15',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to generate scenario and create session
    console.log('Form data:', formData);
    // For now, just navigate to practice with a dummy ID
    router.push('/practice/demo-session');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Convo AI
          </Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
            <span className="text-sm font-medium text-gray-600">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
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
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {num}
              </div>
              {num < 3 && (
                <div className={`h-1 w-16 mx-2 transition-all ${
                  step > num ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Product Details */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Product Details
                </h2>
                <p className="text-gray-600">Tell us about the product you're selling</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="e.g., CloudSync CRM"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Description *
                  </label>
                  <textarea
                    name="productDescription"
                    value={formData.productDescription}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                    placeholder="Describe your product's key features and benefits..."
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="e.g., $99/month"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Market *
                    </label>
                    <input
                      type="text"
                      name="targetMarket"
                      value={formData.targetMarket}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="e.g., Small businesses"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Persona Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Target Persona
                </h2>
                <p className="text-gray-600">Who will you be selling to?</p>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Persona Name
                    </label>
                    <input
                      type="text"
                      name="personaName"
                      value={formData.personaName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="e.g., Sarah Chen (auto-generated if empty)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role/Title *
                    </label>
                    <input
                      type="text"
                      name="personaRole"
                      value={formData.personaRole}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="e.g., VP of Sales"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="personaCompany"
                      value={formData.personaCompany}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="e.g., TechGrow Inc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Industry *
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                      placeholder="e.g., SaaS, Real Estate"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Size *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['small', 'medium', 'large', 'enterprise'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormData({ ...formData, companySize: size })}
                        className={`px-4 py-3 rounded-xl font-medium transition-all ${
                          formData.companySize === size
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
              <div className="mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Session Preferences
                </h2>
                <p className="text-gray-600">Customize your practice session</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Difficulty Level *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-500' },
                      { value: 'medium', label: 'Medium', color: 'from-blue-500 to-cyan-500' },
                      { value: 'hard', label: 'Hard', color: 'from-orange-500 to-amber-500' },
                      { value: 'expert', label: 'Expert', color: 'from-red-500 to-rose-500' },
                    ].map((diff) => (
                      <button
                        key={diff.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficulty: diff.value })}
                        className={`px-4 py-4 rounded-xl font-medium transition-all ${
                          formData.difficulty === diff.value
                            ? `bg-gradient-to-r ${diff.color} text-white shadow-lg scale-105`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Duration: {formData.duration} minutes
                  </label>
                  <input
                    type="range"
                    name="duration"
                    min="5"
                    max="30"
                    step="5"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>5 min</span>
                    <span>15 min</span>
                    <span>30 min</span>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    Session Summary
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-medium">Product:</span> {formData.productName || 'Not specified'}</p>
                    <p><span className="font-medium">Prospect:</span> {formData.personaRole} {formData.personaName && `(${formData.personaName})`}</p>
                    <p><span className="font-medium">Settings:</span> {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)} difficulty, {formData.callType} call, {formData.duration} min</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  Start Practice Session
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
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
