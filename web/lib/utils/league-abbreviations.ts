// 리그명 약어 매핑
const leagueAbbreviations: Record<string, string> = {
  // 주요 리그
  'Premier League': 'PL',
  'La Liga': 'LL',
  'Serie A': 'SA',
  'Bundesliga': 'BL',
  'Ligue 1': 'L1',
  'Ligue 1 Uber Eats': 'L1',
  
  // 2부 리그
  'Championship': 'CH',
  'La Liga 2': 'LL2',
  'Serie B': 'SB',
  '2. Bundesliga': '2BL',
  'Ligue 2': 'L2',
  
  // 기타 유럽 리그
  'Eredivisie': 'ERE',
  'Primeira Liga': 'PL',
  'Liga Portugal': 'LP',
  'Pro League': 'BPL',
  'Belgian Pro League': 'BPL',
  'Super Lig': 'TSL',
  'Süper Lig': 'TSL',
  'Turkish Super Lig': 'TSL',
  'Russian Premier League': 'RPL',
  'Premier Liga': 'RPL',
  'Scottish Premiership': 'SPL',
  'Swiss Super League': 'SSL',
  'Austrian Bundesliga': 'ABL',
  'Danish Superliga': 'DSL',
  'Allsvenskan': 'ASV',
  'Eliteserien': 'NOR',
  'Ekstraklasa': 'EKS',
  'Czech First League': 'CFL',
  'Liga I': 'RL1',
  'Super League Greece': 'GSL',
  'Serbian SuperLiga': 'SSL',
  'Croatian First League': 'CRO',
  'Prva HNL': 'HNL',
  
  // 유럽 대회
  'UEFA Champions League': 'UCL',
  'Champions League': 'UCL',
  'UEFA Europa League': 'UEL',
  'Europa League': 'UEL',
  'UEFA Europa Conference League': 'UECL',
  'Europa Conference League': 'ECL',
  'Conference League': 'ECL',
  'UEFA Super Cup': 'USC',
  'Super Cup': 'USC',
  'UEFA Nations League': 'UNL',
  'Nations League': 'UNL',
  
  // 국내 컵대회
  'FA Cup': 'FAC',
  'EFL Cup': 'EFL',
  'Carabao Cup': 'EFL',
  'League Cup': 'LC',
  'Community Shield': 'CS',
  'Copa del Rey': 'CDR',
  'Coppa Italia': 'CI',
  'DFB Pokal': 'DFB',
  'DFB-Pokal': 'DFB',
  'Coupe de France': 'CDF',
  'Coupe de la Ligue': 'CDL',
  'KNVB Beker': 'KB',
  'Taça de Portugal': 'TDP',
  'Copa de la Liga': 'CDL',
  'Supercopa de España': 'SCE',
  'Supercoppa Italiana': 'SCI',
  'DFL-Supercup': 'DSC',
  'Trophée des Champions': 'TDC',
  
  // 남미
  'Copa Libertadores': 'LIB',
  'Copa Sudamericana': 'SUD',
  'Copa America': 'CA',
  'Copa América': 'CA',
  'Brasileirão': 'BRA',
  'Campeonato Brasileiro': 'BRA',
  'Liga Profesional Argentina': 'ARG',
  'Primera División': 'PD',
  'Liga MX': 'MX',
  'MLS': 'MLS',
  'Major League Soccer': 'MLS',
  
  // 아시아
  'AFC Champions League': 'ACL',
  'K League 1': 'K1',
  'K League 2': 'K2',
  'J1 League': 'J1',
  'J2 League': 'J2',
  'Chinese Super League': 'CSL',
  'A-League': 'AL',
  'Indian Super League': 'ISL',
  'Thai League 1': 'T1',
  'V.League 1': 'V1',
  'Saudi Pro League': 'SPL',
  'Saudi Professional League': 'SPL',
  'UAE Pro League': 'UPL',
  'Qatar Stars League': 'QSL',
  
  // 국가대표
  'World Cup': 'WC',
  'FIFA World Cup': 'WC',
  'European Championship': 'EUR',
  'EURO': 'EUR',
  'Africa Cup of Nations': 'ACN',
  'AFCON': 'ACN',
  'Asian Cup': 'ASC',
  'AFC Asian Cup': 'ASC',
  'CONCACAF Gold Cup': 'GC',
  'Gold Cup': 'GC',
  
  // 친선경기
  'Friendlies': 'INT',
  'International Friendlies': 'INT',
  'Club Friendlies': 'CF',
  
  // 기타
  'FIFA Club World Cup': 'CWC',
  'Club World Cup': 'CWC',
  'Olympics': 'OLY',
  'Olympic Games': 'OLY',
  'U21 Championship': 'U21',
  'U19 Championship': 'U19',
  'Youth League': 'YL',
  'UEFA Youth League': 'UYL',
  'Premier League 2': 'PL2',
  'EFL Trophy': 'EFT',
  'National League': 'NL',
  'Vanarama National League': 'VNL',
}

/**
 * 리그명을 약어로 변환
 * @param leagueName 원본 리그명
 * @returns 리그 약어 또는 원본 리그명의 처음 3글자
 */
export function getLeagueAbbreviation(leagueName: string): string {
  // 매핑에 있는 경우 약어 반환
  if (leagueAbbreviations[leagueName]) {
    return leagueAbbreviations[leagueName]
  }
  
  // 매핑에 없는 경우
  // 1. 숫자로 시작하는 경우 (예: "1. Division")
  if (/^\d/.test(leagueName)) {
    return leagueName.slice(0, 3).toUpperCase()
  }
  
  // 2. 공백으로 분리하여 각 단어의 첫 글자 추출
  const words = leagueName.split(/\s+/)
  if (words.length >= 2) {
    // 최대 3글자까지만
    return words
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
  }
  
  // 3. 단일 단어인 경우 처음 3글자
  return leagueName.slice(0, 3).toUpperCase()
}

/**
 * 모바일 여부에 따라 리그명 또는 약어 반환
 * @param leagueName 원본 리그명
 * @param isMobile 모바일 여부
 * @returns 리그명 또는 약어
 */
export function getLeagueDisplayName(leagueName: string, isMobile: boolean): string {
  return isMobile ? getLeagueAbbreviation(leagueName) : leagueName
}