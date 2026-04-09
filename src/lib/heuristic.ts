/**
 * Local heuristic scoring engine.
 *
 * Produces a complete EvaluationResult from a raw transcript using
 * keyword/pattern analysis — no API key required.
 *
 * This is used as a guaranteed fallback when Gemini is unavailable,
 * ensuring the recruiter dashboard always renders.
 */

import {
  TranscriptEntry,
  EvaluationResult,
  DimensionScore,
  EvaluationDimension,
  EvidenceQuote,
} from '@/types/interview'
import { RUBRIC } from './rubric'
import { computeOverallScore, determineRecommendation } from './scoring'
import { BASE_QUESTIONS } from './questions'

// ---------------------------------------------------------------------------
// Keyword dictionaries per dimension
// ---------------------------------------------------------------------------
const SIGNAL_WORDS: Record<EvaluationDimension, { positive: string[]; negative: string[] }> = {
  clarity: {
    positive: [
      'specifically', 'step by step', 'first', 'second', 'third', 'in other words',
      'to summarize', 'what i mean', 'let me explain', 'example', 'for instance',
      'clearly', 'structure', 'organized', 'breakdown', 'simply put', 'in short',
    ],
    negative: ['um', 'uh', 'like', 'you know', 'kind of', 'sort of', 'maybe', 'i guess'],
  },
  warmth: {
    positive: [
      'i understand', 'that makes sense', 'i hear you', 'i know how', 'you are not alone',
      'it is okay', "it's okay", 'i believe in you', 'great job', 'well done', 'brilliant',
      'proud of you', 'together', 'we can', 'your feelings', 'completely normal',
      'take your time', 'no rush', 'you got this', 'support', 'encourage',
    ],
    negative: ['just do it', 'it is simple', "it's simple", 'just focus', 'pay attention'],
  },
  patience: {
    positive: [
      'take your time', 'no rush', 'let us try again', "let's try again", 'slowly',
      'step by step', 'no pressure', 'whenever you are ready', 'we can go back',
      'do not worry', "don't worry", 'another way', 'different approach',
    ],
    negative: ['quickly', 'hurry', 'we are running out of time', 'just answer', 'move on'],
  },
  simplification: {
    positive: [
      'imagine', 'think of it like', 'like a', 'picture this', 'for example',
      'real life', 'everyday', 'analogy', 'story', 'visualize', 'draw', 'show',
      'pizza', 'chocolate', 'money', 'apples', 'toys', 'game', 'candy',
    ],
    negative: ['mathematically', 'formally', 'technically', 'by definition', 'the formula'],
  },
  fluency: {
    positive: [
      'specifically', 'therefore', 'furthermore', 'building on that',
      'to clarify', 'in addition', 'as a result',
    ],
    negative: [
      'um', 'uh', 'er', 'hmm', 'like i said', 'basically', 'literally',
      'actually actually', 'kind of sort of',
    ],
  },
  confidence: {
    positive: [
      'i would', "i'd", 'my approach', 'i believe', 'i know', 'definitely',
      'absolutely', 'i am confident', "i'm confident", 'the best way', 'here is what',
      'i will', 'my plan', 'i recommend',
    ],
    negative: [
      'i am not sure', "i'm not sure", 'i do not know', "i don't know",
      'maybe', 'perhaps', 'possibly', 'i think maybe', 'not sure if',
    ],
  },
}

// ---------------------------------------------------------------------------
// Per-question dimension targets (same as questions.ts targetDimensions)
// ---------------------------------------------------------------------------
const Q_DIMENSIONS: EvaluationDimension[][] = [
  ['simplification', 'clarity', 'patience'],
  ['warmth', 'patience', 'confidence'],
  ['confidence', 'clarity', 'warmth'],
  ['simplification', 'clarity', 'fluency'],
  ['patience', 'warmth', 'confidence'],
]

// ---------------------------------------------------------------------------
// Core scorer
// ---------------------------------------------------------------------------
function scoreText(text: string, dimension: EvaluationDimension): number {
  const lower = text.toLowerCase()
  const signals = SIGNAL_WORDS[dimension]

  const posHits = signals.positive.filter(w => lower.includes(w)).length
  const negHits = signals.negative.filter(w => lower.includes(w)).length

  // Word count bonus (longer, richer answers score higher)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const lengthBonus = Math.min(20, Math.floor(wordCount / 10) * 3)

  // Question mark in candidate answer suggests curiosity / engagement bonus
  const engagementBonus = lower.includes('?') ? 3 : 0

  const rawScore = 50 + posHits * 6 - negHits * 5 + lengthBonus + engagementBonus

  // Clamp to [30, 96] — heuristic scores are never perfect
  return Math.min(96, Math.max(30, rawScore))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------------------------------------------------------------------
// Build dimension evidence snippet from candidate's answer
// ---------------------------------------------------------------------------
function buildEvidence(text: string, dimension: EvaluationDimension): string {
  // Return a cleaned excerpt (first 120 chars of the answer)
  const excerpt = text.replace(/\s+/g, ' ').trim().slice(0, 120)
  return excerpt.length < text.length ? excerpt + '...' : excerpt
}

// ---------------------------------------------------------------------------
// Build dimension-level reasoning label
// ---------------------------------------------------------------------------
const REASONING_TEMPLATES: Record<EvaluationDimension, (score: number) => string> = {
  clarity: s =>
    s >= 75
      ? 'Candidate structured their explanation clearly with logical progression.'
      : s >= 55
      ? 'Explanation was mostly clear but had some gaps in structure.'
      : 'Response lacked clear structure and was difficult to follow.',
  warmth: s =>
    s >= 75
      ? 'Candidate demonstrated genuine empathy and emotional attunement.'
      : s >= 55
      ? 'Response was polite but could be more emotionally engaged.'
      : 'Response felt transactional with limited emotional connection.',
  patience: s =>
    s >= 75
      ? 'Candidate showed strong patience, giving the learner space and time.'
      : s >= 55
      ? 'Mostly patient approach with some hints of time pressure.'
      : 'Response indicated a tendency to rush past learner difficulties.',
  simplification: s =>
    s >= 75
      ? 'Used concrete analogies and real-world examples effectively.'
      : s >= 55
      ? 'Attempted simplification but relied on some abstract language.'
      : 'Explanation remained complex with limited relatable examples.',
  fluency: s =>
    s >= 75
      ? 'Communication was smooth, well-paced, and articulate.'
      : s >= 55
      ? 'Generally fluent with occasional hesitation or filler.'
      : 'Response showed hesitation and disrupted flow at points.',
  confidence: s =>
    s >= 75
      ? 'Candidate spoke with conviction and presented a clear plan.'
      : s >= 55
      ? 'Showed reasonable confidence but hedged on some points.'
      : 'Response lacked conviction and showed self-doubt at times.',
}

// ---------------------------------------------------------------------------
// Main export: generate full EvaluationResult from transcript
// ---------------------------------------------------------------------------
export function generateHeuristicEvaluation(
  candidateName: string,
  transcript: TranscriptEntry[]
): EvaluationResult & { fallback: true } {
  const candidateEntries = transcript.filter(e => e.role === 'candidate')
  const seenDimensions = new Set<EvaluationDimension>()
  const dimensionScores: Record<EvaluationDimension, number[]> = {
    clarity: [],
    warmth: [],
    patience: [],
    simplification: [],
    fluency: [],
    confidence: [],
  }

  // Score each candidate answer against its question's target dimensions
  candidateEntries.forEach(entry => {
    const qIdx = entry.questionIndex
    const dims: EvaluationDimension[] = qIdx >= 0 && qIdx < Q_DIMENSIONS.length
      ? Q_DIMENSIONS[qIdx]
      : ['clarity', 'confidence', 'fluency']

    dims.forEach(dim => {
      seenDimensions.add(dim)
      const s = scoreText(entry.content, dim)
      dimensionScores[dim].push(s)
    })
  })

  // Ensure all 6 dimensions have at least one score
  const ALL_DIMS: EvaluationDimension[] = ['clarity', 'warmth', 'patience', 'simplification', 'fluency', 'confidence']
  ALL_DIMS.forEach(dim => {
    if (dimensionScores[dim].length === 0) {
      // Use a default mid-range score for unmeasured dimensions
      dimensionScores[dim] = [62]
    }
  })

  // Average each dimension's scores
  const scores: DimensionScore[] = ALL_DIMS.map(dim => {
    const arr = dimensionScores[dim]
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    const rubricEntry = RUBRIC.find(r => r.dimension === dim)!

    // Find a relevant candidate answer for this dimension's evidence
    const relevantEntry = candidateEntries.find(e => {
      const qIdx = e.questionIndex
      const dims = qIdx >= 0 && qIdx < Q_DIMENSIONS.length ? Q_DIMENSIONS[qIdx] : []
      return dims.includes(dim)
    }) ?? candidateEntries[0]

    return {
      dimension: dim,
      score: avg,
      label: rubricEntry.label,
      evidence: relevantEntry ? buildEvidence(relevantEntry.content, dim) : 'No response available.',
      reasoning: REASONING_TEMPLATES[dim](avg),
    }
  })

  const overallScore = computeOverallScore(scores)
  const recommendation = determineRecommendation(overallScore)

  // Build evidence quotes — pick best sentences from candidate answers
  const evidenceQuotes: EvidenceQuote[] = []
  candidateEntries.slice(0, 5).forEach((entry, i) => {
    const qIdx = entry.questionIndex
    const dims: EvaluationDimension[] = qIdx >= 0 && qIdx < Q_DIMENSIONS.length
      ? Q_DIMENSIONS[qIdx]
      : ALL_DIMS

    // Pick up to 2 quotes per answer at most
    const sentences = entry.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200)

    sentences.slice(0, 2).forEach((sentence, j) => {
      const dim = dims[j % dims.length]
      const dimScore = scores.find(s => s.dimension === dim)?.score ?? 65
      const sentiment: EvidenceQuote['sentiment'] =
        dimScore >= 72 ? 'positive' : dimScore >= 55 ? 'neutral' : 'cautionary'

      evidenceQuotes.push({
        id: `q${i}-s${j}`,
        text: sentence,
        dimension: dim,
        sentiment,
        questionIndex: qIdx,
      })
    })
  })

  // Generate summary
  const topDim = scores.reduce((a, b) => (a.score > b.score ? a : b))
  const weakDim = scores.reduce((a, b) => (a.score < b.score ? a : b))

  const summaryPhrases: Record<string, string> = {
    strong_hire: `${candidateName} demonstrated exceptional teaching aptitude across all dimensions. Their ability to simplify complex concepts, combined with genuine warmth and confidence, makes them a standout Cuemath candidate.`,
    hire: `${candidateName} showed solid teaching capabilities with particular strength in ${topDim.label.toLowerCase()}. They communicated clearly and demonstrated appropriate emotional intelligence throughout the interview.`,
    consider: `${candidateName} shows promise as a tutor with some strong moments, especially in ${topDim.label.toLowerCase()}. There is room to develop in ${weakDim.label.toLowerCase()}, but the foundational instincts are positive.`,
    pass: `${candidateName} demonstrated some teaching awareness but struggled with ${weakDim.label.toLowerCase()} and ${scores.sort((a, b) => a.score - b.score)[1]?.label?.toLowerCase() ?? 'confidence'}. Further preparation and development is recommended before reapplying.`,
  }

  const strengthsList = scores
    .filter(s => s.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => `Strong ${s.label.toLowerCase()} — ${REASONING_TEMPLATES[s.dimension](s.score)}`)

  const improvementsList = scores
    .filter(s => s.score < 68)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(s => `Develop ${s.label.toLowerCase()} — ${REASONING_TEMPLATES[s.dimension](s.score)}`)

  if (strengthsList.length === 0) {
    strengthsList.push('Completed all 5 interview scenarios demonstrating commitment.')
  }
  if (improvementsList.length === 0) {
    improvementsList.push('Continue building on existing strengths with real classroom practice.')
  }

  return {
    scores,
    overallScore,
    recommendation,
    summary: summaryPhrases[recommendation],
    strengths: strengthsList,
    improvements: improvementsList,
    evidenceQuotes,
    evaluatedAt: new Date().toISOString(),
    fallback: true,
  }
}
