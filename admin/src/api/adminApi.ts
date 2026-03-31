import axios from 'axios'

const adminClient = axios.create({ baseURL: '/api' })

// Attach JWT to every request
adminClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear tokens and redirect to login
adminClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err instanceof Error ? err : new Error(err.response?.data?.error ?? 'Request failed'))
  }
)

export default adminClient
