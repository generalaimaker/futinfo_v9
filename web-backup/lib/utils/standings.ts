// 진출권 정보 타입
export enum QualificationInfo {
  ChampionsLeague = 'championsLeague',
  ChampionsLeagueQualification = 'championsLeagueQualification',
  EuropaLeague = 'europaLeague',
  EuropaLeagueQualification = 'europaLeagueQualification',
  ConferenceLeague = 'conferenceLeague',
  ConferenceLeagueQualification = 'conferenceLeagueQualification',
  Relegation = 'relegation',
  RelegationPlayoff = 'relegationPlayoff',
  Knockout16Direct = 'knockout16Direct',
  Knockout16Playoff = 'knockout16Playoff',
  None = 'none'
}

// 리그별 진출권 정보 가져오기
export function getQualificationInfo(rank: number, leagueId: number, totalTeams: number): QualificationInfo {
  switch (leagueId) {
    case 2: // 챔피언스리그
      if (rank <= 8) {
        return QualificationInfo.Knockout16Direct // 1위~8위: 16강 직행
      } else if (rank <= 24) {
        return QualificationInfo.Knockout16Playoff // 9위~24위: 16강 플레이오프
      }
      break
      
    case 3: // 유로파리그
      if (rank <= 8) {
        return QualificationInfo.Knockout16Direct // 1위~8위: 16강 직행
      } else if (rank <= 24) {
        return QualificationInfo.Knockout16Playoff // 9위~24위: 16강 플레이오프
      }
      break
      
    case 39: // 프리미어 리그
      if (rank <= 4) {
        return QualificationInfo.ChampionsLeague
      } else if (rank === 5) {
        return QualificationInfo.EuropaLeague
      } else if (rank === 6) {
        return QualificationInfo.ConferenceLeague
      } else if (rank >= totalTeams - 2) {
        return QualificationInfo.Relegation
      }
      break
      
    case 140: // 라리가
      if (rank <= 4) {
        return QualificationInfo.ChampionsLeague
      } else if (rank === 5 || rank === 6) {
        return QualificationInfo.EuropaLeague
      } else if (rank === 7) {
        return QualificationInfo.ConferenceLeague
      } else if (rank >= totalTeams - 2) {
        return QualificationInfo.Relegation
      }
      break
      
    case 78: // 분데스리가
      if (rank <= 4) {
        return QualificationInfo.ChampionsLeague
      } else if (rank === 5) {
        return QualificationInfo.EuropaLeague
      } else if (rank === 6) {
        return QualificationInfo.ConferenceLeague
      } else if (rank === 16) {
        return QualificationInfo.RelegationPlayoff // 16위: 강등 플레이오프
      } else if (rank >= totalTeams - 1) {
        return QualificationInfo.Relegation
      }
      break
      
    case 135: // 세리에 A
      if (rank <= 4) {
        return QualificationInfo.ChampionsLeague
      } else if (rank === 5) {
        return QualificationInfo.EuropaLeague
      } else if (rank === 6) {
        return QualificationInfo.ConferenceLeagueQualification // 6위: 컨퍼런스리그 예선
      } else if (rank >= totalTeams - 2) {
        return QualificationInfo.Relegation
      }
      break
      
    case 61: // 리그앙
      if (rank <= 3) {
        return QualificationInfo.ChampionsLeague
      } else if (rank === 4) {
        return QualificationInfo.ChampionsLeagueQualification
      } else if (rank === 5) {
        return QualificationInfo.EuropaLeague
      } else if (rank === 6) {
        return QualificationInfo.ConferenceLeagueQualification // 6위: 컨퍼런스리그 예선
      } else if (rank === 16) {
        return QualificationInfo.RelegationPlayoff // 16위: 강등 플레이오프
      } else if (rank >= totalTeams - 1) {
        return QualificationInfo.Relegation
      }
      break
      
    default:
      if (rank <= 4) {
        return QualificationInfo.ChampionsLeague
      } else if (rank === 5 || rank === 6) {
        return QualificationInfo.EuropaLeague
      } else if (rank >= totalTeams - 2) {
        return QualificationInfo.Relegation
      }
  }
  
  return QualificationInfo.None
}

// 진출권 정보에 따른 색상
export function getQualificationColor(info: QualificationInfo, leagueId: number): string {
  switch (info) {
    case QualificationInfo.ChampionsLeague:
      // 챔피언스리그 진출 - 로열 블루
      return '#4169E1' // Royal Blue
      
    case QualificationInfo.ChampionsLeagueQualification:
      // 챔피언스리그 예선 - 밝은 하늘색
      return '#42A5F5' // Light Sky Blue
      
    case QualificationInfo.EuropaLeague:
      return '#FFA500' // Orange
      
    case QualificationInfo.EuropaLeagueQualification:
      // 유로파리그 예선 - 연한 오렌지색
      return '#FFB74D' // Light Orange
      
    case QualificationInfo.ConferenceLeague:
      return '#4CAF50' // Green
      
    case QualificationInfo.ConferenceLeagueQualification:
      // 컨퍼런스리그 예선 - 연한 녹색
      return '#81C784' // Light Green
      
    case QualificationInfo.Relegation:
      return '#F44336' // Red
      
    case QualificationInfo.RelegationPlayoff:
      // 강등 플레이오프 - 연한 빨간색
      return '#FF8A80' // Light Red
      
    case QualificationInfo.Knockout16Direct:
      // 리그 ID에 따라 다른 색상 적용
      if (leagueId === 2) { // 챔피언스리그
        return '#4169E1' // Royal Blue
      } else if (leagueId === 3) { // 유로파리그
        return '#FFA500' // Orange
      }
      return '#FFA500' // 기본값: Orange
      
    case QualificationInfo.Knockout16Playoff:
      // 리그 ID에 따라 다른 색상 적용
      if (leagueId === 2) { // 챔피언스리그
        return '#191970' // Midnight Blue
      } else if (leagueId === 3) { // 유로파리그
        return '#B87333' // Copper
      }
      return '#B87333' // 기본값: Copper
      
    case QualificationInfo.None:
    default:
      return 'transparent'
  }
}

// 진출권 정보에 따른 설명
export function getQualificationDescription(info: QualificationInfo): string {
  switch (info) {
    case QualificationInfo.ChampionsLeague:
      return '챔피언스리그'
    case QualificationInfo.ChampionsLeagueQualification:
      return '챔피언스리그 예선'
    case QualificationInfo.EuropaLeague:
      return '유로파리그'
    case QualificationInfo.EuropaLeagueQualification:
      return '유로파리그 예선'
    case QualificationInfo.ConferenceLeague:
      return '컨퍼런스리그'
    case QualificationInfo.ConferenceLeagueQualification:
      return '컨퍼런스리그 예선'
    case QualificationInfo.Relegation:
      return '강등권'
    case QualificationInfo.RelegationPlayoff:
      return '강등 플레이오프'
    case QualificationInfo.Knockout16Direct:
      return '16강 직행'
    case QualificationInfo.Knockout16Playoff:
      return '16강 플레이오프'
    case QualificationInfo.None:
    default:
      return ''
  }
}

// 해당 리그에 관련된 진출권 정보인지 확인
export function isQualificationRelevant(info: QualificationInfo, leagueId: number): boolean {
  switch (info) {
    case QualificationInfo.ChampionsLeague:
      return leagueId !== 2 && leagueId !== 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
      
    case QualificationInfo.ChampionsLeagueQualification:
      return leagueId === 61 // 리그앙에만 적용
      
    case QualificationInfo.EuropaLeague:
      return leagueId !== 2 && leagueId !== 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
      
    case QualificationInfo.EuropaLeagueQualification:
      return false // 현재 사용되지 않음
      
    case QualificationInfo.ConferenceLeague:
      return leagueId !== 2 && leagueId !== 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
      
    case QualificationInfo.ConferenceLeagueQualification:
      return leagueId === 61 || leagueId === 135 // 리그앙과 세리에 A에만 적용
      
    case QualificationInfo.Relegation:
      return leagueId !== 2 && leagueId !== 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
      
    case QualificationInfo.RelegationPlayoff:
      return leagueId === 61 || leagueId === 78 // 리그앙과 분데스리가에만 적용
      
    case QualificationInfo.Knockout16Direct:
      return leagueId === 2 || leagueId === 3 // 챔피언스리그와 유로파리그에만 적용
      
    case QualificationInfo.Knockout16Playoff:
      return leagueId === 2 || leagueId === 3 // 챔피언스리그와 유로파리그에만 적용
      
    case QualificationInfo.None:
    default:
      return false
  }
}