/**
 * Test script to verify all API connections
 */

import { gmailClient } from '../gmail.js';
import { notionClient } from '../notion.js';
import { summarizer } from '../summarizer.js';
import { logger } from '../utils/logger.js';

async function testCredentials() {
  console.log('='.repeat(60));
  console.log('Impact OS - Credential Verification Test');
  console.log('='.repeat(60));
  console.log();

  let allPassed = true;

  // Test 1: Notion API
  console.log('📝 Testing Notion API...');
  try {
    const commitments = await notionClient.getActiveCommitments();
    console.log(`✅ Notion API working! Found ${commitments.length} active commitments`);
  } catch (error) {
    console.error('❌ Notion API failed:', error);
    allPassed = false;
  }
  console.log();

  // Test 2: Gmail API
  console.log('📧 Testing Gmail API...');
  try {
    const messages = await gmailClient.pollInbox();
    console.log(`✅ Gmail API working! Found ${messages.length} unread IMPACT messages`);
  } catch (error) {
    console.error('❌ Gmail API failed:', error);
    allPassed = false;
  }
  console.log();

  // Test 3: Gemini API
  console.log('🤖 Testing Gemini API...');
  try {
    const testText = 'This is a test message for Impact OS summarization.';
    const summary = await summarizer.summarize(testText);
    if (summary) {
      console.log(`✅ Gemini API working! Summary: "${summary}"`);
    } else {
      console.error('❌ Gemini API failed: No summary returned');
      allPassed = false;
    }
  } catch (error) {
    console.error('❌ Gemini API failed:', error);
    allPassed = false;
  }
  console.log();

  // Final summary
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! System is ready to use.');
  } else {
    console.log('❌ Some tests failed. Check errors above.');
  }
  console.log('='.repeat(60));
}

testCredentials();
