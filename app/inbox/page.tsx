'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTasks, updateTask, deleteTask } from '@/lib/storage'
import { Task } from '@/lib/types'
import TaskCard from '@/components/TaskCard'

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === 'inbox'))
  }, [])

  const handleAddToToday = (id: string) => {
    updateTask(id, { status: 'today' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleDelete = (id: string) => {
    deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

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
        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onAddToToday={handleAddToToday}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
