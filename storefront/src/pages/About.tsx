export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-brand-950 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Our Story</h1>
          <p className="text-brand-200 text-lg">Securing Bangladesh since 2015</p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-gold-400/10 text-gold-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">Our Mission</div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Making Every Home & Business More Secure</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Premium Locks BD was founded with a simple belief: every person in Bangladesh deserves access to world-class security products at fair prices. What started as a small shop in Gulshan has grown into the country's most trusted security retailer.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We source only from certified manufacturers and put every product through rigorous quality checks before it reaches our customers. Our team of security experts is always available to help you choose the right lock for your specific needs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['50K+', 'Customers Protected'], ['500+', 'Products Stocked'], ['15+', 'Years in Business'], ['99%', 'Satisfaction Rate']].map(([num, label]) => (
                <div key={label} className="bg-brand-50 rounded-2xl p-6 text-center">
                  <p className="text-3xl font-black text-brand-700 mb-1">{num}</p>
                  <p className="text-gray-600 text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">What We Stand For</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ['🔐', 'Quality First', 'Every product we sell is certified and tested to meet international safety standards.'],
              ['💰', 'Fair Pricing', 'We believe security should not be a luxury. Our prices are the most competitive in Bangladesh.'],
              ['🤝', 'Expert Advice', 'Our trained security consultants help you make the right choice, not the most expensive one.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <span className="text-4xl block mb-4">{icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team placeholder */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4">Meet the Team</h2>
          <p className="text-gray-500 text-center mb-12">The people dedicated to keeping Bangladesh secure</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[['Rahim Ahmed', 'CEO & Founder'], ['Karim Hassan', 'Head of Operations'], ['Fatema Begum', 'Lead Consultant'], ['Nasir Khan', 'Technical Director']].map(([name, role]) => (
              <div key={name} className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white">
                  {name[0]}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
