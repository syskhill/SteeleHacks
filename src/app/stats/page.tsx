'use client';

import React from 'react';

interface BlackjackStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  totalBets: number;
}

const mockStats: BlackjackStats = {
  gamesPlayed: 150,
  wins: 60,
  losses: 70,
  pushes: 20,
  winPercentage: 40,
  totalBets: 5000,
};

const StatsPage: React.FC = () => {
  const stats = mockStats;

  return (
    <div className="min-h-screen bg-blue-800 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">Blackjack Stats</h1>
      
      {/* Stats Card */}
      <div className="bg-blue-950 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-400">Your Game Statistics</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-md">
            <span className="text-lg">Games Played</span>
            <span className="text-xl font-bold">{stats.gamesPlayed}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-md">
            <span className="text-lg">Wins</span>
            <span className="text-xl font-bold text-green-400">{stats.wins}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-md">
            <span className="text-lg">Losses</span>
            <span className="text-xl font-bold text-red-400">{stats.losses}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-md">
            <span className="text-lg">Pushes</span>
            <span className="text-xl font-bold text-yellow-400">{stats.pushes}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-md">
            <span className="text-lg">Win Percentage</span>
            <span className="text-xl font-bold">{stats.winPercentage}%</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-md">
            <span className="text-lg">Total Bets Placed</span>
            <span className="text-xl font-bold">${stats.totalBets}</span>
          </div>
        </div>
      </div>

      <button className="mt-6 px-6 py-2 bg-blue-700 hover:bg-blue-800 rounded-md text-lg font-semibold transition-colors">
        Refresh Stats
      </button>
    </div>
  );
};

export default StatsPage;