// 주요 팀 컬러 정의
// 팀 ID는 API-Football의 팀 ID를 사용

export interface TeamColors {
  primary: string    // 메인 컬러
  secondary?: string // 보조 컬러 (선택)
  text: string      // 텍스트 컬러 (primary 배경에서 사용)
}

export const TEAM_COLORS: Record<number, TeamColors> = {
  // 프리미어리그
  33: { // Manchester United
    primary: '#DA020E',
    secondary: '#FFE500',
    text: 'white'
  },
  34: { // Newcastle
    primary: '#241F20',
    secondary: '#FFFFFF',
    text: 'white'
  },
  35: { // Bournemouth
    primary: '#DA020E',
    secondary: '#000000',
    text: 'white'
  },
  36: { // Fulham
    primary: '#FFFFFF',
    secondary: '#000000',
    text: 'black'
  },
  39: { // Wolves
    primary: '#FDB913',
    secondary: '#231F20',
    text: 'black'
  },
  40: { // Liverpool
    primary: '#C8102E',
    secondary: '#00B2A9',
    text: 'white'
  },
  41: { // Southampton
    primary: '#D71920',
    secondary: '#130C0E',
    text: 'white'
  },
  42: { // Arsenal
    primary: '#EF0107',
    secondary: '#063672',
    text: 'white'
  },
  44: { // Burnley
    primary: '#6C1D45',
    secondary: '#99D6EA',
    text: 'white'
  },
  45: { // Everton
    primary: '#003399',
    secondary: '#FFFFFF',
    text: 'white'
  },
  46: { // Leicester
    primary: '#003090',
    secondary: '#FDBE11',
    text: 'white'
  },
  47: { // Tottenham
    primary: '#132257',
    secondary: '#FFFFFF',
    text: 'white'
  },
  48: { // West Ham
    primary: '#7A263A',
    secondary: '#1BB1E7',
    text: 'white'
  },
  49: { // Chelsea
    primary: '#034694',
    secondary: '#DBA111',
    text: 'white'
  },
  50: { // Manchester City
    primary: '#6CABDD',
    secondary: '#1C2C5B',
    text: 'white'
  },
  51: { // Brighton
    primary: '#0057B8',
    secondary: '#FFCD00',
    text: 'white'
  },
  52: { // Crystal Palace
    primary: '#1B458F',
    secondary: '#A7A5A6',
    text: 'white'
  },
  55: { // Brentford
    primary: '#D20000',
    secondary: '#FBB800',
    text: 'white'
  },
  65: { // Nottingham Forest
    primary: '#DD0000',
    secondary: '#FFFFFF',
    text: 'white'
  },
  66: { // Aston Villa
    primary: '#95BFE5',
    secondary: '#670E36',
    text: 'black'
  },
  
  // 라리가
  77: { // Real Sociedad
    primary: '#003F7F',
    secondary: '#FFFFFF',
    text: 'white'
  },
  78: { // Las Palmas
    primary: '#FFE400',
    secondary: '#005CAB',
    text: 'black'
  },
  79: { // Osasuna
    primary: '#D91A21',
    secondary: '#0A346F',
    text: 'white'
  },
  80: { // Mallorca
    primary: '#E20613',
    secondary: '#000000',
    text: 'white'
  },
  81: { // Barcelona
    primary: '#A50044',
    secondary: '#004D98',
    text: 'white'
  },
  82: { // Valladolid
    primary: '#5B2482',
    secondary: '#FFFFFF',
    text: 'white'
  },
  83: { // Getafe
    primary: '#005999',
    secondary: '#FFFFFF',
    text: 'white'
  },
  86: { // Real Madrid
    primary: '#FFFFFF',
    secondary: '#D7B903',
    text: 'black'
  },
  88: { // Leganes
    primary: '#1E4595',
    secondary: '#FFFFFF',
    text: 'white'
  },
  89: { // Girona
    primary: '#CD2534',
    secondary: '#FFFFFF',
    text: 'white'
  },
  94: { // Valencia
    primary: '#EE3524',
    secondary: '#FFFFFF',
    text: 'white'
  },
  95: { // Rayo Vallecano
    primary: '#E72013',
    secondary: '#FFFFFF',
    text: 'white'
  },
  96: { // Alaves
    primary: '#0761AF',
    secondary: '#FFFFFF',
    text: 'white'
  },
  285: { // Las Palmas
    primary: '#FFE400',
    secondary: '#005999',
    text: 'black'
  },
  530: { // Atletico Madrid
    primary: '#CB3524',
    secondary: '#262E61',
    text: 'white'
  },
  531: { // Athletic Bilbao
    primary: '#EE2523',
    secondary: '#FFFFFF',
    text: 'white'
  },
  532: { // Celta Vigo
    primary: '#8AC5FF',
    secondary: '#FFFFFF',
    text: 'black'
  },
  533: { // Villarreal
    primary: '#FFE667',
    secondary: '#005187',
    text: 'black'
  },
  536: { // Sevilla
    primary: '#F43333',
    secondary: '#FFFFFF',
    text: 'white'
  },
  543: { // Real Betis
    primary: '#00954F',
    secondary: '#FFFFFF',
    text: 'white'
  },
  
  // 분데스리가
  157: { // Bayern Munich
    primary: '#DC052D',
    secondary: '#0066B2',
    text: 'white'
  },
  159: { // Hertha Berlin
    primary: '#005CA9',
    secondary: '#FFFFFF',
    text: 'white'
  },
  160: { // Freiburg
    primary: '#5B5B5B',
    secondary: '#E5002D',
    text: 'white'
  },
  161: { // VfL Wolfsburg
    primary: '#65B32E',
    secondary: '#FFFFFF',
    text: 'white'
  },
  162: { // Werder Bremen
    primary: '#1D9053',
    secondary: '#FFFFFF',
    text: 'white'
  },
  163: { // Borussia M'gladbach
    primary: '#000000',
    secondary: '#FFFFFF',
    text: 'white'
  },
  164: { // Mainz
    primary: '#C3141E',
    secondary: '#FFFFFF',
    text: 'white'
  },
  165: { // Borussia Dortmund
    primary: '#FDE100',
    secondary: '#000000',
    text: 'black'
  },
  167: { // Hoffenheim
    primary: '#1961B5',
    secondary: '#FFFFFF',
    text: 'white'
  },
  168: { // Bayer Leverkusen
    primary: '#E32221',
    secondary: '#000000',
    text: 'white'
  },
  169: { // Eintracht Frankfurt
    primary: '#E00913',
    secondary: '#000000',
    text: 'white'
  },
  170: { // Augsburg
    primary: '#BA3733',
    secondary: '#46714D',
    text: 'white'
  },
  172: { // Stuttgart
    primary: '#FFFFFF',
    secondary: '#E32219',
    text: 'black'
  },
  173: { // RB Leipzig
    primary: '#DD0741',
    secondary: '#001F47',
    text: 'white'
  },
  176: { // Bochum
    primary: '#005CA9',
    secondary: '#FFFFFF',
    text: 'white'
  },
  182: { // Union Berlin
    primary: '#EB1923',
    secondary: '#FFD301',
    text: 'white'
  },
  188: { // Holstein Kiel
    primary: '#131F88',
    secondary: '#FFFFFF',
    text: 'white'
  },
  192: { // Köln
    primary: '#ED1C24',
    secondary: '#FFFFFF',
    text: 'white'
  },
  
  // 세리에 A
  487: { // Lazio
    primary: '#87D8F7',
    secondary: '#FFFFFF',
    text: 'black'
  },
  488: { // Sassuolo
    primary: '#00A752',
    secondary: '#000000',
    text: 'white'
  },
  489: { // AC Milan
    primary: '#FB090B',
    secondary: '#000000',
    text: 'white'
  },
  490: { // Cagliari
    primary: '#B01028',
    secondary: '#002F6C',
    text: 'white'
  },
  492: { // Napoli
    primary: '#12A0D5',
    secondary: '#003C82',
    text: 'white'
  },
  494: { // Udinese
    primary: '#000000',
    secondary: '#FFFFFF',
    text: 'white'
  },
  495: { // Genoa
    primary: '#D1022E',
    secondary: '#27447E',
    text: 'white'
  },
  496: { // Juventus
    primary: '#000000',
    secondary: '#FFFFFF',
    text: 'white'
  },
  497: { // AS Roma
    primary: '#AB1F26',
    secondary: '#FFC72C',
    text: 'white'
  },
  498: { // Sampdoria
    primary: '#002F6C',
    secondary: '#FFFFFF',
    text: 'white'
  },
  499: { // Atalanta
    primary: '#1E71B8',
    secondary: '#000000',
    text: 'white'
  },
  500: { // Bologna
    primary: '#1A2F48',
    secondary: '#ED1C24',
    text: 'white'
  },
  502: { // Fiorentina
    primary: '#6A2E8F',
    secondary: '#FFFFFF',
    text: 'white'
  },
  503: { // Torino
    primary: '#8B2635',
    secondary: '#FDB913',
    text: 'white'
  },
  504: { // Verona
    primary: '#FFE600',
    secondary: '#002F6C',
    text: 'black'
  },
  505: { // Inter
    primary: '#010E80',
    secondary: '#000000',
    text: 'white'
  },
  506: { // Spezia
    primary: '#FFFFFF',
    secondary: '#000000',
    text: 'black'
  },
  511: { // Empoli
    primary: '#1E71B8',
    secondary: '#FFFFFF',
    text: 'white'
  },
  
  // 리그 1 (French Ligue 1)
  97: { // Angers
    primary: '#FFFFFF',
    secondary: '#000000',
    text: 'black'
  },
  106: { // Bordeaux
    primary: '#002B5C',
    secondary: '#FFFFFF',
    text: 'white'
  },
  545: { // Lille
    primary: '#DC0000',
    secondary: '#FFFFFF',
    text: 'white'
  },
  546: { // Lyon
    primary: '#DA001A',
    secondary: '#163C8C',
    text: 'white'
  },
  547: { // Marseille
    primary: '#2FAEE0',
    secondary: '#FFFFFF',
    text: 'white'
  },
  548: { // Montpellier
    primary: '#FF6F00',
    secondary: '#002A5C',
    text: 'white'
  },
  549: { // Nantes
    primary: '#FCD405',
    secondary: '#008D36',
    text: 'black'
  },
  84: { // Nice
    primary: '#D91E26',
    secondary: '#000000',
    text: 'white'
  },
  85: { // Paris Saint-Germain
    primary: '#004170',
    secondary: '#DA291C',
    text: 'white'
  },
  91: { // Monaco
    primary: '#E63031',
    secondary: '#FFFFFF',
    text: 'white'
  },
  93: { // Reims
    primary: '#EE2836',
    secondary: '#FFFFFF',
    text: 'white'
  },
  550: { // Rennes
    primary: '#E13327',
    secondary: '#000000',
    text: 'white'
  },
  
  // K리그
  2748: { // 울산
    primary: '#1B4996',
    secondary: '#F5A200',
    text: 'white'
  },
  2749: { // 전북
    primary: '#12753B',
    secondary: '#F5A200',
    text: 'white'
  },
  2750: { // 포항
    primary: '#C8102E',
    secondary: '#000000',
    text: 'white'
  },
  2751: { // 제주
    primary: '#F47920',
    secondary: '#000000',
    text: 'white'
  },
  2752: { // 서울
    primary: '#E62E2C',
    secondary: '#000000',
    text: 'white'
  },
  2753: { // 강원
    primary: '#E74C3C',
    secondary: '#273C75',
    text: 'white'
  },
  2754: { // 수원FC
    primary: '#004C97',
    secondary: '#FFFFFF',
    text: 'white'
  },
  2755: { // 인천
    primary: '#004B9B',
    secondary: '#FF6900',
    text: 'white'
  },
  2757: { // 대구
    primary: '#0067AC',
    secondary: '#000000',
    text: 'white'
  },
  2758: { // 대전
    primary: '#96144B',
    secondary: '#F5A200',
    text: 'white'
  },
  2759: { // 광주
    primary: '#FFD100',
    secondary: '#000000',
    text: 'black'
  },
  6916: { // 김천
    primary: '#C41230',
    secondary: '#FFD700',
    text: 'white'
  },
  21411: { // 수원 삼성
    primary: '#1E4788',
    secondary: '#FFFFFF',
    text: 'white'
  }
}

// 팀 이름으로 팀 컬러 찾기 (팀 ID를 모를 때 사용)
export const TEAM_COLORS_BY_NAME: Record<string, TeamColors> = {
  // 프리미어리그
  'Manchester United': TEAM_COLORS[33],
  'Liverpool': TEAM_COLORS[40],
  'Arsenal': TEAM_COLORS[42],
  'Chelsea': TEAM_COLORS[49],
  'Manchester City': TEAM_COLORS[50],
  'Tottenham': TEAM_COLORS[47],
  
  // 라리가
  'Real Madrid': TEAM_COLORS[86],
  'Barcelona': TEAM_COLORS[81],
  'Atletico Madrid': TEAM_COLORS[530],
  
  // 분데스리가
  'Bayern Munich': TEAM_COLORS[157],
  'Borussia Dortmund': TEAM_COLORS[165],
  
  // 세리에 A
  'Juventus': TEAM_COLORS[496],
  'AC Milan': TEAM_COLORS[489],
  'Inter': TEAM_COLORS[505],
  
  // 리그 1
  'Paris Saint-Germain': TEAM_COLORS[85],
  'PSG': TEAM_COLORS[85],
  
  // K리그
  '울산': TEAM_COLORS[2748],
  '전북': TEAM_COLORS[2749],
  '포항': TEAM_COLORS[2750],
  'FC Seoul': TEAM_COLORS[2752],
  'FC 서울': TEAM_COLORS[2752],
}

// 팀 컬러 가져오기 함수
export function getTeamColor(teamId?: number, teamName?: string): TeamColors {
  // 팀 ID로 찾기
  if (teamId && TEAM_COLORS[teamId]) {
    return TEAM_COLORS[teamId]
  }
  
  // 팀 이름으로 찾기
  if (teamName && TEAM_COLORS_BY_NAME[teamName]) {
    return TEAM_COLORS_BY_NAME[teamName]
  }
  
  // 기본 색상 (회색)
  return {
    primary: '#6B7280',
    text: 'white'
  }
}