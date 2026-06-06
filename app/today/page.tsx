'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTasks, updateTask } from '@/lib/storage'
import { Task } from '@/lib/types'
import TaskCheckItem from '@/components/TaskCheckItem'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setTasks(getTasks().filter(t => t.status === 'today' || t.status === 'done'))
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

  const active = tasks.filter(t => t.status === 'today')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div className="py-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Today</h1>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
          <p className="text-4xl">✅</p>
          <p className="text-lg font-medium text-gray-700">Немає задач на сьогодні</p>
          <p className="text-gray-500 text-sm">
            Додай з{' '}
            <Link href="/inbox" className="text-blue-600 font-semibold underline underline-offset-2">
              Inbox
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map(task => (
            <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
          ))}

          {done.length > 0 && (
            <>
              {active.length > 0 && <hr className="border-gray-200 my-1" />}
              {done.map(task => (
                <TaskCheckItem key={task.id} task={task} onToggle={handleToggle} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
