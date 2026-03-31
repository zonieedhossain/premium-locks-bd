import { useEffect, useState } from 'react'
import { invoiceApi } from '../api/invoiceApi'
import type { Invoice } from '../types/invoice'

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    invoiceApi.getAll().then(setInvoices).finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📄</p>
            <p className="font-medium text-gray-500">No invoices yet</p>
            <p className="text-sm text-gray-400 mt-1">Generate invoices from the Sales or Purchases pages</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Invoice #', 'Type', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-mono text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${inv.type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <a href={invoiceApi.downloadUrl(inv.id)} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors">
                          Download
                        </a>
                        <a href={invoiceApi.printUrl(inv.id)} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium text-gray-600 hover:text-gray-700 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                          Print
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
