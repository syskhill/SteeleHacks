"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, logout, isAuthenticated, pb, getGuestUser, isGuestUser, guestLogin } from '../../lib/auth';
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

const Settings: React.FC = () => {
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });

    // Login form state
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });

    // Password change form state
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        password: '',
        passwordConfirm: ''
    });

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        const authValid = pb.authStore.isValid;
        const guestUser = getGuestUser();

        setAuthenticated(authValid || !!guestUser);
        setIsGuest(!!guestUser && !authValid);

        if (authValid && pb.authStore.record) {
            setUserEmail(pb.authStore.record.email || '');
        } else if (guestUser) {
            setUserEmail('Anonymous');
        }

        setLoading(false);
    };

    const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: 'info' }), 5000);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await login(loginForm.email, loginForm.password);
            if (result.success) {
                setAuthenticated(true);
                setUserEmail(loginForm.email);
                setLoginForm({ email: '', password: '' });
                showMessage('Login successful!', 'success');
            } else {
                showMessage(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            showMessage('Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);

        try {
            const result = await guestLogin();
            if (result.success) {
                setAuthenticated(true);
                setIsGuest(true);
                setUserEmail('Anonymous');
                showMessage('Now playing as guest!', 'success');
            } else {
                showMessage(result.error || 'Guest login failed', 'error');
            }
        } catch (error) {
            console.error('Guest login error:', error);
            showMessage('Guest login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setAuthenticated(false);
            setIsGuest(false);
            setUserEmail('');
            showMessage('Logged out successfully', 'success');
        } catch (error) {
            showMessage('Logout failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.password !== passwordForm.passwordConfirm) {
            showMessage('New passwords do not match', 'error');
            return;
        }

        if (passwordForm.password.length < 8) {
            showMessage('Password must be at least 8 characters long', 'error');
            return;
        }

        setLoading(true);

        try {
            const userId = pb.authStore.record?.id;
            if (!userId) {
                showMessage('User not authenticated', 'error');
                return;
            }

            // Update password
            await pb.collection('users').update(userId, {
                oldPassword: passwordForm.oldPassword,
                password: passwordForm.password,
                passwordConfirm: passwordForm.passwordConfirm,
            });

            setPasswordForm({ oldPassword: '', password: '', passwordConfirm: '' });
            showMessage('Password changed successfully!', 'success');
        } catch (error: any) {
            console.error('Password change error:', error);
            showMessage(error.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (form: 'login' | 'password', field: string, value: string) => {
        if (form === 'login') {
            setLoginForm(prev => ({ ...prev, [field]: value }));
        } else {
            setPasswordForm(prev => ({ ...prev, [field]: value }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[url('/wood.jpg')] bg-cover bg-center bg-no-repeat bg-fixed text-white flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b-2 border-white/20">
                <button
                    onClick={() => router.push('/table')}
                    className="bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300"
                >
                    ← Back to Table
                </button>
                <h1 className="text-3xl font-bold drop-shadow-lg text-yellow-400">
                    ⚙️ Settings
                </h1>
                <div></div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
                {/* Message Display */}
                {message.text && (
                    <div className={`
                        px-6 py-4 rounded-lg text-center font-semibold max-w-md
                        ${message.type === 'error'
                            ? 'bg-red-500/30 border border-red-500/50 text-red-200'
                            : message.type === 'success'
                            ? 'bg-green-500/30 border border-green-500/50 text-green-200'
                            : 'bg-blue-500/30 border border-blue-500/50 text-blue-200'
                        }
                    `}>
                        {message.text}
                    </div>
                )}

                {!authenticated ? (
                    /* Login Section */
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Login to Your Account</CardTitle>
                            <CardDescription>
                                Access your account to save progress and view statistics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin}>
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={loginForm.email}
                                            onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={loginForm.password}
                                            onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                                            required
                                        />
                                    </div>
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
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleGuestLogin}
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
                                    </Button>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    /* Account Management Section */
                    <div className="w-full max-w-2xl space-y-6">
                        {/* Account Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                                <CardDescription>
                                    {isGuest ? 'You are playing as a guest' : 'You are currently logged in'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            {isGuest ? 'Playing as:' : 'Email:'}
                                        </span>
                                        <span className="font-semibold">{userEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            isGuest
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {isGuest ? 'Guest 👤' : 'Authenticated 🔐'}
                                        </span>
                                    </div>
                                    {isGuest && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">Guest Account</h4>
                                            <p className="text-sm text-blue-700">
                                                You're playing as a guest. Your progress is saved locally but won't sync across devices.
                                                Create an account to save your progress permanently.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? 'Logging out...' : (isGuest ? 'Exit Guest Mode' : 'Logout')}
                                </Button>
                                {isGuest && (
                                    <Button
                                        onClick={() => router.push('/signup')}
                                        className="flex-1"
                                    >
                                        Create Account
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>

                        {/* Change Password - Only for authenticated users */}
                        {!isGuest && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>
                                        Update your account password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePasswordChange}>
                                        <div className="flex flex-col gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="oldPassword">Current Password</Label>
                                                <Input
                                                    id="oldPassword"
                                                    type="password"
                                                    value={passwordForm.oldPassword}
                                                    onChange={(e) => handleInputChange('password', 'oldPassword', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="newPassword">New Password</Label>
                                                <Input
                                                    id="newPassword"
                                                    type="password"
                                                    value={passwordForm.password}
                                                    onChange={(e) => handleInputChange('password', 'password', e.target.value)}
                                                    required
                                                    minLength={8}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={passwordForm.passwordConfirm}
                                                    onChange={(e) => handleInputChange('password', 'passwordConfirm', e.target.value)}
                                                    required
                                                    minLength={8}
                                                />
                                            </div>
                                        </div>
                                        <CardFooter className="px-0 mt-6">
                                            <Button type="submit" className="w-full" disabled={loading}>
                                                {loading ? 'Changing Password...' : 'Change Password'}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;