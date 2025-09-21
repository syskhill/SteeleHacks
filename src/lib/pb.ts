import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL || 'https://1e3cb110514d.ngrok-free.app/');

export default pb;
