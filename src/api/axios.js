import axios from 'axios'

const TOKEN_KEY = 'aether.token'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
})

// Selalu sertakan token (kalau ada) di setiap request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Kalau token sudah tidak valid (401), bersihkan sesi supaya user diarahkan ke login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('aether.user')
    }
    return Promise.reject(error)
  },
)

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export default api
