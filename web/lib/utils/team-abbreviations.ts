// 팀명 약어 매핑
const teamAbbreviations: Record<string, string> = {
  // Premier League
  'Manchester United': 'MUN',
  'Manchester City': 'MCI',
  'Liverpool': 'LIV',
  'Chelsea': 'CHE',
  'Arsenal': 'ARS',
  'Tottenham': 'TOT',
  'Tottenham Hotspur': 'TOT',
  'Newcastle': 'NEW',
  'Newcastle United': 'NEW',
  'Leicester': 'LEI',
  'Leicester City': 'LEI',
  'West Ham': 'WHU',
  'West Ham United': 'WHU',
  'Everton': 'EVE',
  'Aston Villa': 'AVL',
  'Crystal Palace': 'CRY',
  'Brighton': 'BHA',
  'Brighton & Hove Albion': 'BHA',
  'Fulham': 'FUL',
  'Brentford': 'BRE',
  'Nottingham Forest': 'NFO',
  'Bournemouth': 'BOU',
  'Wolverhampton': 'WOL',
  'Wolverhampton Wanderers': 'WOL',
  'Wolves': 'WOL',
  'Burnley': 'BUR',
  'Sheffield United': 'SHU',
  'Luton': 'LUT',
  'Luton Town': 'LUT',
  'Southampton': 'SOU',
  'Leeds': 'LEE',
  'Leeds United': 'LEE',
  'Ipswich': 'IPS',
  'Ipswich Town': 'IPS',
  
  // La Liga
  'Real Madrid': 'RMA',
  'Barcelona': 'BAR',
  'Atletico Madrid': 'ATM',
  'Atlético Madrid': 'ATM',
  'Real Sociedad': 'RSO',
  'Real Betis': 'BET',
  'Sevilla': 'SEV',
  'Villarreal': 'VIL',
  'Athletic Bilbao': 'ATH',
  'Athletic Club': 'ATH',
  'Valencia': 'VAL',
  'Osasuna': 'OSA',
  'Getafe': 'GET',
  'Girona': 'GIR',
  'Rayo Vallecano': 'RAY',
  'Celta Vigo': 'CEL',
  'Mallorca': 'MAL',
  'Cadiz': 'CAD',
  'Cádiz': 'CAD',
  'Alaves': 'ALA',
  'Alavés': 'ALA',
  'Granada': 'GRA',
  'Las Palmas': 'LPA',
  'Almeria': 'ALM',
  'Almería': 'ALM',
  'Real Valladolid': 'VLD',
  'Espanyol': 'ESP',
  'Elche': 'ELC',
  
  // Serie A
  'Juventus': 'JUV',
  'AC Milan': 'MIL',
  'Inter': 'INT',
  'Inter Milan': 'INT',
  'Napoli': 'NAP',
  'Roma': 'ROM',
  'AS Roma': 'ROM',
  'Lazio': 'LAZ',
  'Atalanta': 'ATA',
  'Fiorentina': 'FIO',
  'Torino': 'TOR',
  'Bologna': 'BOL',
  'Udinese': 'UDI',
  'Sassuolo': 'SAS',
  'Monza': 'MON',
  'Empoli': 'EMP',
  'Salernitana': 'SAL',
  'Lecce': 'LEC',
  'Verona': 'VER',
  'Hellas Verona': 'VER',
  'Spezia': 'SPE',
  'Cremonese': 'CRE',
  'Sampdoria': 'SAM',
  'Cagliari': 'CAG',
  'Genoa': 'GEN',
  'Frosinone': 'FRO',
  
  // Bundesliga
  'Bayern Munich': 'BAY',
  'Bayern München': 'BAY',
  'Borussia Dortmund': 'BVB',
  'Dortmund': 'BVB',
  'RB Leipzig': 'RBL',
  'Leipzig': 'RBL',
  'Bayer Leverkusen': 'B04',
  'Leverkusen': 'B04',
  'Union Berlin': 'UNI',
  'Eintracht Frankfurt': 'SGE',
  'Frankfurt': 'SGE',
  'Freiburg': 'FRE',
  'SC Freiburg': 'FRE',
  'Hoffenheim': 'TSG',
  '1899 Hoffenheim': 'TSG',
  'Wolfsburg': 'WOB',
  'VfL Wolfsburg': 'WOB',
  'Borussia Monchengladbach': 'BMG',
  'Borussia Mönchengladbach': 'BMG',
  'Monchengladbach': 'BMG',
  'Mainz': 'M05',
  'Mainz 05': 'M05',
  'Augsburg': 'AUG',
  'FC Augsburg': 'AUG',
  'Hertha Berlin': 'BSC',
  'Hertha BSC': 'BSC',
  'VfB Stuttgart': 'VFB',
  'Stuttgart': 'VFB',
  'Schalke': 'S04',
  'Schalke 04': 'S04',
  'Werder Bremen': 'SVW',
  'Bremen': 'SVW',
  'Bochum': 'BOC',
  'VfL Bochum': 'BOC',
  'FC Koln': 'KOL',
  'FC Köln': 'KOL',
  'Cologne': 'KOL',
  'Heidenheim': 'HDH',
  'Darmstadt': 'D98',
  'Darmstadt 98': 'D98',
  
  // Ligue 1
  'Paris Saint Germain': 'PSG',
  'Paris Saint-Germain': 'PSG',
  'PSG': 'PSG',
  'Marseille': 'MAR',
  'Olympique Marseille': 'MAR',
  'Monaco': 'MON',
  'AS Monaco': 'MON',
  'Lyon': 'OL',
  'Olympique Lyon': 'OL',
  'Olympique Lyonnais': 'OL',
  'Lille': 'LIL',
  'Nice': 'NIC',
  'OGC Nice': 'NIC',
  'Rennes': 'REN',
  'Stade Rennes': 'REN',
  'Lens': 'LEN',
  'RC Lens': 'LEN',
  'Toulouse': 'TOU',
  'Montpellier': 'MTP',
  'Strasbourg': 'STR',
  'RC Strasbourg': 'STR',
  'Nantes': 'NAN',
  'FC Nantes': 'NAN',
  'Reims': 'REI',
  'Stade Reims': 'REI',
  'Brest': 'BRE',
  'Stade Brest': 'BRE',
  'Lorient': 'LOR',
  'FC Lorient': 'LOR',
  'Clermont': 'CLE',
  'Clermont Foot': 'CLE',
  'Metz': 'MET',
  'FC Metz': 'MET',
  'Le Havre': 'HAC',
  'Le Havre AC': 'HAC',
  'Auxerre': 'AUX',
  'AJ Auxerre': 'AUX',
  'Angers': 'ANG',
  'Angers SCO': 'ANG',
  'Troyes': 'TRO',
  'Saint-Etienne': 'STE',
  'Saint-Étienne': 'STE',
  'AS Saint-Étienne': 'STE',
  'Bordeaux': 'BOR',
  
  // Champions League / International
  'Real Madrid CF': 'RMA',
  'FC Barcelona': 'BAR',
  'Liverpool FC': 'LIV',
  'Manchester United FC': 'MUN',
  'Chelsea FC': 'CHE',
  'Arsenal FC': 'ARS',
  'Manchester City FC': 'MCI',
  'Tottenham Hotspur FC': 'TOT',
  'FC Bayern München': 'BAY',
  'Juventus FC': 'JUV',
  'FC Inter Milan': 'INT',
  'SSC Napoli': 'NAP',
  'Atalanta BC': 'ATA',
  'SS Lazio': 'LAZ',
  'Bayer 04 Leverkusen': 'B04',
  
  // 기타 유럽팀들
  'Ajax': 'AJA',
  'PSV': 'PSV',
  'PSV Eindhoven': 'PSV',
  'Feyenoord': 'FEY',
  'Celtic': 'CEL',
  'Rangers': 'RAN',
  'Benfica': 'BEN',
  'SL Benfica': 'BEN',
  'Porto': 'POR',
  'FC Porto': 'POR',
  'Sporting CP': 'SCP',
  'Sporting': 'SCP',
  'Club Brugge': 'BRU',
  'Club Bruges': 'BRU',
  'Anderlecht': 'AND',
  'Galatasaray': 'GAL',
  'Fenerbahce': 'FEN',
  'Fenerbahçe': 'FEN',
  'Besiktas': 'BES',
  'Beşiktaş': 'BES',
  'Shakhtar Donetsk': 'SHA',
  'Dynamo Kyiv': 'DYK',
  'Red Bull Salzburg': 'RBS',
  'FC Salzburg': 'RBS',
  'Young Boys': 'YB',
  'BSC Young Boys': 'YB',
  'FC Basel': 'BAS',
  'Basel': 'BAS',
  'FC Copenhagen': 'COP',
  'Copenhagen': 'COP',
  'Malmo': 'MAL',
  'Malmö FF': 'MAL',
  'Red Star Belgrade': 'RSB',
  'Crvena Zvezda': 'RSB',
  'PAOK': 'PAO',
  'Olympiacos': 'OLY',
  'AEK Athens': 'AEK',
}

/**
 * 팀명을 약어로 변환
 * @param teamName 원본 팀명
 * @returns 3글자 약어 또는 원본 팀명의 처음 3글자
 */
export function getTeamAbbreviation(teamName: string): string {
  // 매핑에 있는 경우 약어 반환
  if (teamAbbreviations[teamName]) {
    return teamAbbreviations[teamName]
  }
  
  // FC, CF, SC 등의 접미사 제거
  const cleanName = teamName
    .replace(/\s?(FC|CF|SC|AC|AS|SS|SSC|BC|BSC|VfL|VfB|TSV|SV|KV|RCD|UD|SD|CD|AD)\s?/gi, '')
    .trim()
  
  // 정리된 이름으로 다시 검색
  if (teamAbbreviations[cleanName]) {
    return teamAbbreviations[cleanName]
  }
  
  // 매핑에 없는 경우
  // 1. 공백으로 분리하여 각 단어의 첫 글자 추출
  const words = teamName.split(/\s+/)
  if (words.length >= 2) {
    // 최대 3글자까지만
    return words
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
  }
  
  // 2. 단일 단어인 경우 처음 3글자
  return teamName.slice(0, 3).toUpperCase()
}

/**
 * 모바일 여부에 따라 팀명 또는 약어 반환
 * @param teamName 원본 팀명
 * @param isMobile 모바일 여부
 * @returns 팀명 또는 약어
 */
export function getTeamDisplayName(teamName: string, isMobile: boolean): string {
  return isMobile ? getTeamAbbreviation(teamName) : teamName
}