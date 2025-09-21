import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL || 'http://localhost:8090');

export default pb;