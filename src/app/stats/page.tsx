'use client';

import React, { useState, useEffect } from 'react';
import { pb } from '../../lib/auth';
import { getUserStatistics, GameStatistics, HandAnalysisResult, formatCurrency, formatPercentage } from '../../lib/statistics';
import { Card } from '../../lib/blackjackStrategy';

// Simple progress bar component
const ProgressBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({ value, max, color, label }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
    </div>
  );
};

// Bar chart component - shows proportional percentages that add up to 100%
const BarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        const minWidth = item.value > 0 ? Math.max(percentage, 8) : 0; // Minimum 8% width if value > 0

        return (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-right mr-3 text-gray-300 font-semibold">{item.label}</div>
            <div className="flex-1 bg-gray-700 rounded h-8 relative overflow-hidden">
              <div
                className={`h-8 rounded flex items-center justify-between px-2 transition-all duration-500 ${item.color}`}
                style={{ width: `${minWidth}%` }}
              >
                <span className="text-xs font-bold text-white drop-shadow-md">{item.value}</span>
                {percentage > 20 && (
                  <span className="text-xs text-white font-semibold drop-shadow-md">
                    {percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              {percentage <= 20 && item.value > 0 && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-300 font-semibold">
                  {percentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Card display component
const CardDisplay: React.FC<{ card: Card }> = ({ card }) => {
  // Handle malformed card data
  if (!card || typeof card !== 'object' || !card.value || !card.suit) {
    return (
      <div className="inline-block w-8 h-12 bg-gray-300 text-gray-600 text-xs font-bold rounded border border-gray-400 flex items-center justify-center flex-shrink-0">
        ?
      </div>
    );
  }

  return (
    <div className={`inline-block w-8 h-12 bg-white text-black text-xs font-bold rounded border border-gray-300 flex items-center justify-center flex-shrink-0 ${
      card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
    }`}>
      {card.value}{card.suit}
    </div>
  );
};

// Hand analysis table component
const HandAnalysisTable: React.FC<{ analyses: HandAnalysisResult[] }> = ({ analyses }) => {
  const [showAll, setShowAll] = useState(false);
  const displayAnalyses = showAll ? analyses : analyses.slice(0, 10);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4 text-yellow-400">Hand Analysis</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Your Hand</th>
              <th className="p-2 text-left">Dealer Up</th>
              <th className="p-2 text-left">Dealer Final</th>
              <th className="p-2 text-left">Optimal</th>
              <th className="p-2 text-left">Your Play</th>
              <th className="p-2 text-left">Result</th>
              <th className="p-2 text-left">Analysis</th>
            </tr>
          </thead>
          <tbody>
            {displayAnalyses.map((analysis, index) => (
              <tr key={analysis.roundId} className={index % 2 === 0 ? 'bg-gray-750' : 'bg-gray-800'}>
                <td className="p-2">
                  {new Date(analysis.date).toLocaleDateString()}
                </td>
                <td className="p-2">
                  {analysis.playerHand.map((card, i) => (
                    <CardDisplay key={i} card={card} />
                  ))}
                </td>
                <td className="p-2">
                  <CardDisplay card={analysis.dealerUpCard} />
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-1 min-w-fit">
                    {analysis.dealerFinalHand ? (
                      analysis.dealerFinalHand.map((card, i) => (
                        <CardDisplay key={i} card={card} />
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    {analysis.optimalAction}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    analysis.wasOptimal
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {analysis.actualAction}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    analysis.finalResult === 'win'
                      ? 'bg-green-600 text-white'
                      : analysis.finalResult === 'lose'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}>
                    {analysis.finalResult.toUpperCase()}
                  </span>
                </td>
                <td className="p-2 max-w-xs">
                  <div className="text-xs">{analysis.explanation}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {analyses.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${analyses.length} Hands`}
        </button>
      )}
    </div>
  );
};

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<GameStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const authValid = pb.authStore.isValid;
      const userId = pb.authStore.record?.id;

      setIsAuthenticated(authValid);

      if (!authValid || !userId) {
        setError('Please log in to view your statistics');
        setLoading(false);
        return;
      }

      try {
        const result = await getUserStatistics(userId);
        if (result.success && result.stats) {
          setStats(result.stats);
        } else {
          setError(result.error || 'Failed to load statistics');
        }
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const refreshStats = async () => {
    setLoading(true);
    setError('');

    const userId = pb.authStore.record?.id;
    if (!userId) {
      setError('Please log in to view your statistics');
      setLoading(false);
      return;
    }

    try {
      const result = await getUserStatistics(userId);
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        setError(result.error || 'Failed to load statistics');
      }
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-800 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-yellow-400">Blackjack Stats</h1>
          <p className="text-lg mb-6">Please log in to view your game statistics and performance analysis.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-800 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-yellow-400">Blackjack Stats</h1>
          <p className="text-lg mb-6 text-red-300">{error}</p>
          <button
            onClick={refreshStats}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div className="min-h-screen bg-blue-800 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-yellow-400">Blackjack Stats</h1>
          <p className="text-lg mb-6">No games played yet. Start playing to see your statistics!</p>
          <button
            onClick={() => window.location.href = '/table'}
            className="px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors mr-4"
          >
            Play Now
          </button>
          <button
            onClick={refreshStats}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">Blackjack Performance Analysis</h1>
          <p className="text-lg text-blue-200">Detailed statistics and strategy analysis for {pb.authStore.record?.email || 'your'} gameplay</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-950 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Games Played</h3>
            <p className="text-3xl font-bold">{stats.totalGames}</p>
          </div>
          <div className="bg-blue-950 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Win Rate</h3>
            <p className="text-3xl font-bold text-green-400">{formatPercentage(stats.winRate)}</p>
          </div>
          <div className="bg-blue-950 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Net Profit</h3>
            <p className={`text-3xl font-bold ${
              stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(stats.netProfit)}
            </p>
          </div>
          <div className="bg-blue-950 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Strategy Accuracy</h3>
            <p className="text-3xl font-bold text-purple-400">{formatPercentage(stats.strategyAccuracy)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Game Results Chart */}
          <div className="bg-blue-950 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Game Results</h3>
            <BarChart data={[
              { label: 'Wins', value: stats.wins, color: 'bg-green-500' },
              { label: 'Losses', value: stats.losses, color: 'bg-red-500' },
              { label: 'Pushes', value: stats.pushes, color: 'bg-yellow-500' }
            ]} />
          </div>

          {/* Strategy Analysis Chart */}
          <div className="bg-blue-950 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Strategy Analysis</h3>
            <BarChart data={[
              { label: 'Optimal', value: stats.optimalDecisions, color: 'bg-green-500' },
              { label: 'Suboptimal', value: stats.suboptimalDecisions, color: 'bg-red-500' }
            ]} />
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Financial Stats */}
          <div className="bg-blue-950 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Wagered:</span>
                <span className="font-semibold">{formatCurrency(stats.totalWagered)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Payouts:</span>
                <span className="font-semibold">{formatCurrency(stats.totalPayout)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Bet:</span>
                <span className="font-semibold">{formatCurrency(stats.averageBet)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-3">
                <span className="font-bold">Net Result:</span>
                <span className={`font-bold ${
                  stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(stats.netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-blue-950 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Performance Metrics</h3>
            <ProgressBar
              value={stats.wins}
              max={stats.totalGames}
              color="bg-green-500"
              label="Win Rate"
            />
            <ProgressBar
              value={stats.optimalDecisions}
              max={stats.totalDecisions}
              color="bg-purple-500"
              label="Strategy Accuracy"
            />
            <ProgressBar
              value={stats.blackjacks}
              max={stats.totalGames}
              color="bg-yellow-500"
              label="Blackjack Rate"
            />
          </div>

          {/* Recent Performance */}
          <div className="bg-blue-950 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Recent Games</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.recentPerformance.slice(0, 10).map((game, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-gray-700">
                  <span className="text-sm">
                    {new Date(game.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      game.result === 'win'
                        ? 'bg-green-600 text-white'
                        : game.result === 'lose'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}>
                      {game.result.toUpperCase()}
                    </span>
                    <span className={`text-sm font-semibold ${
                      game.profit > 0 ? 'text-green-400' :
                      game.profit < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {game.profit > 0 ? '+' : ''}{formatCurrency(game.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hand Analysis Table */}
        {stats.handAnalyses.length > 0 && (
          <HandAnalysisTable analyses={stats.handAnalyses} />
        )}

        {/* Action Buttons */}
        <div className="text-center mt-8 space-x-4">
          <button
            onClick={refreshStats}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
          >
            Refresh Stats
          </button>
          <button
            onClick={() => window.location.href = '/table'}
            className="px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Play More Games
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;