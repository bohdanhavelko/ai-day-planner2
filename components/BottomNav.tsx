'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getTasks } from '@/lib/storage'

const tabs = [
  { href: '/', label: 'Capture', icon: '✏️' },
  { href: '/inbox', label: 'Inbox', icon: '📥' },
  { href: '/today', label: 'Today', icon: '✅' },
  { href: '/week', label: 'Тиждень', icon: '📅' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [inboxCount, setInboxCount] = useState(0)

  useEffect(() => {
    const update = () => setInboxCount(getTasks().filter(t => t.status === 'inbox').length)
    update()
    // Re-read on focus so count stays fresh after navigating back
    window.addEventListener('focus', update)
    return () => window.removeEventListener('focus', update)
  }, [pathname])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 pb-safe"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid rgba(0,0,0,0.12)',
      }}
    >
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = pathname === tab.href
          const showBadge = tab.href === '/inbox' && inboxCount > 0

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-all active:opacity-60 relative"
              style={{ color: active ? '#007AFF' : '#8E8E93' }}
            >
              <span
                className="text-2xl leading-none mb-0.5 transition-transform relative"
                style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}
              >
                {tab.icon}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: '#FF3B30', fontSize: '10px', lineHeight: 1, padding: '0 4px' }}
                  >
                    {inboxCount > 99 ? '99+' : inboxCount}
                  </span>
                )}
              </span>
              <span
                className="text-[10px] tracking-wide"
                style={{ fontWeight: active ? 600 : 400 }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
