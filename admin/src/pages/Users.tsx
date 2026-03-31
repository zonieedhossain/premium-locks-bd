import { useEffect, useState } from 'react'
import { userApi } from '../api/userApi'
import UserForm from '../components/UserForm'
import { useAuth } from '../context/AuthContext'
import type { User, UserFormData } from '../types/user'

const roleBadge: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700', admin: 'bg-orange-100 text-orange-700',
  editor: 'bg-blue-100 text-blue-700', viewer: 'bg-gray-100 text-gray-600',
}

export default function AdminUsers() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; user?: User } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const load = () => {
    setLoading(true)
    userApi.getAll().then(setUsers).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSubmit = async (data: UserFormData) => {
    if (modal?.type === 'edit' && modal.user) await userApi.update(modal.user.id, data)
    else await userApi.create(data)
    setModal(null); load()
  }

  const handleToggle = async (u: User) => { await userApi.toggle(u.id); load() }
  const handleDelete = async () => {
    if (!deleteTarget) return
    await userApi.delete(deleteTarget.id); setDeleteTarget(null); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} accounts</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add User
        </button>
      </div>

      {loading ? <div className="flex justify-center h-48 items-center"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['User', 'Role', 'Permissions', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{u.name[0]?.toUpperCase()}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.permissions.map(p => <span key={p} className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-0.5 rounded">{p}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {u.id !== me?.id ? (
                      <button onClick={() => handleToggle(u)}
                        className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors ${u.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    ) : <span className="text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ type: 'edit', user: u })} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                      </button>
                      {u.id !== me?.id && (
                        <button onClick={() => setDeleteTarget(u)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{modal.type === 'edit' ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="px-6 py-6">
              <UserForm initial={modal.user} onSubmit={handleSubmit} onCancel={() => setModal(null)} creatorRole={me?.role ?? 'viewer'} />
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <p className="font-bold text-gray-900 mb-2">Delete user?</p>
            <p className="text-sm text-gray-600 mb-6">This will permanently remove "<span className="font-semibold">{deleteTarget.name}</span>".</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
