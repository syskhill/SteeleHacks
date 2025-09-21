// Quick database debug script
const PocketBase = require('pocketbase/cjs');

async function debugDatabase() {
  const pb = new PocketBase('http://10.6.30.112:8090/_/');

  try {
    console.log('=== Database Debug ===');

    // Check what collections exist
    console.log('Available collections:');

    // Try to list all records from both potential collections
    try {
      console.log('\n--- Checking rounds collection ---');
      const rounds = await pb.collection('rounds').getList(1, 5);
      console.log('Rounds total:', rounds.totalItems);
      console.log('Sample rounds:', rounds.items.map(r => ({ id: r.id, userId: r.userId, created: r.created })));
    } catch (e) {
      console.log('Rounds collection error:', e.message);
    }

    try {
      console.log('\n--- Checking sources collection ---');
      const sources = await pb.collection('sources').getList(1, 5);
      console.log('Sources total:', sources.totalItems);
      console.log('Sample sources:', sources.items.map(r => ({ id: r.id, userId: r.userId, created: r.created })));
    } catch (e) {
      console.log('Sources collection error:', e.message);
    }

    // Check users collection for reference
    try {
      console.log('\n--- Checking users collection ---');
      const users = await pb.collection('users').getList(1, 3);
      console.log('Users total:', users.totalItems);
      console.log('Sample users:', users.items.map(u => ({ id: u.id, email: u.email })));
    } catch (e) {
      console.log('Users collection error:', e.message);
    }

  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugDatabase();