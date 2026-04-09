'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EvidenceQuote } from '@/types/interview'
import { RUBRIC } from '@/lib/rubric'

const sentimentConfig = {
  positive: { label: 'Strength', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399', icon: '↑' },
  cautionary: { label: 'Watch', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', text: '#FBBF24', icon: '⚑' },
  neutral: { label: 'Note', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)', text: '#9CA3AF', icon: '·' },
}

export function EvidenceQuotes({ quotes, className = '' }: { quotes: EvidenceQuote[]; className?: string }) {
  const [filter, setFilter] = useState<'all' | EvidenceQuote['sentiment']>('all')

  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'positive' as const, label: 'Strengths' },
    { key: 'cautionary' as const, label: 'Watch Points' },
    { key: 'neutral' as const, label: 'Notes' },
  ]

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.sentiment === filter)

  return (
    <div className={className}>
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-body font-medium transition-all ${
              filter === f.key
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30'
                : 'text-ink-muted hover:text-ink hover:bg-surface-overlay border border-transparent'
            }`}>
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-60">({quotes.filter(q => q.sentiment === f.key).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Quotes */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 text-center text-ink-faint text-sm">
              No quotes in this category
            </motion.div>
          ) : filtered.map((quote, i) => {
            const config = sentimentConfig[quote.sentiment]
            const rubricEntry = RUBRIC.find(r => r.dimension === quote.dimension)
            return (
              <motion.div key={quote.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border p-4"
                style={{ backgroundColor: config.bg, borderColor: config.border }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rubricEntry?.color ?? '#9CA3AF' }} />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: rubricEntry?.color ?? '#9CA3AF' }}>
                    {rubricEntry?.label ?? quote.dimension}
                  </span>
                  <div className="flex-1" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ color: config.text, borderColor: config.border, backgroundColor: `${config.text}10` }}>
                    {config.icon} {config.label}
                  </span>
                  <span className="text-[10px] font-mono text-ink-faint">Q{quote.questionIndex + 1}</span>
                </div>
                <blockquote className="text-sm text-ink leading-relaxed border-l-2 pl-3 italic" style={{ borderColor: config.text }}>
                  &ldquo;{quote.text}&rdquo;
                </blockquote>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}