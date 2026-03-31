import { Link } from 'react-router-dom'

export default function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/30 text-gold-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            Trusted by 50,000+ customers across Bangladesh
          </div>

          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
            Lock In<br />
            <span className="text-gold-400">True Security</span>
          </h1>

          <p className="text-brand-200 text-lg lg:text-xl leading-relaxed mb-10 max-w-xl">
            Premium padlocks, smart locks, and deadbolts engineered for Bangladesh's demanding environment. Uncompromising quality, unbeatable protection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-gold-400 hover:bg-gold-500 text-brand-950 font-bold px-8 py-4 rounded-2xl transition-colors text-sm shadow-lg shadow-gold-400/25"
            >
              Shop All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center border border-brand-600 text-brand-200 hover:text-white hover:border-brand-400 font-semibold px-8 py-4 rounded-2xl transition-colors text-sm"
            >
              Our Story
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-8 max-w-sm">
            {[['50K+', 'Happy Customers'], ['15+', 'Years Experience'], ['500+', 'Products']].map(([num, label]) => (
              <div key={label}>
                <p className="text-2xl font-black text-gold-400">{num}</p>
                <p className="text-brand-300 text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
