import { useEffect, useState } from 'react'
import { productApi } from '../api/productApi'
import { userApi } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import type { Product } from '../types/product'
import type { User } from '../types/user'

export default function Dashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      productApi.getAll(1, 1000).catch(() => ({ data: [] as Product[], total: 0, page: 1, limit: 10 })),
      userApi.getAll(1, 1000).catch(() => ({ data: [] as User[], total: 0, page: 1, limit: 10 })),
    ]).then(([p, u]) => { setProducts(p.data); setUsers(u.data) }).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Products', value: products.length, icon: '📦', color: 'bg-blue-50 text-blue-700' },
    { label: 'Active Products', value: products.filter(p => p.is_active).length, icon: '✅', color: 'bg-green-50 text-green-700' },
    { label: 'Out of Stock', value: products.filter(p => p.stock_quantity === 0).length, icon: '⚠️', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Total Users', value: users.length, icon: '👥', color: 'bg-purple-50 text-purple-700' },
  ]

  const recent = [...products].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome back, <span className="font-semibold text-gray-700">{user?.name}</span></p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.color} text-xl mb-3`}>{s.icon}</div>
              <p className="text-3xl font-black text-gray-900">{s.value}</p>
              <p className="text-gray-500 text-sm mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Recently Added Products</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">No products yet</p>
          ) : (
            recent.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                <img src={p.main_image || 'https://placehold.co/40x40/1a3dd6/ffffff?text=P'} alt={p.name}
                  className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/40x40/1a3dd6/ffffff?text=P' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                  <p className="text-gray-400 text-xs">{p.category} · {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">৳{p.price.toLocaleString()}</p>
                  <span className={`text-xs font-semibold ${p.is_active ? 'text-green-600' : 'text-gray-400'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
