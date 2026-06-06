import { Task } from './types'

const STORAGE_KEY = 'ai-planner-tasks'

export function getTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function addTasks(newTasks: Task[]): void {
  saveTasks([...getTasks(), ...newTasks])
}

export function updateTask(id: string, patch: Partial<Task>): void {
  saveTasks(getTasks().map(t => (t.id === id ? { ...t, ...patch } : t)))
}

export function deleteTask(id: string): void {
  saveTasks(getTasks().filter(t => t.id !== id))
}
