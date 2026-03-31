import { Link } from 'react-router-dom'
import type { Product } from '../types/product'

const PLACEHOLDER = 'https://placehold.co/400x300/1a3dd6/ffffff?text=No+Image'

const categoryColor: Record<string, string> = {
  'Padlock':      'bg-blue-100 text-blue-800',
  'Door Lock':    'bg-purple-100 text-purple-800',
  'Smart Lock':   'bg-green-100 text-green-800',
  'Deadbolt':     'bg-orange-100 text-orange-800',
  'Cabinet Lock': 'bg-pink-100 text-pink-800',
  'Chain Lock':   'bg-yellow-100 text-yellow-800',
}

function categoryBadge(cat: string) {
  return categoryColor[cat] ?? 'bg-gray-100 text-gray-700'
}

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const imgSrc = product.imageUrl
    ? product.imageUrl.startsWith('http') ? product.imageUrl : product.imageUrl
    : PLACEHOLDER

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image */}
      <div className="relative h-52 bg-gray-50 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadge(product.category)}`}>
          {product.category}
        </span>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-600 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-brand-700">৳{product.price.toLocaleString()}</span>
          </div>
          <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-3 block w-full text-center bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}
