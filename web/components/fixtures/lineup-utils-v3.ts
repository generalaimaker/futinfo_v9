// 완전히 개선된 라인업 유틸리티 - 정확한 포메이션 및 포지션 기반 배치
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

// 포지션 상세 타입 분석
function analyzePosition(pos: string): { 
  type: 'G' | 'D' | 'M' | 'F',
  side: 'L' | 'R' | 'C' | null,
  role: 'defensive' | 'offensive' | 'neutral'
} {
  const upperPos = pos?.toUpperCase() || ''
  
  // 골키퍼
  if (upperPos.includes('G')) {
    return { type: 'G', side: null, role: 'neutral' }
  }
  
  // 수비수
  if (upperPos.includes('D') || upperPos.includes('B')) {
    let side: 'L' | 'R' | 'C' | null = null
    if (upperPos.includes('L')) side = 'L'
    else if (upperPos.includes('R')) side = 'R'
    else side = 'C'
    return { type: 'D', side, role: 'defensive' }
  }
  
  // 미드필더
  if (upperPos.includes('M')) {
    let side: 'L' | 'R' | 'C' | null = null
    if (upperPos.includes('L')) side = 'L'
    else if (upperPos.includes('R')) side = 'R'
    else side = 'C'
    
    // DM (수비형) vs AM (공격형)
    let role: 'defensive' | 'offensive' | 'neutral' = 'neutral'
    if (upperPos.includes('DM') || upperPos.includes('CDM')) role = 'defensive'
    else if (upperPos.includes('AM') || upperPos.includes('CAM')) role = 'offensive'
    
    return { type: 'M', side, role }
  }
  
  // 공격수/윙어
  if (upperPos.includes('F') || upperPos.includes('W') || upperPos.includes('S')) {
    let side: 'L' | 'R' | 'C' | null = null
    if (upperPos.includes('LW')) side = 'L'
    else if (upperPos.includes('RW')) side = 'R'
    else if (upperPos.includes('L')) side = 'L'
    else if (upperPos.includes('R')) side = 'R'
    else side = 'C'
    
    return { type: 'F', side, role: 'offensive' }
  }
  
  return { type: 'M', side: null, role: 'neutral' }
}

// 개선된 포메이션 감지
export function detectFormation(players: PlayerPosition[]): string {
  const hasGrid = players.some(p => p.player.grid)
  
  if (hasGrid) {
    // Grid 기반 정확한 감지
    const rowPlayers: { [key: number]: PlayerPosition[] } = {}
    
    players.forEach(p => {
      if (p.player.grid) {
        const parsed = parseGridPosition(p.player.grid)
        if (parsed && parsed.row > 1) { // 골키퍼 제외
          if (!rowPlayers[parsed.row]) rowPlayers[parsed.row] = []
          rowPlayers[parsed.row].push(p)
        }
      }
    })
    
    // 각 라인별 선수 수 계산
    const defenders = rowPlayers[2]?.length || 0
    const midLine1 = rowPlayers[3]?.length || 0  // 첫 번째 미드필더 라인
    const midLine2 = rowPlayers[4]?.length || 0  // 두 번째 미드필더 라인 (있는 경우)
    const forwards = rowPlayers[5]?.length || 0
    
    console.log('[detectFormation] Grid analysis:', {
      row2: defenders,
      row3: midLine1,
      row4: midLine2,
      row5: forwards,
      row6: rowPlayers[6]?.length || 0
    })
    
    // 4-2-3-1: row 3에 2명(DM), row 4에 3명(AM), row 5에 1명(ST)
    if (defenders === 4 && midLine1 === 2 && midLine2 === 3 && forwards === 1) {
      return '4-2-3-1'
    }
    
    // 4-3-3: row 3에 3명의 미드필더, row 4에 2명의 윙어, row 5에 1명의 스트라이커
    // 또는 row 3에 3명, row 5에 3명
    if (defenders === 4 && midLine1 === 3) {
      if (midLine2 === 2 && forwards === 1) {
        // 윙어가 row 4에, 스트라이커가 row 5에
        return '4-3-3'
      } else if (midLine2 === 0 && forwards === 3) {
        // 모든 공격수가 row 5에
        return '4-3-3'
      }
    }
    
    // 4-4-2
    if (defenders === 4 && midLine1 === 4 && forwards === 2) {
      return '4-4-2'
    }
    
    // 3-5-2
    if (defenders === 3 && (midLine1 + midLine2) === 5 && forwards === 2) {
      return '3-5-2'
    }
    
    // 일반 케이스 - row 6 이상은 무시
    const totalMidfielders = midLine1 + midLine2
    const totalForwards = forwards + (rowPlayers[6]?.length || 0)  // row 6도 공격수로 계산
    
    // 최종 포메이션 문자열
    if (totalForwards > 0) {
      return `${defenders}-${totalMidfielders}-${totalForwards}`
    } else if (totalMidfielders > 0) {
      return `${defenders}-${totalMidfielders}`
    } else {
      return `${defenders}`
    }
    
  } else {
    // 포지션 텍스트 기반 감지
    const analyzed = players.map(p => {
      const pos = p.player.pos || ''
      console.log(`[detectFormation] Player ${p.player.name}: pos='${pos}'`)
      return analyzePosition(pos)
    })
    
    const defenders = analyzed.filter(a => a.type === 'D').length
    const midfielders = analyzed.filter(a => a.type === 'M').length
    const forwards = analyzed.filter(a => a.type === 'F').length
    
    console.log('[detectFormation] Position-based analysis:', {
      defenders,
      midfielders,
      forwards
    })
    
    // 미드필더 역할 분석
    const defensiveMids = analyzed.filter(a => a.type === 'M' && a.role === 'defensive').length
    const offensiveMids = analyzed.filter(a => a.type === 'M' && a.role === 'offensive').length
    
    // 4-2-3-1 감지: 수비형 2명, 공격형 3명
    if (defenders === 4 && defensiveMids === 2 && offensiveMids === 3 && forwards === 1) {
      return '4-2-3-1'
    }
    
    // 미드필더 5명이면서 공격수 1명인 경우도 4-2-3-1로 처리
    if (defenders === 4 && midfielders === 5 && forwards === 1) {
      return '4-2-3-1'
    }
    
    // 골키퍼 제외 확인
    const goalkeepers = analyzed.filter(a => a.type === 'G').length
    if (goalkeepers > 0 && defenders === 0 && midfielders === 0 && forwards === 0) {
      // 포지션 정보가 없는 경우 기본값
      return '4-3-3'
    }
    
    return `${defenders}-${midfielders}-${forwards}`
  }
}

// Grid 기반 위치 계산 (개선)
export function gridToPosition(row: number, col: number, maxCols: number): FieldPosition {
  let x = 50
  let y = 50
  
  // X 좌표 - 균등 분배
  if (maxCols === 1) {
    x = 50
  } else if (maxCols === 2) {
    x = col === 1 ? 35 : 65
  } else if (maxCols === 3) {
    x = [30, 50, 70][col - 1] || 50
  } else if (maxCols === 4) {
    x = [20, 40, 60, 80][col - 1] || 50
  } else if (maxCols === 5) {
    x = [15, 32, 50, 68, 85][col - 1] || 50
  } else {
    x = 10 + ((col - 1) * 80 / (maxCols - 1))
  }
  
  // Y 좌표 - 라인별 위치
  const yMap: { [key: number]: number } = {
    1: 90,  // 골키퍼
    2: 75,  // 수비수
    3: 55,  // 수비형/중앙 미드필더
    4: 38,  // 공격형 미드필더
    5: 20,  // 공격수
    6: 15,  // 극전방 (드물게 사용)
    7: 10   // 최전방 (매우 드물게)
  }
  
  y = yMap[row] || (90 - ((row - 1) * 15))
  
  return { x, y }
}

// 포지션 텍스트 기반 위치 계산
export function positionToField(
  pos: string, 
  index: number, 
  total: number, 
  formation: string
): FieldPosition {
  const analysis = analyzePosition(pos)
  let x = 50, y = 50
  
  // 골키퍼
  if (analysis.type === 'G') {
    return { x: 50, y: 90 }
  }
  
  // 수비수
  if (analysis.type === 'D') {
    y = 75
    if (analysis.side === 'L') x = 20
    else if (analysis.side === 'R') x = 80
    else {
      // 센터백 - 균등 분배
      if (total === 2) x = index === 0 ? 40 : 60
      else if (total === 3) x = [30, 50, 70][index] || 50
      else if (total === 4) x = [20, 40, 60, 80][index] || 50
      else x = 20 + (index * 60 / (total - 1))
    }
  }
  
  // 미드필더
  if (analysis.type === 'M') {
    // 수비형 vs 공격형 미드필더 Y 위치
    if (analysis.role === 'defensive') y = 60
    else if (analysis.role === 'offensive') y = 40
    else y = 50
    
    // 좌우 위치
    if (analysis.side === 'L') x = 20
    else if (analysis.side === 'R') x = 80
    else {
      // 중앙 - 균등 분배
      if (total === 2) x = index === 0 ? 35 : 65
      else if (total === 3) x = [30, 50, 70][index] || 50
      else if (total === 4) x = [20, 40, 60, 80][index] || 50
      else if (total === 5) x = [15, 32, 50, 68, 85][index] || 50
      else x = 20 + (index * 60 / Math.max(1, total - 1))
    }
  }
  
  // 공격수/윙어
  if (analysis.type === 'F') {
    y = 25
    
    // LW/RW 처리
    if (pos.includes('LW')) {
      x = 20
      y = 30  // 윙어는 약간 뒤에
    } else if (pos.includes('RW')) {
      x = 80
      y = 30  // 윙어는 약간 뒤에
    } else if (analysis.side === 'L') {
      x = 35
    } else if (analysis.side === 'R') {
      x = 65
    } else {
      // 중앙 스트라이커
      x = 50
      y = 20
    }
  }
  
  return { x, y }
}

// 메인 배치 함수
export function arrangePlayersV3(
  players: PlayerPosition[],
  formation: string,
  isHomeTeam: boolean = true
): Array<PlayerPosition & { fieldPosition: FieldPosition }> {
  if (!players || players.length === 0) return []
  
  console.log('[arrangePlayersV3] Input:', {
    playerCount: players.length,
    formation,
    isHomeTeam,
    hasGrid: players.some(p => p.player.grid),
    hasPos: players.some(p => p.player.pos)
  })
  
  const result: Array<PlayerPosition & { fieldPosition: FieldPosition }> = []
  const hasGrid = players.some(p => p.player.grid)
  
  if (hasGrid) {
    // Grid 기반 배치
    const rowMaxCols: { [key: number]: number } = {}
    
    // 각 row의 최대 col 계산
    players.forEach(p => {
      if (p.player.grid) {
        const parsed = parseGridPosition(p.player.grid)
        if (parsed) {
          rowMaxCols[parsed.row] = Math.max(rowMaxCols[parsed.row] || 0, parsed.col)
        }
      }
    })
    
    // 각 선수 배치
    players.forEach(player => {
      let position: FieldPosition = { x: 50, y: 50 }
      
      if (player.player.grid) {
        const parsed = parseGridPosition(player.player.grid)
        if (parsed) {
          position = gridToPosition(parsed.row, parsed.col, rowMaxCols[parsed.row] || 1)
        }
      }
      
      // 원정팀 좌우 반전
      if (!isHomeTeam) {
        position.x = 100 - position.x
      }
      
      result.push({ ...player, fieldPosition: position })
    })
  } else {
    // 포지션 텍스트 기반 배치
    console.log('[arrangePlayersV3] Using position-based arrangement')
    
    // 포지션별로 분류하되, 세부 포지션 정보 유지
    const byPosition: { 
      G: PlayerPosition[],
      D: { L: PlayerPosition[], C: PlayerPosition[], R: PlayerPosition[] },
      M: { L: PlayerPosition[], C: PlayerPosition[], R: PlayerPosition[], DM: PlayerPosition[], AM: PlayerPosition[] },
      F: { L: PlayerPosition[], C: PlayerPosition[], R: PlayerPosition[] }
    } = {
      G: [],
      D: { L: [], C: [], R: [] },
      M: { L: [], C: [], R: [], DM: [], AM: [] },
      F: { L: [], C: [], R: [] }
    }
    
    players.forEach((player, idx) => {
      const pos = player.player.pos?.toUpperCase() || ''
      const analysis = analyzePosition(pos)
      
      if (idx === 0 && !pos) {
        byPosition.G.push(player)
      } else if (analysis.type === 'G') {
        byPosition.G.push(player)
      } else if (analysis.type === 'D') {
        if (analysis.side === 'L') byPosition.D.L.push(player)
        else if (analysis.side === 'R') byPosition.D.R.push(player)
        else byPosition.D.C.push(player)
      } else if (analysis.type === 'M') {
        if (analysis.role === 'defensive') byPosition.M.DM.push(player)
        else if (analysis.role === 'offensive') byPosition.M.AM.push(player)
        else if (analysis.side === 'L') byPosition.M.L.push(player)
        else if (analysis.side === 'R') byPosition.M.R.push(player)
        else byPosition.M.C.push(player)
      } else if (analysis.type === 'F') {
        if (pos.includes('LW')) byPosition.F.L.push(player)
        else if (pos.includes('RW')) byPosition.F.R.push(player)
        else if (analysis.side === 'L') byPosition.F.L.push(player)
        else if (analysis.side === 'R') byPosition.F.R.push(player)
        else byPosition.F.C.push(player)
      }
    })
    
    // 골키퍼 배치
    byPosition.G.forEach(player => {
      let position = { x: 50, y: 90 }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    
    // 수비수 배치
    const defY = 75
    byPosition.D.L.forEach(player => {
      let position = { x: 20, y: defY }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    byPosition.D.R.forEach(player => {
      let position = { x: 80, y: defY }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    const centerDefCount = byPosition.D.C.length
    if (centerDefCount === 2) {
      byPosition.D.C.forEach((player, idx) => {
        let position = { x: idx === 0 ? 40 : 60, y: defY }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else if (centerDefCount === 3) {
      byPosition.D.C.forEach((player, idx) => {
        let position = { x: [30, 50, 70][idx] || 50, y: defY }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else {
      byPosition.D.C.forEach((player, idx) => {
        let position = { x: 50, y: defY }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    }
    
    // 미드필더 배치
    // 수비형 미드필더
    const dmCount = byPosition.M.DM.length
    if (dmCount === 2) {
      byPosition.M.DM.forEach((player, idx) => {
        let position = { x: idx === 0 ? 35 : 65, y: 60 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else {
      byPosition.M.DM.forEach(player => {
        let position = { x: 50, y: 60 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    }
    
    // 공격형 미드필더
    const amCount = byPosition.M.AM.length
    if (amCount === 3) {
      byPosition.M.AM.forEach((player, idx) => {
        let position = { x: [25, 50, 75][idx] || 50, y: 40 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else {
      byPosition.M.AM.forEach(player => {
        let position = { x: 50, y: 40 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    }
    
    // 좌우 미드필더
    byPosition.M.L.forEach(player => {
      let position = { x: 20, y: 50 }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    byPosition.M.R.forEach(player => {
      let position = { x: 80, y: 50 }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    
    // 중앙 미드필더
    const cmCount = byPosition.M.C.length
    if (cmCount === 3) {
      byPosition.M.C.forEach((player, idx) => {
        let position = { x: [30, 50, 70][idx] || 50, y: 50 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else if (cmCount === 2) {
      byPosition.M.C.forEach((player, idx) => {
        let position = { x: idx === 0 ? 40 : 60, y: 50 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else {
      byPosition.M.C.forEach(player => {
        let position = { x: 50, y: 50 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    }
    
    // 공격수 배치
    // 윙어
    byPosition.F.L.forEach(player => {
      let position = { x: 20, y: 30 }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    byPosition.F.R.forEach(player => {
      let position = { x: 80, y: 30 }
      if (!isHomeTeam) position.x = 100 - position.x
      result.push({ ...player, fieldPosition: position })
    })
    
    // 중앙 공격수
    const stCount = byPosition.F.C.length
    if (stCount === 2) {
      byPosition.F.C.forEach((player, idx) => {
        let position = { x: idx === 0 ? 35 : 65, y: 20 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    } else {
      byPosition.F.C.forEach(player => {
        let position = { x: 50, y: 20 }
        if (!isHomeTeam) position.x = 100 - position.x
        result.push({ ...player, fieldPosition: position })
      })
    }
  }
  
  return result
}