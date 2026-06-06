import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TaskPriority } from '@/lib/types'

const SYSTEM_PROMPT = `You are a productivity coach. The user gives you their task list for today.
Create a realistic, energizing daily plan.

Return ONLY a valid JSON object in this exact format:
{
  "summary": "short 1-sentence overview of the plan",
  "tip": "one practical productivity tip for today",
  "orderedTasks": [
    {
      "id": "task-id-here",
      "suggestedStartTime": "09:00",
      "reasoning": "short explanation why this order/time (max 10 words)"
    }
  ]
}

Rules:
- Start schedule from the currentTime provided
- Put 'must' priority tasks earlier in the day
- Group similar tasks together when possible
- Add 10-minute breaks between tasks over 45 minutes
- If total time exceeds 8 hours, note it in summary
- reasoning must be in the same language as task titles
- Return ONLY JSON. No markdown fences. No extra text.`

type InputTask = {
  id: string
  title: string
  priority: TaskPriority
  estimatedMinutes: number
  deadline: string | null
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

  let body: { tasks?: InputTask[]; currentTime?: string; today?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { tasks, currentTime, today } = body
  if (!tasks?.length || !currentTime || !today) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Today is ${today}. Current time is ${currentTime}.\nMy tasks for today: ${JSON.stringify(tasks)}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Plan failed')

    let raw = content.text
    raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(raw)

    if (!parsed.summary || !Array.isArray(parsed.orderedTasks)) throw new Error('Plan failed')

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Plan failed' }, { status: 500 })
  }
}
