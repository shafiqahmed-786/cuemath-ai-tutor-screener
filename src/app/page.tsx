'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

const features = [
  { icon: '◈', title: 'Adaptive Questioning', desc: 'Gemini generates contextual follow-ups based on your answers.', color: '#22D3EE' },
  { icon: '◉', title: 'Voice-First Interface', desc: 'Speak naturally. Browser speech recognition with text fallback.', color: '#FB923C' },
  { icon: '◆', title: '6-Dimension Scoring', desc: 'Clarity, warmth, patience, simplification, fluency, confidence.', color: '#818CF8' },
  { icon: '◇', title: 'Instant Report', desc: 'Radar chart, evidence quotes, and recruiter recommendation.', color: '#34D399' },
]

const stats = [
  { value: '5', label: 'Scenario Questions' },
  { value: '6', label: 'Eval Dimensions' },
  { value: '~12', label: 'Minutes Average' },
  { value: 'Gemini', label: 'Powered AI' },
]

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isFocused, setIsFocused] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  const handleStart = () => {
    if (!name.trim()) { setError('Please enter your name to continue.'); return }
    setError('')
    setIsStarting(true)
    sessionStorage.setItem('cuemath_candidate', JSON.stringify({ name: name.trim(), email: email.trim() }))
    setTimeout(() => router.push('/interview'), 600)
  }

  return (
    <main className="min-h-screen bg-void animated-bg relative overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-100"
        style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-400/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating math symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {['∑', '∫', '√', 'π', '∞', 'Δ', '∂', '∇', '⊕', '⊗'].map((sym, i) => (
          <motion.span key={i} className="absolute font-mono text-2xl text-cyan-400"
            style={{ left: `${8 + i * 9}%`, top: `${10 + (i % 4) * 22}%`, opacity: 0.04 }}
            animate={{ y: [0, -20, 0], opacity: [0.04, 0.07, 0.04] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }}>
            {sym}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Nav */}
        <motion.nav initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center">
              <span className="text-void font-display font-bold text-sm">C</span>
            </div>
            <div>
              <span className="font-display font-bold text-ink text-sm">Cuemath</span>
              <span className="text-ink-faint text-sm"> · Talent Platform</span>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-faint font-mono px-3 py-1.5 rounded-full border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse" style={{ backgroundColor: '#34D399' }} />
            Powered by Gemini
          </span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Hero */}
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-xs font-mono text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AI-Powered Tutor Screening · Gemini 1.5 Pro
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6">
              Screen tutors<br />
              <span className="text-gradient-cyan">10× faster</span><br />
              with voice AI.
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-ink-muted text-lg leading-relaxed mb-8 max-w-md">
              A premium AI interview platform that evaluates tutor candidates on teaching quality, emotional intelligence, and communication — in under 15 minutes.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-6 mb-10">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-display font-bold text-ink">{stat.value}</div>
                  <div className="text-xs text-ink-faint font-mono mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex gap-3 p-3 rounded-xl border border-border bg-surface-raised/50">
                  <span className="text-xl shrink-0 mt-0.5" style={{ color: f.color }}>{f.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-ink mb-0.5">{f.title}</p>
                    <p className="text-[11px] text-ink-faint leading-snug">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Form */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className="bg-surface-raised border border-border-strong rounded-3xl p-8 shadow-card relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-ink mb-1.5">Begin Your Screening</h2>
                <p className="text-sm text-ink-muted">This voice interview takes approximately 10–15 minutes. Find a quiet space.</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-mono text-ink-muted mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-cyan-400">*</span>
                  </label>
                  <input type="text" value={name}
                    onChange={e => { setName(e.target.value); setError('') }}
                    onFocus={() => setIsFocused('name')} onBlur={() => setIsFocused(null)}
                    placeholder="e.g. Priya Sharma"
                    onKeyDown={e => e.key === 'Enter' && handleStart()}
                    className={`w-full bg-surface border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint transition-all duration-200 focus:outline-none ${isFocused === 'name' ? 'border-cyan-400/50 shadow-glow-cyan' : 'border-border'}`} />
                </div>

                <div>
                  <label className="block text-xs font-mono text-ink-muted mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-ink-faint">(optional)</span>
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={() => setIsFocused('email')} onBlur={() => setIsFocused(null)}
                    placeholder="priya@example.com"
                    className={`w-full bg-surface border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint transition-all duration-200 focus:outline-none ${isFocused === 'email' ? 'border-cyan-400/50 shadow-glow-cyan' : 'border-border'}`} />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-rose-400">{error}</motion.p>
                )}
              </div>

              <Button variant="primary" size="lg" fullWidth loading={isStarting} onClick={handleStart}
                iconRight={!isStarting && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}>
                {isStarting ? 'Initializing Interview…' : 'Start Voice Interview'}
              </Button>

              <div className="mt-4 space-y-1.5">
                <p className="text-[11px] text-ink-faint text-center">🎙️ Microphone permission required · Text fallback available</p>
                <p className="text-[11px] text-ink-faint text-center">Responses are evaluated by Gemini 1.5 Pro.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}