'use client'

import { useState, useRef } from 'react'
import { Task, TaskPriority } from '@/lib/types'
import { updateTask } from '@/lib/storage'

interface Props {
  task: Task
  onSchedule: (id: string, targetDate: string) => void
  onDelete: (id: string) => void
}

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null
  const date = new Date(deadline + 'T00:00:00')
  const todayStr = new Date().toISOString().split('T')[0]
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0]
  if (deadline === todayStr) return 'Сьогодні'
  if (deadline === tomorrowStr) return 'Завтра'
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
}

function formatScheduleLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return '📅 Сьогодні'
  if (dateStr === tomorrow) return '📅 Завтра'
  const date = new Date(dateStr + 'T00:00:00')
  return '📅 ' + date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export default function TaskCard({ task, onSchedule, onDelete }: Props) {
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const accentColor = priority === 'must' ? '#FF3B30' : '#8E8E93'
  const [editingTime, setEditingTime] = useState(false)
  const [timeValue, setTimeValue] = useState(task.estimatedMinutes)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const dateInputRef = useRef<HTMLInputElement>(null)

  const togglePriority = () => {
    const next: TaskPriority = priority === 'must' ? 'nice' : 'must'
    setPriority(next)
    updateTask(task.id, { priority: next })
  }

  const commitTime = (val: number) => {
    const clamped = Math.min(480, Math.max(5, val))
    setTimeValue(clamped)
    updateTask(task.id, { estimatedMinutes: clamped })
    setEditingTime(false)
  }

  const todayMin = new Date().toISOString().split('T')[0]

  return (
    <div
      className="bg-white rounded-3xl flex overflow-hidden transition-all active:scale-[0.98]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="w-1 shrink-0" style={{ background: accentColor }} />

      <div className="flex-1 p-4 flex flex-col gap-2.5">
        {/* Title + priority */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold leading-snug flex-1">{task.title}</p>
          <button
            onClick={togglePriority}
            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 flex items-center gap-1"
            style={priority === 'must' ? { background: '#FF3B30', color: '#fff' } : { background: '#F2F2F7', color: '#8E8E93' }}
          >
            {priority === 'must' ? 'MUST' : 'NICE'} <span className="opacity-60">↕</span>
          </button>
        </div>

        {/* Time + deadline */}
        <div className="flex items-center gap-3 text-sm" style={{ color: '#8E8E93' }}>
          {editingTime ? (
            <span className="flex items-center gap-1">
              ⏱{' '}
              <input
                type="number" min={5} max={480} step={5} value={timeValue} autoFocus
                onChange={e => setTimeValue(Number(e.target.value))}
                onBlur={() => commitTime(timeValue)}
                onKeyDown={e => { if (e.key === 'Enter') commitTime(timeValue); if (e.key === 'Escape') setEditingTime(false) }}
                className="w-16 rounded-lg px-1.5 py-0.5 text-sm font-semibold text-center focus:outline-none"
                style={{ background: '#F2F2F7', color: '#007AFF' }}
              />
              <span>хв</span>
            </span>
          ) : (
            <button
              onClick={() => setEditingTime(true)}
              className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-all active:opacity-60"
            >
              ⏱ <span className="font-medium underline decoration-dotted" style={{ color: '#007AFF' }}>{timeValue} хв</span>
            </button>
          )}
          {formatDeadline(task.deadline) && <span>📅 {formatDeadline(task.deadline)}</span>}
        </div>

        {/* Schedule row */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Date picker trigger */}
          <div className="relative">
            <button
              onClick={() => dateInputRef.current?.showPicker()}
              className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-xl min-h-[40px]"
              style={{ background: '#EFF6FF', color: '#3B82F6' }}
            >
              {formatScheduleLabel(selectedDate)}
              <span style={{ color: '#93C5FD' }}>▾</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              min={todayMin}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="absolute opacity-0 pointer-events-none w-0 h-0"
              tabIndex={-1}
            />
          </div>

          {/* Confirm button */}
          <button
            onClick={() => onSchedule(task.id, selectedDate)}
            className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-2 rounded-xl min-h-[40px] transition-opacity active:opacity-75"
            style={{ background: '#007AFF' }}
          >
            Запланувати →
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(task.id)}
            aria-label="Видалити"
            className="ml-auto w-10 h-10 rounded-xl text-base flex items-center justify-center transition-all active:opacity-75 min-h-[40px]"
            style={{ background: '#FFF0EF' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
