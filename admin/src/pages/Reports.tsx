import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { reportApi, type SummaryReport, type DailySales, type StockItem, type TopProduct, type MonthlyComparison, type PaymentMethodBreakdown } from '../api/reportApi'

const PIE_COLORS = ['#1a3dd6', '#25D366', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-black text-gray-900 mt-2">{value}</p>
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Reports() {
  const [summary, setSummary] = useState<SummaryReport | null>(null)
  const [salesData, setSalesData] = useState<DailySales[]>([])
  const [stockData, setStockData] = useState<StockItem[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [monthly, setMonthly] = useState<MonthlyComparison[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = () => {
    Promise.all([
      reportApi.summary(),
      reportApi.sales(from || undefined, to || undefined),
      reportApi.stock(),
      reportApi.topProducts(from || undefined, to || undefined),
      reportApi.monthlyComparison(),
      reportApi.paymentMethods(),
    ]).then(([s, sd, st, tp, mc, pm]) => {
      setSummary(s)
      setSalesData(sd)
      setStockData(st)
      setTopProducts(tp)
      setMonthly(mc)
      setPaymentMethods(pm)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    load()
  }

  const handleDownloadSales = (format: 'excel' | 'pdf' | 'csv') => {
    window.open(reportApi.downloadSalesUrl(from || undefined, to || undefined, format), '_blank')
  }

  const handleDownloadPurchases = (format: 'excel' | 'pdf' | 'csv') => {
    window.open(reportApi.downloadPurchasesUrl(from || undefined, to || undefined, format), '_blank')
  }

  const handleDownloadStock = (format: 'excel' | 'pdf') => {
    window.open(reportApi.downloadStockUrl(format), '_blank')
  }

  const handleDownloadTopProducts = (format: 'excel' | 'pdf') => {
    window.open(reportApi.downloadTopProductsUrl(from || undefined, to || undefined, format), '_blank')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Total Revenue" value={`৳${summary.total_revenue.toLocaleString()}`} icon="💰" />
          <StatCard label="Total Purchase Cost" value={`৳${summary.total_purchase_cost.toLocaleString()}`} icon="🏭" />
          <StatCard label="Gross Profit" value={`৳${summary.gross_profit.toLocaleString()}`} icon="📈" sub={summary.gross_profit >= 0 ? 'Profit' : 'Loss'} />
          <StatCard label="Total Orders" value={String(summary.total_orders)} icon="🛒" />
          <StatCard label="Low Stock Products" value={String(summary.low_stock_products)} icon="⚠️" sub="Stock < 10 units" />
          <StatCard label="Total Stock Value" value={`৳${summary.total_stock_value.toLocaleString()}`} icon="📦" />
        </div>
      )}

      {/* Date filter */}
      <form onSubmit={handleFilter} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">Apply</button>
        <button type="button" onClick={() => { setFrom(''); setTo(''); }} className="border border-gray-200 text-gray-700 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">Reset</button>
      </form>

      {/* Sales Trend */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-900 line-height-1">Sales Trend</h2>
            <p className="text-xs text-gray-400 mt-1">Detailed revenue visualization</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button onClick={() => handleDownloadSales('excel')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 border-r border-gray-100 transition-colors">EXCEL</button>
              <button onClick={() => handleDownloadSales('pdf')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 border-r border-gray-100 transition-colors">PDF</button>
              <button onClick={() => handleDownloadSales('csv')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 transition-colors">CSV</button>
            </div>
            <button onClick={() => window.print()} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-xl transition-colors">Print View</button>
          </div>
        </div>
        {salesData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No sales data in range</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `৳${Number(v).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#1a3dd6" strokeWidth={2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900">Top 10 Products (by Units Sold)</h2>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button onClick={() => handleDownloadTopProducts('excel')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 border-r border-gray-100 transition-colors">EXCEL</button>
              <button onClick={() => handleDownloadTopProducts('pdf')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 transition-colors">PDF</button>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="product_name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="units_sold" fill="#1a3dd6" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-6">Payment Methods</h2>
          {paymentMethods.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentMethods} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${(entry as { method?: string }).method ?? ''}: ${entry.value ?? ''}`}>
                  {paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-900">Monthly Purchase vs Sales</h2>
            <p className="text-xs text-gray-400 mt-1">Comparison of sourcing costs vs revenue</p>
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => handleDownloadPurchases('excel')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 border-r border-gray-100 transition-colors">EXCEL</button>
            <button onClick={() => handleDownloadPurchases('pdf')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 border-r border-gray-100 transition-colors">PDF</button>
            <button onClick={() => handleDownloadPurchases('csv')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 transition-colors">CSV</button>
          </div>
        </div>
        {monthly.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `৳${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="sales" fill="#1a3dd6" name="Sales" />
              <Bar dataKey="purchases" fill="#f59e0b" name="Purchases" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stock Levels */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900">Stock Levels</h2>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => handleDownloadStock('excel')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 border-r border-gray-100 transition-colors">STOCK EXCEL</button>
            <button onClick={() => handleDownloadStock('pdf')} className="text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 transition-colors">STOCK PDF</button>
          </div>
        </div>
        {stockData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No products</p>
        ) : (
          <>
            <div className="mb-6" style={{ height: Math.max(200, stockData.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="product_name" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="current_stock" name="Stock" fill="#1a3dd6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Product', 'SKU', 'Category', 'Stock', 'Value', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockData.map(s => (
                    <tr key={s.product_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.product_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.sku}</td>
                      <td className="px-4 py-3 text-gray-500">{s.category}</td>
                      <td className="px-4 py-3 font-semibold">{s.current_stock}</td>
                      <td className="px-4 py-3 text-gray-500">৳{s.stock_value.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === 'ok' ? 'bg-green-100 text-green-700' : s.status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
