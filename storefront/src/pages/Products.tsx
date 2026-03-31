import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { publicApi } from '../api/publicApi'
import type { Product } from '../types/product'

const CATEGORIES = ['All', 'Padlock', 'Door Lock', 'Smart Lock', 'Deadbolt', 'Cabinet Lock', 'Chain Lock']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeCategory = searchParams.get('category') ?? 'All'
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState<number>(0)

  useEffect(() => {
    publicApi.getProducts()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      const matchQ = p.name.toLowerCase().includes(q) || p.short_description.toLowerCase().includes(q)
      const price = p.discount_price > 0 ? p.discount_price : p.price
      const matchPrice = maxPrice === 0 || price <= maxPrice
      return matchCat && matchQ && matchPrice && p.stock_quantity > 0 || (matchCat && matchQ && matchPrice)
    })
    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price)); break
      case 'price-desc': list = [...list].sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price)); break
      case 'name': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break
      default: list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return list
  }, [products, activeCategory, search, sort, maxPrice])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-brand-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-white mb-1">Our Products</h1>
          <p className="text-brand-300 text-sm">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-20">
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSearchParams(prev => { const n = new URLSearchParams(prev); if (e.target.value) n.set('q', e.target.value); else n.delete('q'); return n }) }}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSearchParams(prev => { const n = new URLSearchParams(prev); if (cat === 'All') n.delete('category'); else n.set('category', cat); return n })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price: {maxPrice > 0 ? `৳${maxPrice.toLocaleString()}` : 'Any'}</label>
                <input type="range" min={0} max={50000} step={500} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-600" />
                {maxPrice > 0 && <button onClick={() => setMaxPrice(0)} className="text-xs text-brand-600 hover:underline mt-1">Clear</button>}
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Sort */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />)}
              </div>
            )}
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
