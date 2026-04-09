'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/Button'
import { ProgressStepper } from '@/components/ui/ProgressStepper'
import { TypingIndicator, EvaluatingIndicator } from '@/components/ui/TypingIndicator'
import { ChatBubble, QuestionBadge } from '@/components/interview/ChatBubble'
import { VoiceRecorder } from '@/components/interview/VoiceRecorder'
import { FallbackInput } from '@/components/interview/FallbackInput'
import { TranscriptDrawer } from '@/components/interview/TranscriptDrawer'
import { TranscriptEntry, InterviewPhase } from '@/types/interview'
import { BASE_QUESTIONS, INTRO_MESSAGE, CLOSING_MESSAGE, getTotalQuestions } from '@/lib/questions'

const TOTAL = getTotalQuestions()

export default function InterviewPage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const transcriptRef = useRef<TranscriptEntry[]>([])

  const [candidateName, setCandidateName] = useState('Candidate')
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [useFallback, setUseFallback] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [hasFollowUp, setHasFollowUp] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [evalError, setEvalError] = useState('')
  const [evalDetail, setEvalDetail] = useState('')
  const [evalCode, setEvalCode] = useState('')

  // Keep ref in sync so evaluateSession sees latest transcript
  useEffect(() => { transcriptRef.current = transcript }, [transcript])

  // Load candidate info
  useEffect(() => {
    const raw = sessionStorage.getItem('cuemath_candidate')
    if (!raw) { router.replace('/'); return }
    try {
      const { name } = JSON.parse(raw)
      setCandidateName(name || 'Candidate')
    } catch { router.replace('/') }
  }, [router])

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript, isTyping])

  const addMessage = useCallback((role: 'ai' | 'candidate', content: string, questionIndex: number, isFollowUp = false) => {
    const entry: TranscriptEntry = { id: uuidv4(), role, content, timestamp: new Date().toISOString(), questionIndex, isFollowUp }
    setTranscript(prev => [...prev, entry])
    return entry
  }, [])

  const simulateTyping = useCallback((duration = 1200): Promise<void> =>
    new Promise(resolve => { setIsTyping(true); setTimeout(() => { setIsTyping(false); resolve() }, duration) }), [])

  // Start the interview
  const startInterview = useCallback(async () => {
    setPhase('intro')
    await simulateTyping(1500)
    addMessage('ai', INTRO_MESSAGE, -1)
    setPhase('asking')
    await simulateTyping(1200)
    addMessage('ai', BASE_QUESTIONS[0].text, 0)
    setPhase('recording')
    setCurrentQ(0)
  }, [addMessage, simulateTyping])

  useEffect(() => {
    if (candidateName !== 'Candidate') {
      const timer = setTimeout(startInterview, 800)
      return () => clearTimeout(timer)
    }
  }, [candidateName, startInterview])

  // ─── Evaluation (Gemini → heuristic fallback on server) ───────────────────
  const evaluateSession = useCallback(async () => {
    setEvalError('')
    setEvalDetail('')
    setEvalCode('')
    try {
      const rawCandidate = sessionStorage.getItem('cuemath_candidate')
      const { name } = rawCandidate ? JSON.parse(rawCandidate) : { name: 'Candidate' }
      const currentTranscript = transcriptRef.current

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName: name, transcript: currentTranscript }),
      })

      // Route always returns 200 (heuristic fallback) — non-200 = genuine outage
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setEvalCode(body.code ?? '')
        setEvalDetail(body.detail ?? '')
        throw new Error(body.error || `Evaluation failed: ${res.status}`)
      }

      const data = await res.json()
      sessionStorage.setItem('cuemath_evaluation', JSON.stringify(data.evaluation))
      sessionStorage.setItem('cuemath_transcript', JSON.stringify(currentTranscript))
      setPhase('complete')
      setTimeout(() => router.push('/results'), 1200)
    } catch (err) {
      console.error('Evaluation error:', err)
      setEvalError(err instanceof Error ? err.message : 'Evaluation failed. Please retry.')
      setPhase('error')
    }
  }, [router])


  // ─── Handle candidate answer ───────────────────────────────────────────────
  const handleAnswer = useCallback(async (answer: string) => {
    if (!answer.trim()) return
    setPhase('processing')
    const currentQuestion = BASE_QUESTIONS[currentQ]
    addMessage('candidate', answer, currentQ)

    // Try follow-up from Gemini Flash
    setIsTyping(true)
    let followUp: string | null = null
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: currentQuestion.text, candidateAnswer: answer, questionIndex: currentQ }),
      })
      const data = await res.json()
      followUp = data.followUp ?? null
    } catch { followUp = null }
    finally { setIsTyping(false) }

    if (followUp) {
      setHasFollowUp(true)
      await simulateTyping(600)
      addMessage('ai', followUp, currentQ, true)
      setPhase('recording')
      return
    }

    setHasFollowUp(false)
    const nextQ = currentQ + 1
    if (nextQ < TOTAL) {
      await simulateTyping(900)
      addMessage('ai', BASE_QUESTIONS[nextQ].text, nextQ)
      setCurrentQ(nextQ)
      setPhase('recording')
    } else {
      await simulateTyping(1000)
      addMessage('ai', CLOSING_MESSAGE, TOTAL)
      setPhase('evaluating')
      await evaluateSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, addMessage, simulateTyping, evaluateSession])

  // ─── Handle follow-up answer ───────────────────────────────────────────────
  const handleFollowUpAnswer = useCallback(async (answer: string) => {
    if (!answer.trim()) return
    setPhase('processing')
    addMessage('candidate', answer, currentQ, true)
    setHasFollowUp(false)
    const nextQ = currentQ + 1
    if (nextQ < TOTAL) {
      await simulateTyping(900)
      addMessage('ai', BASE_QUESTIONS[nextQ].text, nextQ)
      setCurrentQ(nextQ)
      setPhase('recording')
    } else {
      await simulateTyping(1000)
      addMessage('ai', CLOSING_MESSAGE, TOTAL)
      setPhase('evaluating')
      await evaluateSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, addMessage, simulateTyping, evaluateSession])

  const handleRetry = () => {
    if (retryCount >= 3) return
    setRetryCount(r => r + 1)
    setPhase('evaluating')
    setEvalError('')
    evaluateSession()
  }

  const displayedQ = Math.min(currentQ + 1, TOTAL)

  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="shrink-0 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center">
              <span className="text-void font-display font-bold text-xs">C</span>
            </div>
            <span className="font-display font-semibold text-sm text-ink hidden sm:block">Cuemath AI Screener</span>
          </div>

          {phase !== 'idle' && phase !== 'intro' && phase !== 'evaluating' && phase !== 'complete' && (
            <div className="flex-1 max-w-xs hidden sm:block">
              <ProgressStepper total={TOTAL} current={displayedQ} />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {phase === 'recording' && (
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center gap-1.5 text-xs font-mono text-rose-400">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                REC
              </motion.div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowTranscript(true)}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6M9 8h6M9 16h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" strokeLinecap="round" /></svg>}>
              <span className="hidden sm:inline">Transcript</span>
            </Button>
          </div>
        </div>

        {phase !== 'idle' && phase !== 'intro' && phase !== 'evaluating' && phase !== 'complete' && (
          <div className="sm:hidden px-4 pb-3">
            <ProgressStepper total={TOTAL} current={displayedQ} />
          </div>
        )}
      </motion.header>

      {/* ─── Chat area ─────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto chat-container">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {transcript.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 border border-cyan-400/20 mx-auto flex items-center justify-center mb-4">
                <span className="text-2xl font-display font-bold text-gradient-cyan">{candidateName.charAt(0).toUpperCase()}</span>
              </div>
              <h2 className="font-display font-semibold text-xl text-ink mb-1">Welcome, {candidateName}</h2>
              <p className="text-sm text-ink-muted">Initializing your interview…</p>
              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}

          {transcript.map((entry, i) => {
            const prevEntry = transcript[i - 1]
            const showBadge =
              entry.role === 'ai' && !entry.isFollowUp &&
              entry.questionIndex >= 0 && entry.questionIndex < TOTAL &&
              (!prevEntry || prevEntry.questionIndex !== entry.questionIndex || prevEntry.role === 'candidate')

            return (
              <div key={entry.id}>
                {showBadge && <QuestionBadge index={entry.questionIndex + 1} total={TOTAL} />}
                {entry.isFollowUp && entry.role === 'ai' && <QuestionBadge index={entry.questionIndex + 1} total={TOTAL} isFollowUp />}
                <ChatBubble entry={entry} index={i} />
              </div>
            )
          })}

          <AnimatePresence>
            {isTyping && (
              <TypingIndicator label={phase === 'evaluating' ? 'Gemini is generating your report…' : 'Preparing next question…'} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'evaluating' && !isTyping && <EvaluatingIndicator />}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 rounded-full bg-jade-400/10 border border-jade-400/30 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-jade-400 font-mono">Redirecting to your report…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Retry / Error state ─────────────────────────────────── */}
          <AnimatePresence>
            {phase === 'error' && (() => {
              const isEnvMissing = evalCode === 'ENV_MISSING'
              const isAuthError  = evalCode === 'AUTH_ERROR'
              const noRetry = isEnvMissing || isAuthError || retryCount >= 3
              return (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 py-4 px-6 rounded-2xl border border-rose-400/20 bg-rose-400/5 w-full max-w-lg">

                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm text-rose-400 font-semibold">{evalError || 'Evaluation failed'}</p>
                  </div>

                  {/* Actionable setup instructions for ENV_MISSING */}
                  {isEnvMissing && evalDetail ? (
                    <div className="w-full rounded-xl bg-surface-raised border border-border px-4 py-3 text-left">
                      <p className="text-xs font-mono text-amber-400 mb-1">Setup required</p>
                      <p className="text-xs text-ink-muted leading-relaxed">{evalDetail}</p>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:underline"
                      >
                        Get a free Gemini API key
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted text-center">
                      {evalDetail || 'Gemini could not complete the evaluation. This may be a temporary issue.'}
                    </p>
                  )}

                  <div className="flex gap-3">
                    {!noRetry && (
                      <Button variant="danger" size="sm" onClick={handleRetry}>
                        {`Retry Evaluation${retryCount > 0 ? ` (${retryCount}/3)` : ''}`}
                      </Button>
                    )}
                    {retryCount >= 3 && !isEnvMissing && (
                      <Button variant="secondary" size="sm" disabled>Max retries reached</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { sessionStorage.clear(); router.push('/') }}>
                      Start Over
                    </Button>
                  </div>
                </motion.div>
              )
            })()}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ─── Input area ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'recording' && (
          <motion.footer key="input-footer"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 border-t border-border bg-surface/90 backdrop-blur-md">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
              <div className="text-center mb-4">
                <span className="text-xs text-ink-faint font-mono">
                  {hasFollowUp ? '↳ Follow-up' : `Question ${displayedQ} of ${TOTAL}`} ·{' '}
                  <span className="text-ink-muted">{BASE_QUESTIONS[currentQ]?.category.replace(/_/g, ' ')}</span>
                </span>
              </div>

              {useFallback ? (
                <FallbackInput
                  onSubmit={hasFollowUp ? handleFollowUpAnswer : handleAnswer}
                  onSwitchToVoice={() => setUseFallback(false)}
                  disabled={phase !== 'recording'}
                />
              ) : (
                <VoiceRecorder
                  onTranscript={hasFollowUp ? handleFollowUpAnswer : handleAnswer}
                  onFallback={() => setUseFallback(true)}
                  disabled={phase !== 'recording'}
                />
              )}
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      <TranscriptDrawer open={showTranscript} onClose={() => setShowTranscript(false)} transcript={transcript} />
    </div>
  )
}