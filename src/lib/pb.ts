import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL || 'http://0.0.0.0:8090');

export default pb;
