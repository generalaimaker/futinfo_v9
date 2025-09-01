// Analyze missing teams for 95% coverage target
// 2024-25 season 5 major leagues

import { MATCHED_TEAMS } from '../lib/data/team-id-mapping';

// Current 2024-25 season teams per league
const SEASON_2024_25_TEAMS = {
  'Premier League': {
    total: 20,
    teams: [
      { id: 33, name: 'Manchester United', mapped: true },
      { id: 40, name: 'Liverpool', mapped: true },
      { id: 42, name: 'Arsenal', mapped: true },
      { id: 49, name: 'Chelsea', mapped: true },
      { id: 50, name: 'Manchester City', mapped: true },
      { id: 47, name: 'Tottenham', mapped: true },
      { id: 34, name: 'Newcastle', mapped: true },
      { id: 66, name: 'Aston Villa', mapped: true },
      { id: 51, name: 'Brighton', mapped: true },
      { id: 35, name: 'Bournemouth', mapped: true },
      { id: 55, name: 'Brentford', mapped: true },
      { id: 36, name: 'Fulham', mapped: true },
      { id: 52, name: 'Crystal Palace', mapped: true },
      { id: 45, name: 'Everton', mapped: true },
      { id: 48, name: 'West Ham', mapped: true },
      { id: 39, name: 'Wolves', mapped: true },
      { id: 65, name: 'Nottingham Forest', mapped: true },
      { id: 46, name: 'Leicester', mapped: true },
      { id: 57, name: 'Ipswich', mapped: true },
      { id: 41, name: 'Southampton', mapped: true },
    ]
  },
  
  'La Liga': {
    total: 20,
    teams: [
      { id: 541, name: 'Real Madrid', mapped: true },
      { id: 529, name: 'Barcelona', mapped: true },
      { id: 530, name: 'Atletico Madrid', mapped: true },
      { id: 531, name: 'Athletic Bilbao', mapped: true },
      { id: 533, name: 'Villarreal', mapped: true },
      { id: 543, name: 'Real Betis', mapped: true },
      { id: 548, name: 'Real Sociedad', mapped: true },
      { id: 536, name: 'Sevilla', mapped: true },
      { id: 532, name: 'Valencia', mapped: true },
      { id: 538, name: 'Celta Vigo', mapped: true },
      { id: 546, name: 'Getafe', mapped: true },
      { id: 547, name: 'Girona', mapped: true },
      { id: 798, name: 'Mallorca', mapped: true },
      { id: 728, name: 'Rayo Vallecano', mapped: true },
      { id: 542, name: 'Alaves', mapped: true },
      { id: 537, name: 'Leganes', mapped: true },
      { id: 534, name: 'Las Palmas', mapped: true },
      { id: 727, name: 'Osasuna', mapped: true }, // Manual
      { id: 720, name: 'Real Valladolid', mapped: true }, // Manual
      { id: 540, name: 'Espanyol', mapped: false }, // MISSING
    ]
  },
  
  'Serie A': {
    total: 20,
    teams: [
      { id: 496, name: 'Juventus', mapped: true },
      { id: 505, name: 'Inter', mapped: true },
      { id: 489, name: 'AC Milan', mapped: true },
      { id: 492, name: 'Napoli', mapped: true }, // Manual
      { id: 499, name: 'Atalanta', mapped: true },
      { id: 497, name: 'AS Roma', mapped: true },
      { id: 487, name: 'Lazio', mapped: true }, // Manual
      { id: 502, name: 'Fiorentina', mapped: true },
      { id: 500, name: 'Bologna', mapped: true }, // Manual
      { id: 494, name: 'Udinese', mapped: true },
      { id: 503, name: 'Torino', mapped: false }, // MISSING
      { id: 495, name: 'Genoa', mapped: true },
      { id: 504, name: 'Verona', mapped: true },
      { id: 490, name: 'Cagliari', mapped: false }, // MISSING
      { id: 511, name: 'Empoli', mapped: true },
      { id: 895, name: 'Como', mapped: true },
      { id: 517, name: 'Venezia', mapped: true },
      { id: 523, name: 'Parma', mapped: false }, // MISSING
      { id: 867, name: 'Lecce', mapped: false }, // MISSING
      { id: 1579, name: 'Monza', mapped: false }, // MISSING
    ]
  },
  
  'Bundesliga': {
    total: 18, // Note: Bundesliga has 18 teams
    teams: [
      { id: 157, name: 'Bayern Munich', mapped: true },
      { id: 165, name: 'Borussia Dortmund', mapped: true },
      { id: 168, name: 'Bayer Leverkusen', mapped: true },
      { id: 173, name: 'RB Leipzig', mapped: true },
      { id: 169, name: 'Eintracht Frankfurt', mapped: true },
      { id: 172, name: 'VfB Stuttgart', mapped: true },
      { id: 161, name: 'Wolfsburg', mapped: true },
      { id: 163, name: 'Borussia Mönchengladbach', mapped: true },
      { id: 160, name: 'Freiburg', mapped: true },
      { id: 167, name: 'Hoffenheim', mapped: true },
      { id: 164, name: 'Mainz 05', mapped: true },
      { id: 162, name: 'Werder Bremen', mapped: true },
      { id: 170, name: 'Augsburg', mapped: true },
      { id: 182, name: 'Union Berlin', mapped: true },
      { id: 180, name: 'Heidenheim', mapped: true },
      { id: 186, name: 'St. Pauli', mapped: true },
      { id: 175, name: 'Holstein Kiel', mapped: false }, // MISSING
      { id: 176, name: 'VfL Bochum', mapped: false }, // MISSING
    ]
  },
  
  'Ligue 1': {
    total: 18, // Note: Ligue 1 has 18 teams
    teams: [
      { id: 85, name: 'Paris Saint-Germain', mapped: true }, // Manual
      { id: 91, name: 'Monaco', mapped: true },
      { id: 81, name: 'Marseille', mapped: true },
      { id: 79, name: 'Lille', mapped: true },
      { id: 80, name: 'Lyon', mapped: true },
      { id: 84, name: 'Nice', mapped: true },
      { id: 94, name: 'Rennes', mapped: true },
      { id: 116, name: 'Lens', mapped: true },
      { id: 106, name: 'Brest', mapped: true },
      { id: 93, name: 'Reims', mapped: true }, // Manual
      { id: 95, name: 'Strasbourg', mapped: true },
      { id: 96, name: 'Toulouse', mapped: true },
      { id: 82, name: 'Montpellier', mapped: true },
      { id: 83, name: 'Nantes', mapped: true },
      { id: 111, name: 'Le Havre', mapped: true },
      { id: 108, name: 'Auxerre', mapped: true },
      { id: 77, name: 'Angers', mapped: true }, // Manual
      { id: 1063, name: 'Saint-Étienne', mapped: false }, // MISSING
    ]
  }
};

function analyzeMapping() {
  console.log('2024-25 Season Team Mapping Analysis');
  console.log('=' .repeat(60));
  console.log('\nTarget: 95% coverage across all 5 leagues\n');
  
  let totalTeams = 0;
  let totalMapped = 0;
  const missingTeams: any[] = [];
  
  Object.entries(SEASON_2024_25_TEAMS).forEach(([league, data]) => {
    const mapped = data.teams.filter(t => t.mapped).length;
    const missing = data.teams.filter(t => !t.mapped);
    const percentage = (mapped / data.total * 100).toFixed(1);
    
    console.log(`${league}: ${mapped}/${data.total} (${percentage}%)`);
    
    if (missing.length > 0) {
      console.log(`  Missing teams:`);
      missing.forEach(team => {
        console.log(`    - ${team.name} (${team.id})`);
        missingTeams.push({ ...team, league });
      });
    }
    
    totalTeams += data.total;
    totalMapped += mapped;
  });
  
  const currentCoverage = (totalMapped / totalTeams * 100).toFixed(1);
  const teamsNeededFor95 = Math.ceil(totalTeams * 0.95);
  const additionalTeamsNeeded = teamsNeededFor95 - totalMapped;
  
  console.log('\n' + '=' .repeat(60));
  console.log('SUMMARY');
  console.log(`Current: ${totalMapped}/${totalTeams} teams (${currentCoverage}%)`);
  console.log(`Target for 95%: ${teamsNeededFor95}/${totalTeams} teams`);
  console.log(`Need to map: ${additionalTeamsNeeded} more teams\n`);
  
  console.log('Missing Teams by Priority:');
  console.log('\n1. EASIEST TO MAP (Newly promoted/Small teams):');
  console.log('  - Holstein Kiel (Bundesliga) - Newly promoted');
  console.log('  - Saint-Étienne (Ligue 1) - Back from Ligue 2');
  console.log('  - Espanyol (La Liga) - Back from Segunda División');
  
  console.log('\n2. MEDIUM DIFFICULTY (Mid-table teams):');
  console.log('  - VfL Bochum (Bundesliga)');
  console.log('  - Torino (Serie A)');
  console.log('  - Cagliari (Serie A)');
  console.log('  - Empoli (Serie A) - Actually mapped, error in list');
  
  console.log('\n3. HARDEST TO MAP (Small/New teams):');
  console.log('  - Monza (Serie A) - Relatively new to Serie A');
  console.log('  - Lecce (Serie A) - Small southern team');
  console.log('  - Parma (Serie A) - Recently back in Serie A');
  
  console.log('\nRECOMMENDATION FOR 95%:');
  console.log(`Map these ${additionalTeamsNeeded} teams (easiest first):`);
  
  const easyTargets = [
    'Holstein Kiel',
    'VfL Bochum', 
    'Saint-Étienne',
    'Espanyol',
    'Torino'
  ];
  
  easyTargets.slice(0, additionalTeamsNeeded).forEach((team, i) => {
    console.log(`  ${i + 1}. ${team}`);
  });
  
  console.log('\nWith these additions, coverage would be:');
  const projectedMapped = totalMapped + additionalTeamsNeeded;
  const projectedCoverage = (projectedMapped / totalTeams * 100).toFixed(1);
  console.log(`${projectedMapped}/${totalTeams} teams (${projectedCoverage}%)`);
}

// Run analysis
analyzeMapping();