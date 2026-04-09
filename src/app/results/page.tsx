'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RadarScoreCard } from '@/components/dashboard/RadarScoreCard'
import { EvidenceQuotes } from '@/components/dashboard/EvidenceQuotes'
import { RecommendationPanel } from '@/components/dashboard/RecommendationPanel'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { EvaluationResult, TranscriptEntry } from '@/types/interview'
import { RUBRIC, RECOMMENDATION_LABELS } from '@/lib/rubric'
import { getScoreColor } from '@/lib/scoring'

type Tab = 'overview' | 'evidence' | 'transcript'

export default function ResultsPage() {
  const router = useRouter()
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [candidateName, setCandidateName] = useState('Candidate')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    const evalRaw = sessionStorage.getItem('cuemath_evaluation')
    const transcriptRaw = sessionStorage.getItem('cuemath_transcript')
    const candidateRaw = sessionStorage.getItem('cuemath_candidate')

    if (!evalRaw) { router.replace('/'); return }

    try {
      setEvaluation(JSON.parse(evalRaw))
      if (transcriptRaw) setTranscript(JSON.parse(transcriptRaw))
      if (candidateRaw) {
        const { name } = JSON.parse(candidateRaw)
        setCandidateName(name || 'Candidate')
      }
    } catch { router.replace('/'); return }

    setTimeout(() => setIsLoading(false), 600)
  }, [router])

  if (isLoading || !evaluation) {
    return (
      <div className="min-h-screen bg-void">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  const rec = RECOMMENDATION_LABELS[evaluation.recommendation]

  const tabs = [
    { key: 'overview' as Tab, label: 'Score Overview' },
    { key: 'evidence' as Tab, label: `Evidence Quotes (${evaluation.evidenceQuotes.length})` },
    { key: 'transcript' as Tab, label: `Full Transcript (${transcript.length})` },
  ]

  return (
    <div className="min-h-screen bg-void animated-bg">
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-400/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-cyan-400/4 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <motion.header initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center">
              <span className="text-void font-display font-bold text-xs">C</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-semibold text-sm text-ink">Cuemath</span>
              <span className="text-ink-faint text-sm"> · Recruiter Dashboard</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold"
            style={{ backgroundColor: rec.bg, borderColor: `${rec.color}40`, color: rec.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rec.color }} />
            {rec.label}
          </div>

          {evaluation.fallback && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-400/25 bg-amber-400/5 text-[10px] font-mono text-amber-400/80">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              AI fallback mode
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => { sessionStorage.clear(); router.push('/') }}>
              New Interview
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.print()}
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" strokeLinecap="round" strokeLinejoin="round" /></svg>}>
              Export
            </Button>
          </div>

        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ─── Title row ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-ink-faint uppercase tracking-widest mb-1">Interview Assessment Report</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">{candidateName}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-sm text-ink-muted">
                Screened for Cuemath Online Math Tutor &middot;{' '}
                {new Date(evaluation.evaluatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {evaluation.fallback && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-400/5 text-[10px] font-mono text-amber-400/80">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  AI fallback mode
                </span>
              )}
            </div>
          </div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }} className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-5xl font-display font-bold leading-none" style={{ color: getScoreColor(evaluation.overallScore) }}>
                {evaluation.overallScore}
              </div>
              <div className="text-xs text-ink-faint font-mono mt-1">/ 100</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <div className="text-xs text-ink-faint font-mono mb-1">Verdict</div>
              <div className="text-xl font-display font-bold" style={{ color: rec.color }}>{rec.label}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Dimension score pills ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {evaluation.scores.map((score, i) => {
            const rubric = RUBRIC.find(r => r.dimension === score.dimension)
            return (
              <motion.div key={score.dimension}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                className="bg-surface-raised border border-border rounded-2xl p-4 flex flex-col items-center gap-2">
                <span className="text-lg" style={{ color: rubric?.color }}>{rubric?.icon}</span>
                <div className="text-2xl font-display font-bold leading-none" style={{ color: rubric?.color }}>{score.score}</div>
                <div className="text-[10px] text-ink-faint font-mono text-center leading-tight">{rubric?.label}</div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: rubric?.color }}
                    initial={{ width: 0 }} animate={{ width: `${score.score}%` }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.8 }} />
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ─── Tabs ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="border-b border-border">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-5 py-3 text-sm font-body font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.key ? 'text-cyan-400 border-cyan-400' : 'text-ink-muted border-transparent hover:text-ink'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── Tab content ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-ink">Competency Radar</h3>
                  <span className="text-xs text-ink-faint font-mono">6 dimensions</span>
                </div>
                <RadarScoreCard scores={evaluation.scores} />
              </Card>
              <RecommendationPanel evaluation={evaluation} candidateName={candidateName} />
            </motion.div>
          )}

          {activeTab === 'evidence' && (
            <motion.div key="evidence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              <div className="mb-4">
                <h3 className="font-display font-semibold text-ink">Evidence from Transcript</h3>
                <p className="text-sm text-ink-muted mt-1">Direct quotes extracted and classified by Gemini.</p>
              </div>
              <EvidenceQuotes quotes={evaluation.evidenceQuotes} />
            </motion.div>
          )}

          {activeTab === 'transcript' && (
            <motion.div key="transcript" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="space-y-4">
              <h3 className="font-display font-semibold text-ink">Full Interview Transcript</h3>
              <div className="space-y-3">
                {transcript.map((entry, i) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex gap-4 p-4 rounded-xl border ${
                      entry.role === 'ai' ? 'bg-surface-raised border-border' : 'bg-indigo-400/5 border-indigo-400/15'
                    }`}>
                    <div className="shrink-0">
                      <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        entry.role === 'ai'
                          ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                          : 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20'
                      }`}>
                        {entry.role === 'ai' ? 'AI' : 'CAND'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {entry.questionIndex >= 0 && entry.questionIndex < 5 && (
                          <span className="text-[10px] font-mono text-ink-faint">Q{entry.questionIndex + 1}</span>
                        )}
                        {entry.isFollowUp && <span className="text-[10px] font-mono text-amber-400">follow-up</span>}
                        <span className="text-[10px] font-mono text-ink-faint ml-auto">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed">{entry.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Footer ────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-faint font-mono text-center sm:text-left">
            Report generated by Cuemath AI Screener · Powered by Gemini ·{' '}
            <span className="text-ink-muted">Internal use only</span>
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => { sessionStorage.clear(); router.push('/') }}>
              Start New Interview
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}