'use client';

import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Check, X } from 'lucide-react';

export default function SettingsPage() {
  // User info state
  const [userInfo] = useState({
    email: 'player@example.com',
    joinDate: '2024-01-15',
    gamesPlayed: 147,
    winRate: 68.2
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handlePasswordChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordChangeStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordChangeStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    
    // Simulate password change
    setTimeout(() => {
      setPasswordChangeStatus({ type: 'success', message: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordChangeStatus(null), 3000);
    }, 1000);
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-900 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <User className="text-yellow-400 mr-3" size={24} />
              <h2 className="text-xl font-semibold text-white">Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-green-200 text-sm font-medium mb-1">Email</label>
                <div className="bg-white/5 rounded-lg p-3 text-white">{userInfo.email}</div>
              </div>
              
              <div>
                <label className="block text-green-200 text-sm font-medium mb-1">Member Since</label>
                <div className="bg-white/5 rounded-lg p-3 text-white">{new Date(userInfo.joinDate).toLocaleDateString()}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-1">Games Played</label>
                  <div className="bg-white/5 rounded-lg p-3 text-white font-semibold">{userInfo.gamesPlayed}</div>
                </div>
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-1">Win Rate</label>
                  <div className="bg-white/5 rounded-lg p-3 text-white font-semibold">{userInfo.winRate}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Lock className="text-yellow-400 mr-3" size={24} />
              <h2 className="text-xl font-semibold text-white">Change Password</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-green-200 text-sm font-medium mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('current')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-green-200 text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('new')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-green-200 text-sm font-medium mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent pr-10"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('confirm')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {passwordChangeStatus && (
                <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                  passwordChangeStatus.type === 'success' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {passwordChangeStatus.type === 'success' ? (
                    <Check size={18} />
                  ) : (
                    <X size={18} />
                  )}
                  <span>{passwordChangeStatus.message}</span>
                </div>
              )}
              
              <button
                onClick={handlePasswordChange}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 text-center">
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}