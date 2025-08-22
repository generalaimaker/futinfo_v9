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
  
  // x 위치 계산 (columns, 왼쪽에서 오른쪽으로)
  let x = 50
  
  // row별로 다른 x 위치 전략 적용
  // API-Football의 grid는 col 1이 왼쪽, col이 클수록 오른쪽
  if (row === 1) {
    // 골키퍼는 항상 중앙
    x = 50
  } else if (row === 2) {
    // 수비수 라인 (3-5명)
    if (col === 1) x = 20      // 왼쪽
    else if (col === 2) x = 40 // 중왼쪽
    else if (col === 3) x = 60 // 중오른쪽
    else if (col === 4) x = 80 // 오른쪽
    else if (col === 5) x = 90 // 극우측 (5백 포메이션)
    else x = 50
  } else if (row === 3) {
    // 미드필더 라인
    if (col === 1) x = 15      // 왼쪽
    else if (col === 2) x = 35 // 중왼쪽
    else if (col === 3) x = 50 // 중앙
    else if (col === 4) x = 65 // 중오른쪽
    else if (col === 5) x = 85 // 오른쪽
    else x = 50
  } else if (row === 4) {
    // 공격형 미드필더/세컨드 스트라이커 라인
    if (col === 1) x = 20      // 왼쪽
    else if (col === 2) x = 40 // 중왼쪽
    else if (col === 3) x = 50 // 중앙
    else if (col === 4) x = 60 // 중오른쪽
    else if (col === 5) x = 80 // 오른쪽
    else x = 50
  } else if (row === 5) {
    // 최전방 공격수 라인
    if (col === 1) x = 35      // 왼쪽 스트라이커
    else if (col === 2) x = 65 // 오른쪽 스트라이커
    else if (col === 3) x = 50 // 중앙 스트라이커
    else x = 50
  } else if (row === 6 || row === 7) {
    // 매우 공격적 위치 (드물게 사용)
    x = 30 + ((col - 1) * 40 / Math.max(2, col))
  } else {
    // 기타 row
    x = 20 + ((col - 1) * 60 / Math.max(3, col))
  }
  
  // y 위치 계산 (row를 필드 위치로 변환)
  // API-Football 그리드: row 1 = 골키퍼, row 숫자가 클수록 앞쪽(공격)
  let y = 50
  
  // 포메이션에 따라 다른 y 위치 적용
  // 대부분의 포메이션은 4-5개의 row를 사용
  const yPositions: { [key: number]: number } = {
    1: 90,  // 골키퍼 (가장 뒤)
    2: 75,  // 수비수 라인
    3: 55,  // 수비형/중앙 미드필더 라인
    4: 35,  // 공격형 미드필더 라인
    5: 20,  // 최전방 공격수
    6: 15,  // 매우 공격적 위치
    7: 10   // 극단적 전방
  }
  
  y = yPositions[row] || (90 - ((row - 1) * 15))
  
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
  formation: string,
  isHomeTeam: boolean = true
): Array<PlayerPosition & { fieldPosition: { x: number, y: number } }> {
  if (!players || players.length === 0) return []
  
  console.log('[arrangePlayersByPosition] Input players:', players)
  console.log('[arrangePlayersByPosition] Formation:', formation)
  console.log('[arrangePlayersByPosition] Is home team:', isHomeTeam)
  
  const result: Array<PlayerPosition & { fieldPosition: { x: number, y: number } }> = []
  
  // Grid 정보가 있는 선수가 하나라도 있는지 확인
  const hasGridInfo = players.some(p => p.player.grid)
  console.log('[arrangePlayersByPosition] Has grid info:', hasGridInfo)
  
  if (hasGridInfo) {
    // Grid 정보가 있으면 grid 기반으로 배치
    players.forEach(player => {
      let fieldPosition: { x: number, y: number }
      
      if (player.player.grid) {
        const parsed = parseGridPosition(player.player.grid)
        fieldPosition = gridToFieldPosition(player.player.grid)
        
        // 원정팀인 경우 x 좌표 반전
        if (!isHomeTeam) {
          fieldPosition.x = 100 - fieldPosition.x
        }
        
        console.log(`[arrangePlayersByPosition] ${player.player.name} grid:${player.player.grid} (row:${parsed?.row}, col:${parsed?.col}) -> x:${fieldPosition.x.toFixed(1)}, y:${fieldPosition.y.toFixed(1)}`)
      } else {
        // Grid가 없는 선수는 기본 위치
        fieldPosition = { x: 50, y: 50 }
        console.log(`[arrangePlayersByPosition] ${player.player.name} NO GRID -> default position`)
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
      let position = { x: 50, y: 90 }
      // 원정팀인 경우 x 좌표 반전
      if (!isHomeTeam) {
        position.x = 100 - position.x
      }
      console.log(`[arrangePlayersByPosition] GK ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
    
    // 수비수 배치
    const defCount = byPosition.D.length > 0 ? byPosition.D.length : defenders
    const defPositions = getDefenderPositions(defCount)
    console.log(`[arrangePlayersByPosition] Defender positions (${defCount}):`, defPositions)
    byPosition.D.forEach((player, idx) => {
      let position = defPositions[idx] || { x: 50, y: 75 }
      // 원정팀인 경우 x 좌표 반전
      if (!isHomeTeam) {
        position = { ...position, x: 100 - position.x }
      }
      console.log(`[arrangePlayersByPosition] DEF ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
    
    // 미드필더 배치
    const midCount = byPosition.M.length > 0 ? byPosition.M.length : midfielders
    const midPositions = getMidfielderPositions(midCount, formation)
    console.log(`[arrangePlayersByPosition] Midfielder positions (${midCount}):`, midPositions)
    byPosition.M.forEach((player, idx) => {
      let position = midPositions[idx] || { x: 50, y: 50 }
      // 원정팀인 경우 x 좌표 반전
      if (!isHomeTeam) {
        position = { ...position, x: 100 - position.x }
      }
      console.log(`[arrangePlayersByPosition] MID ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
    
    // 공격수 배치
    const fwdCount = byPosition.F.length > 0 ? byPosition.F.length : forwards
    const fwdPositions = getForwardPositions(fwdCount)
    console.log(`[arrangePlayersByPosition] Forward positions (${fwdCount}):`, fwdPositions)
    byPosition.F.forEach((player, idx) => {
      let position = fwdPositions[idx] || { x: 50, y: 25 }
      // 원정팀인 경우 x 좌표 반전
      if (!isHomeTeam) {
        position = { ...position, x: 100 - position.x }
      }
      console.log(`[arrangePlayersByPosition] FWD ${player.player.name} -> x:${position.x}, y:${position.y}`)
      result.push({ ...player, fieldPosition: position })
    })
  }
  
  return result
}

// 수비수 위치 계산 (grid 없는 경우만 사용)
function getDefenderPositions(count: number): Array<{ x: number, y: number }> {
  switch(count) {
    case 3:
      return [
        { x: 30, y: 75 },  // LCB
        { x: 50, y: 75 },  // CB
        { x: 70, y: 75 }   // RCB
      ]
    case 4:
      return [
        { x: 20, y: 75 },  // LB
        { x: 40, y: 75 },  // LCB
        { x: 60, y: 75 },  // RCB
        { x: 80, y: 75 }   // RB
      ]
    case 5:
      return [
        { x: 15, y: 75 },  // LWB
        { x: 32, y: 75 },  // LCB
        { x: 50, y: 75 },  // CB
        { x: 68, y: 75 },  // RCB
        { x: 85, y: 75 }   // RWB
      ]
    default:
      return Array(count).fill(null).map((_, i) => ({
        x: 15 + (i * 70 / Math.max(1, count - 1)),
        y: 75
      }))
  }
}

// 미드필더 위치 계산 (grid 없는 경우만 사용) 
function getMidfielderPositions(count: number, formation: string): Array<{ x: number, y: number }> {
  // 4-2-3-1 같은 특수 포메이션 처리
  if (formation === '4-2-3-1' && count === 5) {
    return [
      { x: 35, y: 60 },  // LDM
      { x: 65, y: 60 },  // RDM
      { x: 20, y: 35 },  // LAM
      { x: 50, y: 35 },  // CAM
      { x: 80, y: 35 }   // RAM
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
        { x: 30, y: 50 },  // LCM
        { x: 50, y: 50 },  // CM
        { x: 70, y: 50 }   // RCM
      ]
    case 4:
      return [
        { x: 20, y: 50 },  // LM
        { x: 40, y: 50 },  // LCM
        { x: 60, y: 50 },  // RCM
        { x: 80, y: 50 }   // RM
      ]
    case 5:
      return [
        { x: 15, y: 50 },  // LWM
        { x: 32, y: 50 },  // LCM
        { x: 50, y: 50 },  // CM
        { x: 68, y: 50 },  // RCM
        { x: 85, y: 50 }   // RWM
      ]
    default:
      return Array(count).fill(null).map((_, i) => ({
        x: 15 + (i * 70 / Math.max(1, count - 1)),
        y: 50
      }))
  }
}

// 공격수 위치 계산 (grid 없는 경우만 사용)
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
        { x: 25, y: 25 },  // LW
        { x: 50, y: 20 },  // ST
        { x: 75, y: 25 }   // RW
      ]
    default:
      return Array(count).fill(null).map((_, i) => ({
        x: 25 + (i * 50 / Math.max(1, count - 1)),
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
    '4-2-2-2', '4-3-1-2', '4-5-1', '3-4-2-1', '4-2-4', '4-1-3-2',
    '3-4-2-1', '3-5-1-1', '4-4-1-1', '5-2-3', '5-2-2-1'
  ]
  
  // 입력 정규화 (공백 제거, 대시 통일)
  const normalized = formation.replace(/\s+/g, '').replace(/[－‐−–—]/g, '-')
  
  // 유효한 포메이션인지 확인
  if (validFormations.includes(normalized)) {
    return normalized
  }
  
  // 기본값
  console.warn(`[normalizeFormation] Unknown formation: ${formation}, using default 4-3-3`)
  return '4-3-3'
}