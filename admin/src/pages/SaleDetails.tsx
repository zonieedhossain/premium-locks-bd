import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { saleApi } from '../api/saleApi'
import { invoiceApi } from '../api/invoiceApi'
import { reportApi } from '../api/reportApi'
import type { Sale } from '../types/sale'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  refunded: 'bg-red-100 text-red-700 border-red-200',
}

export default function SaleDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    saleApi.getById(id)
      .then(setSale)
      .catch(() => navigate('/sales'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleComplete = async () => {
    if (!sale || !confirm('Mark this sale as completed?')) return
    setProcessing(true)
    try {
      await saleApi.complete(sale.id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to complete sale')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!sale || !confirm('Cancel this sale? Stock will be restored.')) return
    setProcessing(true)
    try {
      await saleApi.cancel(sale.id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to cancel sale')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!sale || !confirm('Delete this sale record permanently?')) return
    setProcessing(true)
    try {
      await saleApi.delete(sale.id)
      navigate('/sales')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete sale')
    } finally {
      setProcessing(false)
    }
  }

  const handleInvoice = async () => {
    if (!sale) return
    try {
      const inv = await invoiceApi.generateForSale(sale.id)
      window.open(invoiceApi.printUrl(inv.id), '_blank')
    } catch (e) {
      alert('Failed to generate invoice')
    }
  }

  const handleDownloadPDF = () => {
    if (!sale) return
    window.open(reportApi.downloadSalesUrl(sale.created_at.slice(0, 10), sale.created_at.slice(0, 10), 'pdf'), '_blank')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
  if (!sale) return <div className="text-center py-12 text-gray-500">Sale not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/sales')} className="text-gray-500 hover:text-gray-700 text-sm mb-2 flex items-center gap-1">
            ← Back to Sales
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{sale.invoice_number}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_BADGE[sale.status]}`}>
              {sale.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Transaction ID: {sale.id}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {sale.status === 'pending' && (
            <>
              <button disabled={processing} onClick={handleComplete} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50">
                Mark as Complete
              </button>
              <button disabled={processing} onClick={handleCancel} className="bg-white border border-gray-200 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                Cancel Sale
              </button>
              <button disabled={processing} onClick={handleDelete} className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                Delete
              </button>
            </>
          )}
          <button onClick={handleDownloadPDF} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
            📥 PDF Report
          </button>
          <button onClick={handleInvoice} className="bg-brand-50 border border-brand-100 text-brand-700 hover:bg-brand-100 font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
            📄 View Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Customer Details</h2>
             <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <label className="block text-xs text-gray-400">Name</label>
                  <p className="font-semibold text-gray-900">{sale.customer_name}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Phone</label>
                  <p className="text-gray-700">{sale.customer_phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400">Address</label>
                  <p className="text-gray-700">{sale.customer_address || 'No address provided'}</p>
                </div>
                {sale.customer_email && (
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400">Email</label>
                    <p className="text-gray-700">{sale.customer_email}</p>
                  </div>
                )}
             </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-50">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Itemized Breakdown</h2>
             </div>
             <table className="w-full">
               <thead className="bg-gray-50">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {sale.items.map((item, i) => (
                   <tr key={i}>
                     <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                     </td>
                     <td className="px-6 py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                     <td className="px-6 py-4 text-right text-sm text-gray-600">৳{item.unit_price.toLocaleString()}</td>
                     <td className="px-6 py-4 text-right font-medium text-gray-900 text-sm">৳{item.subtotal.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
             
             <div className="p-6 bg-gray-50/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">৳{sale.sub_total.toLocaleString()}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-red-500">-৳{sale.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                {sale.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VAT/Tax</span>
                    <span className="text-gray-900">৳{sale.tax_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="text-lg font-bold text-brand-700">৳{sale.total_amount.toLocaleString()}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Meta */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Payment & Logistics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400">Payment Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${sale.paid_amount >= sale.total_amount ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <p className="font-semibold text-gray-900">{sale.paid_amount >= sale.total_amount ? 'Fully Paid' : 'Partially Paid'}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">৳{sale.paid_amount.toLocaleString()} received via {sale.payment_method}</p>
              </div>
              
              <div className="border-t border-gray-50 pt-4">
                <label className="block text-xs text-gray-400">Created At</label>
                <p className="text-sm text-gray-700">{new Date(sale.created_at).toLocaleString()}</p>
              </div>

              <div className="border-t border-gray-50 pt-4">
                <label className="block text-xs text-gray-400">Last Updated</label>
                <p className="text-sm text-gray-700">{new Date(sale.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Administrative Note</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 italic">
              {sale.note || 'No administrative notes attached to this transaction.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
