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

interface Game {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  gameOver: boolean;
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
    playerHand: [],
    dealerHand: [],
    gameOver: false
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
    let score = 0;
    let aces = 0;
    for (const card of hand) {
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

  const clearBet = () => {
    setTimeout(() => {
      setChips([]);
      setGameState(prev => ({ ...prev, bet: 0 }));
      setMessage({ text: '', type: 'info' });
    }, 300);
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
    const playerHand = [newDeck.pop()!, newDeck.pop()!];
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
      playerHand,
      dealerHand,
      gameOver: false
    });

    setMessage({ text: '', type: 'info' });
  };

  const hit = async () => {
    if (game.gameOver || game.playerHand.length === 0) return;

    // Track the action before executing it
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'HIT' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...game.playerHand],
        playerScoreBefore: calculateHand(game.playerHand),
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
    const newPlayerHand = [...game.playerHand, drawn];
    setGame(prev => ({ ...prev, playerHand: newPlayerHand }));

    const playerScore = calculateHand(newPlayerHand);

    if (playerScore > 21) {
      endGame('Bust! You lose. 💸', -1, 'error');
    }
  };

  const stand = async () => {
    if (game.gameOver || game.playerHand.length === 0) return;

    // Track the stand action
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'STAND' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...game.playerHand],
        playerScoreBefore: calculateHand(game.playerHand),
        dealerUpCard: game.dealerHand[0]
      };

      setRoundActions(prev => [...prev, action]);

      try {
        await addActionToRound(currentRoundId, action);
      } catch (error) {
        console.error('Failed to track action:', error);
      }
    }

    // Reveal dealer hidden card (UI uses game.gameOver flag to reveal)
    setGame(prev => ({ ...prev, gameOver: true }));

    animationRef.current = setTimeout(() => {
      // Work with local copies so we can update state incrementally and compute score correctly
      let dealerHand = [...game.dealerHand];
      let deckCopy = [...game.deck];
      let dealerScore = calculateHand(dealerHand);

      while (dealerScore < 17 && deckCopy.length > 0) {
        const drawn = deckCopy.pop()!;
        dealerHand = [...dealerHand, drawn];
        dealerScore = calculateHand(dealerHand);
        // persist incremental changes to React state so UI updates as dealer draws
        setGame(prev => ({ ...prev, dealerHand, deck: deckCopy }));
        // optional small delay between cards could be added with chained timeouts for animation
      }

      const playerScore = calculateHand(game.playerHand);
      let result = 0;

      if (dealerScore > 21 || playerScore > dealerScore) result = 1;
      else if (playerScore < dealerScore) result = -1;
      else result = 0;

      const msg = result > 0
        ? 'Panthers Win! 🎉'
        : result < 0
        ? 'Mountaineers Win! Couches are burning! 😤'
        : 'Push! 🤝';

      endGame(msg, result, result > 0 ? 'success' : result < 0 ? 'error' : 'info');
    }, 800);
  };

  const doubleDown = async () => {
    // Check if user has enough balance to double the bet
    if (gameState.bankroll < gameState.bet) {
      showMessage('Insufficient funds to double down!', 'error');
      return;
    }

    if (game.playerHand.length !== 2) {
      showMessage('Can only double down on first two cards!', 'error');
      return;
    }

    // Track the double down action
    if (isAuthenticated && userId && currentRoundId) {
      const action = {
        action: 'DOUBLE' as const,
        timestamp: new Date().toISOString(),
        playerHandBefore: [...game.playerHand],
        playerScoreBefore: calculateHand(game.playerHand),
        dealerUpCard: game.dealerHand[0]
      };

      setRoundActions(prev => [...prev, action]);

      try {
        await addActionToRound(currentRoundId, action);
      } catch (error) {
        console.error('Failed to track action:', error);
      }
    }

    // Subtract additional bet amount from bankroll
    setGameState(prev => ({
      ...prev,
      bankroll: prev.bankroll - prev.bet,
      bet: prev.bet * 2
    }));

    hit();
    setTimeout(() => stand(), 1000);
  };

  const split = () => {
    if (game.playerHand.length !== 2 || game.playerHand[0].value !== game.playerHand[1].value) {
      showMessage('Can only split pairs!', 'error');
      return;
    }
    
    showMessage('Split feature coming soon! 👈', 'info');
    setTimeout(() => setMessage({ text: '', type: 'info' }), 2000);
  };

  const endGame = async (text: string, result: number, type: 'error' | 'success' | 'info') => {
    setMessage({ text, type });

    const playerScore = calculateHand(game.playerHand);
    const dealerScore = calculateHand(game.dealerHand);
    const isBlackjack = game.playerHand.length === 2 && playerScore === 21;

    // Calculate payout
    let payout = 0;
    let resultString: 'win' | 'lose' | 'push' = 'lose';

    if (result === 1) {
      resultString = 'win';
      payout = isBlackjack ? gameState.bet * 1.5 : gameState.bet;
      setGameState(prev => ({
        ...prev,
        bankroll: prev.bankroll + gameState.bet + payout
      }));
    } else if (result === 0) {
      resultString = 'push';
      payout = 0;
      setGameState(prev => ({
        ...prev,
        bankroll: prev.bankroll + prev.bet
      }));
    }
    // Loss: bet already deducted, payout = 0

    // Update round outcomes if authenticated and round exists
    if (isAuthenticated && userId && currentRoundId) {
      try {
        const roundData = {
          playerHand: game.playerHand,
          dealerHand: game.dealerHand,
          playerScore: playerScore,
          dealerScore: dealerScore,
          betAmount: gameState.bet,
          result: resultString,
          payout: payout,
          isBlackjack: isBlackjack
        };

        await updateRoundOutcomes(currentRoundId, roundData, roundActions);
        console.log('Round outcomes updated:', roundData);
        console.log('Round actions tracked:', roundActions);
      } catch (error) {
        console.error('Failed to update round outcomes:', error);
      }
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
  };

  const resetForNewGame = () => {
    resetHands();
    setGameMode('betting');
    clearBet(); // Reset bet for new round
    setCurrentRoundId(''); // Clear current round
    setRoundActions([]); // Clear actions for new round
  };

  const resetHands = () => {
    if (playerHandRef.current) playerHandRef.current.innerHTML = '';
    if (dealerHandRef.current) dealerHandRef.current.innerHTML = '';
    
    setGame({
      deck: [],
      playerHand: [],
      dealerHand: [],
      gameOver: false
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

  // Check for blackjack on initial deal
  useEffect(() => {
    if (game.playerHand.length === 2 && gameMode === 'playing') {
      const playerScore = calculateHand(game.playerHand);
      if (playerScore === 21) {
        setTimeout(() => {
          endGame('Blackjack! You win! 🤑', 1, 'success');
        }, 1000);
      }
    }
  }, [game.playerHand.length, gameMode]);

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
                      className={`chip chip-${amount} animate-bounce-in relative z-10 ${message.type === 'error' ? 'animate-shake' : ''}`}
                      style={{
                        animationDelay: `${index * 0.08}s`,
                        transform: `translateY(${index * -8}px) rotate(${index % 2 ? '-6deg' : '6deg'})`
                      }}
                      title={`$${amount}`}
                    >
                      <div className="chip-stripes" aria-hidden />
                      <div className="chip-inner">
                        <div className="chip-value">${amount}</div>
                      </div>
                    </div>
                  ))}
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
                    Score: <span className="text-lime-400">{game.gameOver ? calculateHand(game.dealerHand) : getCardValue(game.dealerHand[0] || { value: '0' })}</span>
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
                  <div className="text-lg font-semibold text-white/80">
                    Score: <span className="text-lime-400">{calculateHand(game.playerHand)}</span>
                  </div>
                </div>
                <div 
                  ref={playerHandRef}
                  className="min-h-[120px] flex justify-center items-center bg-black/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/10 relative"
                >
                  {game.playerHand.length === 0 ? (
                    <div className="text-gray-400 italic">Place your bet to start!</div>
                  ) : (
                    game.playerHand.map((card, i) => (
                      <div
                        key={`p-${i}`}
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
              </div>

              {/* Current Bet Display */}
              <div className="bg-lime-400/20 px-6 py-3 rounded-full mx-6 text-center font-bold text-lg border-2 border-lime-400/30">
                Current Bet: ${gameState.bet.toLocaleString()}
              </div>

              {/* Game Controls */}
              <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl mx-6 mb-6 flex flex-wrap gap-4 justify-center items-center">
                <button
                  className={`
                    px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                    shadow-lg min-w-[80px] ${game.gameOver || game.playerHand.length === 0 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:scale-105 hover:shadow-green-400/40'
                    }
                  `}
                  onClick={hit}
                  disabled={game.gameOver || game.playerHand.length === 0}
                >
                  Hit
                </button>
                
                <button
                  className={`
                    px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                    shadow-lg min-w-[80px] ${game.gameOver || game.playerHand.length === 0 
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 hover:shadow-blue-400/40'
                    }
                  `}
                  onClick={stand}
                  disabled={game.gameOver || game.playerHand.length === 0}
                >
                  Stand
                </button>
                
                <button
                  className={`
                    px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                    shadow-lg min-w-[80px] ${gameState.bankroll < gameState.bet || game.playerHand.length !== 2
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:scale-105 hover:shadow-orange-400/40'
                    }
                  `}
                  onClick={doubleDown}
                  disabled={gameState.bankroll < gameState.bet || game.playerHand.length !== 2}
                >
                  Double
                </button>
                
                <button
                  className={`
                    px-6 py-3 rounded-full font-bold text-base transition-all duration-300
                    shadow-lg min-w-[80px] ${game.playerHand.length !== 2 || !game.playerHand[0] || !game.playerHand[1] || game.playerHand[0].value !== game.playerHand[1].value
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:scale-105 hover:shadow-purple-400/40'
                    }
                  `}
                  onClick={split}
                  disabled={game.playerHand.length !== 2 || !game.playerHand[0] || !game.playerHand[1] || game.playerHand[0].value !== game.playerHand[1].value}
                >
                  Split
                </button>
              </div>
            {/* End of PLAYING MODE content */}
            </div>
          )}  
        
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`
            mx-auto px-6 py-4 rounded-lg text-center font-medium max-w-md mb-8
            ${message.type === 'error' 
              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
              : message.type === 'success'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            }
          `}>
            {message.text}
          </div>
        )}

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