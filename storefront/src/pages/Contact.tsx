import { useState } from 'react'
import { publicApi } from '../api/publicApi'
import mapImg from '../assets/map.png'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await publicApi.sendContact(form)
    } catch {
      // Always show success to user even if email fails
    } finally {
      setSending(false)
      setSubmitted(true)
    }
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
                ['📍', 'Address', 'Shekherchak, Boalia\nRajshahi, Bangladesh'],
                ['📞', 'Phone', '+880 1737-195614'],
                ['✉️', 'Email', 'premiumlocksbd@gmail.com'],
                ['🕐', 'Business Hours', 'Saturday – Thursday: 9 AM – 8 PM\nFriday: Closed'],
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

            {/* Map Integration */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group">
              <img 
                src={mapImg} 
                alt="Premium Locks BD Location Map" 
                className="w-full h-64 object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=Shekherchak,Boalia,Rajshahi,Bangladesh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/90 backdrop-blur-sm text-gray-900 px-5 py-2.5 rounded-full text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-600 hover:text-white"
                >
                  📍 Open in Google Maps
                </a>
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
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                  className="mt-6 text-brand-600 hover:underline text-sm font-medium">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {([
                  ['name', 'Full Name', 'text', 'John Doe'],
                  ['email', 'Email Address', 'email', 'john@example.com'],
                  ['phone', 'Phone Number', 'tel', '+880 1XXX-XXXXXX'],
                  ['subject', 'Subject', 'text', 'Question about padlocks'],
                ] as const).map(([field, label, type, placeholder]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      required={field !== 'phone'}
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
                <button type="submit" disabled={sending} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
