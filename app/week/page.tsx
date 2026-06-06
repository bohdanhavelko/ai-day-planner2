'use client'

import { useState, useEffect } from 'react'
import { getTasks, updateTask } from '@/lib/storage'
import { Task } from '@/lib/types'
import TaskCheckItem from '@/components/TaskCheckItem'

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Сьогодні'
  if (diff === 1) return 'Завтра'
  return date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'short' })
}

function next7Days(): string[] {
  const days: string[] = []
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function WeekPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status !== 'done'))
  }, [])

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

  const days = next7Days()

  // Tasks with deadline in next 7 days (any status)
  const byDay: Record<string, Task[]> = {}
  for (const d of days) byDay[d] = []

  for (const task of tasks) {
    if (task.deadline && byDay[task.deadline] !== undefined) {
      byDay[task.deadline].push(task)
    }
  }

  // "No deadline" section: only today-status tasks without deadline
  const noDate = tasks.filter(t => !t.deadline && t.status === 'today')

  return (
    <div className="py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Тиждень</h1>
        <p className="text-sm mt-0.5" style={{ color: '#8E8E93' }}>Наступні 7 днів</p>
      </div>

      {days.map(dateStr => {
        const dayTasks = byDay[dateStr]
        return (
          <section key={dateStr}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
              style={{ color: '#8E8E93' }}
            >
              {dayLabel(dateStr)}
            </p>
            {dayTasks.length === 0 ? (
              <p className="text-sm px-1" style={{ color: '#C7C7CC' }}>— вільний день 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {dayTasks.map(task => (
                  <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {noDate.length > 0 && (
        <section>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: '#8E8E93' }}
          >
            Без дати
          </p>
          <div className="flex flex-col gap-2">
            {noDate.map(task => (
              <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
