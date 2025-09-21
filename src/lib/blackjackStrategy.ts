// Blackjack Basic Strategy Implementation
// This implements optimal basic strategy for standard blackjack rules

export interface Card {
  suit: string;
  value: string;
}

export interface HandAnalysis {
  playerScore: number;
  dealerUpCard: number;
  isPlayerSoft: boolean;
  canSplit: boolean;
  canDoubleDown: boolean;
  optimalAction: 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT';
  confidence: number; // 0-100, how confident we are in this decision
}

// Hard totals basic strategy (player total vs dealer up card)
const HARD_STRATEGY: { [key: number]: { [key: number]: string } } = {
  // Player total: {Dealer up card: action}
  5: {2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},
  6: {2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},
  7: {2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},
  8: {2:'H',3:'H',4:'H',5:'H',6:'H',7:'H',8:'H',9:'H',10:'H',11:'H'},
  9: {2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'},
  10: {2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',11:'H'},
  11: {2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'D',11:'D'},
  12: {2:'H',3:'H',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},
  13: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},
  14: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},
  15: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},
  16: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'H',8:'H',9:'H',10:'H',11:'H'},
  17: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},
  18: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},
  19: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},
  20: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},
  21: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}
};

// Soft totals basic strategy (hands with Ace counted as 11)
const SOFT_STRATEGY: { [key: number]: { [key: number]: string } } = {
  // Soft total: {Dealer up card: action}
  13: {2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'}, // A,2
  14: {2:'H',3:'H',4:'H',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'}, // A,3
  15: {2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'}, // A,4
  16: {2:'H',3:'H',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'}, // A,5
  17: {2:'H',3:'D',4:'D',5:'D',6:'D',7:'H',8:'H',9:'H',10:'H',11:'H'}, // A,6
  18: {2:'S',3:'D',4:'D',5:'D',6:'D',7:'S',8:'S',9:'H',10:'H',11:'H'}, // A,7
  19: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}, // A,8
  20: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}, // A,9
  21: {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}  // A,10
};

// Pair splitting strategy
const SPLIT_STRATEGY: { [key: string]: { [key: number]: string } } = {
  'A': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P',11:'P'}, // Always split Aces
  '2': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',11:'H'},
  '3': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',11:'H'},
  '4': {2:'H',3:'H',4:'H',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H',11:'H'},
  '5': {2:'D',3:'D',4:'D',5:'D',6:'D',7:'D',8:'D',9:'D',10:'H',11:'H'}, // Never split 5s
  '6': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'H',8:'H',9:'H',10:'H',11:'H'},
  '7': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'H',9:'H',10:'H',11:'H'},
  '8': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'P',8:'P',9:'P',10:'P',11:'P'}, // Always split 8s
  '9': {2:'P',3:'P',4:'P',5:'P',6:'P',7:'S',8:'P',9:'P',10:'S',11:'S'},
  '10': {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}, // Never split 10s
  'J': {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},
  'Q': {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'},
  'K': {2:'S',3:'S',4:'S',5:'S',6:'S',7:'S',8:'S',9:'S',10:'S',11:'S'}
};

export function getCardValue(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value, 10);
}

export function calculateHand(hand: Card[]): { score: number; isSoft: boolean } {
  let score = 0;
  let aces = 0;
  let isSoft = false;

  for (const card of hand) {
    const val = getCardValue(card);
    if (val === 11) {
      aces++;
      isSoft = true;
    }
    score += val;
  }

  // Adjust for aces
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
    if (aces === 0) isSoft = false;
  }

  return { score, isSoft };
}

export function getOptimalAction(playerHand: Card[], dealerUpCard: Card, canDoubleDown: boolean = true): HandAnalysis {
  const playerHandCalc = calculateHand(playerHand);
  const playerScore = playerHandCalc.score;
  const isPlayerSoft = playerHandCalc.isSoft;
  const dealerUpValue = getCardValue(dealerUpCard);

  // Convert face cards to 10 for strategy lookup
  const dealerLookup = dealerUpValue === 11 ? 11 : Math.min(dealerUpValue, 10);

  const canSplit = playerHand.length === 2 && playerHand[0].value === playerHand[1].value;

  let optimalAction: 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' = 'HIT';
  let confidence = 100;

  // Check for split first (highest priority)
  if (canSplit) {
    const splitAction = SPLIT_STRATEGY[playerHand[0].value]?.[dealerLookup] || 'H';
    if (splitAction === 'P') {
      optimalAction = 'SPLIT';
    } else if (splitAction === 'D' && canDoubleDown) {
      optimalAction = 'DOUBLE';
    } else if (splitAction === 'S') {
      optimalAction = 'STAND';
    } else {
      optimalAction = 'HIT';
    }
  }
  // Check soft hands
  else if (isPlayerSoft && playerScore <= 21) {
    const softAction = SOFT_STRATEGY[playerScore]?.[dealerLookup] || 'H';
    if (softAction === 'D' && canDoubleDown) {
      optimalAction = 'DOUBLE';
    } else if (softAction === 'S') {
      optimalAction = 'STAND';
    } else {
      optimalAction = 'HIT';
    }
  }
  // Hard hands
  else {
    const hardAction = HARD_STRATEGY[Math.min(playerScore, 21)]?.[dealerLookup] || 'H';
    if (hardAction === 'D' && canDoubleDown) {
      optimalAction = 'DOUBLE';
    } else if (hardAction === 'S') {
      optimalAction = 'STAND';
    } else {
      optimalAction = 'HIT';
    }
  }

  // Adjust confidence based on borderline cases
  if (playerScore === 12 && [2, 3].includes(dealerLookup)) confidence = 80;
  if (playerScore === 16 && dealerLookup === 10) confidence = 85;
  if (isPlayerSoft && playerScore === 18 && [9, 10, 11].includes(dealerLookup)) confidence = 90;

  return {
    playerScore,
    dealerUpCard: dealerLookup,
    isPlayerSoft,
    canSplit,
    canDoubleDown,
    optimalAction,
    confidence
  };
}

export function analyzeDecision(
  playerHand: Card[],
  dealerUpCard: Card,
  actualAction: string,
  canDoubleDown: boolean = true
): {
  optimal: HandAnalysis;
  actualAction: string;
  wasOptimal: boolean;
  deviation: 'MINOR' | 'MODERATE' | 'MAJOR';
  explanation: string;
} {
  const optimal = getOptimalAction(playerHand, dealerUpCard, canDoubleDown);
  const normalizedAction = actualAction.toUpperCase();

  const wasOptimal = optimal.optimalAction === normalizedAction;

  let deviation: 'MINOR' | 'MODERATE' | 'MAJOR' = 'MINOR';
  let explanation = '';

  if (!wasOptimal) {
    // Determine severity of deviation
    if (optimal.optimalAction === 'STAND' && normalizedAction === 'HIT') {
      deviation = 'MAJOR';
      explanation = `Should have stood on ${optimal.playerScore}. Hitting risks busting.`;
    } else if (optimal.optimalAction === 'HIT' && normalizedAction === 'STAND') {
      deviation = 'MODERATE';
      explanation = `Should have hit ${optimal.playerScore}. Standing gives dealer advantage.`;
    } else if (optimal.optimalAction === 'DOUBLE' && normalizedAction === 'HIT') {
      deviation = 'MINOR';
      explanation = `Should have doubled down for maximum value. Hitting is okay but not optimal.`;
    } else if (optimal.optimalAction === 'SPLIT' && normalizedAction !== 'SPLIT') {
      deviation = 'MODERATE';
      explanation = `Should have split this pair for better expected value.`;
    } else {
      deviation = 'MINOR';
      explanation = `Minor deviation from basic strategy.`;
    }

    // Adjust based on confidence
    if (optimal.confidence < 90) {
      if (deviation === 'MAJOR') deviation = 'MODERATE';
      if (deviation === 'MODERATE') deviation = 'MINOR';
    }
  } else {
    explanation = `Correct basic strategy play!`;
  }

  return {
    optimal,
    actualAction: normalizedAction,
    wasOptimal,
    deviation,
    explanation
  };
}