import { useRef, useState } from 'react'
import type { Product, ProductFormData } from '../types/product'

const CATEGORIES = ['Padlock', 'Door Lock', 'Smart Lock', 'Deadbolt', 'Cabinet Lock', 'Chain Lock']
const PLACEHOLDER = 'https://placehold.co/80x80/1a3dd6/ffffff?text=No+Img'

interface Props {
  initial?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
}

const empty: ProductFormData = {
  name: '', category: CATEGORIES[0], price: 0, discount_price: 0,
  short_description: '', description: '', stock_quantity: 0, is_active: true,
}

interface Errors { name?: string; category?: string; price?: string; description?: string }

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ProductFormData>(
    initial ? { name: initial.name, category: initial.category, price: initial.price, discount_price: initial.discount_price, short_description: initial.short_description, description: initial.description, stock_quantity: initial.stock_quantity, is_active: initial.is_active } : empty
  )
  const [preview, setPreview] = useState<string>(initial?.main_image || '')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  function validate(): boolean {
    const e: Errors = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.category) e.category = 'Category is required'
    if (form.price <= 0) e.price = 'Price must be greater than 0'
    if (!form.description.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try { await onSubmit(form) }
    catch (err) { setSubmitError(err instanceof Error ? err.message : 'Something went wrong') }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{submitError}</div>}

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
            {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }} />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" id="img" onChange={e => {
              const f = e.target.files?.[0]; if (!f) return
              set('main_image', f)
              const reader = new FileReader(); reader.onload = () => setPreview(reader.result as string); reader.readAsDataURL(f)
            }} />
            <label htmlFor="img" className="cursor-pointer inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              Upload Image
            </label>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Heavy Duty Combination Padlock"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.name ? 'border-red-300' : 'border-gray-200'}`} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
        <input type="text" value={form.short_description} onChange={e => set('short_description', e.target.value)} placeholder="One-liner summary"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Detailed product description..."
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none ${errors.description ? 'border-red-300' : 'border-gray-200'}`} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Price / Discount / Stock */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (৳) *</label>
          <input type="number" min="0" step="0.01" value={form.price || ''} onChange={e => set('price', parseFloat(e.target.value) || 0)} placeholder="0.00"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.price ? 'border-red-300' : 'border-gray-200'}`} />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount (৳)</label>
          <input type="number" min="0" step="0.01" value={form.discount_price || ''} onChange={e => set('discount_price', parseFloat(e.target.value) || 0)} placeholder="0.00"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
          <input type="number" min="0" value={form.stock_quantity || ''} onChange={e => set('stock_quantity', parseInt(e.target.value) || 0)} placeholder="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set('is_active', !form.is_active)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.is_active ? 'bg-brand-600' : 'bg-gray-200'}`}>
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className="text-sm font-medium text-gray-700">{form.is_active ? 'Active (visible on storefront)' : 'Inactive (hidden from storefront)'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm">Cancel</button>
        <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm">
          {submitting ? 'Saving…' : (initial ? 'Save Changes' : 'Create Product')}
        </button>
      </div>
    </form>
  )
}
