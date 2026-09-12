import axios from 'axios'

const TOKEN_KEY = 'aether.token'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
})

// Selalu sertakan token (kalau ada) di setiap request.
// Pakai sessionStorage (bukan localStorage) supaya tiap TAB browser
// punya sesi login sendiri-sendiri — buka banyak tab dengan akun
// demo yang beda-beda (Admin/HR/Manager/Karyawan) jadi nggak akan
// saling menimpa token satu sama lain.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY)
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
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem('aether.user')
    }
    return Promise.reject(error)
  },
)

export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export default api