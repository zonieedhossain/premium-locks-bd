import { useEffect, useMemo, useState } from 'react'
import { productApi } from '../api/productApi'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Product } from '../types/product'

const CATEGORIES = ['All', 'Padlock', 'Door Lock', 'Smart Lock', 'Deadbolt', 'Cabinet Lock', 'Chain Lock']

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    productApi
      .getAll()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      const matchQ = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [products, activeCategory, search])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            Bangladesh's #1 Security Lock Store
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Secure What Matters<br />
            <span className="text-gold-400">Most to You</span>
          </h1>
          <p className="text-brand-200 text-lg max-w-2xl mx-auto mb-8">
            Premium quality padlocks, smart locks, deadbolts and more — trusted by thousands across Bangladesh.
          </p>
          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center h-64 justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 text-sm">
                {filtered.length === 0 ? 'No products found' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
                {activeCategory !== 'All' && ` in ${activeCategory}`}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-semibold">No products found</p>
                  <p className="text-gray-400 text-sm mt-1">Try a different search term or category</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-brand-950 text-brand-300 text-center text-sm py-8 mt-12">
        <p className="font-medium text-white mb-1">Premium Locks BD</p>
        <p>© {new Date().getFullYear()} All rights reserved. Dhaka, Bangladesh.</p>
      </footer>
    </div>
  )
}
