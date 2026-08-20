import { createContext, useContext, useMemo, useState } from 'react'
import { DEMO_ACCOUNTS } from '../data/mock'

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)

  const value = useMemo(() => {
    function persist(next) {
      setUser(next)
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    }

    function login(email, password) {
      const found = DEMO_ACCOUNTS.find(
        (account) => account.email.toLowerCase() === email.trim().toLowerCase(),
      )
      if (found) {
        if (found.password !== password) {
          throw new Error('Kata sandi tidak sesuai.')
        }
        persist(found)
        return found
      }
      if (!email || !password) {
        throw new Error('Lengkapi email dan kata sandi.')
      }
      persist({
        email,
        role: 'employee',
        name: email.split('@')[0].replace(/[._]/g, ' '),
        title: 'Karyawan',
        department: 'Umum',
        location: 'Jakarta',
        joinDate: '01 Jan 2026',
        employeeId: 'EMP-0000',
        phone: '—',
      })
    }

    function register(payload) {
      persist({
        email: payload.email,
        role: 'employee',
        name: payload.name,
        title: 'Karyawan',
        department: payload.department || 'Umum',
        location: 'Jakarta',
        joinDate: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        employeeId: 'EMP-NEW',
        phone: payload.phone || '—',
      })
    }

    function logout() {
      persist(null)
    }

    function updateUser(patch) {
      persist({ ...user, ...patch })
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
