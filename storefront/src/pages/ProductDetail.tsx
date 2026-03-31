import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../api/publicApi'
import type { Product } from '../types/product'

const PLACEHOLDER = 'https://placehold.co/800x600/1a3dd6/ffffff?text=No+Image'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImg, setSelectedImg] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc')

  useEffect(() => {
    if (!slug) { navigate('/products'); return }
    publicApi.getProductBySlug(slug)
      .then(p => { setProduct(p); setSelectedImg(p.main_image || PLACEHOLDER) })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Not found'))
      .finally(() => setLoading(false))
  }, [slug, navigate])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )
  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-red-600">{error ?? 'Product not found'}</p>
      <Link to="/products" className="text-brand-600 hover:underline text-sm">← Back to products</Link>
    </div>
  )

  const hasDiscount = product.discount_price > 0 && product.discount_price < product.price
  const displayPrice = hasDiscount ? product.discount_price : product.price
  const allImages = [product.main_image, ...(product.gallery_images ?? [])].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-600">Products</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Images */}
            <div className="p-8 bg-gray-50">
              <div className="relative rounded-2xl overflow-hidden bg-white mb-4 aspect-square flex items-center justify-center">
                <img
                  src={selectedImg || PLACEHOLDER}
                  alt={product.name}
                  className="max-h-80 w-full object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                />
                {hasDiscount && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{Math.round((1 - product.discount_price / product.price) * 100)}% OFF
                  </span>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(img)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${selectedImg === img ? 'border-brand-500' : 'border-transparent'}`}>
                      <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-8 lg:p-12 flex flex-col">
              <span className="inline-block bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 self-start">{product.category}</span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight mb-2">{product.name}</h1>
              <p className="text-gray-400 text-xs font-mono mb-4">SKU: {product.sku}</p>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-black text-brand-700">৳{displayPrice.toLocaleString()}</span>
                {hasDiscount && <span className="text-gray-400 text-lg line-through">৳{product.price.toLocaleString()}</span>}
                <span className="text-gray-400 text-sm">BDT</span>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className={`w-2.5 h-2.5 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : 'Out of Stock'}
                </span>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6 bg-gray-50 rounded-xl p-4">{product.short_description}</p>

              {product.stock_quantity > 0 && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-lg">−</button>
                    <span className="px-4 py-2.5 font-semibold text-gray-900 border-x border-gray-200 min-w-12 text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-bold text-lg">+</button>
                  </div>
                  <button className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm">
                    Add to Cart — ৳{(displayPrice * qty).toLocaleString()}
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="mt-auto">
                <div className="flex border-b border-gray-100 mb-4">
                  {(['desc', 'specs'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`pb-2 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      {tab === 'desc' ? 'Description' : 'Specifications'}
                    </button>
                  ))}
                </div>
                {activeTab === 'desc'
                  ? <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description || product.short_description}</p>
                  : (
                    <div className="space-y-2 text-sm">
                      {[['SKU', product.sku], ['Category', product.category], ['Stock', String(product.stock_quantity)], ['Added', new Date(product.created_at).toLocaleDateString()]].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                          <span className="text-gray-500 font-medium">{k}</span>
                          <span className="text-gray-900 font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>

        <Link to="/products" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium mt-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
          </svg>
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
