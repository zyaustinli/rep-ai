import Link from 'next/link';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const hasDocuments = (product.document_count || 0) > 0;
  const isVectorized = !!product.vectorized_at;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
          {product.description && (
            <p className="text-slate-600 text-sm leading-relaxed">
              {truncateText(product.description, 120)}
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Document count badge */}
        {hasDocuments ? (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {product.document_count} {product.document_count === 1 ? 'document' : 'documents'}
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
            No documents
          </span>
        )}

        {/* Vectorization status badge */}
        {isVectorized ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Vectorized
          </span>
        ) : (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Not vectorized
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span>Updated {formatDate(product.updated_at)}</span>
        {product.price && (
          <>
            <span>•</span>
            <span>${product.price.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <Link
          href={`/products/${product.id}`}
          className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold text-sm text-center"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(product.id)}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all font-semibold text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
