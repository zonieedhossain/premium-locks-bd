import { useEffect, useRef, useState } from 'react'
import { productApi } from '../api/productApi'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Product, ProductFormData } from '../types/product'

const CATEGORIES = ['Padlock', 'Door Lock', 'Smart Lock', 'Deadbolt', 'Cabinet Lock', 'Chain Lock']
const PLACEHOLDER = 'https://placehold.co/80x80/1a3dd6/ffffff?text=No+Img'

const EMPTY_FORM: ProductFormData = {
  name: '', description: '', price: 0, category: CATEGORIES[0], stock: 0,
}

interface FormErrors {
  name?: string
  description?: string
  price?: string
  category?: string
  stock?: string
}

function validate(data: ProductFormData): FormErrors {
  const e: FormErrors = {}
  if (!data.name.trim()) e.name = 'Name is required'
  if (!data.description.trim()) e.description = 'Description is required'
  if (data.price <= 0) e.price = 'Price must be greater than 0'
  if (!data.category) e.category = 'Category is required'
  if (data.stock < 0) e.stock = 'Stock cannot be negative'
  return e
}

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    productApi
      .getAll()
      .then(setProducts)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImagePreview(null)
    setFormErrors({})
    setSubmitError(null)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, stock: p.stock })
    setImagePreview(p.imageUrl || null)
    setFormErrors({})
    setSubmitError(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, image: file }))
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setFormErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validate(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editing) {
        await productApi.update(editing.id, form)
      } else {
        await productApi.create(form)
      }
      closeModal()
      load()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await productApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">{products.length} products in catalogue</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center h-64 items-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                          <span className="font-medium">No products yet</span>
                          <button onClick={openCreate} className="text-brand-600 hover:underline text-xs">Add your first product</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={p.imageUrl || PLACEHOLDER}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                            />
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                              <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">{p.category}</span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-900">৳{p.price.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-xs">{new Date(p.updatedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{submitError}</div>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="img-upload" />
                    <label
                      htmlFor="img-upload"
                      className="cursor-pointer inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      {editing ? 'Change Image' : 'Upload Image'}
                    </label>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                  placeholder="e.g. Heavy Duty Combination Padlock"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleField('description', e.target.value)}
                  placeholder="Describe the product features..."
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none ${formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => handleField('category', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition bg-white ${formErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price === 0 ? '' : form.price}
                    onChange={(e) => handleField('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${formErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock === 0 ? '' : form.stock}
                    onChange={(e) => handleField('stock', parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${formErrors.stock ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  {formErrors.stock && <p className="text-red-500 text-xs mt-1">{formErrors.stock}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  {submitting ? 'Saving…' : (editing ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Product</h3>
                <p className="text-gray-500 text-sm mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteTarget.name}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleting && <LoadingSpinner size="sm" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
