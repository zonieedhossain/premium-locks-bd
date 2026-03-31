import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner'
import ProductCard from '../components/ProductCard'
import { publicApi } from '../api/publicApi'
import type { Product } from '../types/product'

const CATEGORIES = ['Padlock', 'Door Lock', 'Smart Lock', 'Deadbolt', 'Cabinet Lock', 'Chain Lock']

const catIcons: Record<string, string> = {
  'Padlock': '🔒', 'Door Lock': '🚪', 'Smart Lock': '📱',
  'Deadbolt': '🔐', 'Cabinet Lock': '🗄️', 'Chain Lock': '⛓️',
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const featured = products.slice(0, 8)

  return (
    <div>
      <HeroBanner />

      {/* Category Highlights */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-500">Find the perfect lock for every need</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="group flex flex-col items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-200 transition-all"
              >
                <span className="text-3xl">{catIcons[cat]}</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-600 text-center">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1">Our most popular security solutions</p>
            </div>
            <Link to="/products" className="text-brand-600 hover:text-brand-700 font-semibold text-sm flex items-center gap-1">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="font-medium">No products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-brand-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              ['🛡️', 'Genuine Products', '100% authentic locks from certified brands'],
              ['🚚', 'Fast Delivery', 'Nationwide delivery within 2–3 business days'],
              ['↩️', 'Easy Returns', '7-day hassle-free return policy'],
              ['📞', '24/7 Support', 'Expert security advice anytime'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="text-center">
                <p className="text-3xl mb-2">{icon}</p>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-brand-300 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter strip */}
      <section className="bg-gold-500 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-extrabold text-brand-950 mb-2">Stay Secure. Stay Updated.</h3>
          <p className="text-brand-800 mb-6 text-sm">Get exclusive deals and security tips delivered to your inbox.</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <button className="bg-brand-950 hover:bg-brand-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
