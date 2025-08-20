// 선수 포지션을 기반으로 필드 위치 계산
export interface PlayerPosition {
  player: {
    id: number
    name: string
    number: number
    pos?: string
    grid?: string
  }
}

// Grid 위치를 x, y 좌표로 변환 (grid 형식: "row:col")
export function parseGridPosition(grid: string): { row: number, col: number } | null {
  if (!grid) return null
  const parts = grid.split(':')
  if (parts.length !== 2) return null
  
  const row = parseInt(parts[0])
  const col = parseInt(parts[1])
  
  if (isNaN(row) || isNaN(col)) return null
  return { row, col }
}

// Grid 위치를 필드 좌표로 변환
export function gridToFieldPosition(grid: string, maxRows: number = 7): { x: number, y: number } {
  const parsed = parseGridPosition(grid)
  
  if (!parsed) {
    return { x: 50, y: 50 } // 기본 중앙 위치
  }
  
  const { row, col } = parsed
  
  // x 위치 계산 (1-5 또는 1-11 columns)
  let x = 50
  if (col <= 5) {
    // 5칸 그리드 시스템
    const xPositions5: { [key: number]: number } = {
      1: 15,  // 왼쪽 사이드
      2: 35,  // 왼쪽 중앙
      3: 50,  // 중앙
      4: 65,  // 오른쪽 중앙
      5: 85   // 오른쪽 사이드
    }
    x = xPositions5[col] || 50
  } else {
    // 11칸 그리드 시스템 (더 세밀한 위치)
    x = 10 + (col - 1) * 8 // 10%에서 90%까지 균등 분포
  }
  
  // y 위치 계산 (row를 필드 위치로 변환)
  // row가 클수록 공격진에 가까움 (일반적인 그리드와 반대)
  const yPositions: { [key: number]: number } = {
    1: 90,  // GK
    2: 75,  // DF line (back)
    3: 70,  // DF line (center back)
    4: 55,  // DM/CM (defensive mid)
    5: 45,  // CM/AM (central mid)
    6: 35,  // AM/Winger (attacking mid)
    7: 25,  // FW/ST (forward)
    8: 20,  // ST (striker)
    9: 15,  // Very forward
    10: 10, // Most forward
    11: 5   // Extreme forward
  }
  
  const y = yPositions[row] || (90 - (row - 1) * 8) // 폴백: row가 클수록 앞쪽
  
  return { x, y }
}

// 포지션 텍스트를 기반으로 위치 계산 (grid가 없을 때 폴백)
export function positionToFieldPosition(position: string, index: number, formation: string): { x: number, y: number } {
  const pos = position?.toUpperCase() || ''
  
  // 골키퍼
  if (pos === 'G' || pos === 'GK') {
    return { x: 50, y: 90 }
  }
  
  // 포메이션 파싱
  const formationParts = formation.split('-').map(n => parseInt(n))
  if (formationParts.length < 3) {
    formationParts.push(0, 0, 0) // 기본값
  }
  
  const [defenders, midfielders, forwards] = formationParts
  
  // 수비수
  if (pos === 'D' || pos.includes('B')) {
    if (defenders === 4) {
      const positions = [
        { x: 20, y: 75 }, // LB
        { x: 40, y: 75 }, // LCB
        { x: 60, y: 75 }, // RCB
        { x: 80, y: 75 }  // RB
      ]
      return positions[index % 4] || { x: 50, y: 75 }
    } else if (defenders === 3) {
      const positions = [
        { x: 30, y: 75 }, // LCB
        { x: 50, y: 75 }, // CB
        { x: 70, y: 75 }  // RCB
      ]
      return positions[index % 3] || { x: 50, y: 75 }
    } else if (defenders === 5) {
      const positions = [
        { x: 15, y: 75 }, // LWB
        { x: 35, y: 75 }, // LCB
        { x: 50, y: 75 }, // CB
        { x: 65, y: 75 }, // RCB
        { x: 85, y: 75 }  // RWB
      ]
      return positions[index % 5] || { x: 50, y: 75 }
    }
  }
  
  // 미드필더
  if (pos === 'M' || pos.includes('M')) {
    if (midfielders === 3) {
      const positions = [
        { x: 30, y: 50 }, // LCM
        { x: 50, y: 50 }, // CM
        { x: 70, y: 50 }  // RCM
      ]
      return positions[index % 3] || { x: 50, y: 50 }
    } else if (midfielders === 4) {
      const positions = [
        { x: 20, y: 50 }, // LM
        { x: 40, y: 50 }, // LCM
        { x: 60, y: 50 }, // RCM
        { x: 80, y: 50 }  // RM
      ]
      return positions[index % 4] || { x: 50, y: 50 }
    } else if (midfielders === 5) {
      const positions = [
        { x: 15, y: 50 }, // LWM
        { x: 35, y: 50 }, // LCM
        { x: 50, y: 50 }, // CM
        { x: 65, y: 50 }, // RCM
        { x: 85, y: 50 }  // RWM
      ]
      return positions[index % 5] || { x: 50, y: 50 }
    } else if (midfielders === 2) {
      const positions = [
        { x: 35, y: 55 }, // LDM
        { x: 65, y: 55 }  // RDM
      ]
      return positions[index % 2] || { x: 50, y: 55 }
    }
  }
  
  // 공격수
  if (pos === 'F' || pos.includes('W') || pos.includes('S')) {
    if (forwards === 3) {
      const positions = [
        { x: 25, y: 25 }, // LW
        { x: 50, y: 25 }, // ST
        { x: 75, y: 25 }  // RW
      ]
      return positions[index % 3] || { x: 50, y: 25 }
    } else if (forwards === 2) {
      const positions = [
        { x: 35, y: 25 }, // LS
        { x: 65, y: 25 }  // RS
      ]
      return positions[index % 2] || { x: 50, y: 25 }
    } else if (forwards === 1) {
      return { x: 50, y: 20 } // ST
    }
  }
  
  // 기본값
  return { x: 50, y: 50 }
}

// 선수 배열을 포지션별로 정렬하고 위치 할당
export function arrangePlayersByPosition(
  players: PlayerPosition[], 
  formation: string
): Array<PlayerPosition & { fieldPosition: { x: number, y: number } }> {
  if (!players || players.length === 0) return []
  
  console.log('[arrangePlayersByPosition] Input players:', players)
  console.log('[arrangePlayersByPosition] Formation:', formation)
  
  const result: Array<PlayerPosition & { fieldPosition: { x: number, y: number } }> = []
  const usedPositions = new Set<string>() // 중복 위치 방지
  
  // 포메이션 파싱
  const formationParts = formation.split('-').map(n => parseInt(n) || 0)
  const [defenders = 4, midfielders = 3, forwards = 3] = formationParts
  
  // 포지션별 선수 분류
  const byPosition: { [key: string]: PlayerPosition[] } = {
    G: [],
    D: [],
    M: [],
    F: []
  }
  
  players.forEach((player, idx) => {
    const pos = player.player.pos?.toUpperCase() || ''
    if (pos.includes('G') || idx === 0) {
      byPosition.G.push(player)
    } else if (pos.includes('D') || pos.includes('B')) {
      byPosition.D.push(player)
    } else if (pos.includes('M')) {
      byPosition.M.push(player)
    } else if (pos.includes('F') || pos.includes('W') || pos.includes('S')) {
      byPosition.F.push(player)
    } else {
      // 포지션이 없으면 인덱스로 추론
      if (idx <= defenders) byPosition.D.push(player)
      else if (idx <= defenders + midfielders) byPosition.M.push(player)
      else byPosition.F.push(player)
    }
  })
  
  // 골키퍼 배치
  byPosition.G.forEach(player => {
    const position = { x: 50, y: 90 }
    result.push({ ...player, fieldPosition: position })
  })
  
  // 수비수 배치
  const defPositions = getDefenderPositions(defenders)
  byPosition.D.forEach((player, idx) => {
    const position = defPositions[idx] || { x: 50, y: 75 }
    result.push({ ...player, fieldPosition: position })
  })
  
  // 미드필더 배치
  const midPositions = getMidfielderPositions(midfielders, formation)
  byPosition.M.forEach((player, idx) => {
    const position = midPositions[idx] || { x: 50, y: 50 }
    result.push({ ...player, fieldPosition: position })
  })
  
  // 공격수 배치
  const fwdPositions = getForwardPositions(forwards)
  byPosition.F.forEach((player, idx) => {
    const position = fwdPositions[idx] || { x: 50, y: 25 }
    result.push({ ...player, fieldPosition: position })
  })
  
  return result
}

// 수비수 위치 계산
function getDefenderPositions(count: number): Array<{ x: number, y: number }> {
  switch(count) {
    case 3:
      return [
        { x: 25, y: 75 },  // LCB
        { x: 50, y: 75 },  // CB
        { x: 75, y: 75 }   // RCB
      ]
    case 4:
      return [
        { x: 15, y: 75 },  // LB
        { x: 38, y: 75 },  // LCB
        { x: 62, y: 75 },  // RCB
        { x: 85, y: 75 }   // RB
      ]
    case 5:
      return [
        { x: 10, y: 75 },  // LWB
        { x: 30, y: 75 },  // LCB
        { x: 50, y: 75 },  // CB
        { x: 70, y: 75 },  // RCB
        { x: 90, y: 75 }   // RWB
      ]
    default:
      return Array(count).fill(null).map((_, i) => ({
        x: 15 + (i * 70 / (count - 1)),
        y: 75
      }))
  }
}

// 미드필더 위치 계산
function getMidfielderPositions(count: number, formation: string): Array<{ x: number, y: number }> {
  // 4-2-3-1 같은 특수 포메이션 처리
  if (formation === '4-2-3-1') {
    return [
      { x: 35, y: 60 },  // LDM
      { x: 65, y: 60 },  // RDM
      { x: 20, y: 40 },  // LAM
      { x: 50, y: 40 },  // CAM
      { x: 80, y: 40 }   // RAM
    ]
  }
  
  switch(count) {
    case 2:
      return [
        { x: 35, y: 55 },  // LCM
        { x: 65, y: 55 }   // RCM
      ]
    case 3:
      return [
        { x: 25, y: 50 },  // LCM
        { x: 50, y: 50 },  // CM
        { x: 75, y: 50 }   // RCM
      ]
    case 4:
      return [
        { x: 15, y: 50 },  // LM
        { x: 38, y: 50 },  // LCM
        { x: 62, y: 50 },  // RCM
        { x: 85, y: 50 }   // RM
      ]
    case 5:
      return [
        { x: 10, y: 50 },  // LWM
        { x: 30, y: 50 },  // LCM
        { x: 50, y: 50 },  // CM
        { x: 70, y: 50 },  // RCM
        { x: 90, y: 50 }   // RWM
      ]
    default:
      return Array(count).fill(null).map((_, i) => ({
        x: 15 + (i * 70 / (count - 1)),
        y: 50
      }))
  }
}

// 공격수 위치 계산
function getForwardPositions(count: number): Array<{ x: number, y: number }> {
  switch(count) {
    case 1:
      return [{ x: 50, y: 20 }]  // ST
    case 2:
      return [
        { x: 35, y: 25 },  // LS
        { x: 65, y: 25 }   // RS
      ]
    case 3:
      return [
        { x: 20, y: 25 },  // LW
        { x: 50, y: 20 },  // ST
        { x: 80, y: 25 }   // RW
      ]
    default:
      return Array(count).fill(null).map((_, i) => ({
        x: 20 + (i * 60 / (count - 1)),
        y: 25
      }))
  }
}

// 포메이션 문자열 검증 및 정규화
export function normalizeFormation(formation: string): string {
  // 유효한 포메이션 패턴
  const validFormations = [
    '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '3-4-3',
    '4-1-4-1', '4-3-2-1', '4-1-2-1-2', '3-4-1-2', '5-4-1',
    '4-2-2-2', '4-3-1-2', '4-5-1', '3-4-2-1'
  ]
  
  // 입력 정규화 (공백 제거, 대시 통일)
  const normalized = formation.replace(/\s+/g, '').replace(/[－‐−–—]/g, '-')
  
  // 유효한 포메이션인지 확인
  if (validFormations.includes(normalized)) {
    return normalized
  }
  
  // 기본값
  return '4-3-3'
}