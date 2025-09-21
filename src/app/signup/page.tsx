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
                email: formData.email,
                password: formData.password,
                passwordConfirm: formData.passwordConfirm,
                username: formData.name,
                chips: 1000,
            };

            console.log('Creating user with data:', { ...data, password: '[HIDDEN]', passwordConfirm: '[HIDDEN]' });

            // Create user in auth collection
            const record = await pb.collection('users').create(data);

            console.log('User created successfully:', record);

            // Auto login after successful signup
            const authData = await pb.collection('users').authWithPassword(formData.email, formData.password);

            console.log('Login successful:', authData);

            router.push('/');
        } catch (error: any) {
            console.error('Signup error:', error);
            if (error.response?.data) {
                console.error('Error details:', error.response.data);
            }
            setError(error.message || 'Something went wrong during signup');
        }
    };

    return (
        <div className="min-h-screen bg-[url('/wood.jpg')] text-white flex flex-col justify-center items-center">
            <header className=' text-5xl m-5 font-semibold'>Backyard Blackjack</header>
            <Card className=" w-full max-w-sm">
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