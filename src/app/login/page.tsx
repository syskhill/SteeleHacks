"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, logout, isAuthenticated, googleLogin } from '../../lib/auth';

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

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

    const handleGuestMode = () => {
        // Continue as guest - just redirect to table without authentication
        router.push('/table');
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            const result = await googleLogin();
            if (result.success) {
                setIsLoggedIn(true);
                console.log('Google login successful', result.user);
                router.push('/table'); // Redirect to table page after successful login
            } else {
                setError(result.error || 'Google login failed');
            }
        } catch (error) {
            console.error('Google login error:', error);
            setError('Google login failed');
        } finally {
            setGoogleLoading(false);
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
                                <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleGoogleLogin}
                                    disabled={loading || googleLoading}
                                >
                                    {googleLoading ? 'Connecting to Google...' : 'Login with Google'}
                                </Button>
                                <div className="flex items-center gap-2 w-full my-2">
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                    <span className="text-sm text-gray-500">or</span>
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleGuestMode}
                                    type="button"
                                    disabled={loading || googleLoading}
                                >
                                    Continue as Guest
                                </Button>
                                <Button
                                    variant="link"
                                    className="w-full"
                                    onClick={() => router.push('/signup')}
                                    type="button"
                                >
                                    Don't have an account? Sign up
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
