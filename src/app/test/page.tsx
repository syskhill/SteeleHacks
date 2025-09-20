'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Pocketbase from 'pocketbase';

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
    return (
        <div>
            Test Page
            <Button
                onClick={async () => {
                    await test();
                }}
            >Click Me</Button>
        </div>
    );
};


export default Test;
