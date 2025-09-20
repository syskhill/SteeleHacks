'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, getUsersWithPagination } from '@/lib/userApi';

interface User {
  id: string;
  email: string;
  username?: string;
  created: string;
  updated: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getAllUsers();

      if (result.success) {
        setUsers(result.users);
        setTotalUsers(result.totalItems);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        <button
          onClick={fetchUsers}
          className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users ({totalUsers})</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-semibold text-lg">{user.username || user.email}</h3>
            <p className="text-gray-600 text-sm">{user.email}</p>
            <p className="text-gray-400 text-xs mt-2">
              Created: {new Date(user.created).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
}