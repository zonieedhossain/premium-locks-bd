import { useEffect, useState } from 'react'
import { productApi } from '../api/productApi'
import ProductForm from '../components/ProductForm'
import type { Product, ProductFormData } from '../types/product'

const PLACEHOLDER = 'https://placehold.co/48x48/1a3dd6/ffffff?text=P'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; product?: Product } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    productApi.getAll()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (data: ProductFormData) => {
    if (modal?.type === 'edit' && modal.product) await productApi.update(modal.product.id, data)
    else await productApi.create(data)
    setModal(null); load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await productApi.delete(deleteTarget.id); setDeleteTarget(null); load() }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed') }
    finally { setDeleting(false) }
  }

  const handleToggle = async (p: Product) => {
    await productApi.update(p.id, { name: p.name, category: p.category, price: p.price, discount_price: p.discount_price, short_description: p.short_description, description: p.description, stock_quantity: p.stock_quantity, is_active: !p.is_active })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} products in catalogue</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Product
        </button>
      </div>

      {loading && <div className="flex justify-center h-48 items-center"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">No products yet. <button onClick={() => setModal({ type: 'create' })} className="text-brand-600 hover:underline">Add one</button></td></tr>
                ) : products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.main_image || PLACEHOLDER} alt={p.name} onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                          className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-gray-400 text-xs line-clamp-1">{p.short_description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-4"><span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">{p.category}</span></td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">৳{(p.discount_price || p.price).toLocaleString()}</p>
                      {p.discount_price > 0 && <p className="text-gray-400 text-xs line-through">৳{p.price.toLocaleString()}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-yellow-600' : 'text-green-600'}`}>{p.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => handleToggle(p)}
                        className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${p.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ type: 'edit', product: p })} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{modal.type === 'edit' ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-6">
              <ProductForm initial={modal.product} onSubmit={handleSubmit} onCancel={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg></div>
              <div><h3 className="font-bold text-gray-900">Delete Product</h3><p className="text-gray-500 text-sm">This cannot be undone.</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-6">Delete "<span className="font-semibold">{deleteTarget.name}</span>"?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
