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
      <body className="min-h-full bg-gray-50 text-gray-900 pb-20">
        <main className="max-w-lg mx-auto px-4">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
