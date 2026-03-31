import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="max-w-xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role], ['Status', 'Active']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 font-medium">{k}</span>
                <span className="text-gray-900 font-semibold capitalize">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Your Permissions</h2>
          <div className="flex flex-wrap gap-2">
            {user?.permissions.map(p => (
              <span key={p} className="bg-brand-50 text-brand-700 text-xs font-mono font-semibold px-3 py-1.5 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
