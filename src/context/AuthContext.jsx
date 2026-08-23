import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearToken, saveToken } from '../api/axios'
import { formatDate } from '../lib/format'

const AuthContext = createContext(null)
const STORAGE_KEY = 'aether.user'

function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Backend mengembalikan field snake_case (employee_id, join_date).
// Halaman-halaman FE sudah dibuat memakai camelCase (employeeId, joinDate),
// jadi kita normalisasi di sini supaya halaman lain tidak perlu diubah.
function normalizeUser(raw) {
  if (!raw) return null
  return {
    email: raw.email,
    role: raw.role,
    name: raw.name,
    title: raw.title,
    department: raw.department,
    location: raw.location,
    joinDate: raw.join_date ? formatDate(raw.join_date) : '',
    employeeId: raw.employee_id,
    phone: raw.phone || '—',
  }
}

function extractErrorMessage(err, fallback) {
  const data = err?.response?.data
  if (data?.message) return data.message
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  return fallback
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)

  // Validasi token di background saat aplikasi dibuka lagi.
  // Kalau token sudah kedaluwarsa, /api/me akan gagal (401) dan
  // interceptor axios akan membersihkan localStorage, lalu kita logout di sini.
  useEffect(() => {
    if (!user) return
    api
      .get('/me')
      .then((res) => {
        const fresh = normalizeUser(res.data)
        setUser(fresh)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(() => {
    function persist(next) {
      setUser(next)
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    }

    async function login(email, password) {
      try {
        const res = await api.post('/login', { email, password })
        saveToken(res.data.token)
        const normalized = normalizeUser(res.data.user)
        persist(normalized)
        return normalized
      } catch (err) {
        throw new Error(extractErrorMessage(err, 'Email atau kata sandi tidak sesuai.'))
      }
    }

    async function register(payload) {
      try {
        const res = await api.post('/register', {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          department: payload.department,
          phone: payload.phone,
        })
        saveToken(res.data.token)
        persist(normalizeUser(res.data.user))
      } catch (err) {
        throw new Error(extractErrorMessage(err, 'Gagal membuat akun. Coba lagi.'))
      }
    }

    async function logout() {
      try {
        await api.post('/logout')
      } catch {
        // Token mungkin sudah invalid, tetap lanjut bersihkan sesi lokal.
      }
      clearToken()
      persist(null)
    }

    async function updateUser(patch) {
      const res = await api.patch('/me', patch)
      const normalized = normalizeUser(res.data)
      persist(normalized)
      return normalized
    }

    return { user, login, register, logout, updateUser }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
