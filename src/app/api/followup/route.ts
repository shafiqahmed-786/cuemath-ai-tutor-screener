import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildFollowUpPrompt } from '@/lib/prompts'
import { optionalEnv } from '@/lib/env'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { questionText, candidateAnswer, questionIndex } = await req.json()

    if (!questionText || !candidateAnswer) {
      return NextResponse.json({ followUp: null })
    }

    // Follow-ups are optional — silently skip if no API key
    const apiKey = optionalEnv('GEMINI_API_KEY')
    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[followup] GEMINI_API_KEY not set — skipping follow-up generation.')
      }
      return NextResponse.json({ followUp: null })
    }

    // Only generate follow-ups ~60% of the time for natural variation
    if (Math.random() > 0.6) {
      return NextResponse.json({ followUp: null })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    })

    const prompt = buildFollowUpPrompt(questionText, candidateAnswer, questionIndex)
    const result = await model.generateContent(prompt)
    const followUp = result.response.text().trim()

    if (!followUp || followUp.length < 10 || followUp.length > 400) {
      return NextResponse.json({ followUp: null })
    }

    return NextResponse.json({ followUp })
  } catch (error) {
    // Follow-up failures are silent — interview must continue
    if (process.env.NODE_ENV === 'development') {
      console.warn('[followup] Error (non-fatal):', error instanceof Error ? error.message : error)
    }
    return NextResponse.json({ followUp: null })
  }
}