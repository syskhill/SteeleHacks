import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL || 'https://e0871e346ffb.ngrok-free.app');

export default pb;
