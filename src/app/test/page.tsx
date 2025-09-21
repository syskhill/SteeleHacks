'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Pocketbase from 'pocketbase';
import { getAllUsers } from '@/lib/userApi';
import { getUserRounds, testRoundsCollection, testCreateRound } from '@/lib/userApiSimple';

<<<<<<< HEAD
<<<<<<< HEAD
const pocketbase = new Pocketbase('https://e0871e346ffb.ngrok-free.app');
=======
const pocketbase = new Pocketbase('https://f40022cbd7d9.ngrok-free.app/');
>>>>>>> 463264e (rollback)
=======
const pocketbase = new Pocketbase('https://ec7c12494f3f.ngrok-free.app/');
>>>>>>> f6d18eb (final commit)

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
                    onClick={async () => {
                        setLoading(true);
                        setError('');
                        setSuccess('');
                        try {
                            // Try to create a round directly
                            const userId = pocketbase.authStore.record?.id;
                            if (!userId) {
                                setError('User not authenticated');
                                return;
                            }

                            console.log('Testing direct round creation...');
                            const testData = {
                                userId: userId,
                                seed: 'test-' + Date.now(),
                                startedAt: new Date().toISOString(),
                                outcomes: {
                                    playerHand: [{ value: 'A', suit: '♠' }, { value: 'K', suit: '♥' }],
                                    dealerHand: [{ value: '10', suit: '♦' }, { value: '7', suit: '♣' }],
                                    playerScore: 21,
                                    dealerScore: 17,
                                    betAmount: 50,
                                    result: 'win',
                                    payout: 100,
                                    isBlackjack: true
                                }
                            };

                            const record = await pocketbase.collection('rounds').create(testData);
                            console.log('Direct round created:', record);
                            setSuccess(`Direct round created with ID: ${record.id}`);
                        } catch (err) {
                            console.error('Direct creation failed:', err);
                            setError(`Direct creation failed: ${err instanceof Error ? err.message : String(err)}`);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Test Direct Round Creation'}
                </Button>

                <Button
                    onClick={handleGetUserRounds}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Get My Rounds'}
                </Button>

                <Button
                    onClick={async () => {
                        setLoading(true);
                        setError('');
                        setSuccess('');
                        try {
                            const userId = pocketbase.authStore.record?.id;
                            if (!userId) {
                                setError('User not authenticated');
                                return;
                            }

                            console.log('=== TESTING EXACT QUERY LOGIC ===');
                            console.log('User ID:', userId);

                            // Test 1: Get all rounds
                            console.log('Test 1: Get all rounds...');
                            const allRounds = await pocketbase.collection('rounds').getList(1, 50, {
                                sort: '-created'
                            });
                            console.log('All rounds:', allRounds);

                            // Test 2: Get rounds with filter
                            console.log('Test 2: Get rounds with filter...');
                            const filteredRounds = await pocketbase.collection('rounds').getList(1, 50, {
                                sort: '-created',
                                filter: `userId = "${userId}"`
                            });
                            console.log('Filtered rounds:', filteredRounds);

                            // Test 3: Check userIds
                            if (allRounds.items.length > 0) {
                                console.log('UserIDs in database:');
                                allRounds.items.forEach((round, index) => {
                                    console.log(`Round ${index + 1}: ID=${round.id}, userId="${round.userId}", matches=${round.userId === userId}`);
                                });
                            }

                            setSuccess(`Found ${allRounds.totalItems} total rounds, ${filteredRounds.totalItems} for current user`);
                        } catch (err) {
                            console.error('Debug query failed:', err);
                            setError(`Debug query failed: ${err instanceof Error ? err.message : String(err)}`);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Debug Query Logic'}
                </Button>

                <Button
                    onClick={async () => {
                        setLoading(true);
                        setError('');
                        setSuccess('');
                        try {
                            // Test if it's a permissions issue by checking collection info
                            const collection = await pocketbase.collections.getOne('rounds');
                            console.log('Collection info:', collection);

                            // Test different approaches
                            const tests = [];

                            // Test 1: No filter (should always work if permissions allow)
                            try {
                                const allRounds = await pocketbase.collection('rounds').getFullList({
                                    sort: '-created'
                                });
                                tests.push(`✓ No filter: ${allRounds.length} rounds found`);
                            } catch (e) {
                                tests.push(`✗ No filter failed: ${e instanceof Error ? e.message : String(e)}`);
                            }

                            setSuccess(tests.join('\n'));
                        } catch (err) {
                            console.error('Collection test failed:', err);
                            setError(`Collection test failed: ${err instanceof Error ? err.message : String(err)}`);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="ml-2"
                >
                    {loading ? 'Loading...' : 'Test Collection Access'}
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
