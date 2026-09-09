import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminTopbar from '../../components/admin/AdminTopbar'

export const metadata = { title: 'Khula Admin' }

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--adm-page, #0a0600)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AdminTopbar />
        <main className="admin-main adm-reveal" style={{ flex: 1, padding: '28px 32px 40px', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
