import { useState } from 'react'
import type { UserFormData } from '../types/user'
import { ALL_PERMISSIONS, ROLES } from '../types/user'
import type { User } from '../types/user'

interface Props {
  initial?: User
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  creatorRole: string
}

const empty: UserFormData = { name: '', email: '', password: '', role: 'editor', permissions: [] }

export default function UserForm({ initial, onSubmit, onCancel, creatorRole }: Props) {
  const [form, setForm] = useState<UserFormData>(
    initial ? { name: initial.name, email: initial.email, password: '', role: initial.role, permissions: initial.permissions } : empty
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function set<K extends keyof UserFormData>(k: K, v: UserFormData[K]) {
    setForm(f => {
      const next = { ...f, [k]: v }
      // Auto-set permissions when role changes
      if (k === 'role') {
        const defaults: Record<string, string[]> = {
          superadmin: ['products:read', 'products:write', 'users:read', 'users:write'],
          admin: ['products:read', 'products:write', 'users:read'],
          editor: ['products:read', 'products:write'],
          viewer: ['products:read'],
        }
        next.permissions = defaults[v as string] ?? []
      }
      return next
    })
  }

  function togglePerm(perm: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setSubmitError(null)
    try { await onSubmit(form) }
    catch (err) { setSubmitError(err instanceof Error ? err.message : 'Something went wrong') }
    finally { setSubmitting(false) }
  }

  const allowedRoles = creatorRole === 'superadmin' ? ROLES : ROLES.filter(r => r !== 'superadmin' && r !== 'admin')

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{submitError}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
          <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
          <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password {initial ? '(leave blank to keep current)' : '*'}</label>
        <input type="password" required={!initial} minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
        <select value={form.role} onChange={e => set('role', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          {allowedRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PERMISSIONS.map(perm => (
            <label key={perm} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePerm(perm)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-sm text-gray-700 font-mono">{perm}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm">Cancel</button>
        <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm">
          {submitting ? 'Saving…' : (initial ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  )
}
