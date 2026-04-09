'use client'
import { motion } from 'framer-motion'
import { EvaluationResult } from '@/types/interview'
import { RECOMMENDATION_LABELS } from '@/lib/rubric'
import { getScoreColor, scoreToGrade } from '@/lib/scoring'

export function RecommendationPanel({
  evaluation, candidateName, className = ''
}: { evaluation: EvaluationResult; candidateName: string; className?: string }) {
  const rec = RECOMMENDATION_LABELS[evaluation.recommendation]
  const scoreColor = getScoreColor(evaluation.overallScore)

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Verdict card */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border p-6 relative overflow-hidden"
        style={{ backgroundColor: rec.bg, borderColor: `${rec.color}30` }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: rec.color }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-ink-muted mb-2 uppercase tracking-widest">Final Recommendation</p>
            <h2 className="text-3xl font-display font-bold tracking-tight mb-2" style={{ color: rec.color }}>{rec.label}</h2>
            <p className="text-sm text-ink-muted max-w-sm">{rec.description}</p>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center" style={{ borderColor: scoreColor }}>
              <span className="text-2xl font-display font-bold leading-none" style={{ color: scoreColor }}>{evaluation.overallScore}</span>
              <span className="text-[10px] text-ink-faint font-mono">/ 100</span>
            </div>
            <span className="mt-1.5 text-sm font-mono font-bold" style={{ color: scoreColor }}>Grade: {scoreToGrade(evaluation.overallScore)}</span>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-surface-raised border border-border rounded-2xl p-5">
        <p className="text-xs font-mono text-ink-faint uppercase tracking-widest mb-2">Gemini Evaluator Summary</p>
        <p className="text-sm text-ink leading-relaxed">{evaluation.summary}</p>
      </motion.div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-jade-400/5 border border-jade-400/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-jade-400/20 flex items-center justify-center">
              <span className="text-[10px] text-jade-400">✓</span>
            </div>
            <p className="text-xs font-mono text-jade-400 uppercase tracking-wider">Strengths</p>
          </div>
          <ul className="space-y-2">
            {evaluation.strengths.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex items-start gap-2 text-sm text-ink">
                <span className="text-jade-400 mt-0.5 shrink-0">→</span>{s}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
              <span className="text-[10px] text-amber-400">△</span>
            </div>
            <p className="text-xs font-mono text-amber-400 uppercase tracking-wider">Areas to Develop</p>
          </div>
          <ul className="space-y-2">
            {evaluation.improvements.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-start gap-2 text-sm text-ink">
                <span className="text-amber-400 mt-0.5 shrink-0">→</span>{s}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="flex items-center justify-between text-xs text-ink-faint font-mono border-t border-border pt-4">
        <span>Candidate: <span className="text-ink">{candidateName}</span></span>
        <span>Evaluated: {new Date(evaluation.evaluatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </motion.div>
    </div>
  )
}