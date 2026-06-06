export type TaskPriority = 'must' | 'nice'

export type DayPlanTask = {
  id: string
  suggestedStartTime: string
  reasoning: string
}

export type DayPlan = {
  summary: string
  tip: string
  orderedTasks: DayPlanTask[]
}
export type TaskStatus = 'inbox' | 'today' | 'done'

export type Task = {
  id: string
  title: string
  priority: TaskPriority
  estimatedMinutes: number
  deadline: string | null
  status: TaskStatus
  createdAt: string
}
