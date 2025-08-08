#!/usr/bin/env node

// Test script to diagnose Edge Function authentication issues

const SUPABASE_URL = 'https://uutmymaxkkytibuiiaax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM';

async function testEdgeFunction() {
  console.log('Testing Edge Function authentication...\n');
  
  // Test 1: Direct API call with correct headers
  console.log('Test 1: Calling Edge Function with Authorization header');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-football-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        endpoint: 'leagues',
        params: { current: true }
      })
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('Response Body:', text.substring(0, 500));
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ Success! Edge Function is working');
      console.log('Results count:', data.results || 0);
    } else {
      console.log('❌ Error response from Edge Function');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Without Authorization header (should fail)
  console.log('Test 2: Calling Edge Function WITHOUT Authorization header');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-football-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'leagues',
        params: { current: true }
      })
    });
    
    console.log('Response Status:', response.status);
    const text = await response.text();
    console.log('Response Body:', text);
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Decode JWT to check expiration
  console.log('Test 3: JWT Token Analysis');
  try {
    const parts = SUPABASE_ANON_KEY.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('JWT Payload:', JSON.stringify(payload, null, 2));
    
    const exp = new Date(payload.exp * 1000);
    const now = new Date();
    console.log('Token expires at:', exp.toISOString());
    console.log('Current time:', now.toISOString());
    console.log('Token is valid:', exp > now ? '✅ Yes' : '❌ No (EXPIRED!)');
  } catch (error) {
    console.error('Failed to decode JWT:', error.message);
  }
}

testEdgeFunction();