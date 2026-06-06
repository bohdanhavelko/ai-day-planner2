'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getTasks, updateTask, deleteTask } from '@/lib/storage'
import { Task, TaskPriority } from '@/lib/types'

type Filter = 'all' | TaskPriority

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Всі' },
  { value: 'must', label: 'MUST' },
  { value: 'nice', label: 'NICE' },
]

function formatScheduleLabel(dateStr?: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const d = dateStr || today
  if (d === today) return '📅 Сьогодні'
  if (d === tomorrow) return '📅 Завтра'
  return '📅 ' + new Date(d + 'T00:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState('')
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({})
  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [priorities, setPriorities] = useState<Record<string, TaskPriority>>({})

  useEffect(() => {
    const inbox = getTasks().filter(t => t.status === 'inbox')
    setTasks(inbox)
    const p: Record<string, TaskPriority> = {}
    inbox.forEach(t => { p[t.id] = t.priority })
    setPriorities(p)
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function scheduleTask(taskId: string, targetDate: string) {
    const today = new Date().toISOString().split('T')[0]
    if (targetDate === today) {
      updateTask(taskId, { status: 'today' })
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } else {
      updateTask(taskId, { deadline: targetDate })
      showToast(`Заплановано на ${formatScheduleLabel(targetDate)}`)
    }
  }

  function handleDelete(taskId: string) {
    deleteTask(taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  function togglePriority(taskId: string, current: TaskPriority) {
    const next: TaskPriority = current === 'must' ? 'nice' : 'must'
    setPriorities(prev => ({ ...prev, [taskId]: next }))
    updateTask(taskId, { priority: next })
  }

  const today = new Date().toISOString().split('T')[0]
  const visible = filter === 'all' ? tasks : tasks.filter(t => t.priority === filter)

  return (
    <div className="py-10 flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-sm mt-1" style={{ color: '#8E8E93' }}>
          {tasks.length > 0 ? `${tasks.length} задач` : 'Все чисто'}
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
          <p className="text-5xl">📥</p>
          <p className="text-xl font-semibold">Inbox чистий</p>
          <p className="text-sm" style={{ color: '#8E8E93' }}>
            Йди на{' '}
            <Link href="/" className="font-semibold" style={{ color: '#007AFF' }}>
              Capture
            </Link>{' '}
            і скинь думки
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            {FILTERS.map(f => {
              const active = filter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all min-h-[36px]"
                  style={active
                    ? { background: '#007AFF', color: '#fff' }
                    : { background: '#fff', color: '#3C3C43', border: '1px solid #E5E5EA' }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-3">
            {visible.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#8E8E93' }}>
                Немає задач з фільтром «{FILTERS.find(f => f.value === filter)?.label}»
              </p>
            ) : (
              visible.map(task => {
                const priority = priorities[task.id] ?? task.priority
                const accentColor = priority === 'must' ? '#FF3B30' : '#8E8E93'
                const scheduleDate = scheduleDates[task.id] || today

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-3xl flex overflow-hidden"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                  >
                    <div className="w-1 shrink-0" style={{ background: accentColor }} />
                    <div className="flex-1 p-4 flex flex-col gap-2">

                      {/* Title + priority toggle */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold leading-snug flex-1">{task.title}</p>
                        <button
                          onClick={() => togglePriority(task.id, priority)}
                          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95"
                          style={priority === 'must'
                            ? { background: '#FF3B30', color: '#fff' }
                            : { background: '#F2F2F7', color: '#8E8E93' }}
                        >
                          {priority === 'must' ? 'MUST' : 'NICE'} <span className="opacity-60">↕</span>
                        </button>
                      </div>

                      {/* Time + deadline */}
                      <div className="flex items-center gap-3 text-sm" style={{ color: '#8E8E93' }}>
                        <span>⏱ {task.estimatedMinutes} хв</span>
                        {task.deadline && <span>📅 {task.deadline}</span>}
                      </div>

                      {/* Scheduling row */}
                      <div className="flex gap-2 mt-1">
                        {/* Date picker button */}
                        <div className="relative flex-1">
                          <button
                            onClick={() => dateInputRefs.current[task.id]?.showPicker()}
                            className="w-full flex items-center justify-center gap-1 text-sm font-medium px-3 py-2 rounded-xl"
                            style={{ background: '#EFF6FF', color: '#3B82F6' }}
                          >
                            {formatScheduleLabel(scheduleDate)}
                            <span className="text-xs" style={{ color: '#93C5FD' }}>▾</span>
                          </button>
                          <input
                            ref={el => { dateInputRefs.current[task.id] = el }}
                            type="date"
                            min={today}
                            value={scheduleDate}
                            onChange={e => setScheduleDates(prev => ({ ...prev, [task.id]: e.target.value }))}
                            className="absolute opacity-0 pointer-events-none w-0 h-0"
                            tabIndex={-1}
                          />
                        </div>

                        {/* Schedule confirm button */}
                        <button
                          onClick={() => scheduleTask(task.id, scheduleDate)}
                          className="flex-1 text-sm font-semibold text-white px-3 py-2 rounded-xl transition-opacity active:opacity-75"
                          style={{ background: '#007AFF' }}
                        >
                          Запланувати →
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(task.id)}
                          aria-label="Видалити"
                          className="w-10 h-10 flex items-center justify-center rounded-xl transition-opacity active:opacity-75"
                          style={{ background: '#FFF0EF' }}
                        >
                          🗑
                        </button>
                      </div>

                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2 rounded-full z-50 whitespace-nowrap"
          style={{ background: '#1C1C1E', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
