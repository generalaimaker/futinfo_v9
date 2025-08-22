// 개선된 라인업 유틸리티 - 정확한 포메이션 및 위치 계산
export interface PlayerPosition {
  player: {
    id: number
    name: string
    number: number
    pos?: string
    grid?: string
  }
}

export interface FieldPosition {
  x: number
  y: number
}

// Grid 위치 파싱 (row:col 형식)
export function parseGridPosition(grid: string): { row: number, col: number } | null {
  if (!grid) return null
  const parts = grid.split(':')
  if (parts.length !== 2) return null
  
  const row = parseInt(parts[0])
  const col = parseInt(parts[1])
  
  if (isNaN(row) || isNaN(col)) return null
  return { row, col }
}

// 포메이션 감지 및 정규화
export function detectFormation(players: PlayerPosition[]): string {
  // Grid 정보가 있으면 row별로 카운트
  const hasGrid = players.some(p => p.player.grid)
  
  if (hasGrid) {
    const rowCounts: { [key: number]: number } = {}
    players.forEach(p => {
      if (p.player.grid) {
        const parsed = parseGridPosition(p.player.grid)
        if (parsed && parsed.row > 1) { // 골키퍼 제외
          rowCounts[parsed.row] = (rowCounts[parsed.row] || 0) + 1
        }
      }
    })
    
    // row 2, 3, 4, 5 기반으로 포메이션 구성
    const defenders = rowCounts[2] || 0
    const dmf = rowCounts[3] || 0  // 수비형 미드필더
    const amf = rowCounts[4] || 0  // 공격형 미드필더
    const forwards = rowCounts[5] || 0
    
    // 특수 포메이션 처리
    if (defenders === 4 && dmf === 2 && amf === 3 && forwards === 1) {
      return '4-2-3-1'
    } else if (defenders === 3 && dmf === 4 && amf === 1 && forwards === 2) {
      return '3-4-1-2'
    } else if (defenders === 3 && (dmf + amf) === 5 && forwards === 2) {
      return '3-5-2'
    } else if (defenders === 5 && (dmf + amf) === 3 && forwards === 2) {
      return '5-3-2'
    } else {
      // 일반 포메이션
      const midfielders = dmf + amf
      return `${defenders}-${midfielders}-${forwards}`
    }
  } else {
    // Grid 없으면 포지션 기반
    const positions = players.map(p => p.player.pos || '')
    const defenders = positions.filter(p => p === 'D').length
    const midfielders = positions.filter(p => p === 'M').length
    const forwards = positions.filter(p => p === 'F').length
    
    // 특수 케이스: 미드필더가 5명인 경우
    if (defenders === 4 && midfielders === 5 && forwards === 1) {
      return '4-2-3-1'
    }
    
    return `${defenders}-${midfielders}-${forwards}`
  }
}

// Grid 기반 정확한 위치 계산
export function gridToPosition(row: number, col: number, maxCols: number = 5): FieldPosition {
  // X 좌표 계산 (수평 위치)
  let x = 50
  
  // 열 수에 따른 동적 위치 계산
  if (maxCols === 1) {
    x = 50 // 중앙
  } else if (maxCols === 2) {
    x = col === 1 ? 35 : 65
  } else if (maxCols === 3) {
    const positions = [25, 50, 75]
    x = positions[col - 1] || 50
  } else if (maxCols === 4) {
    const positions = [20, 40, 60, 80]
    x = positions[col - 1] || 50
  } else if (maxCols === 5) {
    const positions = [15, 32, 50, 68, 85]
    x = positions[col - 1] || 50
  } else {
    // 6명 이상
    x = 10 + ((col - 1) * 80 / (maxCols - 1))
  }
  
  // Y 좌표 계산 (수직 위치)
  const yPositions: { [key: number]: number } = {
    1: 90,  // 골키퍼
    2: 75,  // 수비수
    3: 57,  // 수비형 미드필더
    4: 38,  // 공격형 미드필더
    5: 20,  // 공격수
    6: 12,  // 최전방
    7: 8    // 극전방
  }
  
  const y = yPositions[row] || (95 - (row * 12))
  
  return { x, y }
}

// 포메이션 기반 위치 계산 (Grid 없는 경우)
export function formationToPositions(formation: string, players: PlayerPosition[]): Map<number, FieldPosition> {
  const positionMap = new Map<number, FieldPosition>()
  
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
    }
  })
  
  // 골키퍼
  byPosition.G.forEach(player => {
    positionMap.set(player.player.id, { x: 50, y: 90 })
  })
  
  // 포메이션 파싱
  const parts = formation.split('-').map(n => parseInt(n) || 0)
  
  // 특수 포메이션 처리
  if (formation === '4-2-3-1') {
    // 수비수 4명
    const defPositions = [
      { x: 20, y: 75 },
      { x: 40, y: 75 },
      { x: 60, y: 75 },
      { x: 80, y: 75 }
    ]
    byPosition.D.forEach((player, idx) => {
      positionMap.set(player.player.id, defPositions[idx] || { x: 50, y: 75 })
    })
    
    // 미드필더 5명 (2 CDM + 3 CAM)
    const midPositions = [
      { x: 35, y: 60 },  // LDM
      { x: 65, y: 60 },  // RDM
      { x: 20, y: 38 },  // LAM
      { x: 50, y: 38 },  // CAM
      { x: 80, y: 38 }   // RAM
    ]
    byPosition.M.forEach((player, idx) => {
      positionMap.set(player.player.id, midPositions[idx] || { x: 50, y: 50 })
    })
    
    // 공격수 1명
    byPosition.F.forEach(player => {
      positionMap.set(player.player.id, { x: 50, y: 20 })
    })
  } else if (formation === '3-4-1-2') {
    // 수비수 3명
    const defPositions = [
      { x: 30, y: 75 },
      { x: 50, y: 75 },
      { x: 70, y: 75 }
    ]
    byPosition.D.forEach((player, idx) => {
      positionMap.set(player.player.id, defPositions[idx] || { x: 50, y: 75 })
    })
    
    // 미드필더 5명 (4 + 1)
    const midPositions = [
      { x: 15, y: 55 },  // LWM
      { x: 38, y: 55 },  // LCM
      { x: 62, y: 55 },  // RCM
      { x: 85, y: 55 },  // RWM
      { x: 50, y: 38 }   // CAM
    ]
    byPosition.M.forEach((player, idx) => {
      positionMap.set(player.player.id, midPositions[idx] || { x: 50, y: 50 })
    })
    
    // 공격수 2명
    const fwdPositions = [
      { x: 35, y: 20 },
      { x: 65, y: 20 }
    ]
    byPosition.F.forEach((player, idx) => {
      positionMap.set(player.player.id, fwdPositions[idx] || { x: 50, y: 20 })
    })
  } else {
    // 일반 포메이션
    const [defenders, midfielders, forwards] = parts
    
    // 수비수
    const defPositions = getLinePositions(defenders, 75)
    byPosition.D.forEach((player, idx) => {
      positionMap.set(player.player.id, defPositions[idx] || { x: 50, y: 75 })
    })
    
    // 미드필더
    const midPositions = getLinePositions(midfielders, 50)
    byPosition.M.forEach((player, idx) => {
      positionMap.set(player.player.id, midPositions[idx] || { x: 50, y: 50 })
    })
    
    // 공격수
    const fwdPositions = getLinePositions(forwards, 25)
    byPosition.F.forEach((player, idx) => {
      positionMap.set(player.player.id, fwdPositions[idx] || { x: 50, y: 25 })
    })
  }
  
  return positionMap
}

// 라인별 위치 계산
function getLinePositions(count: number, y: number): FieldPosition[] {
  if (count === 0) return []
  if (count === 1) return [{ x: 50, y }]
  
  const positions: FieldPosition[] = []
  const spacing = 70 / (count - 1)
  
  for (let i = 0; i < count; i++) {
    positions.push({
      x: 15 + (i * spacing),
      y
    })
  }
  
  return positions
}

// 메인 함수: 선수 배치
export function arrangePlayersV2(
  players: PlayerPosition[],
  formation: string,
  isHomeTeam: boolean = true
): Array<PlayerPosition & { fieldPosition: FieldPosition }> {
  if (!players || players.length === 0) return []
  
  const result: Array<PlayerPosition & { fieldPosition: FieldPosition }> = []
  const hasGrid = players.some(p => p.player.grid)
  
  if (hasGrid) {
    // Grid 기반 배치
    // 먼저 row별 최대 col 수 계산
    const maxColsByRow: { [key: number]: number } = {}
    players.forEach(p => {
      if (p.player.grid) {
        const parsed = parseGridPosition(p.player.grid)
        if (parsed) {
          maxColsByRow[parsed.row] = Math.max(maxColsByRow[parsed.row] || 0, parsed.col)
        }
      }
    })
    
    // 각 선수 배치
    players.forEach(player => {
      let position: FieldPosition
      
      if (player.player.grid) {
        const parsed = parseGridPosition(player.player.grid)
        if (parsed) {
          const maxCols = maxColsByRow[parsed.row] || 1
          position = gridToPosition(parsed.row, parsed.col, maxCols)
        } else {
          position = { x: 50, y: 50 }
        }
      } else {
        position = { x: 50, y: 50 }
      }
      
      // 원정팀은 좌우 반전
      if (!isHomeTeam) {
        position.x = 100 - position.x
      }
      
      result.push({ ...player, fieldPosition: position })
    })
  } else {
    // 포메이션 기반 배치
    const positionMap = formationToPositions(formation, players)
    
    players.forEach(player => {
      let position = positionMap.get(player.player.id) || { x: 50, y: 50 }
      
      // 원정팀은 좌우 반전
      if (!isHomeTeam) {
        position = { ...position, x: 100 - position.x }
      }
      
      result.push({ ...player, fieldPosition: position })
    })
  }
  
  return result
}