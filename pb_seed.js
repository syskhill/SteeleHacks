// pb_seed.js
// Run this script with: node pb_seed.js
// Make sure PocketBase is running and the admin API token is set in PB_ADMIN_TOKEN env var.

const fetch = require('node-fetch');

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_TOKEN = process.env.PB_ADMIN_TOKEN || '<YOUR_ADMIN_TOKEN_HERE>';

async function seed() {
  // 1. Create demo user
  const userRes = await fetch(`${PB_URL}/api/collections/users/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': PB_ADMIN_TOKEN
    },
    body: JSON.stringify({
      username: 'demo',
      chips: 1000
    })
  });
  const user = await userRes.json();
  console.log('Created user:', user.username, user.id);

  // 2. Create a demo round for the user
  const roundRes = await fetch(`${PB_URL}/api/collections/rounds/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': PB_ADMIN_TOKEN
    },
    body: JSON.stringify({
      userId: user.id,
      seed: 'demo-seed',
      startedAt: new Date().toISOString(),
      outcomes: { result: 'pending' }
    })
  });
  const round = await roundRes.json();
  console.log('Created round:', round.id);
}

seed().catch(console.error);
