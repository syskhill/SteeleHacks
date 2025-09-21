'use client';

import Pocketbase from 'pocketbase';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import Image from 'next/image';


const Home = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const pocketbase = new Pocketbase('https://8cadc2ad641b.ngrok-free.app');

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated();
      setIsLoggedIn(auth);

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
      <header className="text-center p-10">
        <h1 className="text-4xl font-bold mb-4">Backyard Blackjack</h1>
        {isLoggedIn && username && (
          <p className="text-xl text-yellow-400 mb-4">Playing as: {username}</p>
        )}
        <p className="text-lg">Play the classic game of blackjack with your friends!</p>
      </header>
      <Image
        src="/cover.png" // Use the .png extension here
        alt="Blackjack Cover"
        width={700}
        height={300}
      />
      <main className="flex flex-col items-center space-y-6 mt-10">
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
                className="bg-black text-white px-6 py-2 rounded-lg text-xl w-full"
                onClick={() => router.push('/login')}
              >
                Login
              </button>
              <button
                className="bg-blue-950 text-white px-6 py-2 rounded-lg text-xl w-full"
                onClick={() => router.push('/signup')}
              >
                Sign Up
              </button>
              <div className="flex items-center gap-2 w-full my-2">
                <div className="flex-1 h-px bg-gray-400"></div>
                <span className="text-sm text-gray-300">or</span>
                <div className="flex-1 h-px bg-gray-400"></div>
              </div>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-xl w-full transition-colors"
                onClick={() => router.push('/table')}
              >
                Continue as Guest
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
