/**
 * Player 관련 헬퍼 함수들
 */

/**
 * 선수의 풀네임을 반환합니다.
 * firstname과 lastname이 있으면 합쳐서 반환하고,
 * 없으면 name 필드를 그대로 반환합니다.
 */
export function getPlayerFullName(player: any): string {
  // player 객체가 없으면 Unknown 반환
  if (!player) return 'Unknown'
  
  // player.player 구조인 경우 처리
  const playerData = player.player || player
  
  // firstname과 lastname이 모두 있는 경우 (빈 문자열이 아닌 경우)
  if (playerData.firstname && playerData.lastname && 
      playerData.firstname.trim() !== '' && playerData.lastname.trim() !== '') {
    return `${playerData.firstname} ${playerData.lastname}`
  }
  
  // name 필드가 있는 경우
  if (playerData.name) {
    return playerData.name
  }
  
  return 'Unknown'
}

/**
 * 선수의 짧은 이름을 반환합니다 (성만)
 */
export function getPlayerShortName(player: any): string {
  const playerData = player.player || player
  
  if (playerData.lastname) {
    return playerData.lastname
  }
  
  if (playerData.name) {
    const parts = playerData.name.split(' ')
    return parts[parts.length - 1]
  }
  
  return 'Unknown'
}

/**
 * 선수 번호를 반환합니다
 */
export function getPlayerNumber(player: any): string {
  const playerData = player.player || player
  return playerData.number?.toString() || '?'
}

/**
 * 선수 포지션을 반환합니다
 */
export function getPlayerPosition(player: any): string {
  const playerData = player.player || player
  return playerData.pos || playerData.position || ''
}