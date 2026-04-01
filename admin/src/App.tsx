import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Purchases from './pages/Purchases'
import Sales from './pages/Sales'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import SaleDetails from './pages/SaleDetails'
import PurchaseDetails from './pages/PurchaseDetails'
import InvoiceDetails from './pages/InvoiceDetails'
import ProfitReport from './pages/ProfitReport'

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><AdminLayout><Users /></AdminLayout></ProtectedRoute>} />
          <Route path="/purchases" element={<ProtectedRoute><AdminLayout><Purchases /></AdminLayout></ProtectedRoute>} />
          <Route path="/purchases/:id" element={<ProtectedRoute><AdminLayout><PurchaseDetails /></AdminLayout></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><AdminLayout><Sales /></AdminLayout></ProtectedRoute>} />
          <Route path="/sales/:id" element={<ProtectedRoute><AdminLayout><SaleDetails /></AdminLayout></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><AdminLayout><Invoices /></AdminLayout></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute><AdminLayout><InvoiceDetails /></AdminLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
          <Route path="/reports/profit" element={<ProtectedRoute><AdminLayout><ProfitReport /></AdminLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AdminLayout><Settings /></AdminLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
