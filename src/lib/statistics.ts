import { getUserRounds } from './userApiSimple';
import { getOptimalAction, analyzeDecision, Card, calculateHand, getCardValue } from './blackjackStrategy';

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
  deviation: 'MINOR' | 'MODERATE' | 'MAJOR';
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
  strategyAccuracy: number;
  minorDeviations: number;
  moderateDeviations: number;
  majorDeviations: number;

  // Hand breakdowns
  handAnalyses: HandAnalysisResult[];
  recentPerformance: { date: string; result: 'win' | 'lose' | 'push'; profit: number }[];
}

export async function getUserStatistics(userId: string): Promise<{ success: boolean; stats?: GameStatistics; error?: string }> {
  try {
    const roundsResult = await getUserRounds(userId, 1, 100); // Get last 100 games

    if (!roundsResult.success || !roundsResult.rounds) {
      return {
        success: false,
        error: roundsResult.error || 'Failed to fetch rounds'
      };
    }

    const rounds = roundsResult.rounds as RoundData[];

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
    let minorDeviations = 0;
    let moderateDeviations = 0;
    let majorDeviations = 0;

    const handAnalyses: HandAnalysisResult[] = [];
    const recentPerformance: { date: string; result: 'win' | 'lose' | 'push'; profit: number }[] = [];

    // Analyze each round
    for (const round of rounds) {
      if (!round.outcomes || !round.outcomes.playerHand || !round.outcomes.dealerHand) {
        continue; // Skip incomplete rounds
      }

      // Ensure cards are properly structured
      const playerHand = Array.isArray(round.outcomes.playerHand) ? round.outcomes.playerHand : [];
      const dealerHand = Array.isArray(round.outcomes.dealerHand) ? round.outcomes.dealerHand : [];

      // Check if cards have required properties
      const validPlayerHand = playerHand.every((card: any) => card && typeof card === 'object' && card.value && card.suit);
      const validDealerHand = dealerHand.every((card: any) => card && typeof card === 'object' && card.value && card.suit);

      if (!validPlayerHand || !validDealerHand) {
        continue; // Skip this round if cards are malformed
      }

      totalGames++;
      const outcomes = round.outcomes;

      // Basic statistics
      totalWagered += outcomes.betAmount;
      totalPayout += outcomes.payout;

      if (outcomes.result === 'win') wins++;
      else if (outcomes.result === 'lose') losses++;
      else pushes++;

      if (outcomes.isBlackjack) blackjacks++;

      // Recent performance tracking
      recentPerformance.push({
        date: round.endedAt || round.startedAt,
        result: outcomes.result,
        profit: outcomes.result === 'win' ? outcomes.payout :
                outcomes.result === 'push' ? 0 : -outcomes.betAmount
      });

      // Strategy analysis - analyze each recorded action
      if (outcomes.playerHand.length >= 2 && outcomes.dealerHand.length >= 1) {

        // If we have recorded actions, use them to analyze decisions but show only one result per round
        if (round.actions && round.actions.length > 0) {
          // Analyze each action taken during the hand for strategy accuracy
          let roundOptimalDecisions = 0;
          let roundTotalDecisions = 0;

          // Always use the FIRST action as the key decision for display (most strategically important)
          const firstAction = round.actions[0];
          const firstAnalysis = analyzeDecision(
            firstAction.playerHandBefore,
            firstAction.dealerUpCard,
            firstAction.action,
            firstAction.playerHandBefore.length === 2
          );

          let keyAction = firstAnalysis.actualAction;
          let keyOptimalAction = firstAnalysis.optimal.optimalAction;
          let keyExplanation = firstAnalysis.explanation;
          let worstDeviation = firstAnalysis.deviation;

          // Track strategy accuracy for all actions in the round
          for (const action of round.actions) {
            totalDecisions++;
            roundTotalDecisions++;

            // Analyze this specific action
            const analysis = analyzeDecision(
              action.playerHandBefore,
              action.dealerUpCard,
              action.action,
              action.playerHandBefore.length === 2 // Can double down only on first decision
            );

            if (analysis.wasOptimal) {
              optimalDecisions++;
              roundOptimalDecisions++;
            } else {
              if (analysis.deviation === 'MINOR') minorDeviations++;
              else if (analysis.deviation === 'MODERATE') moderateDeviations++;
              else majorDeviations++;
            }
          }


          // Add one consolidated analysis per round showing final hands
          handAnalyses.push({
            roundId: round.id,
            date: round.endedAt || round.startedAt,
            playerHand: outcomes.playerHand, // Final complete player hand
            dealerUpCard: round.actions[0].dealerUpCard,
            dealerFinalHand: outcomes.dealerHand,
            finalResult: outcomes.result,
            betAmount: outcomes.betAmount,
            payout: outcomes.payout,
            optimalAction: keyOptimalAction || 'N/A',
            actualAction: keyAction || 'N/A',
            wasOptimal: firstAnalysis.wasOptimal,
            deviation: worstDeviation as 'MINOR' | 'MODERATE' | 'MAJOR',
            explanation: keyExplanation || 'Round analysis complete',
            confidence: firstAnalysis.optimal.confidence
          });
        } else {
          // Fallback to old inference method for rounds without recorded actions
          totalDecisions++;

          let assumedAction = 'STAND';
          const initialHand = [outcomes.playerHand[0], outcomes.playerHand[1]];

          if (outcomes.playerScore === 21 && outcomes.playerHand.length === 2) {
            assumedAction = 'STAND';
          } else if (outcomes.playerHand.length > 2) {
            assumedAction = 'HIT';
          } else {
            assumedAction = 'STAND';
          }

          const analysis = analyzeDecision(
            initialHand,
            outcomes.dealerHand[0],
            assumedAction,
            true
          );

          if (analysis.wasOptimal) optimalDecisions++;
          else {
            if (analysis.deviation === 'MINOR') minorDeviations++;
            else if (analysis.deviation === 'MODERATE') moderateDeviations++;
            else majorDeviations++;
          }


          handAnalyses.push({
            roundId: round.id,
            date: round.endedAt || round.startedAt,
            playerHand: outcomes.playerHand, // Use final complete player hand
            dealerUpCard: outcomes.dealerHand[0],
            dealerFinalHand: outcomes.dealerHand,
            finalResult: outcomes.result,
            betAmount: outcomes.betAmount,
            payout: outcomes.payout,
            optimalAction: analysis.optimal.optimalAction,
            actualAction: analysis.actualAction,
            wasOptimal: analysis.wasOptimal,
            deviation: analysis.deviation,
            explanation: analysis.explanation,
            confidence: analysis.optimal.confidence
          });
        }
      }
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
      strategyAccuracy,
      minorDeviations,
      moderateDeviations,
      majorDeviations,
      handAnalyses,
      recentPerformance: recentPerformance.slice(0, 20) // Last 20 games
    };

    return {
      success: true,
      stats
    };

  } catch (error) {
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