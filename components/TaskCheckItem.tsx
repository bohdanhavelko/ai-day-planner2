'use client'

import { Task } from '@/lib/types'

interface Props {
  task: Task
  onToggle: (id: string) => void
}

export default function TaskCheckItem({ task, onToggle }: Props) {
  const done = task.status === 'done'

  return (
    <button
      onClick={() => onToggle(task.id)}
      className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-4 min-h-[64px] shadow-sm text-left transition-colors active:bg-gray-50"
    >
      <span
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          done ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
        }`}
      >
        {done && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5l3.5 3.5L11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={`text-base font-medium truncate ${
            done ? 'line-through text-gray-400' : 'text-gray-900'
          }`}
        >
          {task.title}
        </p>
        <p className={`text-sm mt-0.5 ${done ? 'text-gray-300' : 'text-gray-500'}`}>
          ⏱ {task.estimatedMinutes} хв
          {task.deadline && <span className="ml-3">📅 {task.deadline}</span>}
        </p>
      </div>

      <span
        className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
          task.priority === 'must'
            ? done
              ? 'bg-gray-100 text-gray-400'
              : 'bg-red-100 text-red-700'
            : done
            ? 'bg-gray-100 text-gray-400'
            : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {task.priority === 'must' ? 'MUST' : 'NICE'}
      </span>
    </button>
  )
}
