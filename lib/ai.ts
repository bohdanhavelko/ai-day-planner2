import Anthropic from '@anthropic-ai/sdk'
import { Task } from './types'

const SYSTEM_PROMPT = `You are a task extraction assistant. The user gives you a raw brain dump in any language.
Extract individual tasks and return ONLY a valid JSON object in this exact format:

{
  "tasks": [
    {
      "title": "short action-oriented task title",
      "priority": "must" | "nice",
      "estimatedMinutes": number,
      "deadline": "YYYY-MM-DD" | null
    }
  ]
}

Rules:
- priority "must" = important/urgent, "nice" = would be good but not critical
- estimatedMinutes: realistic estimate (5, 10, 15, 30, 60, 90, 120...)
- deadline: only if explicitly mentioned in the text, otherwise null
- title: concise, starts with a verb, in the same language as input
- Return ONLY the JSON object. No markdown. No explanation. No \`\`\`json fences.`

type ParsedTask = Pick<Task, 'title' | 'priority' | 'estimatedMinutes' | 'deadline'>

export async function parseTasks(text: string): Promise<ParsedTask[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured')

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Parse failed')

  const parsed = JSON.parse(content.text)
  if (!Array.isArray(parsed.tasks)) throw new Error('Parse failed')

  return parsed.tasks as ParsedTask[]
}
