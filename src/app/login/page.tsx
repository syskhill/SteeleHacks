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
import { login, logout, isAuthenticated } from '../../lib/auth';

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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
    };

    const handleLogout = () => {
        logout();
        setIsLoggedIn(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center flex-col">
            <header className='text-5xl m-5 font-semibold'>Black Jack</header>
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
                        <CardAction>
                            <Button variant="link">Sign Up</Button>
                        </CardAction>
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
                            <CardFooter className="flex-col gap-2 px-0">
                                <Button type="submit" className="w-full">
                                    Login
                                </Button>
                                <Button variant="outline" className="w-full">
                                    Login with Google
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
