'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Pocketbase from 'pocketbase';
import { getAllUsers } from '@/lib/userApi';
import { getUserRounds, testRoundsCollection, testCreateRound } from '@/lib/userApiSimple';

const pocketbase = new Pocketbase('https://e0871e346ffb.ngrok-free.app');

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
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleGetAllUsers = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await getAllUsers();
            if (result.success) {
                setUsers(users);
                setSuccess('Users fetched successfully!');
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

    const handleTestRoundsCollection = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await testRoundsCollection();
            if (result.success) {
                setSuccess('Rounds collection test passed!');
            } else {
                setError(`Rounds collection test failed: ${result.error}`);
            }
        } catch (err) {
            setError('Failed to test rounds collection');
            console.error('Exception:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTestCreateRound = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await testCreateRound();
            if (result.success) {
                setSuccess('Test round created successfully!');
            } else {
                setError(`Test round creation failed: ${result.error}`);
            }
        } catch (err) {
            setError('Failed to test round creation');
            console.error('Exception:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGetUserRounds = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const userId = pocketbase.authStore.record?.id;
            if (!userId) {
                setError('User not authenticated');
                return;
            }

            const result = await getUserRounds(userId);
            if (result.success) {
                setRounds(rounds || []);
                setSuccess(`Found ${result.rounds?.length || 0} rounds!`);
                console.log('Rounds fetched:', result.rounds);
            } else {
                setError(error);
                console.error('Error fetching rounds:', result.error);
            }
        } catch (err) {
            setError('Failed to fetch rounds');
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

                <Button
                    onClick={handleTestRoundsCollection}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Test Rounds Collection'}
                </Button>

                <Button
                    onClick={handleTestCreateRound}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Test Create Round'}
                </Button>

                <Button
                    onClick={handleGetUserRounds}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Get My Rounds'}
                </Button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error: {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    Success: {success}
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

            {rounds.length > 0 && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    <h3 className="font-semibold">Rounds Found ({rounds.length}):</h3>
                    <div className="mt-2 space-y-2">
                        {rounds.map((round: any) => (
                            <div key={round.id} className="bg-white p-3 rounded border">
                                <div className="text-sm">
                                    <strong>Round ID:</strong> {round.id}
                                </div>
                                <div className="text-sm">
                                    <strong>Started:</strong> {new Date(round.startedAt).toLocaleString()}
                                </div>
                                {round.endedAt && (
                                    <div className="text-sm">
                                        <strong>Ended:</strong> {new Date(round.endedAt).toLocaleString()}
                                    </div>
                                )}
                                <div className="text-sm">
                                    <strong>Seed:</strong> {round.seed}
                                </div>
                                {round.outcomes && Object.keys(round.outcomes).length > 0 && (
                                    <div className="text-sm mt-2">
                                        <strong>Outcomes:</strong>
                                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                                            {JSON.stringify(round.outcomes, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


export default Test;
