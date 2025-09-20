'use client';

import Pocketbase from 'pocketbase';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';

const Home = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const pocketbase = new Pocketbase('http://10.6.30.112:8090/_/');

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsLoggedIn(auth);

      // Get username if logged in
      if (auth && pocketbase.authStore.record) {
        setUsername(pocketbase.authStore.record.username);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    pocketbase.authStore.clear();
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <div className="min-h-screen bg-[url('/wood.jpg')] bg-cover bg-repeat text-white flex flex-col items-center">
      <header className="text-center pt-20 p-10">
        <h1 className="text-4xl font-bold mb-4">Backyard Blackjack</h1>
        {isLoggedIn && username && (
          <p className="text-xl text-yellow-400 mb-4">Playing as: {username}</p>
        )}
        <p className="text-lg">Play the classic game of blackjack with your friends!</p>
      </header>
      <main className="flex flex-col items-center space-y-6 mt-60">
        <button
          className="bg-yellow-500 text-black px-6 py-2 rounded-lg text-xl w-64"
          onClick={() => router.push('/table')}
        >
          Start Game
        </button>
        <div className="space-y-4 w-64">
          {isLoggedIn ? (
            <button
              className="bg-red-500 text-white px-6 py-2 rounded-lg text-xl w-full"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <>
              <button
                className="bg-green-500 text-white px-6 py-2 rounded-lg text-xl w-full"
                onClick={() => router.push('/login')}
              >
                Login
              </button>
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg text-xl w-full"
                onClick={() => router.push('/signup')}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 text-center p-4 bg-black">
        <p>Powered by WVU & PITT</p>
      </footer>
    </div>
  );
};

export default Home;
