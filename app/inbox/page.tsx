'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTasks, updateTask, deleteTask } from '@/lib/storage'
import { Task, TaskPriority } from '@/lib/types'
import TaskCard from '@/components/TaskCard'

type Filter = 'all' | TaskPriority

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Всі' },
  { value: 'must', label: 'MUST' },
  { value: 'nice', label: 'NICE' },
]

function formatScheduleLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return '📅 Сьогодні'
  if (dateStr === tomorrow) return '📅 Завтра'
  const date = new Date(dateStr + 'T00:00:00')
  return '📅 ' + date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState('')

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === 'inbox'))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSchedule = (id: string, targetDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (targetDate === today) {
      updateTask(id, { status: 'today' })
      setTasks(prev => prev.filter(t => t.id !== id))
    } else {
      updateTask(id, { deadline: targetDate })
      showToast(`Заплановано на ${formatScheduleLabel(targetDate)}`)
    }
  }

  const handleDelete = (id: string) => {
    deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

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
              visible.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSchedule={handleSchedule}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2 rounded-full z-50 whitespace-nowrap"
          style={{ background: '#1C1C1E', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
