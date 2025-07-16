#!/bin/bash

# Deploy Supabase Edge Functions

echo "🚀 Deploying Supabase Edge Functions..."

# Deploy news-proxy function
echo "📰 Deploying news-proxy..."
supabase functions deploy news-proxy

# Deploy ai-proxy function
echo "🤖 Deploying ai-proxy..."
supabase functions deploy ai-proxy

# Deploy existing functions
echo "🏈 Deploying football-api..."
supabase functions deploy football-api

echo "📡 Deploying rss-news-collector..."
supabase functions deploy rss-news-collector

echo "🌐 Deploying translate-news-batch..."
supabase functions deploy translate-news-batch

echo "✅ All functions deployed successfully!"