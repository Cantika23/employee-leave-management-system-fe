export const DEMO_ACCOUNTS = [
  {
    email: 'yuki.t@example.com',
    password: 'aether123',
    role: 'hr',
    name: 'Citra Lestari',
    title: 'HR Business Partner',
    department: 'People & Culture',
    location: 'Jakarta',
    joinDate: '12 Mar 2021',
    employeeId: 'HR-1042',
    phone: '+62 812 4401 8890',
  },
  {
    email: 'karen.d@example.net',
    password: 'aether123',
    role: 'manager',
    name: 'Dimas Prakoso',
    title: 'Engineering Manager',
    department: 'Technology',
    location: 'Jakarta',
    joinDate: '08 Jan 2020',
    employeeId: 'EM-2088',
    phone: '+62 811 9021 3345',
  },
  {
    email: 'ivan.p@example.net',
    password: 'aether123',
    role: 'employee',
    name: 'Bagas Wiratama',
    title: 'Software Engineer',
    department: 'Technology',
    location: 'Bandung',
    joinDate: '21 Jun 2022',
    employeeId: 'SE-3317',
    phone: '+62 857 1102 7781',
  },
]

export const LEAVE_TYPES = [
  { id: 'annual', name: 'Cuti Tahunan', days: 12, used: 5, color: '#0EA5E9' },
  { id: 'sick', name: 'Cuti Sakit', days: 12, used: 2, color: '#38BDF8' },
  { id: 'special', name: 'Cuti Khusus', days: 5, used: 1, color: '#0369A1' },
  { id: 'unpaid', name: 'Cuti Tidak Dibayar', days: 10, used: 0, color: '#7DD3FC' },
]

export const LEAVE_REQUESTS = [
  {
    id: 'LV-24081',
    employee: 'Bagas Wiratama',
    department: 'Technology',
    type: 'Cuti Tahunan',
    from: '2026-08-24',
    to: '2026-08-26',
    days: 3,
    status: 'pending',
    reason: 'Acara keluarga di Yogyakarta.',
    submitted: '2026-08-18',
  },
  {
    id: 'LV-24074',
    employee: 'Andini Prameswari',
    department: 'Product',
    type: 'Cuti Sakit',
    from: '2026-08-19',
    to: '2026-08-20',
    days: 2,
    status: 'approved',
    reason: 'Pemulihan setelah prosedur medis.',
    submitted: '2026-08-18',
  },
  {
    id: 'LV-24066',
    employee: 'Fajar Nugraha',
    department: 'Sales',
    type: 'Cuti Tahunan',
    from: '2026-09-01',
    to: '2026-09-04',
    days: 4,
    status: 'pending',
    reason: 'Liburan bersama keluarga.',
    submitted: '2026-08-15',
  },
  {
    id: 'LV-24051',
    employee: 'Eka Putri',
    department: 'Finance',
    type: 'Cuti Khusus',
    from: '2026-08-12',
    to: '2026-08-12',
    days: 1,
    status: 'approved',
    reason: 'Pernikahan saudara kandung.',
    submitted: '2026-08-05',
  },
  {
    id: 'LV-24040',
    employee: 'Galih Santoso',
    department: 'Operations',
    type: 'Cuti Tahunan',
    from: '2026-07-28',
    to: '2026-07-30',
    days: 3,
    status: 'rejected',
    reason: 'Perjalanan pribadi.',
    submitted: '2026-07-20',
    note: 'Bentrok dengan periode closing operasional.',
  },
  {
    id: 'LV-24022',
    employee: 'Hana Salsabila',
    department: 'People & Culture',
    type: 'Cuti Tahunan',
    from: '2026-08-27',
    to: '2026-08-28',
    days: 2,
    status: 'approved',
    reason: 'Pengurusan dokumen sipil.',
    submitted: '2026-08-10',
  },
]

export const EMPLOYEES = [
  { id: 'SE-3317', name: 'Bagas Wiratama', title: 'Software Engineer', dept: 'Technology', status: 'active', leave: 7, location: 'Bandung' },
  { id: 'PD-1182', name: 'Andini Prameswari', title: 'Product Designer', dept: 'Product', status: 'on-leave', leave: 4, location: 'Jakarta' },
  { id: 'EM-2088', name: 'Dimas Prakoso', title: 'Engineering Manager', dept: 'Technology', status: 'active', leave: 9, location: 'Jakarta' },
  { id: 'HR-1042', name: 'Citra Lestari', title: 'HR Business Partner', dept: 'People & Culture', status: 'active', leave: 8, location: 'Jakarta' },
  { id: 'FN-4410', name: 'Eka Putri', title: 'Finance Analyst', dept: 'Finance', status: 'active', leave: 6, location: 'Jakarta' },
  { id: 'SL-5521', name: 'Fajar Nugraha', title: 'Account Executive', dept: 'Sales', status: 'active', leave: 3, location: 'Surabaya' },
  { id: 'OP-6703', name: 'Galih Santoso', title: 'Operations Lead', dept: 'Operations', status: 'active', leave: 10, location: 'Jakarta' },
  { id: 'PC-2290', name: 'Hana Salsabila', title: 'People Partner', dept: 'People & Culture', status: 'active', leave: 5, location: 'Jakarta' },
]

export const HOLIDAYS = [
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI' },
  { date: '2026-09-16', name: 'Maulid Nabi Muhammad SAW' },
  { date: '2026-12-25', name: 'Hari Natal' },
]

export const TEAM_ON_LEAVE = [
  { name: 'Andini Prameswari', type: 'Cuti Sakit', until: '20 Agu' },
  { name: 'Raka Mahendra', type: 'Cuti Tahunan', until: '21 Agu' },
]

export const MONTHLY_TREND = [6, 8, 5, 9, 11, 7, 10, 8, 0, 0, 0, 0]
export const DEPT_LEAVE = [
  { name: 'Technology', value: 18 },
  { name: 'Sales', value: 12 },
  { name: 'Finance', value: 7 },
  { name: 'People', value: 9 },
  { name: 'Operations', value: 11 },
]

export const NOTIFICATIONS = [
  { id: 1, title: 'Permohonan LV-24081 menunggu tinjauan', time: '2 jam lalu', unread: true },
  { id: 2, title: 'Cuti Andini disetujui oleh Dimas', time: 'Kemarin', unread: true },
  { id: 3, title: 'Saldo cuti tahunan Anda tersisa 7 hari', time: '3 hari lalu', unread: false },
]

export const FEATURES = [
  {
    title: 'Pengajuan yang rapi',
    body: 'Formulir cerdas menghitung hari kerja, sisa kuota, dan bentrok kalender sebelum pengajuan terkirim.',
  },
  {
    title: 'Persetujuan bertingkat',
    body: 'Alur atasan dan HR yang transparan, dengan catatan keputusan yang tercatat rapi untuk audit.',
  },
  {
    title: 'Kalender tim hidup',
    body: 'Lihat siapa yang cuti hari ini, minggu ini, dan pada periode sibuk — tanpa spreadsheet terpisah.',
  },
  {
    title: 'Saldo otomatis',
    body: 'Kuota tahunan, sakit, dan cuti khusus terhitung otomatis sesuai kebijakan perusahaan.',
  },
  {
    title: 'Laporan eksekutif',
    body: 'Ringkasan kehadiran, tren cuti, dan utilisasi per departemen siap untuk tinjauan manajemen.',
  },
  {
    title: 'Pengalaman yang tenang',
    body: 'Antarmuka korporat yang bersih, cepat, dan nyaman digunakan setiap hari oleh seluruh peran.',
  },
]
