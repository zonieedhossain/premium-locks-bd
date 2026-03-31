import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-brand-950 border-b border-brand-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gold-400 flex items-center justify-center shadow-md group-hover:bg-gold-500 transition-colors">
              <svg className="w-5 h-5 text-brand-950" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">Premium Locks</span>
              <span className="block text-gold-400 text-xs font-medium tracking-widest uppercase">Bangladesh</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-200 hover:text-white hover:bg-brand-800'
              }`}
            >
              Storefront
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-gold-500 text-white'
                  : 'text-brand-200 hover:text-white hover:bg-brand-800'
              }`}
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
