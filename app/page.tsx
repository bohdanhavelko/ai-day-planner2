'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addTasks } from '@/lib/storage'
import { Task } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySR = any

function makeSR(): AnySR | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  return SR ? new SR() : null
}

function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasSR = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  if (!hasSR) return false
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  // On iOS only Safari has SpeechRecognition; Chrome/Firefox on iOS do not
  if (isIOS) return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return true
}

export default function CapturePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [supported, setSupported] = useState(false)
  const [iosUnsupported, setIosUnsupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<AnySR>(null)
  const router = useRouter()

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasSR = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
    if (isIOS && hasSR && !isVoiceSupported()) {
      setIosUnsupported(true)
    } else {
      setSupported(isVoiceSupported())
    }
  }, [])

  const handleMic = () => {
    if (recording) {
      recRef.current?.stop()
      setRecording(false)
      return
    }

    const recognition = makeSR()
    if (!recognition) return

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'uk-UA'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: AnySR) => {
      const transcript = event.results[0][0].transcript as string
      setText(prev => (prev ? prev + ' ' + transcript : transcript))
      setRecording(false)
    }

    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recRef.current = recognition
    try {
      recognition.start()
      setRecording(true)
    } catch {
      recognition.stop()
      setTimeout(() => {
        try { recognition.start(); setRecording(true) } catch { setRecording(false) }
      }, 200)
    }
  }

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (recording) { recRef.current?.stop(); setRecording(false) }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/parse-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Щось пішло не так')
      }

      const data = await res.json()

      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('Не вдалося розпізнати задачі. Опиши конкретніше що треба зробити.')
      }

      const fullTasks: Task[] = data.tasks.map(
        (t: Omit<Task, 'id' | 'status' | 'createdAt'>) => ({
          ...t,
          id: crypto.randomUUID(),
          status: 'inbox' as const,
          createdAt: new Date().toISOString(),
        })
      )

      addTasks(fullTasks)
      router.push('/inbox')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Щось пішло не так')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-80px)] py-10 gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Day Planner</h1>
        <p className="text-sm mt-1" style={{ color: '#8E8E93' }}>Скинь думки — я розберу</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Що крутиться в голові? Пиши або говори..."
        className="flex-1 min-h-[40vh] w-full rounded-3xl p-5 resize-none focus:outline-none"
        style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontSize: '18px', lineHeight: '1.6', color: '#000' }}
        disabled={loading}
      />

      {error && (
        <p className="text-sm text-center font-medium" style={{ color: '#FF3B30' }}>{error}</p>
      )}

      <div className="flex flex-col items-center gap-4">
        {supported && (
          <button
            onClick={handleMic}
            disabled={loading}
            aria-label={recording ? 'Зупинити запис' : 'Почати запис'}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-90"
            style={
              recording
                ? { background: '#FF3B30', boxShadow: '0 0 0 8px rgba(255,59,48,0.2)', animation: 'pulse 1.5s infinite' }
                : { background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }
            }
          >
            🎤
          </button>
        )}

        {iosUnsupported && (
          <p className="text-sm" style={{ color: '#8E8E93' }}>🎤 Голос доступний лише в Safari</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="w-full py-4 rounded-2xl text-white text-lg font-semibold transition-all active:opacity-75 min-h-[56px] disabled:opacity-40"
          style={{ background: '#007AFF' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Розбираю...
            </span>
          ) : 'Розібрати'}
        </button>
      </div>
    </div>
  )
}
