import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-400 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-950" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">Premium Locks BD</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Importer & Wholesaler of all types of Lock. Serving security needs across Bangladesh with reliability and trust.
            </p>
            {/* Social placeholders */}
            <div className="flex gap-3">
              {['Facebook', 'Instagram', 'Twitter'].map(s => (
                <div key={s} className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center hover:bg-brand-700 cursor-pointer transition-colors" title={s}>
                  <span className="text-xs font-bold text-brand-300">{s[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['Home', '/'], ['Products', '/products'], ['About', '/about'], ['Contact', '/contact']].map(([label, to]) => (
                <li key={to}><Link to={to} className="hover:text-gold-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 Shekherchak, Boalia, Rajshahi</li>
              <li>📞 +880 1737-195614</li>
              <li>✉️ premiumlocksbd@gmail.com</li>
              <li>🕐 Sat–Thu, 9 AM – 8 PM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Premium Locks BD. All rights reserved.</p>
          <p>Built with security in mind.</p>
        </div>
      </div>
    </footer>
  )
}
