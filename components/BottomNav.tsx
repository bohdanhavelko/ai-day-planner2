'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Capture', icon: '✏️' },
  { href: '/inbox', label: 'Inbox', icon: '📥' },
  { href: '/today', label: 'Today', icon: '✅' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] text-sm font-medium transition-all active:scale-95 ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none mb-1">{tab.icon}</span>
              <span className={active ? 'font-semibold' : ''}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
