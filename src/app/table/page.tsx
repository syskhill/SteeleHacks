'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {login, logout, isAuthenticated, pb} from '../../lib/auth';
import { getUserBalance, updateUserBalance, initializeUserBalance, createRound, updateRoundOutcomes, addActionToRound } from '../../lib/userApiSimple';

// Type definitions
interface GameState {
  player: string;
  bankroll: number;
  bet: number;
}

interface Card {
  suit: string;
  value: string;
}

interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isFinished: boolean;
  result?: 'win' | 'lose' | 'push';
  payout?: number;
}

interface Game {
  deck: Card[];
  playerHands: Hand[];
  dealerHand: Card[];
  gameOver: boolean;
  currentHandIndex: number;
  isSplit: boolean;
}

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const BlackjackTable: React.FC = () => {
  const router = useRouter();
  
  // Combined state management
  const [gameState, setGameState] = useState<GameState>({
    player: '',
    bankroll: 1000,
    bet: 0
  });
  const [chips, setChips] = useState<number[]>([]);
  const [game, setGame] = useState<Game>({
    deck: [],
    playerHands: [{ cards: [], bet: 0, isDoubled: false, isFinished: false }],
    dealerHand: [],
    gameOver: false,
    currentHandIndex: 0,
    isSplit: false
  });
  const [gameMode, setGameMode] = useState<'betting' | 'playing' | 'gameOver'>('betting');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' }>({
    text: '',
    type: 'info'
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [currentRoundId, setCurrentRoundId] = useState<string>('');
  const [roundActions, setRoundActions] = useState<any[]>([]);
  
  const playerHandRef = useRef<HTMLDivElement>(null);
  const dealerHandRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount and check authentication
  useEffect(() => {
    const initializeGame = async () => {
      // Check authentication
      const authValid = pb.authStore.isValid;
      const currentUserId = pb.authStore.record?.id;

      setIsAuthenticated(authValid);
      setUserId(currentUserId || '');

      if (authValid && currentUserId) {
        // User is authenticated, load balance from PocketBase
        try {
          const balanceResult = await initializeUserBalance(currentUserId);
          if (balanceResult.success && balanceResult.balance !== undefined) {
            setGameState(prev => ({
              ...prev,
              bankroll: balanceResult.balance,
              player: pb.authStore.record?.email || 'Anonymous'
            }));
          }
        } catch (error) {
          console.error('Failed to load user balance:', error);
        }
      } else {
        // Not authenticated, load from localStorage
        const storedState = localStorage.getItem('blackjackState');
        if (storedState) {
          const parsedState = JSON.parse(storedState) as GameState;
          setGameState(parsedState);

          // If bet exists, start in betting mode with chips
          if (parsedState.bet > 0) {
            setChips([parsedState.bet]);
            setGameMode('betting');
          }
        }
      }

      setIsInitialized(true);
    };

    initializeGame();
  }, []);

  // Save state to localStorage and sync balance with PocketBase
  useEffect(() => {
    const syncBalance = async () => {
      localStorage.setItem('blackjackState', JSON.stringify(gameState));

      // If user is authenticated, sync balance with PocketBase
      if (isAuthenticated && userId && gameState.bankroll !== undefined) {
        try {
          await updateUserBalance(userId, gameState.bankroll);
        } catch (error) {
          console.error('Failed to sync balance with PocketBase:', error);
        }
      }
    };

    if (isInitialized) {
      syncBalance();
    }
  }, [gameState, isAuthenticated, userId, isInitialized]);

  // Cleanup animations
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Game logic functions
  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    return shuffle(deck);
  };

  const shuffle = (array: Card[]): Card[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getCardValue = (card: Card): number => {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value, 10);
  };

  const calculateHand = (hand: Card[]): number => {
    if (!hand || !Array.isArray(hand)) {
      console.warn('calculateHand called with invalid hand:', hand);
      return 0;
    }

    let score = 0;
    let aces = 0;
    for (const card of hand) {
      if (!card || !card.value) {
        console.warn('Invalid card in hand:', card);
        continue;
      }
      const val = getCardValue(card);
      score += val === 11 ? (aces++, val) : val;
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const popCardFromDeck = (): Card => {
    if (game.deck.length === 0) throw new Error('Deck is empty');
    const newDeck = [...game.deck];
    const drawn = newDeck.pop()!;
    // update deck in state
    setGame(prev => ({ ...prev, deck: newDeck }));
    return drawn;
  };
  
  // Betting functions
  const addChip = (amount: number) => {
    // Check if user has sufficient balance
    if (gameState.bankroll < amount) {
      showMessage('Insufficient funds!', 'error');
      return;
    }

    // Check if bet would exceed balance
    if (gameState.bet + amount > gameState.bankroll) {
      showMessage('Cannot bet more than your balance!', 'error');
      return;
    }

    // Limit maximum bet to prevent overbetting
    if (gameState.bet + amount >= gameState.bankroll) {
      showMessage('Maximum bet reached!', 'error');
      return;
    }

    setGameState(prev => ({
      ...prev,
      bet: prev.bet + amount,
      bankroll: prev.bankroll - amount
    }));

    setChips(prev => [...prev, amount]);
  };

  const removeChip = (index?: number) => {
    if (chips.length === 0) {
      showMessage('No chips to remove!', 'error');
      return;
    }

    let chipToRemove: number;
    let newChips: number[];

    if (index !== undefined && index >= 0 && index < chips.length) {
      // Remove specific chip by index
      chipToRemove = chips[index];
      newChips = chips.filter((_, i) => i !== index);
    } else {
      // Remove the last chip added (default behavior)
      chipToRemove = chips[chips.length - 1];
      newChips = chips.slice(0, -1);
    }

    setChips(newChips);

    // Return the chip value to bankroll and subtract from bet
    setGameState(prev => ({
      ...prev,
      bet: prev.bet - chipToRemove,
      bankroll: prev.bankroll + chipToRemove
    }));

    if (newChips.length === 0) {
      // No chips left
      setMessage({ text: '', type: 'info' });
    }
  };

  const clearBet = () => {
    // Return all bet money to bankroll
    setGameState(prev => ({
      ...prev,
      bet: 0,
      bankroll: prev.bankroll + prev.bet
    }));
    setChips([]);
    setMessage({ text: '', type: 'info' });
  };

  const startGame = () => {
    if (gameState.bet === 0) {
      showMessage('Place a bet first!', 'error');
      return;
    }
    
    // Transition to playing mode
    setGameMode('playing');
    initGame();
  };

  // Game functions
  const initGame = async () => {
    const newDeck = createDeck();
    const playerCards = [newDeck.pop()!, newDeck.pop()!];
    const dealerHand = [newDeck.pop()!, newDeck.pop()!];

    // Create a round record if user is authenticated
    if (isAuthenticated && userId) {
      try {
        const seed = Math.random().toString(36).substring(2, 15);
        const roundResult = await createRound(userId, seed);
        if (roundResult.success && roundResult.roundId) {
          setCurrentRoundId(roundResult.roundId);
        }
      } catch (error) {
        console.error('Failed to create round:', error);
      }
    }

    setGame({
      deck: newDeck,
      playerHands: [{
        cards: playerCards,
        bet: gameState.bet,
        isDoubled: false,
        isFinished: false
      }],
      dealerHand,
      gameOver: false,
      currentHandIndex: 0,
      isSplit: false
    });

    setMessage({ text: '', type: 'info' });
  };

  const hit = async () => {
    const currentHand = game.playerHands[game.currentHandIndex];

    if (game.gameOver || !currentHand || !currentHand.cards || currentHand.cards.length === 0) {
      console.warn('hit() called with invalid game state:', { gameOver: game.gameOver, currentHand });
      return;
    }

    // Track the action before executing it
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'HIT' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...currentHand.cards],
        playerScoreBefore: calculateHand(currentHand.cards),
        dealerUpCard: game.dealerHand[0]
      };

      setRoundActions(prev => [...prev, action]);

      try {
        await addActionToRound(currentRoundId, action);
      } catch (error) {
        console.error('Failed to track action:', error);
      }
    }

    const drawn = popCardFromDeck();
    const newCards = [...currentHand.cards, drawn];

    setGame(prev => ({
      ...prev,
      playerHands: prev.playerHands.map((hand, index) =>
        index === prev.currentHandIndex
          ? { ...hand, cards: newCards }
          : hand
      )
    }));

    const playerScore = calculateHand(newCards);

    if (playerScore > 21) {
      // Mark current hand as finished and move to next hand or end game
      setGame(prev => ({
        ...prev,
        playerHands: prev.playerHands.map((hand, index) =>
          index === prev.currentHandIndex
            ? { ...hand, isFinished: true, result: 'lose' }
            : hand
        )
      }));

      if (game.isSplit && game.currentHandIndex < game.playerHands.length - 1) {
        // Move to next hand
        setGame(prev => ({ ...prev, currentHandIndex: prev.currentHandIndex + 1 }));
        setMessage({ text: `Hand ${game.currentHandIndex + 1} busted! Moving to hand ${game.currentHandIndex + 2}`, type: 'error' });
      } else {
        // All hands finished or single hand busted
        const bustMessage = currentHand.isDoubled ? 'Double down bust! You lose. 💸' : 'Bust! You lose. 💸';
        endGame(bustMessage, -1, 'error');
      }
    }
  };

  const stand = async () => {
    const currentHand = game.playerHands[game.currentHandIndex];

    if (game.gameOver || !currentHand || !currentHand.cards || currentHand.cards.length === 0) {
      console.warn('stand() called with invalid game state:', { gameOver: game.gameOver, currentHand });
      return;
    }

    // Track the stand action
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'STAND' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...currentHand.cards],
        playerScoreBefore: calculateHand(currentHand.cards),
        dealerUpCard: game.dealerHand[0]
      };

      setRoundActions(prev => [...prev, action]);

      try {
        await addActionToRound(currentRoundId, action);
      } catch (error) {
        console.error('Failed to track action:', error);
      }
    }

    // Mark current hand as finished
    setGame(prev => ({
      ...prev,
      playerHands: prev.playerHands.map((hand, index) =>
        index === prev.currentHandIndex
          ? { ...hand, isFinished: true }
          : hand
      )
    }));

    // Check if there are more hands to play
    if (game.isSplit && game.currentHandIndex < game.playerHands.length - 1) {
      // Move to next hand
      setGame(prev => ({ ...prev, currentHandIndex: prev.currentHandIndex + 1 }));
      setMessage({ text: `Hand ${game.currentHandIndex + 1} complete! Playing hand ${game.currentHandIndex + 2}`, type: 'info' });
      return;
    }

    // Reveal dealer hidden card (UI uses game.gameOver flag to reveal)
    setGame(prev => ({ ...prev, gameOver: true }));

    animationRef.current = setTimeout(() => {
      // Work with local copies so we can update state incrementally and compute score correctly
      let dealerHand = [...game.dealerHand];
      let deckCopy = [...game.deck];
      let dealerScore = calculateHand(dealerHand);

      // Add delay between each dealer card draw for better animation
      const drawNextCard = () => {
        if (dealerScore < 17 && deckCopy.length > 0) {
          const drawn = deckCopy.pop()!;
          dealerHand = [...dealerHand, drawn];
          dealerScore = calculateHand(dealerHand);

          // Update state immediately so UI shows new card
          setGame(prev => ({ ...prev, dealerHand: [...dealerHand], deck: [...deckCopy] }));

          // Continue drawing if needed
          setTimeout(drawNextCard, 600);
        } else {
          // Dealer is done drawing, evaluate final result
          const playerScore = calculateHand(game.playerHands[0]?.cards || []);
          let result = 0;
          let msg = '';

          // Check for bust first
          if (dealerScore > 21) {
            result = 1;
            msg = 'Dealer busts! Panthers Win! 🎉';
          } else if (playerScore > 21) {
            result = -1;
            msg = 'Player busts! Mountaineers Win! 😤';
          } else {
            // Compare final scores
            if (playerScore > dealerScore) {
              result = 1;
              msg = 'Panthers Win! 🎉';
            } else if (playerScore < dealerScore) {
              result = -1;
              msg = 'Mountaineers Win! Couches are burning! 😤';
            } else {
              // Exact same scores = push
              result = 0;
              msg = 'Push! Same score! 🤝';
            }
          }

          // Final state update with complete dealer hand
          setGame(prev => ({ ...prev, dealerHand: [...dealerHand], deck: [...deckCopy] }));

          // For split games, the endGame function will handle messaging
          if (game.isSplit) {
            endGame('', 0, 'info'); // Empty message, will be overridden in endSplitGame
          } else {
            endGame(msg, result, result > 0 ? 'success' : result < 0 ? 'error' : 'info');
          }
        }
      };

      drawNextCard();
    }, 800);
  };

  const doubleDown = async () => {
    const currentHand = game.playerHands[game.currentHandIndex];

    if (!currentHand || !currentHand.cards) {
      console.error('Invalid current hand for double down:', currentHand);
      showMessage('Invalid hand state!', 'error');
      return;
    }

    // Check if user has enough balance to double the bet
    if (gameState.bankroll < currentHand.bet) {
      showMessage('Insufficient funds to double down!', 'error');
      return;
    }

    if (currentHand.cards.length !== 2) {
      showMessage('Can only double down on first two cards!', 'error');
      return;
    }

    // Track the double down action
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'DOUBLE' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...currentHand.cards],
        playerScoreBefore: calculateHand(currentHand.cards),
        dealerUpCard: game.dealerHand[0]
      };

      setRoundActions(prev => [...prev, action]);

      try {
        await addActionToRound(currentRoundId, action);
      } catch (error) {
        console.error('Failed to track action:', error);
      }
    }

    // Subtract additional bet amount from bankroll and mark hand as doubled
    setGameState(prev => ({
      ...prev,
      bankroll: prev.bankroll - currentHand.bet
    }));

    setGame(prev => ({
      ...prev,
      playerHands: prev.playerHands.map((hand, index) =>
        index === prev.currentHandIndex
          ? { ...hand, bet: hand.bet * 2, isDoubled: true }
          : hand
      )
    }));

    // Hit once then automatically stand
    hit(); // Don't await this to avoid blocking
    setTimeout(() => {
      // Check if hand is still valid before standing
      if (!game.gameOver && game.playerHands[game.currentHandIndex] && !game.playerHands[game.currentHandIndex].isFinished) {
        stand();
      }
    }, 1000);
  };

  const split = async () => {
    const currentHand = game.playerHands[game.currentHandIndex];

    if (!currentHand || !currentHand.cards) {
      console.error('Invalid current hand for split:', currentHand);
      showMessage('Invalid hand state!', 'error');
      return;
    }

    if (currentHand.cards.length !== 2 || currentHand.cards[0].value !== currentHand.cards[1].value) {
      showMessage('Can only split pairs!', 'error');
      return;
    }

    // Check if user has enough balance for the additional bet
    if (gameState.bankroll < currentHand.bet) {
      showMessage('Insufficient funds to split!', 'error');
      return;
    }

    // Check split limit (max 3 splits = 4 hands)
    if (game.playerHands.length >= 4) {
      showMessage('Maximum splits reached!', 'error');
      return;
    }

    // Track the split action
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'SPLIT' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...currentHand.cards],
        playerScoreBefore: calculateHand(currentHand.cards),
        dealerUpCard: game.dealerHand[0]
      };

      setRoundActions(prev => [...prev, action]);

      try {
        await addActionToRound(currentRoundId, action);
      } catch (error) {
        console.error('Failed to track action:', error);
      }
    }

    // Subtract additional bet from bankroll
    setGameState(prev => ({
      ...prev,
      bankroll: prev.bankroll - currentHand.bet
    }));

    // Split the pair into two hands
    const firstCard = currentHand.cards[0];
    const secondCard = currentHand.cards[1];

    // Draw new cards for each hand
    const newCardForFirstHand = popCardFromDeck();
    const newCardForSecondHand = popCardFromDeck();

    setGame(prev => ({
      ...prev,
      playerHands: [
        // Update current hand with first card + new card
        ...prev.playerHands.slice(0, prev.currentHandIndex),
        {
          cards: [firstCard, newCardForFirstHand],
          bet: currentHand.bet,
          isDoubled: false,
          isFinished: false
        },
        // Add new hand with second card + new card
        {
          cards: [secondCard, newCardForSecondHand],
          bet: currentHand.bet,
          isDoubled: false,
          isFinished: false
        },
        ...prev.playerHands.slice(prev.currentHandIndex + 1)
      ],
      isSplit: true
    }));

    setMessage({ text: `Pair split! Playing hand 1 of ${game.playerHands.length + 1}`, type: 'info' });

    // Special rule: Aces can only receive one card each
    if (firstCard.value === 'A') {
      setMessage({ text: 'Aces split! Each hand receives only one card.', type: 'info' });
      // Mark both hands as finished since Aces get only one card
      setTimeout(() => {
        setGame(prev => ({
          ...prev,
          playerHands: prev.playerHands.map(hand => ({ ...hand, isFinished: true }))
        }));
        setTimeout(() => stand(), 500);
      }, 1000);
    }
  };

  const endGame = async (text: string, result: number, type: 'error' | 'success' | 'info') => {
    console.log('endGame called with:', { text, result, type, isSplit: game.isSplit });

    // Always set the message first
    setMessage({ text, type });

    try {
      if (game.isSplit) {
        // Handle multiple hands
        await endSplitGame();
      } else {
        // Handle single hand
        await endSingleGame(result);
      }

      setGame(prev => ({ ...prev, gameOver: true }));
      setGameMode('gameOver');

      // Return to betting mode after delay
      setTimeout(() => {
        const playAgain = confirm('Play another hand?');
        if (playAgain) {
          resetForNewGame();
        } else {
          // Just return to betting mode
          setGameMode('betting');
          resetHands();
        }
      }, 2500);
    } catch (error) {
      console.error('Error in endGame:', error);
      // Fallback to ensure game doesn't get stuck
      setGame(prev => ({ ...prev, gameOver: true }));
      setGameMode('gameOver');
      setMessage({ text: 'Game ended with errors', type: 'error' });
    }
  };

  const endSingleGame = async (result: number) => {
    const playerHand = game.playerHands[0];
    if (!playerHand || !playerHand.cards) {
      console.error('Player hand is invalid:', playerHand);
      return;
    }

    const playerScore = calculateHand(playerHand.cards);
    const dealerScore = calculateHand(game.dealerHand);
    const isBlackjack = playerHand.cards.length === 2 && playerScore === 21;

    console.log('endSingleGame:', { playerScore, dealerScore, result, isBlackjack });

    // Calculate payout
    let payout = 0;
    let resultString: 'win' | 'lose' | 'push' = 'lose';

    if (result === 1) {
      resultString = 'win';
      // For blackjack, only pay 3:2 on original bet (not doubled bets)
      if (isBlackjack && !playerHand.isDoubled) {
        payout = playerHand.bet * 1.5;
      } else {
        // Normal win pays 1:1 on the full bet (including doubled amount)
        payout = playerHand.bet;
      }

      setGameState(prev => ({
        ...prev,
        bankroll: prev.bankroll + playerHand.bet + payout
      }));
    } else if (result === 0) {
      resultString = 'push';
      payout = 0;
      setGameState(prev => ({
        ...prev,
        bankroll: prev.bankroll + playerHand.bet // Return the full bet (including doubled amount)
      }));
    }
    // Loss: bet already deducted, payout = 0

    console.log('Payout calculation:', {
      result,
      isBlackjack,
      isDoubled: playerHand.isDoubled,
      bet: playerHand.bet,
      payout
    });

    // Update round outcomes if authenticated and round exists
    if (isAuthenticated && userId && currentRoundId) {
      try {
        const roundData = {
          playerHand: playerHand.cards,
          dealerHand: game.dealerHand,
          playerScore: playerScore,
          dealerScore: dealerScore,
          betAmount: playerHand.bet,
          result: resultString,
          payout: payout,
          isBlackjack: isBlackjack
        };

        await updateRoundOutcomes(currentRoundId, roundData, roundActions);
        console.log('Round outcomes updated:', roundData);
      } catch (error) {
        console.error('Failed to update round outcomes:', error);
      }
    }
  };

  const endSplitGame = async () => {
    console.log('endSplitGame called with hands:', game.playerHands);

    const dealerScore = calculateHand(game.dealerHand);
    let totalPayout = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalPushes = 0;

    console.log('Dealer score:', dealerScore);

    // Evaluate each hand against dealer
    const updatedHands = game.playerHands.map(hand => {
      const playerScore = calculateHand(hand.cards);
      let result: 'win' | 'lose' | 'push' = 'lose';
      let payout = 0;

      // Check for bust first
      if (playerScore > 21) {
        result = 'lose';
      } else if (dealerScore > 21) {
        result = 'win';
        payout = hand.bet; // Full bet amount (including doubled)
        totalWins++;
      } else if (playerScore > dealerScore) {
        result = 'win';
        payout = hand.bet; // Full bet amount (including doubled)
        totalWins++;
      } else if (playerScore < dealerScore) {
        result = 'lose';
        totalLosses++;
      } else {
        result = 'push';
        payout = 0; // No winnings, but bet will be returned separately
        totalPushes++;
      }

      console.log(`Hand ${game.playerHands.indexOf(hand) + 1}:`, {
        playerScore,
        dealerScore,
        result,
        bet: hand.bet,
        payout,
        isDoubled: hand.isDoubled
      });

      totalPayout += payout;
      return { ...hand, result, payout };
    });

    // Update bankroll with winnings and returned bets
    setGameState(prev => ({
      ...prev,
      bankroll: prev.bankroll + totalPayout + (totalPushes > 0 ? updatedHands.filter(h => h.result === 'push').reduce((sum, h) => sum + h.bet, 0) : 0)
    }));

    // Update game state with results
    setGame(prev => ({
      ...prev,
      playerHands: updatedHands
    }));

    // Generate summary message
    let summaryText = '';
    if (totalWins > 0 && totalLosses === 0 && totalPushes === 0) {
      summaryText = `All hands win! Panthers dominate! 🎉`;
    } else if (totalLosses > 0 && totalWins === 0 && totalPushes === 0) {
      summaryText = `All hands lose! Mountaineers sweep! 😤`;
    } else if (totalWins > totalLosses) {
      summaryText = `Panthers win overall! ${totalWins} wins, ${totalLosses} losses, ${totalPushes} pushes`;
    } else if (totalLosses > totalWins) {
      summaryText = `Mountaineers win overall! ${totalLosses} losses, ${totalWins} wins, ${totalPushes} pushes`;
    } else {
      summaryText = `Split result! ${totalWins} wins, ${totalLosses} losses, ${totalPushes} pushes`;
    }

    // Override the message with the summary
    setMessage({
      text: summaryText,
      type: totalWins > totalLosses ? 'success' : totalLosses > totalWins ? 'error' : 'info'
    });

    console.log('Split game summary:', summaryText);

    // Save to database (use first hand as primary for database compatibility)
    if (isAuthenticated && userId && currentRoundId && updatedHands.length > 0) {
      try {
        const primaryHand = updatedHands[0];
        const roundData = {
          playerHand: primaryHand.cards,
          dealerHand: game.dealerHand,
          playerScore: calculateHand(primaryHand.cards),
          dealerScore: dealerScore,
          betAmount: updatedHands.reduce((sum, h) => sum + h.bet, 0),
          result: totalWins > totalLosses ? 'win' : totalLosses > totalWins ? 'lose' : 'push',
          payout: totalPayout,
          isBlackjack: false
        };

        await updateRoundOutcomes(currentRoundId, roundData, roundActions);
        console.log('Split game outcomes updated:', roundData);
      } catch (error) {
        console.error('Failed to update split game outcomes:', error);
      }
    }
  };

  const resetForNewGame = () => {
    // Clear message first
    setMessage({ text: '', type: 'info' });

    // Reset game state completely
    resetHands();

    // Clear bet state
    setChips([]);
    setGameState(prev => ({
      ...prev,
      bet: 0
    }));

    // Clear round tracking
    setCurrentRoundId('');
    setRoundActions([]);

    // Return to betting mode
    setGameMode('betting');
  };

  const resetHands = () => {
    if (playerHandRef.current) playerHandRef.current.innerHTML = '';
    if (dealerHandRef.current) dealerHandRef.current.innerHTML = '';

    setGame({
      deck: [],
      playerHands: [{ cards: [], bet: 0, isDoubled: false, isFinished: false }],
      dealerHand: [],
      gameOver: false,
      currentHandIndex: 0,
      isSplit: false
    });
    setMessage({ text: '', type: 'info' });
  };

  const resetProgress = () => {
    localStorage.removeItem('blackjackState');
    setChips([]);
    setGameState({ player: '', bankroll: 1000, bet: 0 });
    resetHands();
    setGameMode('betting');
    showMessage('Progress reset', 'success');
  };

  const showMessage = (text: string, type: 'error' | 'success' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: 'info' });
    }, 3000);
  };

  // Auto-scale background for betting mode
  const bettingBackgroundStyle: React.CSSProperties | undefined = gameMode === 'betting' ? {
    backgroundImage: "url('/blackjack.jpg')",
    backgroundSize: 'cover',          // scale to cover the viewport
    backgroundPosition: 'center',     // center the image
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'     // optional: keep background fixed while scrolling
  } : undefined;
  
  // Check for blackjacks on initial deal
  useEffect(() => {
    if (game.playerHands[0]?.cards.length === 2 && game.dealerHand.length === 2 && gameMode === 'playing' && !game.isSplit) {
      const playerScore = calculateHand(game.playerHands[0].cards);
      const dealerScore = calculateHand(game.dealerHand);
      const playerBlackjack = playerScore === 21;
      const dealerBlackjack = dealerScore === 21;

      // Check for dealer blackjack when showing Ace or 10-value card
      const dealerUpCard = game.dealerHand[0];
      const dealerUpValue = getCardValue(dealerUpCard);
      const shouldCheckDealerBlackjack = dealerUpValue === 11 || dealerUpValue === 10;

      if (shouldCheckDealerBlackjack && dealerBlackjack) {
        // Dealer has blackjack - reveal immediately
        setTimeout(() => {
          setGame(prev => ({ ...prev, gameOver: true }));
          setTimeout(() => {
            if (playerBlackjack) {
              endGame('Both blackjacks! Push! 🤝', 0, 'info');
            } else {
              endGame('Dealer Blackjack! Mountaineers win! 😤', -1, 'error');
            }
          }, 500);
        }, 1000);
      } else if (playerBlackjack) {
        // Player has blackjack, dealer doesn't
        setTimeout(() => {
          endGame('Blackjack! You win! 🤑', 1, 'success');
        }, 1000);
      }
    }
  }, [game.playerHands[0]?.cards.length, game.dealerHand.length, gameMode, game.isSplit]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`
        min-h-screen text-white flex flex-col transition-all duration-500
        ${gameMode === 'betting' ? "bg-[url('/blackjack.jpg')]" : 
          gameMode === 'playing' || gameMode === 'gameOver' ? 'bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900' : ''}
      `}>
        {/* Background Pattern for Game Mode */}
        {(gameMode === 'playing' || gameMode === 'gameOver') && (
          <div className="absolute inset-0 opacity-10 ">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #22c55e 0%, transparent 50%),
                                radial-gradient(circle at 75% 75%, #16a34a 0%, transparent 50%)`
            }}></div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-2 border-white/20 relative z-10">
          <h1 className={`
            text-3xl font-bold drop-shadow-lg transition-colors duration-500
            ${gameMode === 'betting' ? 'text-yellow-400' : 'text-lime-400'}
          `}>
            {(gameMode === 'betting' ? '🎰 Backyard Blackjack' : '🎰 Backyard Blackjack')}
          </h1>
          <div className="bg-black/30 px-4 py-2 rounded-full text-sm flex backdrop-blur-md items-center gap-4">
            <span>Pitt Panthers: <span className="font-semibold">{gameState.player || 'Anonymous'}</span></span>
            <span className={`px-3 py-1 rounded-full text-xs backdrop-blur-md font-bold ${isAuthenticated ? 'bg-green-400/20 text-green-300' : 'bg-yellow-400/20'}`}>
              Balance: ${gameState.bankroll.toLocaleString()}
              {isAuthenticated && <span className="ml-1">🔐</span>}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8 relative z-10">
          {/* BETTING MODE */}
          {gameMode === 'betting' && (
            <>
              {/* Bankroll Display */}
              <div className="text-center px-4 py-2 rounded-full bg-black/30 backdrop-blur-md">
                <h3 className="text-2xl font-bold text-yellow-400 drop-shadow-md ">
                  Balance: ${gameState.bankroll.toLocaleString()}
                </h3>
              </div>

              {/* Betting Zone */}
              <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-center space-y-6">
                <h3 className="text-xl font-semibold text-yellow-400">Place Your Bet</h3>
                
                {/* Bet Area with Chips */}
                <div className="min-h-[100px] flex justify-center items-end gap-2 relative">
                  {chips.map((amount, index) => (
                    <div
                      key={index}
                      className={`chip chip-${amount} animate-bounce-in relative z-10 cursor-pointer hover:scale-110 transition-transform group ${message.type === 'error' ? 'animate-shake' : ''}`}
                      style={{
                        animationDelay: `${index * 0.08}s`,
                        transform: `translateY(${index * -8}px) rotate(${index % 2 ? '-6deg' : '6deg'})`
                      }}
                      title={`$${amount} - Click to remove`}
                      onClick={() => removeChip(index)}
                    >
                      <div className="chip-stripes" aria-hidden />
                      <div className="chip-inner">
                        <div className="chip-value">${amount}</div>
                      </div>
                    </div>
                  ))}
                  {chips.length === 0 && (
                    <div className="text-gray-400 italic text-center py-8">
                      Click chip amounts below to place your bet
                    </div>
                  )}
                </div>

                {/* Current Bet */}
                <div className="bg-yellow-400/20 px-5 py-3 rounded-full font-bold text-lg">
                  Bet: ${gameState.bet.toLocaleString()}
                </div>

                {/* Chip Buttons */}
                <div className="flex gap-3 justify-center flex-wrap">
                  {[5, 10, 25, 50, 100].map((amount) => {
                    const disabled = gameState.bankroll < amount || (gameState.bet + amount > gameState.bankroll);
                    return (
                      <button
                        key={amount}
                        onClick={() => addChip(amount)}
                        disabled={disabled}
                        className={`chip chip-${amount} relative z-10 m-0 p-0 border-none cursor-pointer transition-transform duration-200
                          ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : 'hover:-translate-y-1 active:translate-y-0.5'}`}
                        title={disabled ? `Insufficient funds for $${amount}` : `Add $${amount}`}
                        aria-label={`Add $${amount} chip`}
                        type="button"
                      >
                        <div className="chip-stripes" aria-hidden />
                        <div className="chip-inner">
                          <div className="chip-value">${amount}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bet Management Buttons */}
                <div className="flex gap-3 justify-center">
                  <button
                    className={`
                      px-4 py-2 rounded-full border-none font-semibold text-sm cursor-pointer
                      transition-all duration-300 shadow-lg
                      ${chips.length === 0
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-105 hover:shadow-red-400/50'
                      }
                    `}
                    onClick={removeChip}
                    disabled={chips.length === 0}
                    title="Remove last chip"
                  >
                    Remove Chip
                  </button>

                  <button
                    className={`
                      px-4 py-2 rounded-full border-none font-semibold text-sm cursor-pointer
                      transition-all duration-300 shadow-lg
                      ${gameState.bet === 0
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:scale-105 hover:shadow-orange-400/50'
                      }
                    `}
                    onClick={clearBet}
                    disabled={gameState.bet === 0}
                    title="Clear all chips"
                  >
                    Clear Bet
                  </button>
                </div>

                {/* Start Game Button */}
                <button
                  className={`
                    w-full py-4 px-8 rounded-full border-none font-bold text-lg cursor-pointer
                    transition-all duration-300 shadow-xl
                    ${gameState.bet === 0
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 hover:scale-105 hover:shadow-yellow-400/50'
                    }
                  `}
                  onClick={startGame}
                  disabled={gameState.bet === 0}
                >
                  Deal Cards
                </button>
              </div>

              {/* House Rules */}
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl max-w-sm text-sm">
                <h4 className="text-yellow-400 font-semibold text-center mb-4 text-base">
                  House Rules
                </h4>
                <ul className="space-y-2 list-none">
                  <li className="relative pl-6 before:absolute before:left-0 before:text-yellow-400 before:content-['♦']">
                    Blackjack pays 3:2
                  </li>
                  <li className="relative pl-6 before:absolute before:left-0 before:text-yellow-400 before:content-['♦']">
                    Mountaineers stands on soft 17
                  </li>
                  <li className="relative pl-6 before:absolute before:left-0 before:text-yellow-400 before:content-['♦']">
                    Double down on any two cards
                  </li>
                  <li className="relative pl-6 before:absolute before:left-0 before:text-yellow-400 before:content-['♦']">
                    Split pairs up to 3 times
                  </li>
                </ul>
              </div>
            </> 
          )}

          {/* PLAYING MODE */}
          {(gameMode === 'playing' || gameMode === 'gameOver') && (
            <div className="w-full max-w-6xl space-y-8 ">
              {/* Deck */}
              <div 
                className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-24 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl border-2 border-gray-600 cursor-pointer hover:scale-105 transition-transform z-20"
                onClick={resetProgress}
                title="Click to reset game"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-black rounded-lg opacity-20 animate-pulse"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {game.deck.length}
                </div>
              </div>

              {/* Dealer Section */}
              <div className="w-full">
                <div className="text-center mb-4 space-y-2">
                  <h3 className="text-xl font-bold text-lime-400">West Virginia Mountaineers</h3>
                  <div className="text-lg font-semibold text-white/80">
                    Score: <span className="text-lime-400">{game.gameOver ? calculateHand(game.dealerHand || []) : getCardValue(game.dealerHand[0] || { value: '0' })}</span>
                  </div>
                </div>
                <div 
                  ref={dealerHandRef}
                  className="min-h-[120px] flex justify-center items-center bg-black/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/10 relative"
                >
                  {game.dealerHand.length === 0 ? (
                    <div className="text-gray-400 italic">Waiting for deal...</div>
                  ) : (
                    game.dealerHand.map((card, i) => (
                      <div
                        key={`d-${i}`}
                        className={`
                          card w-16 h-24 rounded-lg border-2 border-gray-600 mx-1
                          bg-white text-gray-800 flex items-center justify-center text-lg font-bold
                          shadow-lg relative overflow-hidden
                          ${i === 1 && !game.gameOver ? 'bg-gray-800 text-transparent before:content-["?"] before:absolute before:inset-0 before:flex before:items-center before:justify-center before:text-2xl before:font-bold before:text-gray-400' : ''}
                        `}
                        style={{ 
                          transform: `translateX(${i * 25}px)`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      >
                        {i !== 1 || game.gameOver ? `${card.value}${card.suit}` : ''}
                        <div className={`absolute inset-0 opacity-5 ${
                          card.suit === '♥' || card.suit === '♦' ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-black to-gray-800'
                        }`}></div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Game Message */}
              {message.text && (
                <div className={`
                  mx-auto px-6 py-4 rounded-lg text-center font-bold text-xl shadow-2xl max-w-2xl
                  ${message.type === 'error' 
                    ? 'bg-red-500/30 border border-red-500/50 text-red-200' 
                    : message.type === 'success'
                    ? 'bg-green-500/30 border border-green-500/50 text-green-200'
                    : 'bg-yellow-500/30 border border-yellow-500/50 text-yellow-200'
                  }
                `}>
                  {message.text}
                </div>
              )}

              {/* Player Section */}
              <div className="w-full">
                <div className="text-center mb-4 space-y-2">
                  <h3 className="text-xl font-bold text-lime-400">Pitt Panthers</h3>
                  {game.isSplit ? (
                    <div className="text-lg font-semibold text-white/80">
                      Playing Hand {game.currentHandIndex + 1} of {game.playerHands.length}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-white/80">
                      Score: <span className="text-lime-400">{calculateHand(game.playerHands[0]?.cards || [])}</span>
                    </div>
                  )}
                </div>

                {/* Multiple Hands Display */}
                <div className="space-y-4">
                  {game.playerHands.map((hand, handIndex) => (
                    <div
                      key={handIndex}
                      className={`
                        min-h-[120px] flex justify-center items-center bg-black/20 backdrop-blur-sm rounded-xl p-4 border-2 relative
                        ${handIndex === game.currentHandIndex && !game.gameOver ? 'border-lime-400' : 'border-white/10'}
                        ${hand.isFinished ? 'opacity-60' : ''}
                      `}
                    >
                      {/* Hand indicator */}
                      {game.isSplit && (
                        <div className="absolute top-2 left-2 bg-lime-400 text-black text-xs font-bold px-2 py-1 rounded">
                          Hand {handIndex + 1}
                          {hand.isDoubled && ' (Doubled)'}
                          {hand.result && ` - ${hand.result.toUpperCase()}`}
                        </div>
                      )}

                      {/* Score for this hand */}
                      <div className="absolute top-2 right-2 text-white text-sm font-semibold">
                        Score: <span className="text-lime-400">{calculateHand(hand.cards || [])}</span>
                        <br />
                        Bet: <span className="text-yellow-400">${hand.bet}</span>
                      </div>

                      {/* Cards */}
                      {hand.cards.length === 0 ? (
                        <div className="text-gray-400 italic">Place your bet to start!</div>
                      ) : (
                        hand.cards.map((card, i) => (
                          <div
                            key={`p-${handIndex}-${i}`}
                            className={`
                              card w-16 h-24 rounded-lg border-2 border-gray-600 mx-1
                              bg-white text-gray-800 flex items-center justify-center text-lg font-bold
                              shadow-lg relative overflow-hidden
                            `}
                            style={{
                              transform: `translateX(${i * 25}px)`,
                              animationDelay: `${i * 0.2}s`
                            }}
                          >
                            {card.value}{card.suit}
                            <div className={`absolute inset-0 opacity-5 ${
                              card.suit === '♥' || card.suit === '♦' ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-black to-gray-800'
                            }`}></div>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Bet Display */}
              <div className="bg-lime-400/20 px-6 py-3 rounded-full mx-6 text-center font-bold text-lg border-2 border-lime-400/30">
                {game.isSplit
                  ? `Total Bet: $${game.playerHands.reduce((sum, hand) => sum + hand.bet, 0).toLocaleString()}`
                  : `Current Bet: $${gameState.bet.toLocaleString()}`
                }
              </div>

              {/* Game Controls */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl mx-6 mb-6 flex flex-wrap gap-4 justify-center items-center">
                {(() => {
                  const currentHand = game.playerHands[game.currentHandIndex];
                  const canHit = !game.gameOver && currentHand && !currentHand.isFinished;
                  const canDouble = canHit && currentHand.cards.length === 2 && gameState.bankroll >= currentHand.bet;
                  const canSplit = canHit && currentHand.cards.length === 2 &&
                    currentHand.cards[0].value === currentHand.cards[1].value &&
                    gameState.bankroll >= currentHand.bet &&
                    game.playerHands.length < 4;

                  return (
                    <>
                      <button
                        className={`
                          px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                          shadow-lg min-w-[80px] ${!canHit
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:scale-105 hover:shadow-green-400/40'
                          }
                        `}
                        onClick={hit}
                        disabled={!canHit}
                      >
                        Hit
                      </button>

                      <button
                        className={`
                          px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                          shadow-lg min-w-[80px] ${!canHit
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-blue-400/40'
                          }
                        `}
                        onClick={stand}
                        disabled={!canHit}
                      >
                        Stand
                      </button>

                      <button
                        className={`
                          px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                          shadow-lg min-w-[80px] ${!canDouble
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:scale-105 hover:shadow-orange-400/40'
                          }
                        `}
                        onClick={doubleDown}
                        disabled={!canDouble}
                      >
                        Double
                      </button>

                      <button
                        className={`
                          px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                          shadow-lg min-w-[80px] ${!canSplit
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:scale-105 hover:shadow-purple-400/40'
                          }
                        `}
                        onClick={split}
                        disabled={!canSplit}
                      >
                        Split {game.playerHands.length < 4 ? '' : '(Max)'}
                      </button>
                    </>
                  );
                })()}
              </div>
            {/* End of PLAYING MODE content */}
            </div>
          )}  
        
        </div>


        {/* Footer */}
        <div className="border-t border-white/10 p-4 text-center">
          <button
            className={`
              bg-white/20 text-white border border-white/30 px-6 py-2 rounded-full 
              hover:bg-white/30 transition-all duration-300 font-medium
              ${gameMode === 'betting' ? 'px-6' : 'px-8'}
            `}
            onClick={gameMode === 'betting' ? resetProgress : resetForNewGame}
          >
            {gameMode === 'betting' ? 'Reset Progress' : 'New Game'}
          </button>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) translateY(20px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes card-deal {
          0% {
            transform: translateX(-100px) rotateY(90deg) scale(0.8);
            opacity: 0;
            z-index: 100;
          }
          100% {
            transform: translateX(var(--card-offset, 0px)) rotateY(0deg) scale(1);
            opacity: 1;
            z-index: 1;
          }
        }
        
        @keyframes reveal {
          0% {
            transform: rotateY(90deg);
            opacity: 0.5;
          }
          100% {
            transform: rotateY(0deg);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-card-deal {
          animation: card-deal 0.6s ease-out forwards;
          animation-delay: var(--card-delay, 0s);
        }
        
        .animate-reveal {
          animation: reveal 0.4s ease-out forwards;
        }
        
        .card {
          transition: all 0.3s ease;
        }
        
        .card:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.4) !important;
        }

        /* Realistic chip styles */
        .chip {
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #fff;
          box-shadow: 0 8px 22px rgba(0,0,0,0.45), inset 0 2px 6px rgba(255,255,255,0.06);
          transform-origin: center bottom;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .chip:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 12px 28px rgba(0,0,0,0.55);
        }

        .chip-inner {
          width: 70%;
          height: 70%;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .chip-stripes {
          position: absolute;
          inset: 6px;
          border-radius: 9999px;
          z-index: 1;
          background: repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 6px, transparent 6px 12px);
          mix-blend-mode: overlay;
          opacity: 0.25;
          pointer-events: none;
        }

        .chip-value {
          font-size: 12px;
          line-height: 1;
          text-shadow: 0 2px 6px rgba(0,0,0,0.45);
        }

        /* color variants */
        .chip-5 { background: linear-gradient(180deg,#f5f5f5,#d6d6d6); color:#111; }
        .chip-10 { background: linear-gradient(180deg,#ffd86b,#ffb84a); }
        .chip-25 { background: linear-gradient(180deg,#ff6b6b,#c43b3b); }
        .chip-50 { background: linear-gradient(180deg,#6bb6ff,#1e88e5); }
        .chip-100 { background: linear-gradient(180deg,#c78bff,#7a3cff); }

        /* thin outer ring for visual separation */
        .chip::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          box-shadow: inset 0 0 0 4px rgba(255,255,255,0.06);
          pointer-events: none;
        }

        /* small responsive adjustment for narrow screens */
        @media (max-width: 640px) {
          .chip { width:48px; height:48px; }
          .chip-inner { width:66%; height:66%; }
          .chip-value { font-size:11px; }
        }

        .card:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.4) !important;
        }
      `}</style>
    </>
  );
};

export default BlackjackTable;