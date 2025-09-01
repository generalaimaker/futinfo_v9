// Script to verify team ID mappings by fetching and comparing team data from both APIs

import { MATCHED_TEAMS } from '../lib/data/team-id-mapping';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4';

interface VerificationResult {
  apiFootballId: number;
  freeApiId: number;
  apiFootballName: string;
  freeApiName: string;
  match: 'exact' | 'partial' | 'suspicious' | 'error';
  confidence: number;
}

// Fetch team info from api-football
async function fetchApiFootballTeam(teamId: number) {
  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/teams?id=${teamId}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team ${teamId}`);
    }
    
    const data = await response.json();
    return data.response?.[0]?.team || null;
  } catch (error) {
    console.error(`Error fetching api-football team ${teamId}:`, error);
    return null;
  }
}

// Fetch team transfers to extract team name from free-api
async function fetchFreeApiTeamName(teamId: number) {
  try {
    // Try to get team info from transfers
    const response = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-in-transfers?teamid=${teamId}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) {
      // Try alternative endpoint
      const altResponse = await fetch(
        `https://free-api-live-football-data.p.rapidapi.com/football-team-logo?teamid=${teamId}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
          },
        }
      );
      
      if (!altResponse.ok) {
        throw new Error(`Failed to fetch team ${teamId}`);
      }
      
      return `Team_${teamId}`; // Placeholder if we can't get the name
    }
    
    const data = await response.json();
    
    // Extract team name from transfers
    if (data?.response?.transfers && Array.isArray(data.response.transfers) && data.response.transfers.length > 0) {
      const transfer = data.response.transfers[0];
      if (transfer.toClubId === teamId) {
        return transfer.toClub;
      } else if (transfer.fromClubId === teamId) {
        return transfer.fromClub;
      }
    } else if (Array.isArray(data) && data.length > 0) {
      const transfer = data[0];
      if (transfer.toClubId === teamId) {
        return transfer.toClub;
      } else if (transfer.fromClubId === teamId) {
        return transfer.fromClub;
      }
    }
    
    return `Team_${teamId}`;
  } catch (error) {
    console.error(`Error fetching free-api team ${teamId}:`, error);
    return null;
  }
}

// Normalize team names for comparison
function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(fc|cf|ac|as|ss|sc|vf[bl]|rb|fsv|tsg|1899)\s+/i, '')
    .replace(/\s+(fc|cf|ac|as|ss|sc)$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

// Calculate match confidence
function calculateConfidence(name1: string, name2: string): { match: 'exact' | 'partial' | 'suspicious', confidence: number } {
  const norm1 = normalizeForComparison(name1);
  const norm2 = normalizeForComparison(name2);
  
  if (norm1 === norm2) {
    return { match: 'exact', confidence: 100 };
  }
  
  // Check for common variations
  const variations = [
    ['united', 'utd'],
    ['city', 'fc'],
    ['saint', 'st'],
    ['hotspur', 'spurs'],
    ['wanderers', ''],
    ['athletic', 'atletico'],
    ['real', ''],
  ];
  
  let adjusted1 = norm1;
  let adjusted2 = norm2;
  
  for (const [full, short] of variations) {
    adjusted1 = adjusted1.replace(full, short);
    adjusted2 = adjusted2.replace(full, short);
  }
  
  if (adjusted1 === adjusted2) {
    return { match: 'partial', confidence: 90 };
  }
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const lengthDiff = Math.abs(norm1.length - norm2.length);
    if (lengthDiff <= 3) {
      return { match: 'partial', confidence: 85 };
    } else if (lengthDiff <= 5) {
      return { match: 'partial', confidence: 75 };
    }
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  if (similarity > 70) {
    return { match: 'partial', confidence: similarity };
  }
  
  return { match: 'suspicious', confidence: similarity };
}

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Main verification function
async function verifyMappings() {
  console.log('Starting team mapping verification...\n');
  console.log('=' .repeat(80));
  
  const results: VerificationResult[] = [];
  const entries = Object.entries(MATCHED_TEAMS);
  let processed = 0;
  
  // Test with a subset first to avoid rate limiting
  const testEntries = entries.slice(0, 30); // Test first 30 teams
  
  for (const [apiFootballId, freeApiId] of testEntries) {
    processed++;
    console.log(`\n[${processed}/${testEntries.length}] Verifying team ${apiFootballId} -> ${freeApiId}`);
    
    // Fetch from both APIs
    const [apiFootballTeam, freeApiName] = await Promise.all([
      fetchApiFootballTeam(parseInt(apiFootballId)),
      fetchFreeApiTeamName(freeApiId),
    ]);
    
    if (!apiFootballTeam || !freeApiName) {
      results.push({
        apiFootballId: parseInt(apiFootballId),
        freeApiId,
        apiFootballName: apiFootballTeam?.name || 'Unknown',
        freeApiName: freeApiName || 'Unknown',
        match: 'error',
        confidence: 0,
      });
      console.log(`  ❌ Error: Could not fetch team data`);
      continue;
    }
    
    const { match, confidence } = calculateConfidence(apiFootballTeam.name, freeApiName);
    
    results.push({
      apiFootballId: parseInt(apiFootballId),
      freeApiId,
      apiFootballName: apiFootballTeam.name,
      freeApiName: freeApiName,
      match,
      confidence,
    });
    
    // Display result
    const emoji = match === 'exact' ? '✅' : match === 'partial' ? '⚠️' : '❌';
    console.log(`  ${emoji} ${apiFootballTeam.name} <-> ${freeApiName}`);
    console.log(`     Match: ${match}, Confidence: ${confidence.toFixed(1)}%`);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('VERIFICATION SUMMARY\n');
  
  const exact = results.filter(r => r.match === 'exact');
  const partial = results.filter(r => r.match === 'partial');
  const suspicious = results.filter(r => r.match === 'suspicious');
  const errors = results.filter(r => r.match === 'error');
  
  console.log(`Total verified: ${results.length}`);
  console.log(`✅ Exact matches: ${exact.length} (${(exact.length/results.length*100).toFixed(1)}%)`);
  console.log(`⚠️  Partial matches: ${partial.length} (${(partial.length/results.length*100).toFixed(1)}%)`);
  console.log(`❌ Suspicious matches: ${suspicious.length} (${(suspicious.length/results.length*100).toFixed(1)}%)`);
  console.log(`🔴 Errors: ${errors.length}`);
  
  if (suspicious.length > 0) {
    console.log('\n⚠️  SUSPICIOUS MAPPINGS TO REVIEW:');
    suspicious.forEach(r => {
      console.log(`  ${r.apiFootballId}: ${r.apiFootballName} -> ${r.freeApiName} (${r.confidence.toFixed(1)}%)`);
    });
  }
  
  // Save detailed results
  const fs = await import('fs');
  fs.writeFileSync(
    './scripts/verification-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\nDetailed results saved to: scripts/verification-results.json');
  
  return results;
}

// Run verification
if (require.main === module) {
  verifyMappings()
    .then(() => {
      console.log('\nVerification completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Verification error:', error);
      process.exit(1);
    });
}