import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportApi, type ProfitRecord } from '../api/reportApi'
import Pagination from '../components/Pagination'

export default function ProfitReport() {
  const [data, setData] = useState<ProfitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const load = (p = page) => {
    setLoading(true)
    reportApi.profitList(p, limit, from, to)
      .then(res => {
        setData(res.data)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1); setPage(1) }, [from, to])
  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / limit)

  // Calculate totals for the current view or summary
  const summary = data.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    cogs: acc.cogs + curr.cogs,
    profit: acc.profit + curr.gross_profit
  }), { revenue: 0, cogs: 0, profit: 0 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your net earnings and cost of goods sold</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="text-sm bg-transparent outline-none text-gray-600 cursor-pointer" title="From Date" />
            <span className="text-gray-400 text-sm">→</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="text-sm bg-transparent outline-none text-gray-600 cursor-pointer" title="To Date" />
            {(from || to) && (
              <button onClick={() => { setFrom(''); setTo('') }} className="text-gray-400 hover:text-red-500 font-bold ml-1 text-sm">&times;</button>
            )}
          </div>
          <a href={reportApi.downloadProfitUrl(from, to)} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-gray-50 shadow-sm flex items-center gap-2">
            📥 PDF Report
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">৳{summary.revenue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2">Based on current page results</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total COGS</p>
          <p className="text-2xl font-bold text-orange-600">৳{summary.cogs.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2">Cost of Goods Sold</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -mr-8 -mt-8" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-green-600">৳{summary.profit.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-2">Gross Margin for {data.length} orders</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date', 'Invoice #', 'Customer', 'Revenue', 'COGS', 'Profit', 'Action'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading records...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No records found for the selected period.</td></tr>
              ) : data.map(r => (
                <tr key={r.sale_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{r.date}</td>
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{r.invoice_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{r.customer_name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">৳{r.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-orange-600 font-medium">৳{r.cogs.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">৳{r.gross_profit.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Link to={`/sales/${r.sale_id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
