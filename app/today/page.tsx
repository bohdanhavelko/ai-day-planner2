'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTasks, updateTask, saveTasks } from '@/lib/storage'
import { Task, DayPlan } from '@/lib/types'
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
          <circle cx="72" cy="72" r={RING_R} fill="none" stroke="#E5E5EA" strokeWidth="10" />
          <circle
            cx="72" cy="72" r={RING_R} fill="none"
            stroke={ringColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color: complete ? '#34C759' : '#000' }}>
            {done}/{total}
          </span>
          <span className="text-xs font-medium" style={{ color: '#8E8E93' }}>виконано</span>
        </div>
      </div>
      {complete && (
        <p className="text-base font-semibold" style={{ color: '#34C759' }}>🎉 День завершено!</p>
      )}
    </div>
  )
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [plan, setPlan] = useState<DayPlan | null>(null)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    // Auto-promote inbox tasks due today
    getTasks()
      .filter(t => t.status === 'inbox' && t.deadline === today)
      .forEach(t => updateTask(t.id, { status: 'today' }))
    setTasks(getTasks().filter(t => t.status === 'today' || t.status === 'done'))
  }, [])

  const handleMoveAllToInbox = () => {
    tasks.filter(t => t.status === 'today').forEach(t => updateTask(t.id, { status: 'inbox' }))
    setTasks(prev => prev.filter(t => t.status === 'done'))
    setPlan(null)
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
    setPlan(null)
  }

  const handlePlanDay = async () => {
    const pendingTasks = tasks.filter(t => t.status === 'today')
    if (pendingTasks.length === 0) return

    setIsPlanLoading(true)
    setPlanError('')
    setPlan(null)

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const today = now.toISOString().split('T')[0]

    try {
      const res = await fetch('/api/plan-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: pendingTasks.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            estimatedMinutes: t.estimatedMinutes,
            deadline: t.deadline,
          })),
          currentTime,
          today,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlan(data)
    } catch {
      setPlanError('Не вдалось скласти план. Спробуй ще раз.')
    } finally {
      setIsPlanLoading(false)
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Сьогодні</h1>
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

          {/* AI Plan button */}
          {active.length > 0 && !plan && (
            <button
              onClick={handlePlanDay}
              disabled={isPlanLoading}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity active:opacity-75"
              style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
            >
              {isPlanLoading ? (
                <><span className="animate-spin">⏳</span> Claude складає план...</>
              ) : (
                <>✨ AI розплануй мій день</>
              )}
            </button>
          )}

          {planError && (
            <p className="text-sm text-center font-medium" style={{ color: '#FF3B30' }}>{planError}</p>
          )}

          {/* Plan result card */}
          {plan && (
            <div
              className="rounded-3xl p-4"
              style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', border: '1px solid #BFDBFE' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className="font-semibold text-sm" style={{ color: '#1E293B' }}>План на сьогодні</span>
                </div>
                <button
                  onClick={() => setPlan(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-lg transition-opacity active:opacity-50"
                  style={{ color: '#94A3B8' }}
                >
                  ×
                </button>
              </div>

              <p className="text-sm mb-3" style={{ color: '#374151' }}>{plan.summary}</p>

              <div className="flex flex-col gap-2 mb-3">
                {plan.orderedTasks.map(pt => {
                  const task = tasks.find(t => t.id === pt.id)
                  if (!task) return null
                  return (
                    <div key={pt.id} className="flex items-start gap-3 bg-white rounded-2xl p-3"
                      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                    >
                      <span className="font-bold text-sm min-w-[40px]" style={{ color: '#3B82F6' }}>
                        {pt.suggestedStartTime}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: '#111827' }}>{task.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{pt.reasoning}</p>
                      </div>
                      <span
                        className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={task.priority === 'must'
                          ? { background: '#FF3B30', color: '#fff' }
                          : { background: '#F2F2F7', color: '#8E8E93' }}
                      >
                        {task.priority === 'must' ? 'MUST' : 'NICE'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 rounded-2xl p-3" style={{ background: '#FEFCE8' }}>
                <span>💡</span>
                <p className="text-xs" style={{ color: '#92400E' }}>{plan.tip}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {active.map(task => (
              <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
            ))}

            {done.length > 0 && (
              <>
                {active.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px" style={{ background: '#E5E5EA' }} />
                    <span className="text-xs font-medium" style={{ color: '#C7C7CC' }}>виконано</span>
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

          {done.length > 0 && (
            <button
              onClick={() => {
                const remaining = getTasks().filter(t => t.status !== 'done')
                saveTasks(remaining)
                setTasks(prev => prev.filter(t => t.status !== 'done'))
              }}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:opacity-70 min-h-[48px]"
              style={{ background: '#FFF0EF', color: '#FF3B30' }}
            >
              Очистити виконані 🗑
            </button>
          )}
        </>
      )}
    </div>
  )
}
