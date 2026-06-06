'use client'

/// <reference types="@types/dom-speech-recognition" />

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addTasks } from '@/lib/storage'
import { Task } from '@/lib/types'

type SpeechRecognitionCtor = new () => SpeechRecognition
type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtor
  webkitSpeechRecognition?: SpeechRecognitionCtor
}

function getSR(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as WindowWithSpeech
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export default function CapturePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [hasMic, setHasMic] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (getSR()) setHasMic(true)
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setRecording(false)
  }, [])

  const startRecognition = useCallback((lang: string, baseText: string) => {
    const SR = getSR()
    if (!SR) return

    const recognition = new SR()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.continuous = true

    let base = baseText
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (final) base += (base ? ' ' : '') + final
      setText(base + (interim ? (base ? ' ' : '') + interim : ''))
    }

    recognition.onend = () => setRecording(false)
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'language-not-supported' && lang === 'uk-UA') {
        recognition.stop()
        startRecognition(navigator.language, base)
      } else {
        setRecording(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }, [])

  const toggleMic = useCallback(() => {
    if (recording) {
      stopRecording()
      return
    }
    startRecognition('uk-UA', text)
  }, [recording, text, stopRecording, startRecognition])

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (recording) stopRecording()

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

      const { tasks } = await res.json()

      const fullTasks: Task[] = tasks.map(
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
        <p className="text-sm mt-1" style={{ color: '#8E8E93' }}>
          Скинь думки — я розберу
        </p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Що крутиться в голові? Пиши або говори..."
        className="flex-1 min-h-[40vh] w-full rounded-3xl p-5 text-lg resize-none focus:outline-none"
        style={{
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          fontSize: '18px',
          lineHeight: '1.6',
          color: '#000',
        }}
        disabled={loading}
      />

      {error && (
        <p className="text-sm text-center font-medium" style={{ color: '#FF3B30' }}>
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-4">
        {hasMic && (
          <button
            onClick={toggleMic}
            disabled={loading}
            aria-label={recording ? 'Зупинити запис' : 'Почати запис'}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-90"
            style={
              recording
                ? {
                    background: '#FF3B30',
                    boxShadow: '0 0 0 8px rgba(255,59,48,0.2)',
                    animation: 'pulse 1.5s infinite',
                  }
                : {
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                  }
            }
          >
            🎤
          </button>
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
          ) : (
            'Розібрати'
          )}
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: '#C7C7CC' }}>v1.4</p>
    </div>
  )
}
