import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Acceso',
    default: 'Acceso',
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      {children}
    </div>
  )
}
