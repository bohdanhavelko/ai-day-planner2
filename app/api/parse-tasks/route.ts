import { NextRequest, NextResponse } from 'next/server'
import { parseTasks } from '@/lib/ai'

export async function POST(req: NextRequest) {
  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Text required' }, { status: 400 })
  }

  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const messageWithDate = `Today is ${today}.\n\n${text}`
    const tasks = await parseTasks(messageWithDate)
    const validTasks = tasks.filter(t => t.title && t.title.trim().length >= 3)
    if (validTasks.length === 0) {
      return NextResponse.json({ tasks: [], message: 'Не вдалося знайти задачі' })
    }
    return NextResponse.json({ tasks: validTasks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse failed'
    if (message === 'AI not configured') {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}
