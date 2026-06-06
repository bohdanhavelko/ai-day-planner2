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
      className="w-full flex items-center gap-4 bg-white rounded-3xl px-4 py-4 min-h-[68px] text-left transition-all active:scale-[0.98] active:opacity-80"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <span
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={
          done
            ? { background: '#34C759', border: 'none' }
            : { background: 'transparent', border: '2px solid #C7C7CC' }
        }
      >
        {done && (
          <svg className="w-4 h-4 text-white" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5l3.5 3.5L11 1"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className="text-base font-medium truncate transition-all"
          style={{ color: done ? '#C7C7CC' : '#000', textDecoration: done ? 'line-through' : 'none' }}
        >
          {task.title}
        </p>
        <p className="text-sm mt-0.5" style={{ color: done ? '#E5E5EA' : '#8E8E93' }}>
          ⏱ {task.estimatedMinutes} хв
          {task.deadline && <span className="ml-3">📅 {task.deadline}</span>}
        </p>
      </div>

      <span
        className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={
          done
            ? { background: '#F2F2F7', color: '#C7C7CC' }
            : task.priority === 'must'
            ? { background: '#FFF0EF', color: '#FF3B30' }
            : { background: '#F2F2F7', color: '#8E8E93' }
        }
      >
        {task.priority === 'must' ? 'MUST' : 'NICE'}
      </span>
    </button>
  )
}
