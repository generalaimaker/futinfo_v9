// 축구 관련 주요 용어 사전
export const footballDictionary: Record<string, string> = {
  // 팀 이름
  'Manchester United': '맨체스터 유나이티드',
  'Manchester City': '맨체스터 시티',
  'Liverpool': '리버풀',
  'Chelsea': '첼시',
  'Arsenal': '아스널',
  'Tottenham': '토트넘',
  'Real Madrid': '레알 마드리드',
  'Barcelona': '바르셀로나',
  'Bayern Munich': '바이에른 뮌헨',
  'Paris Saint-Germain': '파리 생제르맹',
  'PSG': 'PSG',
  'Juventus': '유벤투스',
  'Inter Milan': '인터 밀란',
  'AC Milan': 'AC 밀란',
  'Atletico Madrid': '아틀레티코 마드리드',
  
  // 대회 이름
  'Premier League': '프리미어리그',
  'Champions League': '챔피언스리그',
  'Europa League': '유로파리그',
  'La Liga': '라리가',
  'Serie A': '세리에 A',
  'Bundesliga': '분데스리가',
  'Ligue 1': '리그 1',
  'World Cup': '월드컵',
  'Euro': '유로',
  'FA Cup': 'FA컵',
  'League Cup': '리그컵',
  'Carabao Cup': '카라바오컵',
  
  // 포지션
  'striker': '스트라이커',
  'midfielder': '미드필더',
  'defender': '수비수',
  'goalkeeper': '골키퍼',
  'forward': '공격수',
  'winger': '윙어',
  'center-back': '센터백',
  'left-back': '레프트백',
  'right-back': '라이트백',
  
  // 축구 용어
  'goal': '골',
  'goals': '골',
  'assist': '어시스트',
  'assists': '어시스트',
  'hat-trick': '해트트릭',
  'penalty': '페널티',
  'free kick': '프리킥',
  'corner': '코너킥',
  'offside': '오프사이드',
  'red card': '레드카드',
  'yellow card': '옐로카드',
  'match': '경기',
  'game': '경기',
  'victory': '승리',
  'win': '승리',
  'wins': '승리',
  'defeat': '패배',
  'loss': '패배',
  'draw': '무승부',
  'scores': '득점',
  'scored': '득점',
  'scoring': '득점',
  'stunning': '놀라운',
  'amazing': '놀라운',
  'brilliant': '훌륭한',
  'transfer': '이적',
  'injury': '부상',
  'lineup': '라인업',
  'formation': '포메이션',
  'substitute': '교체',
  'manager': '감독',
  'coach': '코치',
  'captain': '주장',
  'season': '시즌',
  'points': '포인트',
  'table': '순위표',
  'standings': '순위',
  'top': '상위',
  'bottom': '하위',
  'home': '홈',
  'away': '원정',
  
  // 일반 동사
  'beats': '이기다',
  'defeats': '패배시키다',
  'loses': '패배하다',
  'draws': '무승부하다',
  'leads': '선두를 달리다',
  'trails': '뒤처지다',
  'dominates': '압도하다',
  'struggles': '고전하다',
  'signs': '영입하다',
  'extends': '연장하다',
  'confirms': '확정하다',
  'announces': '발표하다',
  'reveals': '밝히다',
  'targets': '노리다',
  'pursues': '추진하다',
  'rejects': '거절하다',
  'accepts': '수락하다',
  
  // 시간 표현
  'today': '오늘',
  'yesterday': '어제',
  'tomorrow': '내일',
  'tonight': '오늘 밤',
  'this week': '이번 주',
  'next week': '다음 주',
  'last week': '지난 주',
  'this season': '이번 시즌',
  'next season': '다음 시즌',
  
  // 기타 표현
  'breaking': '속보',
  'official': '공식',
  'confirmed': '확정',
  'rumor': '루머',
  'report': '보도',
  'exclusive': '단독',
  'update': '업데이트',
  'news': '뉴스',
  'latest': '최신',
  'in': '에서',
  'vs': '대',
  'against': '상대로',
  'for': '위한',
  'with': '함께',
  'without': '없이',
  'after': '후',
  'before': '전',
  'during': '중',
}

// 간단한 규칙 기반 번역 함수
export function simpleTranslate(text: string): string {
  let translated = text
  
  // 대소문자 구분 없이 단어 매칭
  Object.entries(footballDictionary).forEach(([eng, kor]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi')
    translated = translated.replace(regex, kor)
  })
  
  // 숫자-숫자 형식의 스코어는 그대로 유지
  translated = translated.replace(/(\d+)\s*-\s*(\d+)/g, '$1-$2')
  
  // 년도는 그대로 유지
  translated = translated.replace(/\b(19|20)\d{2}\b/g, (match) => match)
  
  return translated
}