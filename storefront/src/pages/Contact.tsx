import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-brand-950 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Get in Touch</h1>
          <p className="text-brand-200 text-lg">We're here to help with any security questions</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Contact Information</h2>
            <div className="space-y-6">
              {[
                ['📍', 'Address', '123 Gulshan Avenue, Gulshan-1\nDhaka 1212, Bangladesh'],
                ['📞', 'Phone', '+880 1700-000000\n+880 1800-000000'],
                ['✉️', 'Email', 'info@premiumlocksbd.com\nsupport@premiumlocksbd.com'],
                ['🕐', 'Business Hours', 'Saturday – Thursday: 9 AM – 7 PM\nFriday: Closed'],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{label}</p>
                    <p className="text-gray-600 text-sm whitespace-pre-line">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="mt-8 bg-gray-100 rounded-2xl h-48 flex items-center justify-center border border-gray-200">
              <div className="text-center text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className="text-sm font-medium">Map placeholder — Gulshan, Dhaka</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Send a Message</h2>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <span className="text-5xl block mb-4">✅</span>
                <p className="font-bold text-green-800 text-lg mb-2">Message Sent!</p>
                <p className="text-green-600 text-sm">We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="mt-6 text-brand-600 hover:underline text-sm font-medium">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {([['name', 'Full Name', 'text', 'John Doe'], ['email', 'Email Address', 'email', 'john@example.com'], ['subject', 'Subject', 'text', 'Question about padlocks']] as const).map(([field, label, type, placeholder]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      required
                      value={form[field as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>
                <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
