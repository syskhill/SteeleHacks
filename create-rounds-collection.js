// Script to create the rounds collection in PocketBase
// Run this with: node create-rounds-collection.js

// First, let's check if the rounds collection already exists
console.log('=== PocketBase Rounds Collection Setup ===\n');

console.log('1. Open your PocketBase admin interface at: http://localhost:8090/_/');
console.log('2. Log in to the admin panel');
console.log('3. Go to Collections');
console.log('4. If "rounds" collection exists, DELETE it first');
console.log('5. Click "New collection"');
console.log('6. Set collection name to: rounds');
console.log('7. Set collection type to: Base');
console.log('\n=== Schema Fields ===\n');

console.log('Add these fields one by one:\n');

console.log('Field 1: userId');
console.log('- Type: Relation');
console.log('- Required: Yes');
console.log('- Collection: users (select the users collection from dropdown)');
console.log('- Max select: 1');
console.log('');

console.log('Field 2: seed');
console.log('- Type: Text');
console.log('- Required: Yes');
console.log('');

console.log('Field 3: startedAt');
console.log('- Type: Date');
console.log('- Required: Yes');
console.log('');

console.log('Field 4: endedAt');
console.log('- Type: Date');
console.log('- Required: No');
console.log('');

console.log('Field 5: outcomes');
console.log('- Type: JSON');
console.log('- Required: No');
console.log('');

console.log('=== API Rules ===\n');
console.log('Set these rules in the "API Rules" tab:');
console.log('- List rule: userId = @request.auth.id');
console.log('- View rule: userId = @request.auth.id');
console.log('- Create rule: userId = @request.auth.id');
console.log('- Update rule: userId = @request.auth.id');
console.log('- Delete rule: userId = @request.auth.id');
console.log('');

console.log('=== After Setup ===\n');
console.log('Click "Save" to create the collection.');
console.log('Then test your application again!');