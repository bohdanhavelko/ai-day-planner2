'use client'

import { useState } from 'react'
import { Task } from '@/lib/types'
import { updateTask } from '@/lib/storage'

interface Props {
  task: Task
  onAddToToday: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskCard({ task, onAddToToday, onDelete }: Props) {
  const accentColor = task.priority === 'must' ? '#FF3B30' : '#8E8E93'
  const [editingTime, setEditingTime] = useState(false)
  const [timeValue, setTimeValue] = useState(task.estimatedMinutes)

  const commitTime = (val: number) => {
    const clamped = Math.min(480, Math.max(5, val))
    setTimeValue(clamped)
    updateTask(task.id, { estimatedMinutes: clamped })
    setEditingTime(false)
  }

  return (
    <div
      className="bg-white rounded-3xl flex overflow-hidden transition-all active:scale-[0.98]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="w-1 shrink-0" style={{ background: accentColor }} />

      <div className="flex-1 p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold leading-snug flex-1">{task.title}</p>
          <span
            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              task.priority === 'must'
                ? { background: '#FFF0EF', color: '#FF3B30' }
                : { background: '#F2F2F7', color: '#8E8E93' }
            }
          >
            {task.priority === 'must' ? 'MUST' : 'NICE'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm" style={{ color: '#8E8E93' }}>
          {editingTime ? (
            <span className="flex items-center gap-1">
              ⏱{' '}
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={timeValue}
                autoFocus
                onChange={e => setTimeValue(Number(e.target.value))}
                onBlur={() => commitTime(timeValue)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitTime(timeValue)
                  if (e.key === 'Escape') setEditingTime(false)
                }}
                className="w-16 rounded-lg px-1.5 py-0.5 text-sm font-semibold text-center focus:outline-none"
                style={{ background: '#F2F2F7', color: '#007AFF' }}
              />
              <span>хв</span>
            </span>
          ) : (
            <button
              onClick={() => setEditingTime(true)}
              className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-all active:opacity-60"
              style={{ background: 'transparent' }}
            >
              ⏱ <span className="font-medium underline decoration-dotted" style={{ color: '#007AFF' }}>{timeValue} хв</span>
            </button>
          )}
          {task.deadline && <span>📅 {task.deadline}</span>}
        </div>

        <div className="flex gap-2 pt-0.5">
          <button
            onClick={() => onAddToToday(task.id)}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold transition-opacity active:opacity-75 min-h-[48px]"
            style={{ background: '#007AFF' }}
          >
            На сьогодні
          </button>
          <button
            onClick={() => onDelete(task.id)}
            aria-label="Видалити"
            className="w-12 h-12 rounded-2xl text-lg flex items-center justify-center transition-all active:opacity-75 min-h-[48px]"
            style={{ background: '#FFF0EF' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
