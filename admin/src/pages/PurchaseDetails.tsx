import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { purchaseApi } from '../api/purchaseApi'
import { invoiceApi } from '../api/invoiceApi'
import { reportApi } from '../api/reportApi'
import type { Purchase } from '../types/purchase'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  received: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function PurchaseDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    purchaseApi.getById(id)
      .then(setPurchase)
      .catch(() => navigate('/purchases'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleReceive = async () => {
    if (!purchase || !confirm('Mark this purchase as received? Stock will be updated.')) return
    setProcessing(true)
    try {
      await purchaseApi.receive(purchase.id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to mark as received')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!purchase || !confirm('Cancel this purchase?')) return
    setProcessing(true)
    try {
      await purchaseApi.cancel(purchase.id)
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to cancel purchase')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!purchase || !confirm('Delete this purchase record permanently?')) return
    setProcessing(true)
    try {
      await purchaseApi.delete(purchase.id)
      navigate('/purchases')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete purchase')
    } finally {
      setProcessing(false)
    }
  }

  const handleInvoice = async () => {
    if (!purchase) return
    try {
      const inv = await invoiceApi.generateForPurchase(purchase.id)
      window.open(invoiceApi.printUrl(inv.id), '_blank')
    } catch (e) {
      alert('Failed to generate document')
    }
  }

  const handleDownloadPDF = () => {
    if (!purchase) return
    window.open(reportApi.downloadPurchasesUrl(purchase.created_at.slice(0, 10), purchase.created_at.slice(0, 10), 'pdf'), '_blank')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
  if (!purchase) return <div className="text-center py-12 text-gray-500">Purchase not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/purchases')} className="text-gray-500 hover:text-gray-700 text-sm mb-2 flex items-center gap-1">
            ← Back to Purchases
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">PUR-{purchase.id.slice(0, 8).toUpperCase()}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_BADGE[purchase.status]}`}>
              {purchase.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Order Date: {new Date(purchase.created_at).toLocaleString()}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {purchase.status === 'pending' && (
            <>
              <button disabled={processing} onClick={handleReceive} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50">
                Mark as Received
              </button>
              <button disabled={processing} onClick={handleCancel} className="bg-white border border-gray-200 text-orange-600 hover:bg-orange-50 font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                Cancel Order
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
            📄 View Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
             <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Supplier Information</h2>
             <div className="grid grid-cols-2 gap-y-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400">Supplier Name</label>
                  <p className="font-semibold text-gray-900 text-lg uppercase tracking-tight">{purchase.supplier_name}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Status</label>
                  <p className="text-gray-700 capitalize">{purchase.status}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Creation Method</label>
                  <p className="text-gray-700">Manual Entry</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex items-center justify-between">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Purchase Items</h2>
               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{purchase.items.length} Lines</span>
             </div>
             <table className="w-full">
               <thead className="bg-gray-50">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sourcing Item</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {purchase.items.map((item, i) => (
                   <tr key={i}>
                     <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-400 font-mono tracking-tighter">{item.sku}</p>
                     </td>
                     <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">{item.quantity}</td>
                     <td className="px-6 py-4 text-right text-sm text-gray-600">৳{item.unit_cost.toLocaleString()}</td>
                     <td className="px-6 py-4 text-right font-medium text-gray-900 text-sm">৳{item.subtotal.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
             
             <div className="p-6 bg-gray-50/50">
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="font-bold text-gray-900 uppercase text-xs tracking-widest">Total Sourcing Cost</span>
                  <span className="text-lg font-bold text-brand-700">৳{purchase.total_amount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic text-right">Tax and shipping costs are calculated as part of the unit cost in this entry.</p>
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Financial Status</h2>
            <div className="space-y-4">
              <div className="bg-brand-50/50 rounded-xl p-4 border border-brand-100">
                <label className="block text-xs text-brand-600 font-bold uppercase tracking-wider mb-1">Paid Amount</label>
                <p className="text-2xl font-bold text-brand-700">৳{purchase.paid_amount.toLocaleString()}</p>
                <div className="mt-2 w-full bg-brand-200 rounded-full h-1.5 overflow-hidden">
                   <div className="bg-brand-600 h-full" style={{ width: `${Math.min(100, (purchase.paid_amount / purchase.total_amount) * 100)}%` }} />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-4">
                <span className="text-gray-500">Balance Due</span>
                <span className={`font-bold ${purchase.total_amount - purchase.paid_amount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  ৳{(purchase.total_amount - purchase.paid_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Internal Notes</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">
              {purchase.note || 'No internal notes found for this procurement order.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
