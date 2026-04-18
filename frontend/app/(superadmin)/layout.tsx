import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | SuperAdmin',
    default: 'SuperAdmin',
  },
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
