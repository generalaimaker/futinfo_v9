/**
 * Advanced Football Match Prediction Model
 * Based on ensemble approach with Bayesian updating
 */

import { Fixture } from '@/lib/types/football'

// 예측 결과 타입 정의
export interface AdvancedPrediction {
  homeWin: number
  draw: number
  awayWin: number
  confidence: number
  factors: PredictionFactors
  uncertainty: number
}

export interface PredictionFactors {
  formFactor: number
  homeFactor: number
  goalsFactor: number
  h2hFactor: number
  fatigueFactor: number
  motivationFactor: number
}

// 팀 통계 타입
interface TeamStats {
  form?: string
  fixtures?: {
    played: { home: number; away: number; total: number }
    wins: { home: number; away: number; total: number }
    draws: { home: number; away: number; total: number }
    loses: { home: number; away: number; total: number }
  }
  goals?: {
    for: { 
      total: { home: number; away: number; total: number }
      average: { home: string | number; away: string | number; total: string }
    }
    against: {
      total: { home: number; away: number; total: number }
      average: { home: string | number; away: string | number; total: string }
    }
  }
  clean_sheet?: { home: number; away: number; total: number }
  failed_to_score?: { home: number; away: number; total: number }
  biggest?: {
    wins: { home: string; away: string }
    loses: { home: string; away: string }
  }
}

// H2H 통계 타입
interface H2HStats {
  homeWins: number
  draws: number
  awayWins: number
  totalGames: number
  avgHomeGoals: number
  avgAwayGoals: number
  recentForm: string[] // 최근 5경기 결과
}

export class AdvancedPredictionModel {
  // 1. Poisson 모델 - 골 기반 예측
  private poissonModel(
    homeGoalsFor: number,
    homeGoalsAgainst: number,
    awayGoalsFor: number,
    awayGoalsAgainst: number
  ): { home: number; draw: number; away: number } {
    // Dixon-Coles adjustment 간소화 버전
    const homeAttack = homeGoalsFor
    const homeDefense = homeGoalsAgainst
    const awayAttack = awayGoalsFor
    const awayDefense = awayGoalsAgainst
    
    // Expected goals
    const expHomeGoals = (homeAttack + awayDefense) / 2
    const expAwayGoals = (awayAttack + homeDefense) / 2
    
    // Poisson probabilities (간소화)
    let homeWin = 0, draw = 0, awayWin = 0
    
    // 0-4골까지 계산
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        const prob = this.poissonProb(expHomeGoals, h) * this.poissonProb(expAwayGoals, a)
        if (h > a) homeWin += prob
        else if (h === a) draw += prob
        else awayWin += prob
      }
    }
    
    // 정규화
    const total = homeWin + draw + awayWin
    return {
      home: homeWin / total,
      draw: draw / total,
      away: awayWin / total
    }
  }
  
  private poissonProb(lambda: number, k: number): number {
    // Poisson probability mass function
    return Math.exp(-lambda) * Math.pow(lambda, k) / this.factorial(k)
  }
  
  private factorial(n: number): number {
    if (n <= 1) return 1
    return n * this.factorial(n - 1)
  }
  
  // 2. Form 기반 모델
  private formModel(homeForm: string, awayForm: string): { home: number; draw: number; away: number } {
    const formToScore = (form: string): number => {
      return form.split('').slice(-5).reduce((acc, result) => {
        if (result === 'W') return acc + 3
        if (result === 'D') return acc + 1
        return acc
      }, 0)
    }
    
    const homeScore = formToScore(homeForm)
    const awayScore = formToScore(awayForm)
    const totalScore = homeScore + awayScore + 5 // +5 for draw probability
    
    return {
      home: (homeScore + 2) / (totalScore + 6), // +2 홈 어드밴티지
      draw: 5 / (totalScore + 6),
      away: awayScore / (totalScore + 6)
    }
  }
  
  // 3. H2H 기반 모델
  private h2hModel(h2h: H2HStats): { home: number; draw: number; away: number } {
    if (h2h.totalGames === 0) {
      return { home: 0.4, draw: 0.3, away: 0.3 } // 기본값
    }
    
    // Laplace smoothing 적용
    const alpha = 1
    const total = h2h.totalGames + 3 * alpha
    
    return {
      home: (h2h.homeWins + alpha) / total,
      draw: (h2h.draws + alpha) / total,
      away: (h2h.awayWins + alpha) / total
    }
  }
  
  // 4. Bayesian 업데이트 with market prior
  private bayesianUpdate(
    modelProbs: { home: number; draw: number; away: number },
    priorProbs: { home: number; draw: number; away: number },
    priorWeight: number = 0.3
  ): { home: number; draw: number; away: number } {
    return {
      home: modelProbs.home * (1 - priorWeight) + priorProbs.home * priorWeight,
      draw: modelProbs.draw * (1 - priorWeight) + priorProbs.draw * priorWeight,
      away: modelProbs.away * (1 - priorWeight) + priorProbs.away * priorWeight
    }
  }
  
  // 5. 앙상블 결합
  private ensemblePredict(
    predictions: Array<{ home: number; draw: number; away: number }>,
    weights?: number[]
  ): { home: number; draw: number; away: number } {
    const w = weights || predictions.map(() => 1 / predictions.length)
    
    let home = 0, draw = 0, away = 0
    predictions.forEach((pred, i) => {
      home += pred.home * w[i]
      draw += pred.draw * w[i]
      away += pred.away * w[i]
    })
    
    return { home, draw, away }
  }
  
  // 6. 신뢰도 계산
  private calculateConfidence(
    predictions: Array<{ home: number; draw: number; away: number }>,
    factors: PredictionFactors
  ): number {
    // 예측 간 분산 계산
    const variance = this.calculateVariance(predictions)
    
    // Factor 기반 신뢰도
    const factorConfidence = (
      factors.formFactor * 0.25 +
      factors.homeFactor * 0.15 +
      factors.goalsFactor * 0.25 +
      factors.h2hFactor * 0.15 +
      factors.fatigueFactor * 0.1 +
      factors.motivationFactor * 0.1
    )
    
    // 최종 신뢰도 (분산이 낮을수록 높은 신뢰도)
    const confidence = factorConfidence * (1 - variance)
    return Math.max(0, Math.min(100, confidence * 100))
  }
  
  private calculateVariance(predictions: Array<{ home: number; draw: number; away: number }>): number {
    const mean = this.ensemblePredict(predictions)
    let variance = 0
    
    predictions.forEach(pred => {
      variance += Math.pow(pred.home - mean.home, 2)
      variance += Math.pow(pred.draw - mean.draw, 2)
      variance += Math.pow(pred.away - mean.away, 2)
    })
    
    return variance / (predictions.length * 3)
  }
  
  // 7. 불확실성 계산
  private calculateUncertainty(
    confidence: number,
    dataQuality: number,
    sampleSize: number
  ): number {
    // 데이터 품질과 샘플 크기를 고려한 불확실성
    const baseUncertainty = (100 - confidence) / 100
    const dataFactor = 1 - dataQuality
    const sampleFactor = 1 / Math.sqrt(sampleSize + 1)
    
    return Math.min(1, baseUncertainty + dataFactor * 0.3 + sampleFactor * 0.2)
  }
  
  // 메인 예측 함수
  public predict(
    homeStats: TeamStats,
    awayStats: TeamStats,
    h2hStats: H2HStats,
    apiPrediction?: { home: string; draw: string; away: string },
    fixture?: Fixture,
    advancedStats?: any // Free API의 고급 통계
  ): AdvancedPrediction {
    const predictions: Array<{ home: number; draw: number; away: number }> = []
    
    // 1. Poisson 모델
    if (homeStats.goals && awayStats.goals) {
      const poissonPred = this.poissonModel(
        typeof homeStats.goals.for.average.home === 'number' ? homeStats.goals.for.average.home : parseFloat(homeStats.goals.for.average.home as string) || 1.5,
        typeof homeStats.goals.against.average.home === 'number' ? homeStats.goals.against.average.home : parseFloat(homeStats.goals.against.average.home as string) || 1.2,
        typeof awayStats.goals.for.average.away === 'number' ? awayStats.goals.for.average.away : parseFloat(awayStats.goals.for.average.away as string) || 1.2,
        typeof awayStats.goals.against.average.away === 'number' ? awayStats.goals.against.average.away : parseFloat(awayStats.goals.against.average.away as string) || 1.5
      )
      predictions.push(poissonPred)
    }
    
    // 2. Form 모델
    if (homeStats.form && awayStats.form) {
      const formPred = this.formModel(homeStats.form, awayStats.form)
      predictions.push(formPred)
    }
    
    // 3. H2H 모델
    const h2hPred = this.h2hModel(h2hStats)
    predictions.push(h2hPred)
    
    // 4. 기본 통계 모델
    if (homeStats.fixtures && awayStats.fixtures) {
      const homeWinRate = homeStats.fixtures.wins.home / Math.max(1, homeStats.fixtures.played.home)
      const awayWinRate = awayStats.fixtures.wins.away / Math.max(1, awayStats.fixtures.played.away)
      const drawRate = 0.25 // 평균 무승부율
      
      const total = homeWinRate + awayWinRate + drawRate
      predictions.push({
        home: homeWinRate / total,
        draw: drawRate / total,
        away: awayWinRate / total
      })
    }
    
    // 앙상블 예측
    let ensemble = this.ensemblePredict(predictions)
    
    // API 예측을 prior로 사용한 Bayesian 업데이트
    if (apiPrediction) {
      const prior = {
        home: parseInt(apiPrediction.home.replace('%', '')) / 100,
        draw: parseInt(apiPrediction.draw.replace('%', '')) / 100,
        away: parseInt(apiPrediction.away.replace('%', '')) / 100
      }
      ensemble = this.bayesianUpdate(ensemble, prior, 0.25)
    }
    
    // Factors 계산
    const factors = this.calculateFactors(homeStats, awayStats, h2hStats, fixture)
    
    // 신뢰도 계산
    const confidence = this.calculateConfidence(predictions, factors)
    
    // 불확실성 계산
    const dataQuality = predictions.length / 4 // 4개 모델 중 몇 개가 실행됐나
    const uncertainty = this.calculateUncertainty(confidence, dataQuality, h2hStats.totalGames)
    
    // 최종 보정 (Isotonic Regression 대체)
    const calibrated = this.calibrateProbabilities(ensemble)
    
    return {
      homeWin: calibrated.home,
      draw: calibrated.draw,
      awayWin: calibrated.away,
      confidence,
      factors,
      uncertainty
    }
  }
  
  private calculateFactors(
    homeStats: TeamStats,
    awayStats: TeamStats,
    h2hStats: H2HStats,
    fixture?: Fixture
  ): PredictionFactors {
    // Form Factor
    const homeFormScore = homeStats.form ? 
      homeStats.form.slice(-5).split('').filter(r => r === 'W').length / 5 : 0.5
    const awayFormScore = awayStats.form ? 
      awayStats.form.slice(-5).split('').filter(r => r === 'W').length / 5 : 0.5
    const formFactor = Math.abs(homeFormScore - awayFormScore) + 0.5
    
    // Home Advantage Factor
    const homeFactor = homeStats.fixtures ? 
      (homeStats.fixtures.wins.home / Math.max(1, homeStats.fixtures.played.home)) * 1.2 : 0.6
    
    // Goals Factor
    const goalsFactor = homeStats.goals && awayStats.goals ?
      Math.min(1, Math.abs(
        (typeof homeStats.goals.for.average.home === 'number' ? homeStats.goals.for.average.home : parseFloat(homeStats.goals.for.average.home as string)) - 
        (typeof awayStats.goals.for.average.away === 'number' ? awayStats.goals.for.average.away : parseFloat(awayStats.goals.for.average.away as string))
      ) / 3) : 0.5
    
    // H2H Factor
    const h2hFactor = h2hStats.totalGames > 0 ?
      Math.max(h2hStats.homeWins, h2hStats.awayWins) / h2hStats.totalGames : 0.5
    
    // Fatigue Factor (간소화 - 최근 경기 일정 기반)
    const fatigueFactor = 0.8 // 기본값, 실제로는 최근 경기 간격 계산 필요
    
    // Motivation Factor (리그 순위, 중요도 기반)
    const motivationFactor = fixture?.league.round?.includes('Final') || 
                           fixture?.league.round?.includes('Semi') ? 1.0 : 0.7
    
    return {
      formFactor,
      homeFactor,
      goalsFactor,
      h2hFactor,
      fatigueFactor,
      motivationFactor
    }
  }
  
  // Calibration (간소화 버전)
  private calibrateProbabilities(probs: { home: number; draw: number; away: number }) {
    // Ensure probabilities sum to 1
    const total = probs.home + probs.draw + probs.away
    
    // Apply mild smoothing to avoid extreme predictions
    const smoothed = {
      home: probs.home / total * 0.9 + 0.033,
      draw: probs.draw / total * 0.9 + 0.033,
      away: probs.away / total * 0.9 + 0.033
    }
    
    // Re-normalize
    const newTotal = smoothed.home + smoothed.draw + smoothed.away
    return {
      home: smoothed.home / newTotal,
      draw: smoothed.draw / newTotal,
      away: smoothed.away / newTotal
    }
  }
  
  // Monte Carlo simulation for uncertainty (간소화)
  public simulateWithUncertainty(
    prediction: AdvancedPrediction,
    iterations: number = 100
  ): { 
    mean: { home: number; draw: number; away: number },
    std: { home: number; draw: number; away: number },
    confidence_interval: {
      home: [number, number],
      draw: [number, number],
      away: [number, number]
    }
  } {
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      // Add Gaussian noise based on uncertainty
      const noise = {
        home: this.gaussianRandom(0, prediction.uncertainty * 0.1),
        draw: this.gaussianRandom(0, prediction.uncertainty * 0.1),
        away: this.gaussianRandom(0, prediction.uncertainty * 0.1)
      }
      
      const simulated = {
        home: Math.max(0, Math.min(1, prediction.homeWin + noise.home)),
        draw: Math.max(0, Math.min(1, prediction.draw + noise.draw)),
        away: Math.max(0, Math.min(1, prediction.awayWin + noise.away))
      }
      
      // Renormalize
      const total = simulated.home + simulated.draw + simulated.away
      results.push({
        home: simulated.home / total,
        draw: simulated.draw / total,
        away: simulated.away / total
      })
    }
    
    // Calculate statistics
    const mean = {
      home: results.reduce((sum, r) => sum + r.home, 0) / iterations,
      draw: results.reduce((sum, r) => sum + r.draw, 0) / iterations,
      away: results.reduce((sum, r) => sum + r.away, 0) / iterations
    }
    
    const std = {
      home: Math.sqrt(results.reduce((sum, r) => sum + Math.pow(r.home - mean.home, 2), 0) / iterations),
      draw: Math.sqrt(results.reduce((sum, r) => sum + Math.pow(r.draw - mean.draw, 2), 0) / iterations),
      away: Math.sqrt(results.reduce((sum, r) => sum + Math.pow(r.away - mean.away, 2), 0) / iterations)
    }
    
    // 95% confidence intervals
    const confidence_interval = {
      home: [mean.home - 1.96 * std.home, mean.home + 1.96 * std.home] as [number, number],
      draw: [mean.draw - 1.96 * std.draw, mean.draw + 1.96 * std.draw] as [number, number],
      away: [mean.away - 1.96 * std.away, mean.away + 1.96 * std.away] as [number, number]
    }
    
    return { mean, std, confidence_interval }
  }
  
  private gaussianRandom(mean: number, std: number): number {
    // Box-Muller transform
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z0 * std + mean
  }
}

// Export singleton instance
export const advancedModel = new AdvancedPredictionModel()