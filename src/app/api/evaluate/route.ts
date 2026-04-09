import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { TranscriptEntry } from '@/types/interview'
import { buildEvaluationPrompt } from '@/lib/prompts'
import { validateEvaluationResult } from '@/lib/scoring'
import { generateHeuristicEvaluation } from '@/lib/heuristic'
import { optionalEnv } from '@/lib/env'

export const maxDuration = 60

const isDev = process.env.NODE_ENV === 'development'

export async function POST(req: NextRequest) {
  // ─── Parse request ─────────────────────────────────────────────────────────
  let body: { candidateName: string; transcript: TranscriptEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { candidateName, transcript } = body

  if (!candidateName || typeof candidateName !== 'string') {
    return NextResponse.json({ error: 'candidateName is required' }, { status: 400 })
  }
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return NextResponse.json({ error: 'transcript must be a non-empty array' }, { status: 400 })
  }

  // ─── Try Gemini first (if API key is present) ──────────────────────────────
  const apiKey = optionalEnv('GEMINI_API_KEY')

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      })

      const prompt = buildEvaluationPrompt(candidateName, transcript)
      const result = await model.generateContent(prompt)
      const rawText = result.response.text().trim()

      // Strip accidental markdown fences
      let jsonText = rawText
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      }

      const evaluation = JSON.parse(jsonText)

      if (!validateEvaluationResult(evaluation)) {
        if (isDev) console.warn('[evaluate] Gemini returned invalid structure — falling back to heuristic')
        throw new Error('invalid_structure')
      }

      // Explicitly mark as NOT fallback
      evaluation.fallback = false
      if (isDev) console.log(`[evaluate] Gemini OK — score: ${evaluation.overallScore}, verdict: ${evaluation.recommendation}`)
      return NextResponse.json({ evaluation }, { status: 200 })

    } catch (geminiError) {
      const msg = geminiError instanceof Error ? geminiError.message : String(geminiError)
      if (isDev) console.warn(`[evaluate] Gemini failed (${msg}) — falling back to heuristic scoring`)
      // Fall through to heuristic below
    }
  } else {
    if (isDev) console.log('[evaluate] No GEMINI_API_KEY — using heuristic scoring')
  }

  // ─── Heuristic fallback — always succeeds ──────────────────────────────────
  try {
    const evaluation = generateHeuristicEvaluation(candidateName, transcript)
    if (isDev) console.log(`[evaluate] Heuristic OK — score: ${evaluation.overallScore}, verdict: ${evaluation.recommendation}`)
    return NextResponse.json({ evaluation }, { status: 200 })
  } catch (heuristicError) {
    // This should never happen, but just in case
    const msg = heuristicError instanceof Error ? heuristicError.message : 'Unknown heuristic error'
    console.error('[evaluate] CRITICAL: heuristic engine also failed:', msg)
    return NextResponse.json(
      { error: 'Evaluation engine unavailable. Please try again.', code: 'ENGINE_ERROR' },
      { status: 500 }
    )
  }
}