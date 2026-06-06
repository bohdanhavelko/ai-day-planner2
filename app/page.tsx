'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addTasks } from '@/lib/storage'
import { Task } from '@/lib/types'

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export default function CapturePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const router = useRouter()

  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Голосовий ввід не підтримується. Використовуй Safari.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'uk-UA'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    const gotResultRef = { current: false }

    recognition.onstart = () => {
      gotResultRef.current = false
      setIsListening(true)
    }

    recognition.onresult = (e) => {
      gotResultRef.current = true
      // Safari sometimes returns multiple results — take the last final one
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript
        }
      }
      console.log('transcript:', transcript)
      if (transcript.trim()) {
        // Use functional update to avoid stale closure
        setText(prev => prev ? prev + ' ' + transcript.trim() : transcript.trim())
      }
    }

    recognition.onend = () => {
      if (gotResultRef.current) {
        gotResultRef.current = false
        try { recognition.start() } catch { setIsListening(false) }
      } else {
        setIsListening(false)
      }
    }

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') {
        try { recognition.start() } catch { setIsListening(false) }
        return
      }
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false) }

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
        <button
          onClick={toggleVoice}
          disabled={loading}
          aria-label={isListening ? 'Зупинити запис' : 'Почати запис'}
          className={`p-4 rounded-full transition-all ${
            isListening
              ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200'
              : 'bg-blue-600'
          }`}
        >
          <span className="text-white text-2xl">{isListening ? '⏹' : '🎤'}</span>
        </button>

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
