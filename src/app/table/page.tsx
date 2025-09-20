'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Type definitions
interface GameState {
  player: string;
  bankroll: number;
  bet: number;
}

const TablePage: React.FC = () => {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    player: '',
    bankroll: 1000,
    bet: 0
  });
  const [chips, setChips] = useState<number[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | '' }>({
    text: '',
    type: ''
  });

  // Load state from localStorage on mount (no auth gating)
  useEffect(() => {
    const storedState = localStorage.getItem('blackjackState');
    if (storedState) {
      const parsedState = JSON.parse(storedState) as GameState;
      setGameState(parsedState);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('blackjackState', JSON.stringify(gameState));
  }, [gameState]);

  const addChip = (amount: number) => {
    if (gameState.bankroll < amount) {
      showMessage('Insufficient funds!', 'error');
      return;
    }
    
    if (gameState.bet >= gameState.bankroll * 0.5) {
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
      setMessage({ text: '', type: '' });
    }, 300);
  };

  const startGame = () => {
    if (gameState.bet === 0) {
      showMessage('Place a bet first!', 'error');
      return;
    }
    
    router.push('/game');
  };

  // Replace logout/login flow with a simple reset action
  const resetProgress = () => {
    localStorage.removeItem('blackjackState');
    setChips([]);
    setGameState({ player: '', bankroll: 1000, bet: 0 });
    showMessage('Progress reset', 'success');
  };

  const showMessage = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-2 border-white/20">
          <h1 className="text-3xl font-bold text-yellow-400 drop-shadow-lg">
            🎰 Blackjack Table
          </h1>
          <div className="bg-black/30 px-4 py-2 rounded-full text-sm">
            Player: <span className="font-semibold">{gameState.player}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
          {/* Bankroll Display */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-yellow-400 drop-shadow-md">
              Bankroll: ${gameState.bankroll.toLocaleString()}
            </h3>
          </div>

          {/* Betting Zone */}
          <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-center space-y-6">
            <h3 className="text-xl font-semibold text-yellow-400">Place a Bet</h3>
            
            {/* Bet Area with Chips */}
            <div className="min-h-[100px] flex justify-center items-end gap-2 relative">
              {chips.map((amount, index) => (
                <div
                  key={index}
                  className={`
                    w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300
                    flex items-center justify-center text-xs font-bold text-blue-900
                    shadow-lg animate-bounce-in relative -mb-6 z-10
                    ${message.type === 'error' ? 'animate-shake' : ''}
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  ${amount}
                </div>
              ))}
            </div>

            {/* Current Bet */}
            <div className="bg-yellow-400/20 px-5 py-3 rounded-full font-bold text-lg">
              Bet: ${gameState.bet.toLocaleString()}
            </div>

            {/* Chip Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                className={`
                  w-16 h-16 rounded-full border-none font-bold text-base cursor-pointer
                  transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-300
                  text-blue-900 shadow-lg hover:scale-110 hover:shadow-yellow-400/40
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  ${gameState.bet >= gameState.bankroll * 0.5 ? 'disabled:opacity-50' : ''}
                `}
                onClick={() => addChip(10)}
                disabled={gameState.bet >= gameState.bankroll * 0.5}
              >
                $10
              </button>
              
              <button
                className={`
                  w-16 h-16 rounded-full border-none font-bold text-base cursor-pointer
                  transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-300
                  text-blue-900 shadow-lg hover:scale-110 hover:shadow-yellow-400/40
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  ${gameState.bet >= gameState.bankroll * 0.5 ? 'disabled:opacity-50' : ''}
                `}
                onClick={() => addChip(50)}
                disabled={gameState.bet >= gameState.bankroll * 0.5}
              >
                $50
              </button>
              
              <button
                className={`
                  w-16 h-16 rounded-full border-none font-bold text-base cursor-pointer
                  transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-300
                  text-blue-900 shadow-lg hover:scale-110 hover:shadow-yellow-400/40
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  ${gameState.bet >= gameState.bankroll * 0.5 ? 'disabled:opacity-50' : ''}
                `}
                onClick={() => addChip(100)}
                disabled={gameState.bet >= gameState.bankroll * 0.5}
              >
                $100
              </button>
              
              <button
                className={`
                  w-16 h-16 rounded-full border-none font-bold text-base cursor-pointer
                  transition-all duration-300 bg-gradient-to-r from-red-500 to-red-400
                  text-white shadow-lg hover:scale-110 hover:shadow-red-400/40
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  ${chips.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={clearBet}
                disabled={chips.length === 0}
              >
                Clear
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
              Start Game
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
                Dealer stands on soft 17
              </li>
              <li className="relative pl-6 before:absolute before:left-0 before:text-yellow-400 before:content-['♦']">
                Double down on any two cards
              </li>
              <li className="relative pl-6 before:absolute before:left-0 before:text-yellow-400 before:content-['♦']">
                Split pairs up to 3 times
              </li>
            </ul>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`
            mx-auto px-6 py-4 rounded-lg text-center font-medium max-w-md mb-8
            ${message.type === 'error' 
              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
              : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }
          `}>
            {message.text}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 p-4 text-center">
          <button
            className={`bg-white/20 text-white border border-white/30 px-6 py-2 rounded-full hover:bg-white/30 transition-all duration-300 font-medium`}
            onClick={resetProgress}
          >
            Reset
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
        
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default TablePage;