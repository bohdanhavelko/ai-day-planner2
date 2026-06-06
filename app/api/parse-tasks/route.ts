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
    const tasks = await parseTasks(text)
    return NextResponse.json({ tasks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse failed'
    if (message === 'AI not configured') {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}
