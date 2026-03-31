import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { productApi } from '../api/productApi'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Product } from '../types/product'

const PLACEHOLDER = 'https://placehold.co/800x600/1a3dd6/ffffff?text=No+Image'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!id) { navigate('/'); return }
    productApi
      .getById(id)
      .then(setProduct)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load product'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-red-600 font-medium">{error ?? 'Product not found'}</p>
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Back to store</Link>
      </div>
    )
  }

  const imgSrc = product.imageUrl || PLACEHOLDER
  const inStock = product.stock > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative bg-gray-50 flex items-center justify-center p-8 min-h-96">
              <img
                src={imgSrc}
                alt={product.name}
                className="max-h-96 w-full object-contain rounded-xl"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
              />
              <span className="absolute top-4 left-4 bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {product.category}
              </span>
              {!inStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-l-2xl">
                  <span className="bg-red-600 text-white font-bold px-6 py-2 rounded-full text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-8 lg:p-12 flex flex-col">
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{product.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                  {inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-brand-700">৳{product.price.toLocaleString()}</span>
                <span className="text-gray-400 text-sm ml-2">BDT</span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Qty + CTA */}
              {inStock && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="px-4 py-2.5 font-semibold text-gray-900 border-x border-gray-200 min-w-12 text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                  <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm">
                    Add to Cart — ৳{(product.price * qty).toLocaleString()}
                  </button>
                </div>
              )}

              {/* Meta */}
              <div className="mt-auto pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="block font-semibold text-gray-500 mb-0.5">Product ID</span>
                  <span className="font-mono">{product.id.slice(0, 8)}…</span>
                </div>
                <div>
                  <span className="block font-semibold text-gray-500 mb-0.5">Added</span>
                  <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
