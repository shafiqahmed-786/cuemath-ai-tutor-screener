import { TranscriptEntry } from '@/types/interview'

export function buildEvaluationPrompt(candidateName: string, transcript: TranscriptEntry[]): string {
  const formattedTranscript = transcript
    .map(e => `[${e.role === 'ai' ? 'INTERVIEWER' : 'CANDIDATE'}]: ${e.content}`)
    .join('\n\n')

  return `You are a senior talent evaluator at Cuemath, an online math tutoring platform. Evaluate this tutor screening interview transcript very carefully.

CANDIDATE: ${candidateName}

=== TRANSCRIPT ===
${formattedTranscript}
=== END TRANSCRIPT ===

Score 0–100 on each of these 6 dimensions (be strict and differentiated — don't cluster all scores near 70):
1. clarity — structured, organized communication
2. warmth — empathy and care for students  
3. patience — composure with struggling learners
4. simplification — breaking down complex concepts accessibly
5. fluency — smooth, articulate verbal expression
6. confidence — conviction and professional assertiveness

Scoring guidelines:
- 0–40: Poor / Does not meet standard
- 41–60: Developing / Below average
- 61–80: Good / Meets standard
- 81–100: Exceptional / Exceeds standard

Respond ONLY with valid JSON (absolutely no markdown code fences, no extra text):
{
  "scores": [
    {
      "dimension": "clarity",
      "score": 75,
      "label": "Clear",
      "evidence": "direct verbatim quote from transcript",
      "reasoning": "2-3 sentences explaining why this score was given"
    }
  ],
  "overallScore": 74,
  "recommendation": "hire",
  "summary": "2-3 sentence holistic summary of the candidate",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific area to improve 1", "specific area to improve 2"],
  "evidenceQuotes": [
    {
      "id": "eq1",
      "text": "verbatim quote from transcript",
      "dimension": "warmth",
      "sentiment": "positive",
      "questionIndex": 1
    }
  ],
  "evaluatedAt": "${new Date().toISOString()}"
}

Rules:
- recommendation must be exactly one of: "strong_hire" | "hire" | "consider" | "pass"
- sentiment must be exactly one of: "positive" | "cautionary" | "neutral"
- Include 4–6 evidence quotes from across different questions
- Weighted scoring for overallScore: clarity x0.2, warmth x0.2, patience x0.15, simplification x0.2, fluency x0.1, confidence x0.15
- quotes must be exact verbatim text from the transcript, not paraphrased`
}

export function buildFollowUpPrompt(
  questionText: string,
  candidateAnswer: string,
  questionIndex: number
): string {
  return `You are an empathetic but probing interviewer at Cuemath conducting a structured tutor screening.

The candidate just answered question ${questionIndex + 1} of 5:

QUESTION: "${questionText}"

CANDIDATE ANSWER: "${candidateAnswer}"

Your task: Generate ONE natural follow-up question that:
1. References something specific they said (use their language)
2. Probes deeper into their teaching approach or philosophy
3. Feels conversational, not interrogative
4. Is no longer than 2 sentences max
5. Reveals more about their emotional intelligence or pedagogical skill

Respond with ONLY the follow-up question. No labels, no preamble, no commentary. Just the question.`
}