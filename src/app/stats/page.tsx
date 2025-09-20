'use client'; // Required for Next.js App Router to make this a Client Component

import React from 'react';

// Define the type for user stats
interface BlackjackStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  totalBets: number;
}

// Mock data (replace with database fetch later)
const mockStats: BlackjackStats = {
  gamesPlayed: 150,
  wins: 60,
  losses: 70,
  pushes: 20,
  winPercentage: 40, // (wins / gamesPlayed) * 100
  totalBets: 5000,
};

const StatsPage: React.FC = () => {
  // In the future, fetch stats from database here (e.g., using useEffect or server-side fetching)
  const stats = mockStats;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Blackjack Stats</h1>
      
      {/* Stats Card */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Your Game Statistics</h2>
        <div className="grid grid-cols-1 gap-4">
          {/* Stat Item */}
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

      {/* Optional: Add a button to refresh stats or navigate */}
      <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-lg font-semibold transition-colors">
        Refresh Stats
      </button>
    </div>
  );
};

export default StatsPage;