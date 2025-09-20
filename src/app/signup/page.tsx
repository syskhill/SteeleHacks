"use client";

import React, { useState } from 'react';
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
import { pb } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const SignUp = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        name: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.passwordConfirm) {
            setError('Passwords do not match');
            return;
        }

        try {
            const data = {
                username: formData.name,
                email: formData.email,
                password: formData.password,
                passwordConfirm: formData.passwordConfirm,
                chips: 1000,
            };

            await pb.collection('users').create(data);

            // Auto login after successful signup
            await pb.collection('users').authWithPassword(formData.email, formData.password);

            router.push('/');
        } catch (error: any) {
            setError(error.message || 'Something went wrong');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center flex-col">
            <header className='text-5xl m-5 font-semibold'>Blackjack</header>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john.doe@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="passwordConfirm">Confirm Password</Label>
                                <Input
                                    id="passwordConfirm"
                                    type="password"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            {error && (
                                <div className="text-red-500 text-sm">{error}</div>
                            )}
                        </div>
                        <CardFooter className="flex-col gap-2 px-0 mt-6">
                            <Button type="submit" className="w-full">
                                Sign Up
                            </Button>
                            <Button
                                variant="link"
                                className="w-full"
                                onClick={() => router.push('/')}
                            >
                                Already have an account? Login
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignUp;