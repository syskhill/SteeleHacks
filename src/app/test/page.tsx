'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Pocketbase from 'pocketbase';
import { getAllUsers } from '@/lib/userApi';

const pocketbase = new Pocketbase('http://localhost:8090');

async function test() {
    const userID = pocketbase.authStore.record?.id;
    if (!userID) {
        console.error('User is not authenticated');
        return;
    }

    if (userID) {
        await pocketbase.collection('users').getOne(userID);
    }
}

async function checkLogin() {
    if (pocketbase.authStore.isValid) {
        console.log('User is logged in:', pocketbase.authStore.record);
    }
    else {
        console.log('No user is logged in');
    }
}

const Test = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGetAllUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getAllUsers();
            if (result.success) {
                setUsers(users);
                console.log('Users fetched:', result.users);
            } else {
                setError(error);
                console.error('Error fetching users:', result.error);
            }
        } catch (err) {
            setError('Failed to fetch users');
            console.error('Exception:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Test Page</h1>

            <div className="space-y-2">
                <Button
                    onClick={async () => {
                        await test();
                    }}
                >
                    Original Test
                </Button>

                <Button
                    onClick={handleGetAllUsers}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Get All Users'}
                </Button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error: {error}
                </div>
            )}

            {users.length > 0 && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <h3 className="font-semibold">Users Found ({users.length}):</h3>
                    <ul className="list-disc list-inside mt-2">
                        {users.map((user: any) => (
                            <li key={user.id}>
                                {user.email} - {user.username || 'No username'} (ID: {user.id})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export default Test;
