'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'

export default function ConditionalShell({ children }) {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname.startsWith('/staff-login')) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
