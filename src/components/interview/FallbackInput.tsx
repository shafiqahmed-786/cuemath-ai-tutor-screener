'use client'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface FallbackInputProps {
  onSubmit: (text: string) => void
  onSwitchToVoice?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function FallbackInput({
  onSubmit, onSwitchToVoice, disabled = false,
  placeholder = 'Type your answer here…', className = ''
}: FallbackInputProps) {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
  }, [text])

  const canSubmit = text.trim().length >= 30 && !disabled

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(text.trim())
    setText('')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col gap-3 ${className}`}>
      <div className={`relative rounded-2xl border transition-all duration-200 ${isFocused ? 'border-cyan-400/50 shadow-glow-cyan bg-surface-overlay' : 'border-border bg-surface-raised'}`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit() } }}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          maxLength={2000}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-10 text-sm text-ink placeholder-ink-faint font-body leading-relaxed focus:outline-none disabled:opacity-50"
        />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-ink-faint">{text.length} / 2000</span>
          <span className="text-[10px] text-ink-faint">⌘↵ to submit</span>
        </div>
      </div>

      {text.length > 0 && text.trim().length < 30 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-ink-muted px-1">
          Please provide at least 30 characters for a meaningful response.
        </motion.p>
      )}

      <div className="flex items-center justify-between gap-3">
        {onSwitchToVoice && (
          <Button variant="ghost" size="sm" onClick={onSwitchToVoice} disabled={disabled}>
            🎙 Use voice instead
          </Button>
        )}
        <Button variant="primary" size="md" onClick={handleSubmit} disabled={!canSubmit} className="ml-auto"
          iconRight={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}>
          Submit Answer
        </Button>
      </div>
    </motion.div>
  )
}