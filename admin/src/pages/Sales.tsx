import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { saleApi } from '../api/saleApi'
import { productApi } from '../api/productApi'
import { reportApi } from '../api/reportApi'
import Pagination from '../components/Pagination'
import type { Sale, CreateSaleInput } from '../types/sale'
import type { Product } from '../types/product'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-red-100 text-red-700',
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash (নগদ)' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'dbbl_nexus', label: 'DBBL Nexus' },
  { value: 'upay', label: 'Upay' },
]

type ItemRow = { product_id: string; quantity: number; unit_price: number; discount: number }

const emptyForm = (): CreateSaleInput => ({
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  items: [{ product_id: '', quantity: 1, unit_price: 0, discount: 0 }],
  discount_amount: 0,
  paid_amount: 0,
  payment_method: 'cash',
  transaction_id: '',
  note: '',
})

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateSaleInput>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const limit = 10

  const load = (p = page) => {
    setLoading(true)
    Promise.all([saleApi.getAll(p, limit, from, to), productApi.getAll(1, 1000)])
      .then(([saleRes, prodRes]) => {
        setSales(saleRes.data)
        setTotal(saleRes.total)
        setProducts(prodRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1); setPage(1) }, [from, to])
  useEffect(() => { load(page) }, [page])

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const totalPages = Math.ceil(total / limit)

  const addRow = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1, unit_price: 0, discount: 0 }] }))
  const removeRow = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  const updateRow = (i: number, field: keyof ItemRow, value: string | number) => {
    setForm(f => {
      const items = [...f.items]
      const updated = { ...items[i], [field]: value }
      if (field === 'product_id' && value) {
        const p = productMap[value as string]
        if (p) updated.unit_price = p.discount_price > 0 && p.discount_price < p.price ? p.discount_price : p.price
      }
      items[i] = updated
      return { ...f, items }
    })
  }

  const subTotal = form.items.reduce((s, it) => s + it.quantity * it.unit_price - it.discount, 0)
  const grandTotal = subTotal - form.discount_amount
  const needsTrxId = form.payment_method !== 'cash'

  const stockError = form.items.find(it => {
    if (!it.product_id) return false
    const p = productMap[it.product_id]
    return p && it.quantity > p.stock_quantity
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (stockError) return
    setSaving(true)
    setError('')
    try {
      await saleApi.create(form)
      setShowForm(false)
      setForm(emptyForm())
      load(1)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale')
    } finally {
      setSaving(false)
    }
  }



  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="text-sm bg-transparent outline-none text-gray-600 cursor-pointer" />
            <span className="text-gray-400 text-sm">→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="text-sm bg-transparent outline-none text-gray-600 cursor-pointer" />
            {(from || to) && (
              <button onClick={() => { setFrom(''); setTo('') }} className="text-gray-400 hover:text-red-500 font-bold ml-1 text-sm">&times;</button>
            )}
          </div>
          <a href={reportApi.downloadSalesUrl(from, to, 'pdf')} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-gray-50 shadow-sm flex items-center gap-2">
            📥 PDF Report
          </a>
          <button onClick={() => setShowForm(true)} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
            + New Sale
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mb-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-gray-900 text-lg">Create New Sale</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>}

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">👤 Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Full Name *</label>
                    <input required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                      placeholder="e.g. Rahim Uddin"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                    <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                      placeholder="e.g. 01712345678"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                    <input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                      placeholder="e.g. rahim@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address</label>
                    <input value={form.customer_address} onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))}
                      placeholder="e.g. House 12, Road 5, Dhanmondi, Dhaka"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
              </div>

              {/* Product Items */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📦 Product Items</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                    <div className="col-span-4">Product Name</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Item Disc.</div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  {form.items.map((item, i) => {
                    const p = item.product_id ? productMap[item.product_id] : null
                    const overStock = p && item.quantity > p.stock_quantity
                    return (
                      <div key={i} className="space-y-1">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <select value={item.product_id} required onChange={e => updateRow(i, 'product_id', e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                              <option value="">Select product</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="1" value={item.quantity} onChange={e => updateRow(i, 'quantity', parseInt(e.target.value) || 1)}
                              placeholder="Qty"
                              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${overStock ? 'border-red-400' : 'border-gray-200'}`} />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateRow(i, 'unit_price', parseFloat(e.target.value) || 0)}
                              placeholder="Unit Price (৳)"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="0" step="0.01" value={item.discount} onChange={e => updateRow(i, 'discount', parseFloat(e.target.value) || 0)}
                              placeholder="Item Discount"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                          </div>
                          <div className="col-span-1 text-right text-xs text-gray-500">৳{(item.quantity * item.unit_price - item.discount).toFixed(0)}</div>
                          <div className="col-span-1">
                            {form.items.length > 1 && (
                              <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 font-bold text-lg">&times;</button>
                            )}
                          </div>
                        </div>
                        {overStock && <p className="text-red-500 text-xs pl-1">⚠️ Not enough stock (available: {p?.stock_quantity})</p>}
                      </div>
                    )
                  })}
                  <button type="button" onClick={addRow} className="text-brand-600 hover:text-brand-700 text-sm font-medium">+ Add Another Item</button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">💳 Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Overall Discount (৳)</label>
                    <input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="Flat discount on total bill"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid by Customer (৳)</label>
                    <input type="number" min="0" step="0.01" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="How much did the customer pay?"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                    <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID (TrxID) {needsTrxId ? '*' : '(Optional)'}</label>
                    <input required={needsTrxId} value={form.transaction_id} onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
                      placeholder="e.g. TXN123456789"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <p className="text-[10px] text-gray-400 mt-1">Enter the bKash/Nagad/Rocket/Bank reference number</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-brand-50 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Sub Total</span><span className="font-medium">৳{subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-medium">-৳{form.discount_amount.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-brand-100 pt-1 mt-1"><span className="font-bold text-gray-900">Grand Total</span><span className="font-bold text-brand-700 text-base">৳{grandTotal.toFixed(2)}</span></div>
                {form.paid_amount < grandTotal && grandTotal > 0 && (
                  <div className="flex justify-between text-orange-600"><span>Due Amount</span><span className="font-semibold">৳{(grandTotal - form.paid_amount).toFixed(2)}</span></div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Internal Note (optional)</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                  placeholder="Any internal notes about this sale (not visible to customer)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !!stockError} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {saving ? 'Creating Sale...' : 'Create Sale'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No sales yet</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Invoice', 'Customer', 'Date', 'Total', 'Paid', 'Method', 'TrxID', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-mono text-xs text-gray-700">{s.invoice_number}</td>
                      <td className="px-5 py-4 font-medium text-gray-900 text-sm">{s.customer_name}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900 text-sm">৳{s.total_amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">৳{s.paid_amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm capitalize">{s.payment_method?.replace('_', ' ')}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-400">{s.transaction_id || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/sales/${s.id}`} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">View</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
