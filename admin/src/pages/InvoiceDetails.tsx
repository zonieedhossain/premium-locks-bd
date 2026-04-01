import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { invoiceApi } from '../api/invoiceApi'

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    invoiceApi.getAll()
      .then(res => {
        const found = res.data.find(i => i.id === id)
        if (found) {
          navigate(found.type === 'sale' ? `/sales/${found.linked_id}` : `/purchases/${found.linked_id}`, { replace: true })
        } else {
          navigate('/invoices')
        }
      })
      .catch(() => navigate('/invoices'))
  }, [id, navigate])

  if (!id) return <div className="text-center py-12 text-gray-500">Invalid Invoice ID</div>

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium animate-pulse">Redirecting to transaction details...</p>
    </div>
  )
}
