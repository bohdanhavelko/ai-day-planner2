'use client'

import { Task } from '@/lib/types'

interface Props {
  task: Task
  onAddToToday: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskCard({ task, onAddToToday, onDelete }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-medium leading-snug flex-1">{task.title}</p>
        <span
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            task.priority === 'must'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {task.priority === 'must' ? 'MUST' : 'NICE'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>⏱ {task.estimatedMinutes} хв</span>
        {task.deadline && <span>📅 {task.deadline}</span>}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAddToToday(task.id)}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[48px]"
        >
          На сьогодні
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Видалити"
          className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-colors flex items-center justify-center text-lg min-h-[48px]"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
