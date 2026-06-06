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
    <div className="py-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Inbox</h1>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center text-gray-500">
          <p className="text-lg">Inbox чистий.</p>
          <p>
            Йди на{' '}
            <Link href="/" className="text-blue-600 underline font-medium">
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
