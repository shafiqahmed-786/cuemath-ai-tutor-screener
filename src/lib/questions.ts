import { BaseQuestion } from '@/types/interview'

export const BASE_QUESTIONS: BaseQuestion[] = [
  {
    id: 'q1',
    text: `Let's start with a teaching challenge. Explain to me, as if I were a 7-year-old, why 1/2 is actually bigger than 1/4 — even though 4 is a bigger number than 2. Walk me through the exact words and visuals you'd use.`,
    category: 'simplification',
    intent: 'Assess ability to break down counterintuitive math concepts for young learners',
    targetDimensions: ['simplification', 'clarity', 'patience'],
  },
  {
    id: 'q2',
    text: `Mid-session, a student suddenly starts crying and says "I hate math. I'm so stupid. Everyone else gets it except me." You have 20 minutes left on the clock. Walk me through what you say and do — word for word if you can.`,
    category: 'warmth_and_patience',
    intent: 'Evaluate emotional intelligence, warmth, and de-escalation under pressure',
    targetDimensions: ['warmth', 'patience', 'confidence'],
  },
  {
    id: 'q3',
    text: `A parent calls you after the third session saying: "My child has shown zero improvement. I'm starting to think online tutoring just doesn't work." How do you respond? What's your plan?`,
    category: 'professional_communication',
    intent: 'Test confidence, composure, and strategic thinking under parental pressure',
    targetDimensions: ['confidence', 'clarity', 'warmth'],
  },
  {
    id: 'q4',
    text: `Teach me about negative numbers using something from real life — not temperature. Give me the full explanation you'd use with a 10-year-old, including a concrete example they can visualize and interact with.`,
    category: 'pedagogy',
    intent: 'Measure teaching creativity, real-world application, and concept simplification',
    targetDimensions: ['simplification', 'clarity', 'fluency'],
  },
  {
    id: 'q5',
    text: `You notice a student is completely zoned out — scrolling on their phone, giving one-word answers, clearly disengaged. You have 30 minutes left. What's your move? Give me the specific technique you'd use to win them back.`,
    category: 'engagement',
    intent: 'Test engagement strategies, creativity, and patience under difficult teaching conditions',
    targetDimensions: ['patience', 'warmth', 'confidence'],
  },
]

export const INTRO_MESSAGE = `Hi! I'm the Cuemath AI Screener. I'll be conducting a structured screening interview to assess your fit as a Cuemath tutor.

You'll be asked **5 scenario-based questions** that assess your teaching approach, emotional intelligence, and communication skills.

There are no right or wrong answers — we're looking for authenticity, clarity, and warmth. Take your time, and answer as you naturally would with a real student or parent.

Ready to begin?`

export const CLOSING_MESSAGE = `That's all 5 questions. Excellent work — you've given me a lot to evaluate.

I'm now generating your **AI-powered assessment report**. This typically takes 10–15 seconds. Your recruiter will receive a full breakdown of your scores.`

export function getQuestionByIndex(index: number): BaseQuestion | undefined {
  return BASE_QUESTIONS[index]
}

export function getTotalQuestions(): number {
  return BASE_QUESTIONS.length
}