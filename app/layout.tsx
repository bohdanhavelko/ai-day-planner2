import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'AI Day Planner',
  description: 'Todoist that plans itself.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" className="h-full">
      <body className="min-h-full pb-24" style={{ background: '#F2F2F7' }}>
        <main className="max-w-lg mx-auto px-5">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
