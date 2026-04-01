import adminClient from './adminApi'
import type { User, UserFormData } from '../types/user'
import type { PaginatedResponse } from '../types/pagination'
import { AxiosError } from 'axios'

function handleError(err: unknown): never {
  if (err instanceof AxiosError && err.response?.data?.error) throw new Error(err.response.data.error as string)
  throw err
}

export const userApi = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<User>> => {
    try { return (await adminClient.get<PaginatedResponse<User>>('/admin/users', { params: { page, limit } })).data }
    catch (err) { return handleError(err) }
  },
  getById: async (id: string): Promise<User> => {
    try { return (await adminClient.get<User>(`/admin/users/${id}`)).data }
    catch (err) { return handleError(err) }
  },
  create: async (data: UserFormData): Promise<User> => {
    try { return (await adminClient.post<User>('/admin/users', data)).data }
    catch (err) { return handleError(err) }
  },
  update: async (id: string, data: Partial<UserFormData>): Promise<User> => {
    try { return (await adminClient.put<User>(`/admin/users/${id}`, data)).data }
    catch (err) { return handleError(err) }
  },
  toggle: async (id: string): Promise<User> => {
    try { return (await adminClient.patch<User>(`/admin/users/${id}/toggle`)).data }
    catch (err) { return handleError(err) }
  },
  delete: async (id: string): Promise<void> => {
    try { await adminClient.delete(`/admin/users/${id}`) }
    catch (err) { return handleError(err) }
  },
}
