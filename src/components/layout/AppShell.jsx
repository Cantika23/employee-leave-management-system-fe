import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Users,
  FilePlus2,
  History,
  UserRound,
} from 'lucide-react'
import Brand from '../Brand'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const EMPLOYEE_MENU = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, group: 'Utama' },
  { to: '/app/leave/apply', label: 'Pengajuan Cuti', icon: FilePlus2, group: 'Cuti' },
  { to: '/app/leave/history', label: 'Riwayat Cuti', icon: History, group: 'Cuti' },
  { to: '/app/profile', label: 'Profil', icon: UserRound, group: 'Akun' },
]

const MANAGER_MENU = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, group: 'Utama' },
  { to: '/app/approvals', label: 'Pengajuan Tim', icon: ClipboardCheck, group: 'Tim' },
  { to: '/app/leave/history', label: 'Riwayat Pengajuan', icon: History, group: 'Tim' },
  { to: '/app/employees', label: 'Data Karyawan', icon: Users, group: 'Organisasi' },
  { to: '/app/reports', label: 'Laporan', icon: PieChart, group: 'Organisasi' },
  { to: '/app/profile', label: 'Profil', icon: UserRound, group: 'Akun' },
]

const HR_MENU = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, group: 'Utama' },
  { to: '/app/leave/apply', label: 'Pengajuan Cuti', icon: FilePlus2, group: 'Cuti' },
  { to: '/app/leave/history', label: 'Riwayat Cuti', icon: History, group: 'Cuti' },
  { to: '/app/approvals', label: 'Persetujuan', icon: ClipboardCheck, group: 'Tim' },
  { to: '/app/employees', label: 'Data Karyawan', icon: Users, group: 'Organisasi' },
  { to: '/app/reports', label: 'Laporan', icon: PieChart, group: 'Organisasi' },
  { to: '/app/profile', label: 'Profil', icon: UserRound, group: 'Akun' },
]

const MENU_BY_ROLE = {
  employee: EMPLOYEE_MENU,
  manager: MANAGER_MENU,
  hr: HR_MENU,
}

const PAGE_META = {
  '/app': { title: '', subtitle: '' },
  '/app/leave/apply': { title: 'Pengajuan Cuti', subtitle: 'Buat pengajuan cuti/izin/sakit baru' },
  '/app/leave/history': { title: 'Riwayat Cuti', subtitle: 'Lihat riwayat pengajuan Anda' },
  '/app/profile': { title: 'Profil', subtitle: 'Kelola informasi akun Anda' },
  '/app/approvals': { title: 'Persetujuan', subtitle: 'Pengajuan tim menunggu keputusan' },
  '/app/employees': { title: 'Data Karyawan', subtitle: 'Tambah & aktif/nonaktif' },
  '/app/reports': { title: 'Laporan', subtitle: 'Ringkasan statistik cuti' },
  '/app/settings': { title: 'Pengaturan', subtitle: 'Konfigurasi sistem' },
}

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
  const location = useLocation()
  const pageMeta = PAGE_META[location.pathname] || { title: 'Dashboard', subtitle: '' }
  const [open, setOpen] = useState(false)
  const [notes, setNotes]  = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    api
      .get('/notifications')
      .then((res) => setNotifications(res.data))
      .catch(() => {})
  }, [])

  const items = MENU_BY_ROLE[user.role] || EMPLOYEE_MENU

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
        <header
          className="topbar"
          style={{
            background: 'linear-gradient(90deg, #f7fbff 0%, #f7fbff 55%, #ffffff 100%)',
            borderBottom: '1px solid #e2edf7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Buka menu">
              <Menu size={18} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{pageMeta.title}</div>
              {pageMeta.subtitle && (
                <div className="hint" style={{ fontSize: 13 }}>
                  {pageMeta.subtitle}
                </div>
              )}
            </div>
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