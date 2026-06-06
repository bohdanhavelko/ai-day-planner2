'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTasks, updateTask } from '@/lib/storage'
import { Task } from '@/lib/types'
import TaskCheckItem from '@/components/TaskCheckItem'

const RING_R = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total
  const offset = RING_CIRCUMFERENCE * (1 - pct)
  const complete = total > 0 && done === total
  const ringColor = complete ? '#34C759' : '#007AFF'

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
          <circle
            cx="72"
            cy="72"
            r={RING_R}
            fill="none"
            stroke="#E5E5EA"
            strokeWidth="10"
          />
          <circle
            cx="72"
            cy="72"
            r={RING_R}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color: complete ? '#34C759' : '#000' }}>
            {done}/{total}
          </span>
          <span className="text-xs font-medium" style={{ color: '#8E8E93' }}>
            виконано
          </span>
        </div>
      </div>

      {complete && (
        <p className="text-base font-semibold" style={{ color: '#34C759' }}>
          🎉 День завершено!
        </p>
      )}
    </div>
  )
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === 'today' || t.status === 'done'))
  }, [])

  const handleMoveAllToInbox = () => {
    tasks.filter(t => t.status === 'today').forEach(t => updateTask(t.id, { status: 'inbox' }))
    setTasks(prev => prev.filter(t => t.status === 'done'))
  }

  const handleToggle = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const next = t.status === 'done' ? 'today' : 'done'
        updateTask(id, { status: next })
        return { ...t, status: next }
      })
    )
  }

  const active = tasks.filter(t => t.status === 'today')
  const done = tasks.filter(t => t.status === 'done')

  const pendingMinutes = active.reduce((sum, t) => sum + t.estimatedMinutes, 0)
  const totalHours = (pendingMinutes / 60).toFixed(1).replace('.0', '')

  const timeBanner =
    pendingMinutes > 480
      ? { bg: '#FFF5F5', border: '#FFCDD2', text: '#D32F2F', icon: '⚠️', label: `Заплановано ${totalHours} год — більше ніж є в дні` }
      : pendingMinutes >= 360
      ? { bg: '#FFFDE7', border: '#FFE082', text: '#F57F17', icon: '⚠️', label: `Заплановано ${totalHours} год — майже повний день` }
      : null

  return (
    <div className="py-10 flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
        <p className="text-sm mt-0.5" style={{ color: '#8E8E93' }}>
          {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {tasks.length > 0 && (
          <p className="text-xs mt-1" style={{ color: '#C7C7CC' }}>
            {active.length} залишилось · {done.length} виконано
          </p>
        )}
      </div>

      {timeBanner && (
        <div
          className="rounded-2xl p-3 text-sm font-medium"
          style={{ background: timeBanner.bg, border: `1px solid ${timeBanner.border}`, color: timeBanner.text }}
        >
          {timeBanner.icon} {timeBanner.label}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
          <p className="text-5xl">✅</p>
          <p className="text-xl font-semibold">Немає задач на сьогодні</p>
          <p className="text-sm" style={{ color: '#8E8E93' }}>
            Додай з{' '}
            <Link href="/inbox" className="font-semibold" style={{ color: '#007AFF' }}>
              Inbox
            </Link>
          </p>
        </div>
      ) : (
        <>
          <ProgressRing done={done.length} total={tasks.length} />

          <div className="flex flex-col gap-3">
            {active.map(task => (
              <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
            ))}

            {done.length > 0 && (
              <>
                {active.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px" style={{ background: '#E5E5EA' }} />
                    <span className="text-xs font-medium" style={{ color: '#C7C7CC' }}>
                      виконано
                    </span>
                    <div className="flex-1 h-px" style={{ background: '#E5E5EA' }} />
                  </div>
                )}
                {done.map(task => (
                  <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
                ))}
              </>
            )}
          </div>

          {active.length > 0 && (
            <button
              onClick={handleMoveAllToInbox}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:opacity-70 min-h-[48px]"
              style={{ background: '#F2F2F7', color: '#8E8E93' }}
            >
              Перенести невиконані в Inbox →
            </button>
          )}
        </>
      )}
    </div>
  )
}
