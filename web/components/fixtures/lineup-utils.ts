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
  
  // x 위치 계산 (1~5 columns를 0~100%로 매핑)
  const xPositions: { [key: number]: number } = {
    1: 15,  // 왼쪽 사이드
    2: 35,  // 왼쪽 중앙
    3: 50,  // 중앙
    4: 65,  // 오른쪽 중앙
    5: 85   // 오른쪽 사이드
  }
  
  // y 위치 계산 (row를 필드 위치로 변환)
  // row 1 = GK (90%), row 2-3 = DF (70-75%), row 4-5 = MF (45-55%), row 6-7 = FW (20-30%)
  const yPositions: { [key: number]: number } = {
    1: 90,  // GK
    2: 75,  // DF line
    3: 70,  // DF line (CB)
    4: 55,  // DM/CM
    5: 45,  // AM/CM
    6: 30,  // FW/Winger
    7: 20   // ST
  }
  
  const x = xPositions[col] || 50
  const y = yPositions[row] || 50
  
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
  
  // 포지션별 인덱스 추적을 위한 객체
  const positionIndices: { [key: string]: number } = {
    D: 0,
    M: 0,
    F: 0
  }
  
  players.forEach((player, index) => {
    let fieldPosition: { x: number, y: number }
    
    // 1. Grid 정보가 있으면 우선 사용
    if (player.player.grid) {
      console.log(`[arrangePlayersByPosition] Player ${player.player.name} has grid: ${player.player.grid}`)
      fieldPosition = gridToFieldPosition(player.player.grid)
    } 
    // 2. Grid가 없으면 포지션 기반 위치 계산
    else {
      const pos = player.player.pos?.toUpperCase() || ''
      console.log(`[arrangePlayersByPosition] Player ${player.player.name} position: ${pos}`)
      
      if (pos === 'G' || pos.includes('G')) {
        fieldPosition = { x: 50, y: 90 }
      } else if (pos === 'D' || pos.includes('D') || pos.includes('B')) {
        fieldPosition = positionToFieldPosition('D', positionIndices.D++, formation)
      } else if (pos === 'M' || pos.includes('M')) {
        fieldPosition = positionToFieldPosition('M', positionIndices.M++, formation)
      } else if (pos === 'F' || pos.includes('F') || pos.includes('W') || pos.includes('S')) {
        fieldPosition = positionToFieldPosition('F', positionIndices.F++, formation)
      } else {
        // 포지션이 없는 경우 인덱스 기반으로 추론
        if (index === 0) {
          fieldPosition = { x: 50, y: 90 } // 첫 번째는 골키퍼
        } else if (index <= 4) {
          fieldPosition = positionToFieldPosition('D', positionIndices.D++, formation)
        } else if (index <= 7) {
          fieldPosition = positionToFieldPosition('M', positionIndices.M++, formation)
        } else {
          fieldPosition = positionToFieldPosition('F', positionIndices.F++, formation)
        }
      }
    }
    
    console.log(`[arrangePlayersByPosition] ${player.player.name} -> x:${fieldPosition.x}, y:${fieldPosition.y}`)
    
    result.push({
      ...player,
      fieldPosition
    })
  })
  
  return result
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