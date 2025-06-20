// Simple debug test for Twitch API
import { twitchService } from './src/services/backend/twitchService.js';

console.log('🔍 Debug: Testing Twitch Service...\n');

async function debugTest() {
  console.log('1. Testing getFollowers...');
  try {
    const followers = await twitchService.getFollowers('123456789', 5);
    console.log('✅ Followers result:', followers.length, 'items');
    console.log('   Sample:', followers[0]);
  } catch (error) {
    console.error('❌ Followers error:', error.message);
  }

  console.log('\n2. Testing getSubscribers...');
  try {
    const subscribers = await twitchService.getSubscribers('123456789', 5);
    console.log('✅ Subscribers result:', subscribers.length, 'items');
    console.log('   Sample:', subscribers[0]);
  } catch (error) {
    console.error('❌ Subscribers error:', error.message);
  }

  console.log('\n3. Testing getStreamStatus...');
  try {
    const status = await twitchService.getStreamStatus('jesski');
    console.log('✅ Stream status:', status.isLive ? 'LIVE' : 'OFFLINE');
  } catch (error) {
    console.error('❌ Stream status error:', error.message);
  }
}

debugTest();
