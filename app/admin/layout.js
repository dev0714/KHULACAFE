import AdminSidebar from '../../components/admin/AdminSidebar'

export const metadata = { title: 'Khula Admin' }

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: '#0a0600' }}>
      <AdminSidebar />
      <main className="admin-main" style={{ flex: 1, padding: '40px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
