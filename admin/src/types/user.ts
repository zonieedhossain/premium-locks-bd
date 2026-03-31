export interface User {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  is_active: boolean
  created_at: string
  created_by: string
}

export interface UserFormData {
  name: string
  email: string
  password: string
  role: string
  permissions: string[]
}

export const ALL_PERMISSIONS = [
  'products:read', 'products:write',
  'users:read', 'users:write',
]

export const ROLES = ['superadmin', 'admin', 'editor', 'viewer'] as const
export type RoleType = typeof ROLES[number]
