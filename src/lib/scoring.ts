import { DimensionScore, EvaluationResult, RecommendationTier } from '@/types/interview'
import { RECOMMENDATION_THRESHOLDS, RUBRIC } from './rubric'

export function computeOverallScore(scores: DimensionScore[]): number {
  let weightedSum = 0
  let totalWeight = 0
  for (const score of scores) {
    const rubricEntry = RUBRIC.find(r => r.dimension === score.dimension)
    if (rubricEntry) {
      weightedSum += score.score * rubricEntry.weight
      totalWeight += rubricEntry.weight
    }
  }
  if (totalWeight === 0) return 0
  return Math.round(weightedSum / totalWeight)
}

export function determineRecommendation(overallScore: number): RecommendationTier {
  if (overallScore >= RECOMMENDATION_THRESHOLDS.strong_hire) return 'strong_hire'
  if (overallScore >= RECOMMENDATION_THRESHOLDS.hire) return 'hire'
  if (overallScore >= RECOMMENDATION_THRESHOLDS.consider) return 'consider'
  return 'pass'
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 55) return 'C'
  if (score >= 50) return 'C-'
  return 'D'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#34D399'
  if (score >= 65) return '#22D3EE'
  if (score >= 50) return '#FBBF24'
  return '#F87171'
}

export function validateEvaluationResult(result: EvaluationResult): boolean {
  return (
    Array.isArray(result.scores) &&
    result.scores.length > 0 &&
    typeof result.overallScore === 'number' &&
    result.overallScore >= 0 &&
    result.overallScore <= 100 &&
    ['strong_hire', 'hire', 'consider', 'pass'].includes(result.recommendation) &&
    typeof result.summary === 'string' &&
    Array.isArray(result.strengths) &&
    Array.isArray(result.improvements) &&
    Array.isArray(result.evidenceQuotes)
  )
}