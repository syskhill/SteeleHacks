"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, logout, isAuthenticated, guestLogin } from '../../lib/auth';

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                setIsLoggedIn(true);
                setEmail('');
                setPassword('');
                console.log('Logged in successfully', result.user);
                router.push('/table'); // Redirect to table page after successful login
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (error) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
    };

    const handleGuestMode = async () => {
        setError('');
        setLoading(true);

        try {
            const result = await guestLogin();
            if (result.success) {
                setIsLoggedIn(true);
                console.log('Guest login successful', result.user);
                router.push('/table');
            } else {
                setError(result.error || 'Guest login failed');
            }
        } catch (error) {
            console.error('Guest login error:', error);
            setError('Guest login failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[url('/wood.jpg')] text-white flex flex-col justify-center items-center">
            <header className='text-5xl m-5 font-semibold'>Backyard Blackjack</header>
            {isLoggedIn ? (
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Welcome!</CardTitle>
                        <CardDescription>You are logged in</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={handleLogout} className="w-full">
                            Logout
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Login to your account</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john.doe@example.com"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        <a
                                            href="#"
                                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="text-red-500 text-sm">{error}</div>
                                )}
                            </div>
                            <CardFooter className="flex-col gap-2 px-0 mt-6">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                                <div className="flex items-center gap-2 w-full my-2">
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                    <span className="text-sm text-gray-500">or</span>
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                </div>
<<<<<<< HEAD
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleGuestMode}
                                    type="button"
                                    disabled={loading}
                                >
                                    Continue as Guest
                                </Button>
                                <Button
                                    variant="link"
                                    className="w-full"
                                    onClick={() => router.push('/signup')}
                                    type="button"
                                >
                                    Don&apos;t have an account? Sign up
=======
                                <Button variant="outline" className="w-full" onClick={async () => {
                                    const result = await guestLogin();
                                    if (result.success) {
                                        router.push('/table');
                                    }
                                }}>
                                    Continue as Guest
>>>>>>> 463264e (rollback)
                                </Button>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Login;
