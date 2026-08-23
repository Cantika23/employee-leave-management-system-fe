import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Search,
  Settings,
  Users,
  FilePlus2,
  History,
  UserRound,
} from 'lucide-react'
import Brand from '../Brand'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const MENU = [
  { to: '/app', label: 'Ringkasan', icon: LayoutDashboard, end: true, group: 'Utama' },
  { to: '/app/leave/apply', label: 'Pengajuan', icon: FilePlus2, group: 'Cuti' },
  { to: '/app/leave/history', label: 'Riwayat Pengajuan', icon: History, group: 'Cuti' },
  { to: '/app/calendar', label: 'Kalender', icon: CalendarDays, group: 'Cuti', roles: ['manager', 'hr'] },
  { to: '/app/approvals', label: 'Persetujuan', icon: ClipboardCheck, group: 'Tim', roles: ['manager', 'hr'] },
  { to: '/app/employees', label: 'Karyawan', icon: Users, group: 'Organisasi', roles: ['hr'] },
  { to: '/app/reports', label: 'Laporan', icon: PieChart, group: 'Organisasi', roles: ['manager', 'hr'] },
  { to: '/app/settings', label: 'Pengaturan', icon: Settings, group: 'Akun', roles: ['manager', 'hr'] },
  { to: '/app/profile', label: 'Profil', icon: UserRound, group: 'Akun' },
]

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    api
      .get('/notifications')
      .then((res) => setNotifications(res.data))
      .catch(() => {})
  }, [])

  const items = useMemo(
    () => MENU.filter((item) => !item.roles || item.roles.includes(user.role)),
    [user.role],
  )

  const grouped = items.reduce((acc, item) => {
    acc[item.group] = acc[item.group] || []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="app-shell">
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <Brand to="/app" />
        <nav>
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group}>
              <div className="side-group">{group}</div>
              {list.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `side-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar__foot">
          <button
            className="side-link"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      <div>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Buka menu">
              <Menu size={18} />
            </button>
            <label className="search">
              <Search size={16} />
              <input placeholder="Cari cuti, karyawan, atau laporan" />
            </label>
          </div>
          <div className="topbar__right">
            <div className="rel">
              <button className="icon-btn" onClick={() => setNotes((v) => !v)} aria-label="Notifikasi">
                <Bell size={18} />
                {notifications.some((n) => n.unread) && <span className="dot-alert" />}
              </button>
              {notes && (
                <div className="dropdown">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setNotes(false)
                        if (item.unread) {
                          api.patch(`/notifications/${item.id}/read`).catch(() => {})
                          setNotifications((prev) =>
                            prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
                          )
                        }
                      }}
                    >
                      <strong>{item.title}</strong>
                      <div className="hint">{item.time}</div>
                    </button>
                  ))}
                  {notifications.length === 0 && (
                    <button disabled>
                      <span className="hint">Tidak ada notifikasi.</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <button className="profile-btn" onClick={() => navigate('/app/profile')}>
              <span className="avatar">{initials(user.name)}</span>
              <span>
                <b>{user.name}</b>
                <small>{user.title}</small>
              </span>
            </button>
          </div>
        </header>
        <main className="workspace">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
