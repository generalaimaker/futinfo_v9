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
export function gridToFieldPosition(grid: string): { x: number, y: number } {
  const parsed = parseGridPosition(grid)
  
  if (!parsed) {
    return { x: 50, y: 50 } // 기본 중앙 위치
  }
  
  const { row, col } = parsed
  
  // x 위치 계산 (1-11 columns, 왼쪽에서 오른쪽으로)
  let x = 50
  if (col <= 11) {
    // 11칸 그리드 시스템
    // col 1 = 가장 왼쪽(10%), col 11 = 가장 오른쪽(90%)
    x = 5 + (col - 1) * 9 // 5%에서 95%까지 분포
  }
  
  // y 위치 계산 (row를 필드 위치로 변환)
  // API-Football 그리드: row 1 = 골키퍼, row 숫자가 클수록 앞쪽(공격)
  let y = 50
  
  // 일반적인 축구 필드 그리드 (1-7 rows)
  if (row <= 7) {
    const yPositions: { [key: number]: number } = {
      1: 90,  // 골키퍼 (가장 뒤)
      2: 75,  // 수비수 라인
      3: 60,  // 수비형 미드필더
      4: 50,  // 중앙 미드필더
      5: 40,  // 공격형 미드필더
      6: 30,  // 공격수 라인
      7: 20   // 최전방 (FW)
    }
    y = yPositions[row] || 50
  } else {
    // 더 많은 row가 있는 경우
    y = 90 - ((row - 1) * 10) // 역순으로 균등 분포
  }
  
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
  
  // Grid 정보가 있는 선수가 하나라도 있는지 확인
  const hasGridInfo = players.some(p => p.player.grid)
  console.log('[arrangePlayersByPosition] Has grid info:', hasGridInfo)
  
  if (hasGridInfo) {
    // Grid 정보가 있으면 grid 기반으로 배치
    players.forEach(player => {
      let fieldPosition: { x: number, y: number }
      
      if (player.player.grid) {
        fieldPosition = gridToFieldPosition(player.player.grid)
        console.log(`[arrangePlayersByPosition] ${player.player.name} using grid ${player.player.grid} -> x:${fieldPosition.x}, y:${fieldPosition.y}`)
      } else {
        // Grid가 없는 선수는 기본 위치
        fieldPosition = { x: 50, y: 50 }
      }
      
      result.push({ ...player, fieldPosition })
    })
  } else {
    // Grid 정보가 없으면 포지션/인덱스 기반으로 배치
    const formationParts = formation.split('-').map(n => parseInt(n) || 0)
    const [defenders = 4, midfielders = 3, forwards = 3] = formationParts
    
    // 포지션별 선수 분류
    const byPosition: { [key: string]: PlayerPosition[] } = {
      G: [],
      D: [],
      M: [],
      F: []
    }
    
    // 포지션 정보가 있는지 확인
    const hasPositionInfo = players.some(p => p.player.pos)
    console.log('[arrangePlayersByPosition] Has position info:', hasPositionInfo)
    
    if (hasPositionInfo) {
      // 포지션 정보로 분류
      players.forEach((player, idx) => {
        const pos = player.player.pos?.toUpperCase() || ''
        if (pos.includes('G') || (idx === 0 && !pos)) {
          byPosition.G.push(player)
        } else if (pos.includes('D') || pos.includes('B')) {
          byPosition.D.push(player)
        } else if (pos.includes('M')) {
          byPosition.M.push(player)
        } else if (pos.includes('F') || pos.includes('W') || pos.includes('S')) {
          byPosition.F.push(player)
        } else {
          // 포지션이 명확하지 않으면 미드필더로 분류
          byPosition.M.push(player)
        }
      })
    } else {
      // 포지션 정보가 없으면 인덱스로 추론
      players.forEach((player, idx) => {
        if (idx === 0) {
          byPosition.G.push(player)
        } else if (idx >= 1 && idx <= defenders) {
          byPosition.D.push(player)
        } else if (idx > defenders && idx <= defenders + midfielders) {
          byPosition.M.push(player)
        } else if (idx > defenders + midfielders) {
          byPosition.F.push(player)
        }
      })
    }
    
    console.log('[arrangePlayersByPosition] Grouped by position:', {
      G: byPosition.G.length,
      D: byPosition.D.length,
      M: byPosition.M.length,
      F: byPosition.F.length
    })
    
    // 골키퍼 배치
    byPosition.G.forEach(player => {
      const position = { x: 50, y: 90 }
      console.log(`[arrangePlayersByPosition] GK ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
    
    // 수비수 배치
    const defCount = byPosition.D.length > 0 ? byPosition.D.length : defenders
    const defPositions = getDefenderPositions(defCount)
    console.log(`[arrangePlayersByPosition] Defender positions (${defCount}):`, defPositions)
    byPosition.D.forEach((player, idx) => {
      const position = defPositions[idx] || { x: 50, y: 75 }
      console.log(`[arrangePlayersByPosition] DEF ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
    
    // 미드필더 배치
    const midCount = byPosition.M.length > 0 ? byPosition.M.length : midfielders
    const midPositions = getMidfielderPositions(midCount, formation)
    console.log(`[arrangePlayersByPosition] Midfielder positions (${midCount}):`, midPositions)
    byPosition.M.forEach((player, idx) => {
      const position = midPositions[idx] || { x: 50, y: 50 }
      console.log(`[arrangePlayersByPosition] MID ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
    
    // 공격수 배치
    const fwdCount = byPosition.F.length > 0 ? byPosition.F.length : forwards
    const fwdPositions = getForwardPositions(fwdCount)
    console.log(`[arrangePlayersByPosition] Forward positions (${fwdCount}):`, fwdPositions)
    byPosition.F.forEach((player, idx) => {
      const position = fwdPositions[idx] || { x: 50, y: 25 }
      console.log(`[arrangePlayersByPosition] FWD ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
  }
  
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
        x: 10 + (i * 80 / Math.max(1, count - 1)),
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
        x: 10 + (i * 80 / Math.max(1, count - 1)),
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
        x: 20 + (i * 60 / Math.max(1, count - 1)),
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