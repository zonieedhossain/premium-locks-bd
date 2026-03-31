import { Link } from 'react-router-dom'
import type { Product } from '../types/product'

const PLACEHOLDER = 'https://placehold.co/400x300/1a3dd6/ffffff?text=No+Image'

interface Props { product: Product }

export default function ProductCard({ product }: Props) {
  const hasDiscount = product.discount_price > 0 && product.discount_price < product.price
  const displayPrice = hasDiscount ? product.discount_price : product.price

  return (
    <Link to={`/products/${product.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-52 bg-gray-50 overflow-hidden">
        <img
          src={product.main_image || PLACEHOLDER}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
        <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {product.category}
        </span>
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{Math.round((1 - product.discount_price / product.price) * 100)}%
          </span>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1 font-mono">{product.sku}</p>
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug mb-1">{product.name}</h3>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.short_description}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-brand-700">৳{displayPrice.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-gray-400 text-sm line-through ml-2">৳{product.price.toLocaleString()}</span>
            )}
          </div>
          <span className={`text-xs font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Sold out'}
          </span>
        </div>

        <div className="mt-3 w-full text-center bg-brand-600 group-hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          View Details
        </div>
      </div>
    </Link>
  )
}
