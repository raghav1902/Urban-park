const redis = require('./config/redis');

async function testLock() {
    const testSlotId = 'test-slot-' + Date.now();
    const userId1 = 'user-1';
    const userId2 = 'user-2';

    console.log('--- Starting Redis Lock Test ---');

    console.log(`1. Attempting to lock slot ${testSlotId} for ${userId1}...`);
    // Using the same key format 'lock:slotId' as implemented in routes
    const lock1 = await redis.set(`lock:${testSlotId}`, userId1, { NX: true, EX: 10 });

    if (lock1 === 'OK') {
        console.log('✅ Success: First lock acquired.');
    } else {
        console.log('❌ Error: Could not acquire first lock. Result:', lock1);
    }

    console.log(`2. Attempting to lock slot ${testSlotId} for ${userId2} (should fail)...`);
    const lock2 = await redis.set(`lock:${testSlotId}`, userId2, { NX: true, EX: 10 });

    if (lock2 === null) {
        console.log('✅ Success: Second lock was correctly rejected (Already locked).');
    } else {
        console.log('❌ Error: Second lock was incorrectly granted!');
    }

    console.log('3. Checking TTL for the lock...');
    const ttl = await redis.ttl(`lock:${testSlotId}`);
    console.log(`✅ Current TTL: ${ttl} seconds remaining.`);

    console.log('4. Releasing lock manually...');
    await redis.del(`lock:${testSlotId}`);
    const exists = await redis.exists(`lock:${testSlotId}`);

    if (!exists) {
        console.log('✅ Success: Lock released.');
    } else {
        console.log('❌ Error: Lock was not released!');
    }

    console.log('--- Test Complete ---');
    process.exit(0);
}

// Wait a bit for redis to connect
setTimeout(testLock, 1000);
