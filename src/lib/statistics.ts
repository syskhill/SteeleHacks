import { getUserRounds } from './userApiSimple';
import { Card } from './blackjackStrategy';

export interface RoundData {
  id: string;
  userId: string;
  seed: string;
  startedAt: string;
  endedAt?: string;
  outcomes: {
    playerHand: Card[];
    dealerHand: Card[];
    playerScore: number;
    dealerScore: number;
    betAmount: number;
    result: 'win' | 'lose' | 'push';
    payout: number;
    isBlackjack: boolean;
  };
  actions?: Array<{
    action: 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT';
    timestamp: string;
    playerHandBefore: Card[];
    playerScoreBefore: number;
    dealerUpCard: Card;
  }>;
}

export interface HandAnalysisResult {
  roundId: string;
  date: string;
  playerHand: Card[];
  dealerUpCard: Card;
  dealerFinalHand: Card[];
  finalResult: 'win' | 'lose' | 'push';
  betAmount: number;
  payout: number;
  optimalAction: string;
  actualAction: string;
  wasOptimal: boolean;
  explanation: string;
  confidence: number;
}

export interface GameStatistics {
  totalGames: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  totalWagered: number;
  totalPayout: number;
  netProfit: number;
  blackjacks: number;
  averageBet: number;

  // Strategy analysis
  totalDecisions: number;
  optimalDecisions: number;
  suboptimalDecisions: number;
  strategyAccuracy: number;

  // Hand breakdowns
  handAnalyses: HandAnalysisResult[];
  recentPerformance: { date: string; result: 'win' | 'lose' | 'push'; profit: number }[];
}

export async function getUserStatistics(userId: string): Promise<{ success: boolean; stats?: GameStatistics; error?: string }> {
  try {
    console.log('=== getUserStatistics Debug ===');
    console.log('Processing userId:', userId);

    const roundsResult = await getUserRounds(userId, 1, 100);
    console.log('getRounds result:', roundsResult);

    if (!roundsResult.success || !roundsResult.rounds) {
      console.log('No rounds found or error:', roundsResult.error);
      return {
        success: false,
        error: roundsResult.error || 'Failed to fetch rounds'
      };
    }

    const rounds = roundsResult.rounds as RoundData[];
    console.log('Processing', rounds.length, 'rounds');
    console.log('First round sample:', rounds[0]);

    // Initialize statistics
    let totalGames = 0;
    let wins = 0;
    let losses = 0;
    let pushes = 0;
    let totalWagered = 0;
    let totalPayout = 0;
    let blackjacks = 0;

    let totalDecisions = 0;
    let optimalDecisions = 0;
    let suboptimalDecisions = 0;

    const handAnalyses: HandAnalysisResult[] = [];
    const recentPerformance: { date: string; result: 'win' | 'lose' | 'push'; profit: number }[] = [];

    // Analyze each round
    for (const round of rounds) {
      if (!round.outcomes) continue;

      const outcomes = round.outcomes;
      if (!outcomes.result || typeof outcomes.betAmount !== 'number') continue;

      totalGames++;

      // Basic statistics
      totalWagered += outcomes.betAmount;
      totalPayout += outcomes.payout || 0;

      if (outcomes.result === 'win') wins++;
      else if (outcomes.result === 'lose') losses++;
      else pushes++;

      if (outcomes.isBlackjack) blackjacks++;

      // Recent performance tracking
      recentPerformance.push({
        date: round.endedAt || round.startedAt,
        result: outcomes.result,
        profit: outcomes.result === 'win' ? (outcomes.payout || 0) :
                outcomes.result === 'push' ? 0 : -outcomes.betAmount
      });
    }

    // Calculate derived statistics
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const netProfit = totalPayout - totalWagered;
    const averageBet = totalGames > 0 ? totalWagered / totalGames : 0;
    const strategyAccuracy = totalDecisions > 0 ? (optimalDecisions / totalDecisions) * 100 : 0;

    // Sort recent performance by date (most recent first)
    recentPerformance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const stats: GameStatistics = {
      totalGames,
      wins,
      losses,
      pushes,
      winRate,
      totalWagered,
      totalPayout,
      netProfit,
      blackjacks,
      averageBet,
      totalDecisions,
      optimalDecisions,
      suboptimalDecisions,
      strategyAccuracy,
      handAnalyses,
      recentPerformance: recentPerformance.slice(0, 20)
    };

    return {
      success: true,
      stats
    };

  } catch (error) {
    console.error('Statistics calculation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate statistics'
    };
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}