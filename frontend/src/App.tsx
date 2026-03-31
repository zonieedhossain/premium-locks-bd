import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Admin from './pages/Admin'
import ProductDetail from './pages/ProductDetail'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <p className="text-6xl font-extrabold text-gray-200">404</p>
              <p className="text-gray-500">Page not found</p>
              <a href="/" className="text-brand-600 hover:underline text-sm">Go home</a>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
